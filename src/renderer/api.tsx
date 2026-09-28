import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
export const call = <T = any,>(method: string, args?: any): Promise<T> =>
  window.clarity.call<T>(method, args);
export const invoke = (module: string, method: string, args?: any) =>
  call('module', { module, method, args });
export const AppContext = createContext<{
  bootstrap: any;
  refresh: () => Promise<void>;
  navigate: (module: string, target?: { id?: string; path?: string }) => void;
  error: (error: any) => void;
}>({ bootstrap: null, refresh: async () => {}, navigate: () => {}, error: () => {} });
export const useApp = () => useContext(AppContext);
export function useResource<T>(load: () => Promise<T>, dependencies: any[], module?: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const loader = useRef(load);
  loader.current = load;
  const generation = useRef(0);
  const reload = async () => {
    const request = ++generation.current;
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
    void reload();
    return () => {
      generation.current++;
    };
  }, dependencies);
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type === 'changed' && (!module || event.module === module)) void reload();
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
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
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
