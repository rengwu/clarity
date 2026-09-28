import type { Integrations } from './integrations';
import type { Auth } from './auth';
import type { Store } from './store';
import type { AppEvent } from '../shared/types';
import { SpotifyPlayer } from './spotify-player';

export type MusicItem = {
  id: string;
  source: 'spotify' | 'navidrome';
  type: 'song' | 'album' | 'artist' | 'playlist';
  title: string;
  artist?: string;
  cover?: string;
  duration?: number;
  uri?: string;
};
export class Music {
  private active?: 'spotify' | 'navidrome';
  private native: SpotifyPlayer;
  private queue: MusicItem[] = [];
  private index = 0;
  private visited = new Set<number>();
  private volume = 70;
  private shuffle = false;
  private repeat = 'off';
  private changes: Promise<any> = Promise.resolve();
  private generation = 0;
  constructor(
    private api: Integrations,
    private auth: Auth,
    private store: Store,
    private notify: (event: AppEvent) => void,
    executable: string,
    root: string,
  ) {
    this.native = new SpotifyPlayer(executable, root, auth, (event) => {
      if (this.active !== 'spotify') return;
      if (event.event === 'ended')
        void this.change(() => this.advance(1, true)).catch((error) =>
          this.playbackError(error.message),
        );
      else if (event.event === 'error') this.playbackError(event.message);
      else if (event.event === 'state' || event.event === 'position')
        this.notify({
          type: 'playback',
          data: {
            action: 'state',
            source: 'spotify',
            ...(event.playing !== undefined ? { playing: event.playing } : {}),
            ...(event.position !== undefined ? { position: event.position } : {}),
          },
        });
    });
  }
  connectPlayback() {
    return this.native.signIn();
  }
  async close() {
    this.generation++;
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
    this.notify({ type: 'playback', data: { action: 'error', source: 'spotify', message } });
  }
  private async playCurrent() {
    const item = this.queue[this.index];
    if (!item) return;
    await this.native.command('load', { uri: item.uri || `spotify:track:${item.id}` });
    await this.native.command('volume', { volume: this.volume });
    this.notify({
      type: 'playback',
      data: { action: 'play', source: 'spotify', queue: this.queue, index: this.index },
    });
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
        await this.native.command('stop');
        return;
      }
    }
    this.index = Math.max(0, next);
    await this.playCurrent();
  }
  private spotifyItem(item: any, type?: MusicItem['type']): MusicItem {
    const value = item.track || (!item.id && item.album ? item.album : item);
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
    };
  }
  async invoke(method: string, args: any): Promise<any> {
    if (method === 'play' || method === 'control')
      return this.change(() => this.perform(method, args));
    return this.perform(method, args);
  }
  private async perform(method: string, args: any): Promise<any> {
    if (method === 'recent')
      return (await this.store.list('music-recent'))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 30);
    if (method === 'search' || method === 'library') {
      const tasks: Promise<MusicItem[]>[] = [];
      if (this.auth.secrets.get('spotify'))
        tasks.push(
          (async () => {
            if (method === 'search') {
              const data = await this.api.spotify(
                `search?${new URLSearchParams({ q: String(args.query || ''), type: 'track,album,artist,playlist', limit: '20' })}`,
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
                    this.spotifyItem(item, args.type === 'albums' ? 'album' : 'playlist'),
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
        );
      if (this.auth.secrets.get('navidrome'))
        tasks.push(
          (async () => {
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
        );
      const settled = await Promise.allSettled(tasks);
      return {
        items: settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : [])),
        errors: settled.flatMap((result) =>
          result.status === 'rejected' ? [result.reason.message] : [],
        ),
      };
    }
    if (method === 'collection') {
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
      let path =
        args.id === 'liked'
          ? 'me/tracks?limit=50'
          : `${args.type === 'album' ? 'albums' : 'playlists'}/${encodeURIComponent(args.id)}/tracks?limit=50`;
      const items: MusicItem[] = [];
      for (let page = 0; path && page < 100; page++) {
        const data = await this.api.spotify(path);
        items.push(
          ...(data.items || [])
            .filter((item: any) => item && (item.track === undefined || item.track))
            .map((item: any) => this.spotifyItem(item, 'song')),
        );
        path = data.next
          ? new URL(data.next).pathname.replace('/v1/', '') + new URL(data.next).search
          : '';
      }
      return { items };
    }
    if (method === 'play') {
      const generation = this.generation;
      const source = args.source as MusicItem['source'];
      if (!['spotify', 'navidrome'].includes(source)) throw new Error('Unknown music source.');
      let queue: MusicItem[];
      if (args.type === 'song') queue = [args as MusicItem];
      else {
        let collection = await this.invoke('collection', args);
        if (args.type === 'artist') {
          if (!collection.items.length) throw new Error('No albums are available for this artist.');
          collection = await this.invoke('collection', collection.items[0]);
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
      if (source === 'spotify') {
        this.queue = queue;
        this.index = index;
        this.visited.clear();
        await this.playCurrent();
      } else
        this.notify({
          type: 'playback',
          data: { action: 'play', source, queue, index, context: args },
        });
      if (args.type !== 'song')
        await this.store.put('music-recent', `${source}-${args.type}-${args.id}`, args);
      return { playing: queue[index], source, count: queue.length };
    }
    if (method === 'control') {
      if (args.volume !== undefined) this.volume = Math.max(0, Math.min(100, Number(args.volume)));
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
        else if (args.action === 'pause' || args.action === 'resume')
          await this.native.command(args.action);
      }
      this.notify({ type: 'playback', data: { ...args, action: 'control', command: args.action } });
      return { applied: true };
    }
    throw new Error('Unknown music action');
  }
}
