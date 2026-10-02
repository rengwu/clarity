import { useRememberedState, useSubmission } from '../state';
import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import {
  call,
  invoke,
  useApp,
  useResource,
  Dialog,
  Field,
  ErrorText,
  listAll,
  DeleteButton,
  ListState,
  useItemFocus,
} from '../api';

export function News() {
  const app = useApp();
  const list = useResource<any>(() => listAll('news'), [], 'news');
  const focus = useItemFocus('news', list.data?.items, list.loading);
  const submission = useSubmission();
  const [error, setError] = useState('');
  const sources = useResource<any[]>(() => invoke('news', 'sources'), [], 'news');
  const [source, setSource] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (app.target?.module === 'news' && app.target.id) {
      setSource('');
      setQuery('');
    }
  }, [app.target]);
  const [manage, setManage] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const items = (list.data?.items || [])
    .filter(
      (item: any) =>
        (!source || item.sourceId === source) &&
        `${item.title} ${item.source}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a: any, b: any) => b.published - a.published);
  return (
    <section className="page news-view">
      <div className="toolbar">
        <h1>News</h1>
        <button onClick={() => setManage(true)}>
          <Icon name="news" size={14} />
          Sources
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setStatus('Refreshing…');
            try {
              const result = await invoke('news', 'refresh');
              setStatus(result.errors.length ? result.errors.join('\n') : '');
            } catch (failure: any) {
              setStatus(failure.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Icon name="refresh" size={14} />
          Refresh
        </button>
      </div>
      <div className="news-toolbar">
        <label className="module-search">
          <Icon name="search" size={14} />
          <input
            type="search"
            aria-label="Search headlines"
            placeholder="Search headlines"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="list-filters" aria-label="News source">
          {[{ id: '', title: 'All sources' }, ...(sources.data || [])].map((item) => (
            <button
              key={item.id}
              className={source === item.id ? 'selected' : ''}
              aria-pressed={source === item.id}
              onClick={() => setSource(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
      <ErrorText>{list.error || focus.error}</ErrorText>
      <ListState
        loading={list.loading}
        count={items.length}
        query={query}
        empty="No articles yet. Add a feed in Sources, then refresh."
        error={list.error}
      />
      <p className="muted" role="status">
        {status}
      </p>
      <div className="news-list">
        {items.map((item: any) => (
          <article
            key={item.id}
            data-item-id={item.id}
            tabIndex={-1}
            data-focused={focus.id === item.id}
          >
            <button
              className="news-item"
              title={item.title}
              onClick={() => void call('external.open', { url: item.url }).catch(app.error)}
            >
              <Icon name="news" size={12} />
              <span className="news-headline">{item.title}</span>
              <span className="news-source">{item.source}</span>
              <time className="news-date" dateTime={new Date(item.published).toISOString()}>
                {new Date(item.published).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
              <Icon name="external" size={12} />
            </button>
          </article>
        ))}
      </div>
      {manage && (
        <Dialog title="News sources" onClose={() => setManage(false)}>
          <ul className="plain-list">
            {sources.data?.map((item) => (
              <li className="row" key={item.id}>
                <span>{item.title}</span>
                <span className="spacer" />
                <DeleteButton
                  name={item.title}
                  label="Remove"
                  onDelete={async () => {
                    await invoke('news', 'removeSource', {
                      id: item.id,
                      revision: item.revision,
                    });
                  }}
                />
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await submission.run(async () => {
                setError('');
                try {
                  await invoke('news', 'addSource', { title, url });
                  setTitle('');
                  setUrl('');
                } catch (failure: any) {
                  setError(failure.message);
                }
              });
            }}
          >
            <Field label="Name">
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </Field>
            <Field label="Feed URL">
              <input
                required
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </Field>
            <ErrorText>{error || sources.error}</ErrorText>
            <button className="primary" disabled={submission.busy}>
              Add source
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

export function Mail() {
  const app = useApp();
  const [page, setPage] = useRememberedState('mail:page', '');
  const [query, setQuery] = useRememberedState('mail:query', '');
  const [search, setSearch] = useRememberedState('mail:search', '');
  const [selected, setSelected] = useRememberedState('mail:selected', '');
  const [history, setHistory] = useRememberedState<string[]>('mail:history', []);
  useEffect(() => {
    if (app.target?.module === 'mail') setSelected(app.target.id || '');
  }, [app.target]);
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type !== 'auth' || event.data?.provider !== 'google') return;
        setSelected('');
        setPage('');
        setQuery('');
        setSearch('');
        setHistory([]);
      }),
    [],
  );
  const inbox = useResource<any>(
    () =>
      app.bootstrap.auth.google
        ? invoke('mail', 'list', { pageToken: page, query })
        : Promise.resolve({ messages: [] }),
    [page, query, app.bootstrap.auth.google],
    'mail',
  );
  const message = useResource<any>(
    () =>
      app.bootstrap.auth.google && selected
        ? invoke('mail', 'read', { id: selected })
        : Promise.resolve(null),
    [selected, app.bootstrap.auth.google],
    'mail',
  );
  if (!app.bootstrap.auth.google)
    return (
      <section className="page">
        <h1>Mail</h1>
        <p>Connect Google to read your inbox.</p>
        <button onClick={() => app.navigate('settings', { section: 'google' })}>
          Connect Google
        </button>
      </section>
    );
  return (
    <section className="mail-view">
      <aside className="mail-list">
        <div className="toolbar">
          <h1>Inbox</h1>
          <button
            className="icon-button quiet"
            aria-label="Refresh"
            title="Refresh inbox"
            onClick={() => void inbox.reload()}
          >
            <Icon name="refresh" size={14} />
          </button>
        </div>
        <form
          className="module-search"
          onSubmit={(event) => {
            event.preventDefault();
            setPage('');
            setHistory([]);
            setSelected('');
            app.rememberLocation?.({ module: 'mail' });
            setQuery(search);
          }}
        >
          <Icon name="search" size={14} />
          <input
            aria-label="Search mail"
            type="search"
            placeholder="Search mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
        <ErrorText>{inbox.error}</ErrorText>
        <ListState
          loading={inbox.loading}
          count={inbox.data?.messages.length || 0}
          query={query}
          empty="Your inbox is empty."
          error={inbox.error}
        />
        <nav aria-label="Messages">
          {inbox.data?.messages.map((item: any) => (
            <button
              key={item.id}
              className={`${selected === item.id ? 'selected' : ''} ${item.unread ? 'unread' : ''}`}
              onClick={() => app.navigate('mail', { id: item.id })}
            >
              <strong>{item.subject}</strong>
              <span>{item.from}</span>
              <small>{item.date && new Date(item.date).toLocaleDateString()}</small>
            </button>
          ))}
        </nav>
        <div className="row">
          {history.length > 0 && (
            <button
              disabled={inbox.loading}
              onClick={() => {
                setPage(history.at(-1)!);
                setHistory(history.slice(0, -1));
              }}
            >
              Previous page
            </button>
          )}
          {page && (
            <button
              disabled={inbox.loading}
              onClick={() => {
                setPage('');
                setHistory([]);
              }}
            >
              First page
            </button>
          )}
          {inbox.data?.nextPage && (
            <button
              disabled={inbox.loading}
              onClick={() => {
                setHistory([...history, page]);
                setPage(inbox.data.nextPage);
              }}
            >
              Older messages
            </button>
          )}
        </div>
      </aside>
      <article className="mail-reader">
        <ErrorText>{message.error}</ErrorText>
        {message.loading && selected && <p role="status">Loading message…</p>}
        {message.data && (
          <>
            <h1>{message.data.subject}</h1>
            <div className="mail-meta">
              <span>{message.data.from}</span>
              <time>
                {message.data.date &&
                  (Number.isNaN(new Date(message.data.date).getTime())
                    ? message.data.date
                    : new Date(message.data.date).toLocaleString())}
              </time>
            </div>
            <div className="mail-body">{message.data.text}</div>
          </>
        )}
        {!selected && <p className="muted">Select a message.</p>}
      </article>
    </section>
  );
}
