import { useSubmission } from '../state';
import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../icons';
import { Notice, useFeedback, errorMessage } from '../feedback';
import {
  call,
  invoke,
  useApp,
  useResource,
  Field,
  Dialog,
  ErrorText,
  listAll,
  DeleteButton,
  ListState,
  useItemFocus,
} from '../api';

export function Bookmarks() {
  const app = useApp();
  const feedback = useFeedback();
  const submission = useSubmission();
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (app.target?.module === 'bookmarks') setQuery('');
  }, [app.target]);
  const list = useResource<any>(() => listAll('bookmarks', { query }), [query], 'bookmarks');
  const focus = useItemFocus('bookmarks', list.data?.items, list.loading);
  const refreshState = useResource<any>(() => call('linkding.status'), [], 'bookmarks');
  const [editing, setEditing] = useState<any>();
  const editGeneration = useRef(0);
  function openEditor(item: any) {
    editGeneration.current++;
    setError('');
    setEditing(item);
  }
  function closeEditor() {
    editGeneration.current++;
    setEditing(undefined);
    setError('');
  }
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [refreshFailure, setRefreshFailure] = useState<{
    source: 'Linkding' | 'X';
    message: string;
  }>();
  const [partial, setPartial] = useState(false);
  const [busy, setBusy] = useState(false);
  const refreshGeneration = useRef(0);
  const refreshing = useRef(false);
  useEffect(() => {
    const unsubscribe = window.clarity.subscribe((event) => {
      if (event.type !== 'auth') return;
      refreshGeneration.current++;
      refreshing.current = false;
      setBusy(false);
      setStatus('');
      setPartial(false);
      setRefreshFailure(undefined);
      feedback.dismiss('bookmarks-refresh-Linkding');
      feedback.dismiss('bookmarks-refresh-X');
    });
    return () => {
      refreshGeneration.current++;
      unsubscribe();
    };
  }, [feedback]);
  async function refresh(source: 'Linkding' | 'X') {
    if (refreshing.current) return;
    refreshing.current = true;
    const generation = ++refreshGeneration.current;
    setBusy(true);
    feedback.dismiss(`bookmarks-refresh-${source}`);
    try {
      const result = await invoke('bookmarks', `refresh${source}`);
      if (generation !== refreshGeneration.current) return;
      const incomplete = !!result.truncated || result.complete === false;
      const summary = `${result.imported} imported${source === 'Linkding' ? `, ${result.updated} updated, ${result.preserved} with local edits preserved` : ''}${incomplete ? '. Older bookmarks may remain beyond this refresh’s limit.' : '.'}`;
      setStatus(summary);
      setPartial(incomplete);
      setRefreshFailure(undefined);
      if (!incomplete)
        feedback.notify({
          id: `bookmarks-refresh-${source}`,
          severity: 'success',
          title: `${source} bookmarks refreshed`,
          description: summary,
        });
      await refreshState.reload();
    } catch (failure: any) {
      if (generation === refreshGeneration.current)
        setRefreshFailure({ source, message: errorMessage(failure) });
    } finally {
      if (generation === refreshGeneration.current) {
        refreshing.current = false;
        setBusy(false);
      }
    }
  }
  return (
    <section className="page">
      <div className="toolbar">
        <h1>Bookmarks</h1>
        <button
          className="primary"
          onClick={() => {
            openEditor({ title: '', url: '', description: '', tags: '' });
          }}
        >
          <Icon name="plus" size={14} />
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
      <label className="module-search">
        <Icon name="search" size={14} />
        <input
          type="search"
          aria-label="Search bookmarks"
          placeholder="Search bookmarks"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {busy && (
        <p role="status" className="muted">
          Refreshing bookmarks…
        </p>
      )}
      {partial ? (
        <Notice severity="warning" title="Some bookmarks weren’t refreshed">
          {status}
        </Notice>
      ) : (
        status && <p className="muted">{status}</p>
      )}
      {app.bootstrap.auth.linkding && refreshState.data && (
        <p className="muted">
          {refreshState.data.lastRun
            ? `Last Linkding ${refreshState.data.error ? 'attempt' : 'refresh'}: ${new Date(refreshState.data.lastRun).toLocaleString()}. `
            : ''}
          {refreshState.data.result &&
            `${refreshState.data.result.imported} imported, ${refreshState.data.result.updated} updated, ${refreshState.data.result.preserved} with local edits preserved. `}
          {refreshState.data.result?.truncated &&
            'Older bookmarks remain beyond this refresh’s limit. '}
          {refreshState.data.nextRun
            ? `Next refresh: ${new Date(refreshState.data.nextRun).toLocaleString()}.`
            : ''}
        </p>
      )}
      <Notice
        title={refreshFailure ? `Couldn’t refresh ${refreshFailure.source}` : undefined}
        actions={
          refreshFailure && (
            <button disabled={busy} onClick={() => void refresh(refreshFailure.source)}>
              {busy ? 'Retrying…' : 'Try again'}
            </button>
          )
        }
      >
        {refreshFailure?.message || refreshState.data?.error || refreshState.error}
      </Notice>
      <ErrorText>{list.error || focus.error}</ErrorText>
      <ListState
        loading={list.loading}
        count={list.data?.items.length || 0}
        query={query}
        empty="No bookmarks yet. Add a bookmark or refresh a connected source."
        error={list.error}
      />
      <div className="bookmark-list">
        {list.data?.items.map((item: any) => (
          <article
            className="bookmark"
            key={item.id}
            data-item-id={item.id}
            tabIndex={-1}
            data-focused={focus.id === item.id}
          >
            <Icon name="bookmarks" size={16} />
            <div className="bookmark-copy">
              <div className="bookmark-first-line">
                <button
                  className="link bookmark-title"
                  title={item.title}
                  onClick={() =>
                    void call('external.open', { url: item.url }).catch((failure) =>
                      app.error(failure, {
                        id: `open-bookmark-${item.id}`,
                        title: `Couldn’t open ${item.title}`,
                      }),
                    )
                  }
                >
                  {item.title}
                </button>
                <span className="bookmark-tags" title={item.tags.join(', ')}>
                  {item.tags.map((tag: string) => (
                    <span className="mini-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
              <div className="bookmark-meta">
                <span className="bookmark-domain">
                  {item.url.replace(/^https?:\/\/(?:www\.)?/, '').split('/')[0]}
                </span>
                {item.description && (
                  <span className="bookmark-description">{item.description}</span>
                )}
                {item.source && (
                  <span className="bookmark-origin">
                    {item.source === 'local' ? '' : item.source}
                  </span>
                )}
              </div>
            </div>
            <button
              className="icon-button quiet row-action"
              aria-label="Edit"
              title={`Edit ${item.title}`}
              onClick={() => {
                openEditor({ ...item, tags: item.tags.join(', ') });
              }}
            >
              <Icon name="edit" size={14} />
            </button>
          </article>
        ))}
      </div>
      {list.data?.truncated && (
        <p className="muted">Showing 2,000 matches. Narrow your search to find older items.</p>
      )}
      {editing && (
        <Dialog title={editing.id ? 'Edit bookmark' : 'Add bookmark'} onClose={closeEditor}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const submittedGeneration = editGeneration.current;
              await submission.run(async () => {
                setError('');
                try {
                  await invoke('bookmarks', editing.id ? 'update' : 'add', {
                    ...editing,
                    tags: editing.tags
                      .split(',')
                      .map((tag: string) => tag.trim())
                      .filter(Boolean),
                  });
                  if (submittedGeneration === editGeneration.current) closeEditor();
                } catch (failure: any) {
                  if (submittedGeneration === editGeneration.current) setError(failure.message);
                }
              });
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
                <DeleteButton
                  name={editing.title || editing.description || 'this item'}
                  onDelete={async () => {
                    const deletedGeneration = editGeneration.current;
                    await invoke('bookmarks', 'remove', {
                      id: editing.id,
                      revision: editing.revision,
                    });
                    if (deletedGeneration === editGeneration.current) closeEditor();
                  }}
                />
              )}
              <span className="spacer" />
              <button type="button" onClick={closeEditor}>
                Cancel
              </button>
              <button className="primary" disabled={submission.busy}>
                {submission.busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
