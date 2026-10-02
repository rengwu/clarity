import type { RecordValue } from '../shared/types';

const fields = ['title', 'url', 'description', 'tags'] as const;
const same = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b);

export function reconcileBookmark(current: RecordValue, incoming: Record<string, any>) {
  const next: RecordValue = { ...current, sourceValues: incoming };
  let updated = false;
  let preserved = false;
  for (const key of fields) {
    const previous = current.sourceValues?.[key];
    const untouched = current.sourceValues ? same(current[key], previous) : current.revision === 1;
    if (same(current[key], incoming[key])) continue;
    if (untouched) {
      next[key] = incoming[key];
      updated = true;
    } else preserved = true;
  }
  return { next, updated, preserved, changed: !same(next, current) };
}
