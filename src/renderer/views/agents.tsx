import React, { useState } from 'react';
import { call, invoke, useApp, useResource, Dialog, Field, ErrorText, labels } from '../api';
import { Markdown } from '../markdown';

export function Board() {
  const app = useApp();
  const [query, setQuery] = useState('');
  const list = useResource<any>(
    () => invoke('board', 'list', { query, limit: 2000 }),
    [query],
    'board',
  );
  const [selected, setSelected] = useState('');
  const thread = useResource<any>(
    () => (selected ? invoke('board', 'read', { id: selected }) : Promise.resolve(null)),
    [selected],
    'board',
  );
  const [compose, setCompose] = useState(false);
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="page">
      <div className="toolbar">
        <h1>Agent board</h1>
        <button onClick={() => setCompose(true)}>New thread</button>
        {selected && <button onClick={() => setSelected('')}>All threads</button>}
      </div>
      <ErrorText>{list.error || thread.error || error}</ErrorText>
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
                      onClick={() => app.navigate(link.module, { id: link.id, path: link.path })}
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
              try {
                await invoke('board', 'post', {
                  topic: thread.data.thread.topic,
                  text: reply,
                  threadId: selected,
                });
                setReply('');
              } catch (failure: any) {
                setError(failure.message);
              }
            }}
          >
            <Field label="Reply">
              <textarea required value={reply} onChange={(event) => setReply(event.target.value)} />
            </Field>
            <button className="primary">Post</button>
          </form>
        </div>
      ) : (
        <>
          <input
            type="search"
            className="search"
            aria-label="Search board"
            placeholder="Search board"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="thread-list">
            {list.data?.items
              .filter((post: any) => !post.threadId)
              .map((post: any) => (
                <button key={post.id} onClick={() => setSelected(post.id)}>
                  <strong>{post.topic}</strong>
                  <span>{post.text.slice(0, 180)}</span>
                  <time className="muted">{new Date(post.createdAt).toLocaleString()}</time>
                </button>
              ))}
          </div>
          {!list.loading && !list.data?.items.length && (
            <p className="muted">No posts. Agents use this board only when instructed.</p>
          )}
        </>
      )}
      {compose && (
        <Dialog title="New thread" onClose={() => setCompose(false)}>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                const item = await invoke('board', 'post', { topic, text });
                setSelected(item.id);
                setCompose(false);
                setTopic('');
                setText('');
              } catch (failure) {
                app.error(failure);
              }
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
            <button className="primary">Post</button>
          </form>
        </Dialog>
      )}
    </section>
  );
}

export function Automations() {
  const app = useApp();
  const list = useResource<any>(() => invoke('automations', 'list'), [], 'automations');
  const topics = useResource<any[]>(() => invoke('wiki', 'list'), [], 'wiki');
  const [editing, setEditing] = useState<any>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const review = useResource<any[]>(
    async () => {
      const items = await invoke('automations', 'list');
      return (
        await Promise.all(
          items.items.map((item: any) =>
            call<any[]>('actions.list', { owner: `automation:${item.id}` }),
          ),
        )
      ).flat();
    },
    [],
    'actions',
  );
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
          New automation
        </button>
      </div>
      <ErrorText>{list.error || error}</ErrorText>
      <div className="automation-list">
        {list.data?.items.map((item: any) => (
          <article key={item.id}>
            <div className="row">
              <h2>{item.title}</h2>
              <span className="spacer" />
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
                Enabled
              </label>
              <button
                onClick={() => {
                  setError('');
                  setEditing({ ...item });
                }}
              >
                Edit
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
                Run now
              </button>
            </div>
            <p>{item.instruction}</p>
            <p className="muted">
              {item.topicPath} ·{' '}
              {item.enabled && item.nextRun
                ? `Next: ${new Date(item.nextRun).toLocaleString()}`
                : 'Paused'}
            </p>
            {item.status === 'running' && <p role="status">Running…</p>}
            <ErrorText>{item.error}</ErrorText>
            {item.result && (
              <details>
                <summary>Last result · {new Date(item.lastRun).toLocaleString()}</summary>
                <Markdown text={item.result} />
              </details>
            )}
          </article>
        ))}
      </div>
      {review.data
        ?.filter((action) => action.status === 'pending')
        .map((action) => (
          <article className="action-review" key={action.id}>
            <strong>{action.description}</strong>
            <pre>{JSON.stringify(action.args, null, 2)}</pre>
            <div className="row">
              <button
                onClick={() =>
                  void call('actions.review', { id: action.id, apply: true }).catch(app.error)
                }
              >
                Apply
              </button>
              <button
                onClick={() =>
                  void call('actions.review', { id: action.id, apply: false }).catch(app.error)
                }
              >
                Dismiss
              </button>
            </div>
          </article>
        ))}
      {editing && (
        <Dialog
          title={editing.id ? 'Edit automation' : 'New automation'}
          onClose={() => setEditing(undefined)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await invoke('automations', editing.id ? 'update' : 'add', editing);
                setEditing(undefined);
              } catch (failure: any) {
                setError(failure.message);
              }
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
                onChange={(event) => setEditing({ ...editing, instruction: event.target.value })}
              />
            </Field>
            <div className="row">
              <Field label="Schedule">
                <select
                  value={editing.frequency}
                  onChange={(event) => setEditing({ ...editing, frequency: event.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </Field>
              {editing.frequency === 'weekly' && (
                <Field label="Day">
                  <select
                    value={editing.weekdays?.[0] || 'MO'}
                    onChange={(event) => setEditing({ ...editing, weekdays: [event.target.value] })}
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
              Runs while Clarity is open. Missed runs are skipped. Saving authorizes edits to this
              topic using new information from now on.
            </p>
            <ErrorText>{error}</ErrorText>
            <div className="form-actions">
              {editing.id && (
                <button
                  type="button"
                  onClick={() =>
                    void invoke('automations', 'remove', {
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
