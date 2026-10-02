import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const viewState = new Map<string, unknown>();
const draftRevisions = new Map<string, number>();

export function readDraftRevision(key: string) {
  return draftRevisions.get(key) || 0;
}

export function readDraft<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`clarity:draft:${key}`);
    return saved === null ? fallback : JSON.parse(saved);
  } catch {
    return fallback;
  }
}

export function writeDraft(key: string, value: unknown) {
  localStorage.setItem(`clarity:draft:${key}`, JSON.stringify(value));
  draftRevisions.set(key, readDraftRevision(key) + 1);
  window.dispatchEvent(new CustomEvent('clarity-draft', { detail: { key, value } }));
}

export function useRememberedState<T>(key: string, initial: T, persistent = false) {
  const [value, setValue] = useState<T>(() =>
    persistent ? readDraft(key, initial) : viewState.has(key) ? (viewState.get(key) as T) : initial,
  );
  useEffect(() => {
    if (!persistent) return;
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail.key === key) setValue(detail.value);
    };
    window.addEventListener('clarity-draft', changed);
    return () => window.removeEventListener('clarity-draft', changed);
  }, [key, persistent]);
  const current = useRef(value);
  current.current = value;
  const update: Dispatch<SetStateAction<T>> = (change) => {
    const next =
      typeof change === 'function' ? (change as (previous: T) => T)(current.current) : change;
    if (persistent) writeDraft(key, next);
    else viewState.set(key, next);
    current.current = next;
    setValue(next);
  };
  return [value, update] as const;
}

export function useSubmission() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  async function run(work: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    try {
      await work();
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, run };
}
