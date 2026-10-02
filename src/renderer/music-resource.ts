import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { AppEvent } from '../shared/types';
import type { MusicItem } from '../main/music';
import { invoke } from './api';

type MusicResult = {
  items: MusicItem[];
  item?: MusicItem;
  errors?: string[];
  nextOffset?: number | null;
  total?: number;
};
type ReadMethod = 'recent' | 'library' | 'search' | 'collection';
type CacheEntry = {
  method: ReadMethod;
  data?: MusicResult;
  pending?: Promise<MusicResult>;
};
const cache = new Map<string, CacheEntry>();
const listeners = new Set<() => void>();
let revision = 0;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Player stays mounted across modules, so account changes also clear hidden Music results.
export function updateMusicCache(event: AppEvent) {
  const accountChanged =
    event.type === 'auth' &&
    ['spotify', 'navidrome'].includes(event.data?.provider) &&
    ['connected', 'disconnected'].includes(event.data?.kind);
  const recentChanged = event.type === 'changed' && event.module === 'music';
  if (!accountChanged && !recentChanged) return;
  for (const [key, entry] of cache) {
    if (accountChanged || entry.method === 'recent') cache.delete(key);
  }
  revision++;
  listeners.forEach((listener) => listener());
}

function trimCache() {
  for (const [key, entry] of cache) {
    if (cache.size <= 50) break;
    if (!entry.pending) cache.delete(key);
  }
}

function readMusic(
  key: string,
  method: ReadMethod,
  args: Record<string, string>,
  refresh: boolean,
  more = false,
) {
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    if (cached.pending) return cached.pending;
    if (cached.data && !refresh && !more) return Promise.resolve(cached.data);
  }
  const paged =
    method === 'collection' &&
    args.source === 'spotify' &&
    ['album', 'playlist'].includes(args.type);
  const previous = more ? cached?.data : undefined;
  if (more && previous?.nextOffset == null) return Promise.resolve(previous);
  const entry: CacheEntry = { method, data: cached?.data };
  cache.set(key, entry);
  const response =
    method === 'search' && !args.query
      ? Promise.resolve({ items: [] })
      : invoke(
          'music',
          method,
          paged ? { ...args, offset: previous?.nextOffset ?? 0, refresh } : args,
        );
  entry.pending = response
    .then((value) => {
      const data: MusicResult =
        method === 'recent' && Array.isArray(value)
          ? { items: value }
          : previous
            ? { ...value, items: [...previous.items, ...value.items] }
            : value;
      if (cache.get(key) === entry) {
        if (data.errors?.length) cache.delete(key);
        else entry.data = data;
      }
      return data;
    })
    .catch((error) => {
      if (cache.get(key) === entry) {
        if (previous && cached) cache.set(key, cached);
        else cache.delete(key);
      }
      throw error;
    })
    .finally(() => {
      entry.pending = undefined;
      trimCache();
    });
  trimCache();
  return entry.pending;
}

export function useMusicResource(
  root: string,
  method: ReadMethod,
  args: Record<string, string> = {},
) {
  const key = JSON.stringify([root, method, args]);
  const version = useSyncExternalStore(subscribe, () => revision);
  const [result, setResult] = useState<{
    key: string;
    version: number;
    data?: MusicResult;
    error: string;
    loading: boolean;
    more: boolean;
  }>();
  const generation = useRef(0);
  async function load(refresh = false, more = false) {
    const request = ++generation.current;
    const previous =
      (refresh || more) && result?.key === key && result.version === version ? result : undefined;
    const data = previous?.data || cache.get(key)?.data;
    setResult({
      key,
      version,
      data,
      error: previous?.error || '',
      loading: !data || refresh || more,
      more,
    });
    try {
      const next = await readMusic(key, method, args, refresh, more);
      if (request === generation.current && version === revision)
        setResult({
          key,
          version,
          data: next,
          error: '',
          loading: false,
          more,
        });
    } catch (error: any) {
      if (request === generation.current && version === revision)
        setResult({
          key,
          version,
          data,
          error: error.message,
          loading: false,
          more,
        });
    }
  }
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [key, version]);
  const data = cache.get(key)?.data;
  const current =
    result?.key === key && result.version === version
      ? result
      : { data, error: '', loading: !data, more: false };
  return {
    ...current,
    loadingMore: current.loading && current.more,
    hasMore: current.data?.nextOffset != null,
    reload: () => load(true),
    retry: () => (current.more ? load(false, true) : load(true)),
    loadMore: () =>
      current.loading || current.data?.nextOffset == null ? Promise.resolve() : load(false, true),
  };
}
