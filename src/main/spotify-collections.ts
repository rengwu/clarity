import type { MusicItem } from './music';

type Collection = {
  id: string;
  type: string;
  offset?: number;
  refresh?: boolean;
};
export type CollectionPage = {
  item?: MusicItem;
  items: MusicItem[];
  nextOffset: number | null;
  total?: number;
};
type Entry = {
  item?: MusicItem;
  metadata?: Promise<MusicItem>;
  pages: Map<number, Promise<CollectionPage>>;
  pending: number;
};

export class SpotifyCollections {
  private entries = new Map<string, Entry>();
  constructor(
    private read: (path: string) => Promise<any>,
    private map: (value: any, type: MusicItem['type']) => MusicItem,
  ) {}
  clear() {
    this.entries.clear();
  }
  private trim() {
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= 50) break;
      if (!entry.pending) this.entries.delete(key);
    }
  }
  private metadata(entry: Entry, args: Collection) {
    if (args.id === 'liked')
      return Promise.resolve<MusicItem>({
        source: 'spotify',
        id: 'liked',
        type: 'playlist',
        title: 'Liked Songs',
      });
    if (entry.item) return Promise.resolve(entry.item);
    if (!entry.metadata)
      entry.metadata = this.read(
        args.type === 'album'
          ? `albums/${encodeURIComponent(args.id)}`
          : `playlists/${encodeURIComponent(args.id)}?fields=id,name,type,images`,
      )
        .then((data) => (entry.item = this.map(data, args.type as MusicItem['type'])))
        .finally(() => {
          entry.metadata = undefined;
        });
    return entry.metadata;
  }
  page(args: Collection): Promise<CollectionPage> {
    const offset = args.offset ?? 0;
    if (!Number.isSafeInteger(offset) || offset < 0)
      return Promise.reject(new Error('Track offset must be a non-negative integer.'));
    const key = JSON.stringify([args.type, args.id]);
    let entry = this.entries.get(key);
    if (!entry || (args.refresh && offset === 0)) {
      entry = { pages: new Map(), pending: 0 };
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    const cached = entry.pages.get(offset);
    if (cached) return cached;
    const current = entry;
    current.pending++;
    const endpoint =
      args.id === 'liked'
        ? 'me/tracks'
        : args.type === 'album'
          ? `albums/${encodeURIComponent(args.id)}/tracks`
          : `playlists/${encodeURIComponent(args.id)}/items`;
    const request = Promise.all([
      this.metadata(current, args),
      this.read(`${endpoint}?limit=50${offset ? `&offset=${offset}` : ''}`),
    ])
      .then(([item, data]) => {
        let nextOffset: number | null = null;
        if (data.next) {
          const next = new URL(data.next);
          nextOffset = Number(next.searchParams.get('offset'));
          if (
            next.origin !== 'https://api.spotify.com' ||
            next.pathname !== `/v1/${endpoint}` ||
            !Number.isSafeInteger(nextOffset) ||
            nextOffset <= offset
          )
            throw new Error(
              'Spotify returned an invalid next page. Refresh this collection to try again.',
            );
        }
        return {
          item,
          items: (data.items || [])
            .map((entry: any) => {
              if (!entry || typeof entry !== 'object' || entry.is_local) return null;
              if ('item' in entry) return entry.item;
              return typeof entry.track === 'object' ? entry.track : entry;
            })
            .filter(
              (item: any) =>
                item?.id &&
                typeof item.name === 'string' &&
                item.name.trim() &&
                !item.is_local &&
                (!item.type || item.type === 'track'),
            )
            .map((item: any) => this.map(item, 'song')),
          nextOffset,
          total: Number.isSafeInteger(data.total) && data.total >= 0 ? data.total : undefined,
        };
      })
      .catch((error) => {
        current.pages.delete(offset);
        throw error;
      })
      .finally(() => {
        current.pending--;
        this.trim();
      });
    current.pages.set(offset, request);
    this.trim();
    return request;
  }
  async all(args: Collection) {
    const pending = this.page({ ...args, offset: 0 });
    const key = JSON.stringify([args.type, args.id]);
    const entry = this.entries.get(key);
    const first = await pending;
    const items = [...first.items];
    let next = first.nextOffset;
    const checkCurrent = () => {
      if (this.entries.get(key) !== entry)
        throw new Error('This music collection changed while loading. Try again.');
    };
    while (next !== null) {
      checkCurrent();
      const page = await this.page({ ...args, offset: next, refresh: false });
      items.push(...page.items);
      next = page.nextOffset;
    }
    checkCurrent();
    return { item: first.item, items };
  }
}
