import React, { useState } from 'react';
import { invoke, useApp, useResource, ErrorText } from '../api';

export function Todos() {
  const app = useApp();
  const list = useResource<any>(() => invoke('todos', 'list', { limit: 2000 }), [], 'todos');
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState<any>();
  const [busy, setBusy] = useState(false);
  const [updating, setUpdating] = useState('');
  async function toggle(item: any, done: boolean) {
    setUpdating(item.id);
    list.setData((current: any) => ({
      ...current,
      items: current.items.map((task: any) => (task.id === item.id ? { ...task, done } : task)),
    }));
    try {
      await invoke('todos', 'update', { id: item.id, revision: item.revision, done });
    } catch (error) {
      app.error(error);
    } finally {
      await list.reload();
      setUpdating('');
    }
  }
  async function add(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await invoke('todos', 'add', { title });
      setTitle('');
    } catch (error) {
      app.error(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <div className="toolbar">
        <h1>Todos</h1>
      </div>
      <form className="row add-task" onSubmit={add}>
        <input
          aria-label="New task"
          placeholder="Add a task"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={1000}
        />
        <button className="primary" disabled={busy || !title.trim()}>
          Add
        </button>
      </form>
      <ErrorText>{list.error}</ErrorText>
      <ul className="tasks">
        {[...(list.data?.items || [])]
          .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt)
          .map((item) => (
            <li className={item.done ? 'done' : ''} key={item.id}>
              <input
                type="checkbox"
                aria-label={`Complete ${item.title}`}
                checked={item.done}
                disabled={updating === item.id}
                onChange={(event) => void toggle(item, event.target.checked)}
              />
              {editing?.id === item.id ? (
                <form
                  className="task-title"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    try {
                      await invoke('todos', 'update', {
                        id: item.id,
                        revision: item.revision,
                        title: editing.title,
                      });
                      setEditing(undefined);
                    } catch (error) {
                      app.error(error);
                    }
                  }}
                >
                  <input
                    aria-label="Task title"
                    autoFocus
                    value={editing.title}
                    onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setEditing(undefined);
                    }}
                  />
                  <button>Save</button>
                </form>
              ) : (
                <button className="task-title" onClick={() => setEditing({ ...item })}>
                  {item.title}
                </button>
              )}
              <button
                className="quiet"
                aria-label={`Delete ${item.title}`}
                onClick={() =>
                  void invoke('todos', 'remove', { id: item.id, revision: item.revision }).catch(
                    app.error,
                  )
                }
              >
                ×
              </button>
            </li>
          ))}
      </ul>
      {list.data?.truncated && <p className="muted">Showing the most recent 2,000 tasks.</p>}
    </section>
  );
}
