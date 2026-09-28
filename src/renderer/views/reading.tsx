import React, { useState } from 'react';
import { call, invoke, useApp, useResource, Dialog, Field, ErrorText } from '../api';

export function News() {
  const app = useApp();
  const list = useResource<any>(() => invoke('news', 'list', { limit: 2000 }), [], 'news');
  const sources = useResource<any[]>(() => invoke('news', 'sources'), [], 'news');
  const [source, setSource] = useState('');
  const [manage, setManage] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="page">
      <div className="toolbar">
        <h1>News</h1>
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
          Refresh
        </button>
        <button onClick={() => setManage(true)}>Sources</button>
        <select
          aria-label="News source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        >
          <option value="">All sources</option>
          {sources.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>
      <ErrorText>{list.error}</ErrorText>
      <p className="muted" role="status">
        {status}
      </p>
      {!sources.data?.length && <p>Add an RSS or Atom feed in Sources.</p>}
      <div className="news-list">
        {[...(list.data?.items || [])]
          .filter((item) => !source || item.sourceId === source)
          .sort((a, b) => b.published - a.published)
          .map((item) => (
            <article key={item.id}>
              <button
                className="link"
                onClick={() => void call('external.open', { url: item.url }).catch(app.error)}
              >
                {item.title}
              </button>
              <div className="muted">
                {item.source} · {new Date(item.published).toLocaleString()}
              </div>
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
                <button
                  onClick={() =>
                    void invoke('news', 'removeSource', { id: item.id }).catch(app.error)
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await invoke('news', 'addSource', { title, url });
                setTitle('');
                setUrl('');
              } catch (error) {
                app.error(error);
              }
            }}
          >
            <Field label="Name">
              <input required value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Feed URL">
              <input
                required
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </Field>
            <button className="primary">Add source</button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

export function Mail() {
  const app = useApp();
  const [page, setPage] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const inbox = useResource<any>(
    () =>
      app.bootstrap.auth.google
        ? invoke('mail', 'list', { pageToken: page, query })
        : Promise.resolve({ messages: [] }),
    [page, query, app.bootstrap.auth.google],
    'mail',
  );
  const message = useResource<any>(
    () => (selected ? invoke('mail', 'read', { id: selected }) : Promise.resolve(null)),
    [selected],
    'mail',
  );
  if (!app.bootstrap.auth.google)
    return (
      <section className="page">
        <h1>Mail</h1>
        <p>Connect Google to read your inbox.</p>
        <button onClick={() => app.navigate('settings')}>Connect Google</button>
      </section>
    );
  return (
    <section className="mail-view">
      <aside className="mail-list">
        <div className="toolbar">
          <h1>Inbox</h1>
          <button onClick={() => void inbox.reload()}>Refresh</button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setPage('');
            setQuery(search);
          }}
        >
          <input
            aria-label="Search mail"
            type="search"
            placeholder="Search mail"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>
        <ErrorText>{inbox.error}</ErrorText>
        {inbox.loading && <p role="status">Loading inbox…</p>}
        <nav aria-label="Messages">
          {inbox.data?.messages.map((item: any) => (
            <button
              key={item.id}
              className={`${selected === item.id ? 'selected' : ''} ${item.unread ? 'unread' : ''}`}
              onClick={() => setSelected(item.id)}
            >
              <strong>{item.subject}</strong>
              <span>{item.from}</span>
              <small>{item.date && new Date(item.date).toLocaleDateString()}</small>
            </button>
          ))}
        </nav>
        <div className="row">
          {page && <button onClick={() => setPage('')}>First page</button>}
          {inbox.data?.nextPage && (
            <button onClick={() => setPage(inbox.data.nextPage)}>Older messages</button>
          )}
        </div>
      </aside>
      <article className="mail-reader">
        <ErrorText>{message.error}</ErrorText>
        {message.loading && selected && <p role="status">Loading message…</p>}
        {message.data && (
          <>
            <h1>{message.data.subject}</h1>
            <p>{message.data.from}</p>
            <p className="muted">{message.data.date}</p>
            <div className="mail-body">{message.data.text}</div>
          </>
        )}
        {!selected && <p className="muted">Select a message.</p>}
      </article>
    </section>
  );
}
