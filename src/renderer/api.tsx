import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ItemTarget } from '../shared/navigation';
import { useSubmission } from './state';
import { Icon } from './icons';
export const call = <T = any,>(method: string, args?: any): Promise<T> =>
  window.clarity.call<T>(method, args);
export const invoke = (module: string, method: string, args?: any) =>
  call('module', { module, method, args });
export const AppContext = createContext<{
  bootstrap: any;
  refresh: () => Promise<void>;
  navigate: (module: string, target?: Omit<ItemTarget, 'module'>) => void;
  target?: ItemTarget;
  active?: string;
  inspect?: (target: ItemTarget) => void;
  rememberLocation?: (target: ItemTarget) => void;
  error: (error: any) => void;
}>({ bootstrap: null, refresh: async () => {}, navigate: () => {}, error: () => {} });
export const useApp = () => useContext(AppContext);
export function useResource<T>(load: () => Promise<T>, dependencies: any[], module?: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accountGeneration, setAccountGeneration] = useState(0);
  const loader = useRef(load);
  loader.current = load;
  const generation = useRef(0);
  const reload = async () => {
    const request = ++generation.current;
    setLoading(true);
    try {
      const next = await loader.current();
      if (request === generation.current) {
        setData(next);
        setError('');
      }
    } catch (error: any) {
      if (request === generation.current) setError(error.message);
    } finally {
      if (request === generation.current) setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    setData(undefined);
    setError('');
    void reload();
    return () => {
      generation.current++;
    };
  }, [...dependencies, accountGeneration]);
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type === 'auth' && module === 'mail' && event.data?.provider === 'google') {
          generation.current++;
          setData(undefined);
          setError('');
          setLoading(true);
          setAccountGeneration((current) => current + 1);
          return;
        }
        if (
          (event.type === 'changed' && (!module || event.module === module)) ||
          (event.type === 'auth' && module === 'music')
        )
          void reload();
      }),
    [...dependencies, module],
  );
  return { data, error, loading, reload, setData };
}
export function ErrorText({ children }: { children: React.ReactNode }) {
  return children ? (
    <p className="error" role="alert">
      {children}
    </p>
  ) : null;
}
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Close" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function DeleteButton({
  name,
  onDelete,
  label = 'Delete',
  compact = false,
}: {
  name: string;
  onDelete: () => Promise<void>;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const submission = useSubmission();
  return (
    <>
      <button
        type="button"
        className={compact ? 'icon-button quiet row-action' : 'danger'}
        title={compact ? `${label} ${name}` : undefined}
        aria-label={`${label} ${name}`}
        onClick={() => {
          setError('');
          setOpen(true);
        }}
      >
        {compact ? <Icon name="trash" size={14} /> : label}
      </button>
      {open && (
        <Dialog
          title={`Delete ${name}?`}
          onClose={() => {
            if (!submission.busy) setOpen(false);
          }}
        >
          <p>This permanently deletes this item. It cannot be undone.</p>
          <ErrorText>{error}</ErrorText>
          <div className="form-actions">
            <button
              type="button"
              autoFocus
              disabled={submission.busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="danger primary"
              disabled={submission.busy}
              onClick={() =>
                void submission.run(async () => {
                  try {
                    await onDelete();
                    setOpen(false);
                  } catch (failure: any) {
                    setError(failure.message);
                  }
                })
              }
            >
              {submission.busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

export async function listAll(module: string, args: any = {}) {
  const items: any[] = [];
  let offset = 0;
  while (true) {
    const page = await invoke(module, 'list', { ...args, offset, limit: 2000 });
    items.push(...page.items);
    if (!page.truncated) return { items, total: page.total, truncated: false };
    if (!page.items.length)
      throw new Error('The list changed while loading. Refresh to try again.');
    offset += page.items.length;
  }
}

export function useItemFocus(module: string, items: any[] | undefined, loading = false) {
  const { target } = useApp();
  const id = target?.module === module ? target.id : undefined;
  const [error, setError] = useState('');
  useEffect(() => {
    setError('');
    if (!id || !items || loading) return;
    if (!items.some((item) => item.id === id)) {
      setError('This item is no longer available in this module.');
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(id)}"]`);
    element?.scrollIntoView({ block: 'center' });
    element?.focus({ preventScroll: true });
  }, [target, items, loading]);
  return { id, error };
}

export function ListState({
  loading,
  count,
  query,
  empty = 'No items yet.',
  error,
}: {
  loading: boolean;
  count: number;
  query?: string;
  empty?: string;
  error?: string;
}) {
  if (error) return null;
  if (loading)
    return (
      <p className="muted list-state" role="status">
        Loading…
      </p>
    );
  if (!count)
    return (
      <p className="muted list-state" role="status">
        {query ? `No results for “${query}”.` : empty}
      </p>
    );
  return null;
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const labelId = useId();
  return (
    <label className="field">
      <span id={labelId}>{label}</span>
      {React.isValidElement(children)
        ? React.cloneElement(
            children as React.ReactElement<{
              'aria-label'?: string;
              'aria-labelledby'?: string;
            }>,
            {
              'aria-labelledby': (children.props as { 'aria-label'?: string })['aria-label']
                ? undefined
                : labelId,
            },
          )
        : children}
    </label>
  );
}
export function Source({ source }: { source: string }) {
  return (
    <span className={`source source-${source}`}>
      {source === 'navidrome' ? 'Navidrome' : source === 'spotify' ? 'Spotify' : source}
    </span>
  );
}
export const labels: Record<string, string> = {
  chat: 'Chat',
  notes: 'Notes',
  todos: 'Todos',
  wiki: 'Wiki',
  calendar: 'Calendar',
  expenses: 'Expenses',
  mail: 'Mail',
  news: 'News',
  bookmarks: 'Bookmarks',
  music: 'Music',
  board: 'Agent board',
  automations: 'Automations',
};
