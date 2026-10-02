import type { Integrations } from './integrations';
import type { Auth } from './auth';
import type { Store } from './store';
import type { AppEvent } from '../shared/types';
import { SpotifyPlayer } from './spotify-player';
import { readReplayGain, type ReplayGain } from '../shared/music-volume';
import { SpotifyCollections } from './spotify-collections';

export type MusicItem = {
  id: string;
  source: 'spotify' | 'navidrome';
  type: 'song' | 'album' | 'artist' | 'playlist';
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
  uri?: string;
  replayGain?: ReplayGain;
};
export class Music {
  private active?: 'spotify' | 'navidrome';
  private native: SpotifyPlayer;
  private queue: MusicItem[] = [];
  private index = 0;
  private visited = new Set<number>();
  private volume = 70;
  private normalization = true;
  private albumContext = false;
  private shuffle = false;
  private repeat = 'off';
  private changes: Promise<any> = Promise.resolve();
  private generation = 0;
  private browseGeneration = 0;
  private spotifyFailed = false;
  private spotifyRecoveryUsed = false;
  private spotifyPosition = 0;
  private playbackIntent = 0;
  private wantsPlayback = false;
  private collections: SpotifyCollections;
  constructor(
    private api: Integrations,
    private auth: Auth,
    private store: Store,
    private notify: (event: AppEvent) => void,
    executable: string,
    root: string,
  ) {
    this.collections = new SpotifyCollections(
      (path) => this.api.spotify(path),
      (value, type) => this.spotifyItem(value, type),
    );
    this.native = new SpotifyPlayer(executable, root, auth, (event) => {
      if (this.active !== 'spotify') return;
      if (event.event === 'ended')
        void this.change(() => this.advance(1, true)).catch((error) =>
          this.playbackError(error.message),
        );
      else if (event.event === 'error') {
        this.spotifyFailed = true;
        if (event.recoverable && this.wantsPlayback && !this.spotifyRecoveryUsed) {
          this.spotifyRecoveryUsed = true;
          const intent = this.playbackIntent;
          const position = this.spotifyPosition;
          void this.change(async () => {
            if (intent !== this.playbackIntent || this.active !== 'spotify') return;
            await this.native.close();
            if (intent !== this.playbackIntent || !this.wantsPlayback) return;
            await this.playCurrent(true, position, intent);
          }).catch((error) => {
            if (intent === this.playbackIntent && this.active === 'spotify')
              this.playbackError(error.message);
          });
        } else this.playbackError(event.message);
      } else if (event.event === 'state' || event.event === 'position') {
        if (event.position !== undefined) this.spotifyPosition = event.position;
        this.notify({
          type: 'playback',
          data: {
            action: 'state',
            source: 'spotify',
            ...(event.playing !== undefined ? { playing: event.playing } : {}),
            ...(event.position !== undefined ? { position: event.position } : {}),
          },
        });
      }
    });
  }
  connectPlayback() {
    return this.native.signIn();
  }
  clearCollections() {
    this.browseGeneration++;
    this.collections.clear();
  }
  setNormalization(enabled: boolean) {
    this.normalization = enabled;
  }
  async close() {
    this.clearCollections();
    this.generation++;
    this.playbackIntent++;
    this.wantsPlayback = false;
    this.active = undefined;
    this.notify({ type: 'playback', data: { action: 'stop' } });
    await this.native.close();
    await this.changes.catch(() => {});
  }
  private change(work: () => Promise<any>) {
    const generation = this.generation;
    const task = this.changes
      .catch(() => {})
      .then(() => {
        if (generation !== this.generation) throw new Error('Playback was stopped.');
        return work();
      });
    this.changes = task;
    return task;
  }
  private playbackError(message: string) {
    this.spotifyFailed = true;
    this.notify({
      type: 'playback',
      data: { action: 'error', source: 'spotify', message },
    });
  }
  private async playCurrent(recovering = false, position = 0, intent = this.playbackIntent) {
    const item = this.queue[this.index];
    if (!item) return;
    if (this.spotifyFailed) await this.native.close();
    this.spotifyFailed = false;
    if (!recovering) this.spotifyRecoveryUsed = false;
    this.spotifyPosition = position;
    this.notify({
      type: 'playback',
      data: {
        action: 'play',
        source: 'spotify',
        queue: this.queue,
        index: this.index,
      },
    });
    try {
      await this.native.command(
        'load',
        {
          uri: item.uri || `spotify:track:${item.id}`,
          position: Math.round(position * 1000),
          volume: this.volume,
          normalization: this.normalization,
          albumGain: this.albumContext && !this.shuffle,
        },
        () => intent === this.playbackIntent && this.wantsPlayback,
      );
      if (intent !== this.playbackIntent || !this.wantsPlayback) {
        this.spotifyFailed = true;
        return;
      }
      await this.native.command('volume', { volume: this.volume });
    } catch (error: any) {
      this.playbackError(error.message);
      throw error;
    }
  }
  private async advance(direction: number, ended = false) {
    if (ended && this.repeat === 'track') return this.playCurrent();
    let next = this.index + direction;
    if (this.shuffle && direction > 0) {
      this.visited.add(this.index);
      let candidates = this.queue
        .map((_, index) => index)
        .filter((index) => !this.visited.has(index));
      if (!candidates.length && this.repeat === 'context') {
        this.visited.clear();
        candidates = this.queue.map((_, index) => index);
      }
      next = candidates.length
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : this.queue.length;
    }
    if (next >= this.queue.length) {
      if (this.repeat === 'context') next = 0;
      else {
        this.wantsPlayback = false;
        await this.native.command('stop');
        return;
      }
    }
    this.index = Math.max(0, next);
    await this.playCurrent();
  }
  private spotifyItem(value: any, type?: MusicItem['type']): MusicItem {
    return {
      source: 'spotify',
      id: value.id,
      type: type || value.type || 'song',
      title: value.name,
      artist: value.artists?.map((artist: any) => artist.name).join(', '),
      cover: value.images?.[0]?.url || value.album?.images?.[0]?.url,
      duration: value.duration_ms / 1000 || undefined,
      uri: value.uri,
    } as MusicItem;
  }
  private navidromeItem(item: any, type: MusicItem['type']): MusicItem {
    return {
      source: 'navidrome',
      id: item.id,
      type,
      title: item.title || item.name,
      artist: item.artist,
      cover: item.coverArt ? `clarity://cover/${encodeURIComponent(item.coverArt)}` : undefined,
      duration: item.duration,
      replayGain: readReplayGain(item.replayGain),
    };
  }
  private async recent() {
    const generation = this.browseGeneration;
    const records = (await this.store.list('music-recent'))
      .sort((a, b) => (b.playedAt ?? b.updatedAt) - (a.playedAt ?? a.updatedAt))
      .slice(0, 30);
    const failedSources = new Set<string>();
    const items = await Promise.all(
      records.map(async (record) => {
        const { source, type } = record;
        const prefix = `${source}-${type}-`;
        const id =
          record.itemId ||
          (record.id.startsWith(prefix) ? record.id.slice(prefix.length) : record.id);
        if (
          !['spotify', 'navidrome'].includes(source) ||
          !['album', 'playlist', 'artist'].includes(type) ||
          !id
        )
          return null;
        let item: MusicItem = {
          id,
          source,
          type,
          title: record.title,
          artist: record.artist,
          cover: record.cover,
        };
        try {
          if (!item.title?.trim()) {
            if (source === 'spotify' && type === 'playlist' && id === 'liked')
              item.title = 'Liked Songs';
            else {
              if (!this.auth.secrets.get(source)) throw new Error('Source is disconnected.');
              if (source === 'navidrome')
                item = (await this.perform('collection', { source, type, id })).item;
              else
                item = this.spotifyItem(
                  await this.api.spotify(
                    `${type}s/${encodeURIComponent(id)}${type === 'playlist' ? '?fields=id,name,type,images' : ''}`,
                  ),
                  type,
                );
              if (!item.title?.trim()) throw new Error('Collection metadata is unavailable.');
            }
          }
          if (generation !== this.browseGeneration) throw new Error('Music connection changed.');
          if (!record.itemId || !record.title?.trim()) {
            try {
              await this.store.put(
                'music-recent',
                record.id,
                {
                  source,
                  type,
                  title: item.title,
                  artist: item.artist,
                  cover: item.cover,
                  itemId: id,
                  playedAt: record.playedAt ?? record.updatedAt,
                },
                record.revision,
              );
            } catch (error: any) {
              // A newer play owns the record; a late repair must not overwrite it.
              if (error.code !== 'CONFLICT') throw error;
            }
          }
        } catch {
          failedSources.add(source === 'spotify' ? 'Spotify' : 'Navidrome');
        }
        return {
          id,
          source,
          type,
          title: item.title?.trim() || `Unavailable ${type}`,
          artist: item.artist,
          cover: item.cover,
        };
      }),
    );
    if (generation !== this.browseGeneration)
      throw new Error('Music connection changed. Try again.');
    return {
      items: items.filter((item) => item !== null),
      errors: [...failedSources]
        .sort()
        .map(
          (source) =>
            `Couldn’t restore some ${source} recent items. Check the connection and try again.`,
        ),
    };
  }
  async invoke(method: string, args: any): Promise<any> {
    if (method === 'play' || method === 'control') {
      if (method === 'play' || ['pause', 'resume', 'next', 'previous'].includes(args.action)) {
        this.playbackIntent++;
        this.wantsPlayback = args.action !== 'pause';
      }
      return this.change(() => this.perform(method, args));
    }
    return this.perform(method, args);
  }
  private async perform(method: string, args: any): Promise<any> {
    if (method === 'recent') return this.recent();
    if (method === 'search' || method === 'library') {
      const tasks: { source: string; request: Promise<MusicItem[]> }[] = [];
      if (this.auth.secrets.get('spotify'))
        tasks.push({
          source: 'Spotify',
          request: (async () => {
            if (method === 'search') {
              // Spotify Development Mode limits each result type to ten items.
              const data = await this.api.spotify(
                `search?${new URLSearchParams({ q: String(args.query || ''), type: 'track,album,artist,playlist', limit: '10' })}`,
              );
              return [
                ['tracks', 'song'],
                ['albums', 'album'],
                ['artists', 'artist'],
                ['playlists', 'playlist'],
              ].flatMap(([field, type]) =>
                (data[field]?.items || [])
                  .filter(Boolean)
                  .map((item: any) => this.spotifyItem(item, type as any)),
              );
            }
            if (args.type === 'artists') return [];
            const items: MusicItem[] = [];
            let next = args.type === 'albums' ? 'me/albums?limit=50' : 'me/playlists?limit=50';
            const account = args.type === 'playlists' ? await this.api.spotify('me') : null;
            for (let page = 0; next && page < 20; page++) {
              const data = await this.api.spotify(next);
              items.push(
                ...(data.items || [])
                  .filter((item: any) => !account || item.owner?.id === account.id)
                  .map((item: any) =>
                    this.spotifyItem(
                      args.type === 'albums' ? item.album : item,
                      args.type === 'albums' ? 'album' : 'playlist',
                    ),
                  ),
              );
              next = data.next
                ? new URL(data.next).pathname.replace('/v1/', '') + new URL(data.next).search
                : '';
            }
            if (args.type === 'playlists')
              items.unshift({
                id: 'liked',
                source: 'spotify',
                type: 'playlist',
                title: 'Liked Songs',
              });
            return items;
          })(),
        });
      if (this.auth.secrets.get('navidrome'))
        tasks.push({
          source: 'Navidrome',
          request: (async () => {
            if (method === 'search') {
              const data =
                (
                  await this.api.navidrome('search3', {
                    query: args.query,
                    artistCount: 30,
                    albumCount: 30,
                    songCount: 50,
                  })
                ).searchResult3 || {};
              const playlists =
                (await this.api.navidrome('getPlaylists')).playlists?.playlist || [];
              return [
                ...(data.artist || []).map((item: any) => this.navidromeItem(item, 'artist')),
                ...(data.album || []).map((item: any) => this.navidromeItem(item, 'album')),
                ...(data.song || []).map((item: any) => this.navidromeItem(item, 'song')),
                ...playlists
                  .filter((item: any) =>
                    item.name.toLowerCase().includes(String(args.query).toLowerCase()),
                  )
                  .map((item: any) => this.navidromeItem(item, 'playlist')),
              ];
            }
            if (args.type === 'playlists')
              return ((await this.api.navidrome('getPlaylists')).playlists?.playlist || []).map(
                (item: any) => this.navidromeItem(item, 'playlist'),
              );
            if (args.type === 'artists')
              return ((await this.api.navidrome('getArtists')).artists?.index || [])
                .flatMap((group: any) => group.artist || [])
                .map((item: any) => this.navidromeItem(item, 'artist'));
            const items: MusicItem[] = [];
            for (let offset = 0; offset < 10000; offset += 500) {
              const albums =
                (
                  await this.api.navidrome('getAlbumList2', {
                    type: 'alphabeticalByName',
                    size: 500,
                    offset,
                  })
                ).albumList2?.album || [];
              items.push(...albums.map((item: any) => this.navidromeItem(item, 'album')));
              if (albums.length < 500) break;
            }
            return items;
          })(),
        });
      const settled = await Promise.allSettled(tasks.map((task) => task.request));
      return {
        items: settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
        errors: settled.flatMap((result, index) => {
          if (result.status === 'fulfilled') return [];
          const source = tasks[index].source;
          const message = result.reason?.message || String(result.reason);
          if (message === 'fetch failed' || message === 'Failed to fetch')
            return [`Couldn’t reach ${source}. Check your connection.`];
          return [message.startsWith(source) ? message : `${source}: ${message}`];
        }),
      };
    }
    if (method === 'collection') {
      if (args.type === 'song') {
        const item =
          args.source === 'navidrome'
            ? this.navidromeItem(
                (await this.api.navidrome('getSong', { id: args.id })).song,
                'song',
              )
            : this.spotifyItem(
                await this.api.spotify(`tracks/${encodeURIComponent(args.id)}`),
                'song',
              );
        return { item, items: [item] };
      }
      if (args.source === 'navidrome') {
        const data = await this.api.navidrome(
          args.type === 'album' ? 'getAlbum' : args.type === 'artist' ? 'getArtist' : 'getPlaylist',
          { id: args.id },
        );
        const collection = data.album || data.playlist || data.artist;
        return {
          item: this.navidromeItem(collection, args.type),
          items: (collection.song || collection.entry || collection.album || []).map((item: any) =>
            this.navidromeItem(item, args.type === 'artist' ? 'album' : 'song'),
          ),
        };
      }
      if (args.type === 'artist') {
        const artist = await this.api.spotify(`artists/${encodeURIComponent(args.id)}`);
        const albums = await this.api.spotify(
          `artists/${encodeURIComponent(args.id)}/albums?limit=50`,
        );
        return {
          item: this.spotifyItem(artist),
          items: albums.items.map((item: any) => this.spotifyItem(item, 'album')),
        };
      }
      return args.offset === undefined ? this.collections.all(args) : this.collections.page(args);
    }
    if (method === 'play') {
      const generation = this.generation;
      const source = args.source as MusicItem['source'];
      if (!['spotify', 'navidrome'].includes(source)) throw new Error('Unknown music source.');
      let queue: MusicItem[];
      let recentItem: MusicItem | undefined;
      let albumContext = args.type === 'album';
      if (args.type === 'song') {
        queue =
          source === 'navidrome' && !('replayGain' in args)
            ? (await this.invoke('collection', args)).items
            : [
                {
                  ...args,
                  replayGain: readReplayGain(args.replayGain),
                } as MusicItem,
              ];
      } else {
        let collection = await this.invoke('collection', args);
        recentItem = collection.item;
        if (args.type === 'artist') {
          if (!collection.items.length) throw new Error('No albums are available for this artist.');
          collection = await this.invoke('collection', collection.items[0]);
          albumContext = true;
        }
        queue = collection.items;
      }
      if (!queue.length) throw new Error('This collection is empty.');
      const index = Math.max(0, args.index || 0);
      if (index >= queue.length) throw new Error('Track position is outside this collection.');
      if (generation !== this.generation) throw new Error('Playback was stopped.');
      if (this.active === 'spotify' && source !== 'spotify') await this.native.close();
      this.notify({ type: 'playback', data: { action: 'stop' } });
      this.active = source;
      this.albumContext = albumContext;
      if (source === 'spotify') {
        this.queue = queue;
        this.index = index;
        this.visited.clear();
        await this.playCurrent();
      } else
        this.notify({
          type: 'playback',
          data: {
            action: 'play',
            source,
            queue,
            index,
            context: { ...args, type: albumContext ? 'album' : args.type },
          },
        });
      if (args.type !== 'song')
        await this.store.put('music-recent', `${source}-${args.type}-${args.id}`, {
          source,
          type: args.type,
          itemId: args.id,
          title: recentItem?.title || args.title,
          artist: recentItem?.artist || args.artist,
          cover: recentItem?.cover || args.cover,
          playedAt: Date.now(),
        });
      return { playing: queue[index], source, count: queue.length };
    }
    if (method === 'control') {
      if (args.action === 'seek') {
        if (!this.active) throw new Error('Choose a track before seeking.');
        if (
          typeof args.position !== 'number' ||
          !Number.isFinite(args.position) ||
          args.position < 0
        )
          throw new Error('Playback position must be a non-negative number of seconds.');
        if (this.active === 'spotify') {
          const duration = this.queue[this.index]?.duration;
          args = {
            ...args,
            position: Math.min(args.position, duration || Infinity),
          };
          await this.native.command('seek', {
            position: Math.round(args.position * 1000),
          });
        }
      }
      if (args.volume !== undefined) {
        if (typeof args.volume !== 'number' || !Number.isFinite(args.volume))
          throw new Error('Volume must be a finite number.');
        this.volume = Math.max(0, Math.min(100, args.volume));
        args = { ...args, volume: this.volume };
      }
      if (args.shuffle !== undefined) {
        this.shuffle = !!args.shuffle;
        this.visited.clear();
      }
      if (args.repeat !== undefined)
        this.repeat = ['off', 'track', 'context'].includes(args.repeat) ? args.repeat : 'off';
      if (this.active === 'spotify') {
        if (args.volume !== undefined) await this.native.command('volume', { volume: this.volume });
        else if (args.action === 'next') await this.advance(1);
        else if (args.action === 'previous') await this.advance(-1);
        else if (args.action === 'resume' && this.spotifyFailed) await this.playCurrent();
        else if (args.action === 'pause' || args.action === 'resume')
          await this.native.command(args.action);
      }
      this.notify({
        type: 'playback',
        data: { ...args, action: 'control', command: args.action },
      });
      return { applied: true };
    }
    throw new Error('Unknown music action');
  }
}
