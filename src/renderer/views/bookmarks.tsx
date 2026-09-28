import React, { useState } from 'react';
import { call, invoke, useApp, useResource, Field, Dialog, Source, ErrorText } from '../api';

export function Bookmarks() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const list = useResource<any>(
    () => invoke('bookmarks', 'list', { query, limit: 2000 }),
    [query],
    'bookmarks',
  );
  const [editing, setEditing] = useState<any>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh(source: 'Linkding' | 'X') {
    setBusy(true);
    setStatus(`Refreshing ${source}…`);
    try {
      const result = await invoke('bookmarks', `refresh${source}`);
      setStatus(
        `${result.imported} bookmarks imported${result.truncated || result.complete === false ? '. Older bookmarks may remain beyond this refresh’s limit.' : '.'}`,
      );
    } catch (failure: any) {
      setStatus(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <div className="toolbar">
        <h1>Bookmarks</h1>
        <button
          className="primary"
          onClick={() => {
            setError('');
            setEditing({ title: '', url: '', description: '', tags: '' });
          }}
        >
          Add bookmark
        </button>
        <button
          disabled={busy || !app.bootstrap.auth.linkding}
          onClick={() => void refresh('Linkding')}
        >
          Refresh Linkding
        </button>
        <button disabled={busy} onClick={() => void refresh('X')}>
          Refresh X
        </button>
      </div>
      <input
        className="search"
        type="search"
        aria-label="Search bookmarks"
        placeholder="Search bookmarks"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p role="status" className="muted">
        {status}
      </p>
      <ErrorText>{list.error}</ErrorText>
      <div className="bookmark-list">
        {list.data?.items.map((item: any) => (
          <article className="bookmark" key={item.id}>
            <div className="row">
              <button
                className="link bookmark-title"
                onClick={() => void call('external.open', { url: item.url }).catch(app.error)}
              >
                {item.title}
              </button>
              {item.source && <Source source={item.source} />}
              <span className="spacer" />
              <button
                onClick={() => {
                  setError('');
                  setEditing({ ...item, tags: item.tags.join(', ') });
                }}
              >
                Edit
              </button>
            </div>
            <div className="muted bookmark-url">{item.url}</div>
            {item.description && <p>{item.description}</p>}
            <div className="row muted">
              <span>{item.tags.join(' · ')}</span>
              <span className="spacer" />
              <time>{new Date(item.createdAt).toLocaleDateString()}</time>
            </div>
          </article>
        ))}
      </div>
      {list.data?.truncated && (
        <p className="muted">Showing 2,000 matches. Narrow your search to find older items.</p>
      )}
      {editing && (
        <Dialog
          title={editing.id ? 'Edit bookmark' : 'Add bookmark'}
          onClose={() => setEditing(undefined)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await invoke('bookmarks', editing.id ? 'update' : 'add', {
                  ...editing,
                  tags: editing.tags
                    .split(',')
                    .map((tag: string) => tag.trim())
                    .filter(Boolean),
                });
                setEditing(undefined);
              } catch (failure: any) {
                setError(failure.message);
              }
            }}
          >
            <Field label="Title">
              <input
                autoFocus
                required
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>
            <Field label="URL">
              <input
                required
                type="url"
                value={editing.url}
                onChange={(event) => setEditing({ ...editing, url: event.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={editing.description}
                onChange={(event) => setEditing({ ...editing, description: event.target.value })}
              />
            </Field>
            <Field label="Tags (comma separated)">
              <input
                value={editing.tags}
                onChange={(event) => setEditing({ ...editing, tags: event.target.value })}
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <div className="form-actions">
              {editing.id && (
                <button
                  type="button"
                  onClick={() =>
                    void invoke('bookmarks', 'remove', {
                      id: editing.id,
                      revision: editing.revision,
                    })
                      .then(() => setEditing(undefined))
                      .catch(app.error)
                  }
                >
                  Delete
                </button>
              )}
              <span className="spacer" />
              <button type="button" onClick={() => setEditing(undefined)}>
                Cancel
              </button>
              <button className="primary">Save</button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
