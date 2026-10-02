import { useSubmission } from '../state';
import { ActionCard } from '../action-card';
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
  labels,
  listAll,
  DeleteButton,
  ListState,
  useItemFocus,
} from '../api';
import { Markdown } from '../markdown';

export function Board() {
  const app = useApp();
  const submission = useSubmission();
  const [query, setQuery] = useState('');
  const list = useResource<any>(() => listAll('board', { query, threads: true }), [query], 'board');
  const [selected, setSelected] = useState('');
  useEffect(() => {
    if (app.target?.module === 'board') setSelected(app.target.id || '');
  }, [app.target]);
  const thread = useResource<any>(
    () => (selected ? invoke('board', 'read', { id: selected }) : Promise.resolve(null)),
    [selected],
    'board',
  );
  const [compose, setCompose] = useState(false);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [replies, setReplies] = useState<Record<string, string>>({});
  const reply = replies[selected] || '';
  const setReply = (value: string) => setReplies((current) => ({ ...current, [selected]: value }));
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [composeError, setComposeError] = useState('');
  return (
    <section className="page">
      <div className="toolbar">
        <h1>Agent board</h1>
        <button
          className="primary"
          onClick={() => {
            setComposeError('');
            setCompose(true);
          }}
        >
          <Icon name="plus" size={14} />
          New thread
        </button>
        {selected && <button onClick={() => app.navigate('board', {})}>All threads</button>}
      </div>
      <ErrorText>{list.error || thread.error}</ErrorText>
      {selected && thread.data?.thread ? (
        <div className="board-thread">
          <h2>{thread.data.thread.topic}</h2>
          {[thread.data.thread, ...thread.data.replies].map((post: any) => (
            <article key={post.id}>
              <Markdown text={post.text} />
              {post.links?.map((link: any, index: number) => (
                <div key={index}>
                  {typeof link === 'string' ? (
                    <Markdown text={`[${link}](${link})`} />
                  ) : link?.module && labels[link.module] ? (
                    <button
                      className="link"
                      onClick={() =>
                        app.navigate(link.module, {
                          id: link.id,
                          path: link.path,
                        })
                      }
                    >
                      {link.label || link.path || labels[link.module]}
                    </button>
                  ) : (
                    <span>{JSON.stringify(link)}</span>
                  )}
                </div>
              ))}
              <time className="muted">{new Date(post.createdAt).toLocaleString()}</time>
            </article>
          ))}
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const submittedThread = selected;
              const submittedReply = reply;
              await submission.run(async () => {
                setReplyErrors((current) => ({
                  ...current,
                  [submittedThread]: '',
                }));
                try {
                  await invoke('board', 'post', {
                    topic: thread.data.thread.topic,
                    text: reply,
                    threadId: thread.data.thread.id,
                  });
                  setReplies((current) => ({
                    ...current,
                    [submittedThread]:
                      current[submittedThread] === submittedReply ? '' : current[submittedThread],
                  }));
                } catch (failure: any) {
                  setReplyErrors((current) => ({
                    ...current,
                    [submittedThread]: failure.message,
                  }));
                }
              });
            }}
          >
            <Field label="Reply">
              <textarea required value={reply} onChange={(event) => setReply(event.target.value)} />
            </Field>
            <ErrorText>{replyErrors[selected]}</ErrorText>
            <button className="primary" disabled={submission.busy}>
              Post
            </button>
          </form>
        </div>
      ) : (
        <>
          <label className="module-search">
            <Icon name="search" size={14} />
            <input
              type="search"
              aria-label="Search board"
              placeholder="Search board"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ListState
            loading={list.loading}
            count={list.data?.items.length || 0}
            query={query}
            error={list.error}
            empty="No posts. Agents use this board only when instructed."
          />
          <div className="thread-list">
            {list.data?.items.map((post: any) => (
              <button key={post.id} onClick={() => app.navigate('board', { id: post.id })}>
                <strong>{post.topic}</strong>
                <span>
                  {post.match
                    ? `Matching reply: ${post.match.slice(0, 180)}`
                    : post.text.slice(0, 180)}
                </span>
                <time className="muted">{new Date(post.createdAt).toLocaleString()}</time>
              </button>
            ))}
          </div>
          {selected && !thread.loading && !thread.data?.thread && (
            <ErrorText>This thread is no longer available.</ErrorText>
          )}
        </>
      )}
      {compose && (
        <Dialog title="New thread" onClose={() => setCompose(false)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await submission.run(async () => {
                setComposeError('');
                try {
                  const item = await invoke('board', 'post', { topic, text });
                  app.navigate('board', { id: item.id });
                  setCompose(false);
                  setTopic('');
                  setText('');
                } catch (failure: any) {
                  setComposeError(failure.message);
                }
              });
            }}
          >
            <Field label="Topic">
              <input
                autoFocus
                required
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              />
            </Field>
            <Field label="Post">
              <textarea required value={text} onChange={(event) => setText(event.target.value)} />
            </Field>
            <ErrorText>{composeError}</ErrorText>
            <button className="primary" disabled={submission.busy}>
              Post
            </button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

export function Automations() {
  const app = useApp();
  const submission = useSubmission();
  const list = useResource<any>(() => listAll('automations'), [], 'automations');
  const topics = useResource<any[]>(() => invoke('wiki', 'list'), [], 'wiki');
  const [editing, setEditing] = useState<any>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const review = useResource<any[]>(
    async () => {
      const items = await listAll('automations');
      return (
        await Promise.all(
          items.items.map((item: any) =>
            call<any[]>('actions.list', { owner: `automation:${item.id}` }),
          ),
        )
      ).flat();
    },
    [list.data],
    'actions',
  );
  const focus = useItemFocus('automations', list.data?.items, list.loading);
  return (
    <section className="page">
      <div className="toolbar">
        <h1>Automations</h1>
        <button
          className="primary"
          onClick={() => {
            setError('');
            setEditing({
              title: '',
              instruction: '',
              topicPath: '',
              hour: 9,
              minute: 0,
              frequency: 'daily',
              weekdays: ['MO'],
              enabled: true,
            });
          }}
        >
          <Icon name="plus" size={14} />
          New automation
        </button>
      </div>
      <ErrorText>{list.error || review.error || focus.error || error}</ErrorText>
      <ListState
        loading={list.loading}
        count={list.data?.items.length || 0}
        error={list.error}
        empty="No automations yet. Create a schedule for a wiki topic."
      />
      <div className="automation-list">
        {list.data?.items.map((item: any) => (
          <article
            key={item.id}
            data-item-id={item.id}
            tabIndex={-1}
            data-focused={focus.id === item.id}
          >
            <div className="automation-overview">
              <Icon name="automations" />
              <div className="automation-copy">
                <h2>{item.title}</h2>
                <p>{item.instruction}</p>
                <small>
                  {item.topicPath} ·{' '}
                  {item.enabled && item.nextRun
                    ? `Next: ${new Date(item.nextRun).toLocaleString()}`
                    : 'Paused'}
                </small>
              </div>
              <div className="automation-controls">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(event) =>
                      void invoke('automations', 'update', {
                        id: item.id,
                        revision: item.revision,
                        enabled: event.target.checked,
                      }).catch(app.error)
                    }
                  />
                  <span className="sr-only">Enabled</span>
                </label>
                <button
                  className="icon-button quiet"
                  aria-label="Edit"
                  title={`Edit ${item.title}`}
                  onClick={() => {
                    setError('');
                    setEditing({ ...item });
                  }}
                >
                  <Icon name="edit" size={14} />
                </button>
                <button
                  disabled={busy === item.id || item.status === 'running'}
                  onClick={async () => {
                    setBusy(item.id);
                    try {
                      await call('automations.run', { id: item.id });
                    } catch (failure: any) {
                      setError(failure.message);
                    } finally {
                      setBusy('');
                    }
                  }}
                >
                  <Icon name="play" size={13} />
                  Run now
                </button>
              </div>
            </div>
            {item.status === 'running' && <p role="status">Running…</p>}
            <ErrorText>{item.error}</ErrorText>
            {review.data
              ?.filter((action) => action.owner === `automation:${item.id}`)
              .map((action) => (
                <ActionCard key={action.id} action={action} />
              ))}
            {item.result && (
              <details>
                <summary>Last result · {new Date(item.lastRun).toLocaleString()}</summary>
                <Markdown text={item.result} />
              </details>
            )}
          </article>
        ))}
      </div>
      {editing && (
        <Dialog
          title={editing.id ? 'Edit automation' : 'New automation'}
          onClose={() => setEditing(undefined)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await submission.run(async () => {
                try {
                  await invoke('automations', editing.id ? 'update' : 'add', editing);
                  setEditing(undefined);
                } catch (failure: any) {
                  setError(failure.message);
                }
              });
            }}
          >
            <Field label="Name">
              <input
                autoFocus
                required
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>
            <Field label="Wiki topic">
              <input
                required
                list="wiki-topics"
                placeholder="Topic.md"
                value={editing.topicPath}
                onChange={(event) => setEditing({ ...editing, topicPath: event.target.value })}
              />
              <datalist id="wiki-topics">
                {topics.data
                  ?.filter((item) => !item.folder)
                  .map((item) => (
                    <option key={item.path} value={item.path} />
                  ))}
              </datalist>
            </Field>
            <Field label="Instructions">
              <textarea
                required
                placeholder="What to keep up to date, and which new app information to use"
                value={editing.instruction}
                onChange={(event) =>
                  setEditing({ ...editing, instruction: event.target.value })
                }
              />
            </Field>
            <div className="row">
              <Field label="Schedule">
                <select
                  value={editing.frequency}
                  onChange={(event) =>
                    setEditing({ ...editing, frequency: event.target.value })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </Field>
              {editing.frequency === 'weekly' && (
                <Field label="Day">
                  <select
                    value={editing.weekdays?.[0] || 'MO'}
                    onChange={(event) =>
                      setEditing({ ...editing, weekdays: [event.target.value] })
                    }
                  >
                    {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((day, index) => (
                      <option key={day} value={day}>
                        {
                          [
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday',
                            'Sunday',
                          ][index]
                        }
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Time">
                <input
                  type="time"
                  required
                  value={`${String(editing.hour).padStart(2, '0')}:${String(editing.minute).padStart(2, '0')}`}
                  onChange={(event) => {
                    const [hour, minute] = event.target.value.split(':').map(Number);
                    setEditing({ ...editing, hour, minute });
                  }}
                />
              </Field>
            </div>
            <p className="muted">
              Runs while Clarity is open. Missed runs are skipped. Saving authorizes edits to
              this topic using new information from now on.
            </p>
            <ErrorText>{error}</ErrorText>
            <div className="form-actions">
              {editing.id && (
                <DeleteButton
                  name={editing.title}
                  onDelete={async () => {
                    await invoke('automations', 'remove', {
                      id: editing.id,
                      revision: editing.revision,
                    });
                    setEditing(undefined);
                  }}
                />
              )}
              <span className="spacer" />
              <button type="button" onClick={() => setEditing(undefined)}>
                Cancel
              </button>
              <button className="primary" disabled={submission.busy}>
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
