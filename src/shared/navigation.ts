import { modules } from './types';

export type ItemTarget = {
  module: string;
  id?: string;
  path?: string;
  section?: string;
  source?: string;
  type?: string;
  contextPath?: string;
  key?: number;
};

export function parseItemLink(address: string): ItemTarget | undefined {
  try {
    const url = new URL(address);
    if (url.protocol !== 'clarity:' || url.hostname !== 'item' || url.username || url.password)
      return;
    const module = decodeURIComponent(url.pathname.slice(1));
    if (!modules.includes(module as any)) return;
    const target: ItemTarget = { module };
    for (const key of ['id', 'path', 'source', 'type'] as const) {
      const value = url.searchParams.get(key);
      if (value) target[key] = value;
    }
    if (
      target.path &&
      (target.path.startsWith('/') ||
        target.path.includes('\\') ||
        target.path.split('/').includes('..'))
    )
      return;
    return target;
  } catch {
    return;
  }
}

export function itemLink(target: ItemTarget) {
  const url = new URL(`clarity://item/${target.module}`);
  for (const key of ['id', 'path', 'source', 'type'] as const)
    if (target[key]) url.searchParams.set(key, target[key]);
  return url.toString();
}
