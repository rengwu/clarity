import { useSubmission } from '../state';
import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import { useListMotion } from '../motion';
import {
  invoke,
  useApp,
  useResource,
  ErrorText,
  listAll,
  DeleteButton,
  ListState,
  useItemFocus,
  Dialog,
  Field,
} from '../api';

export function Todos() {
  const app = useApp();
  const submission = useSubmission();
  const list = useResource<any>(() => listAll('todos'), [], 'todos');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const focus = useItemFocus('todos', list.data?.items, list.loading);
  const [editing, setEditing] = useState<any>();
  const [busy, setBusy] = useState(false);
  const [updating, setUpdating] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [filter, setFilter] = useState('all');
  const items = list.data?.items || [];
  const visible = [...items]
    .filter((item) => filter === 'all' || (filter === 'completed') === !!item.done)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);
  useListMotion(
    '.tasks [data-item-id]',
    visible.map((item) => `${item.id}:${item.done}`).join('|'),
  );
  useEffect(() => {
    if (app.target?.module === 'todos' && app.target.id) setFilter('all');
  }, [app.target]);
  async function toggle(item: any, done: boolean) {
    setUpdating(item.id);
    list.setData((current: any) => ({
      ...current,
      items: current.items.map((task: any) =>
        task.id === item.id ? { ...task, done } : task,
      ),
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
    await submission.run(async () => {
      setBusy(true);
      setAddError('');
      try {
        await invoke('todos', 'add', { title, date: date || null });
        setTitle('');
        setDate('');
        setAdding(false);
      } catch (error) {
        setAddError(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    });
  }
  return (
    <section className="page todos-view">
      <div className="toolbar">
        <h1>Todos</h1>
        <button
          className="primary"
          onClick={() => {
            setAddError('');
            setAdding(true);
          }}
        >
          <Icon name="plus" size={14} />
          New task
        </button>
      </div>
      {adding && (
        <Dialog
          title="New task"
          onClose={() => {
            if (!busy) setAdding(false);
          }}
        >
          <form className="new-task-form" onSubmit={add}>
            <Field label="Task">
              <input
                autoFocus
                required
                aria-label="New task"
                placeholder="Add a task"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={1000}
              />
            </Field>
            <Field label="Date (optional)">
              <input
                type="date"
                aria-label="New task date (optional)"
                min="0001-01-01"
                max="9999-12-31"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <ErrorText>{addError}</ErrorText>
            <div className="form-actions">
              <button type="button" onClick={() => setAdding(false)}>
                Cancel
              </button>
              <button className="primary" disabled={busy || !title.trim()}>
                Add
              </button>
            </div>
          </form>
        </Dialog>
      )}
      <div className="list-filters" aria-label="Task filter">
        {['all', 'open', 'completed'].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? 'selected' : ''}
            onClick={() => setFilter(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}{' '}
            <span>
              {
                items.filter(
                  (item: any) => value === 'all' || (value === 'completed') === !!item.done,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <ErrorText>{list.error || focus.error}</ErrorText>
      <ListState
        loading={list.loading}
        count={visible.length}
        empty={
          filter === 'completed'
            ? 'No completed tasks.'
            : filter === 'open'
              ? 'All caught up.'
              : 'No tasks yet. Add a task to get started.'
        }
        error={list.error}
      />
      <ul className="tasks">
        {visible.map((item) => (
          <li
            className={item.done ? 'done' : ''}
            key={item.id}
            data-item-id={item.id}
            tabIndex={-1}
            data-focused={focus.id === item.id}
          >
            <input
              type="checkbox"
              aria-label={`Complete ${item.title}`}
              checked={item.done}
              disabled={updating === item.id}
              onChange={(event) => void toggle(item, event.target.checked)}
            />
            {editing?.id === item.id ? (
              <form
                className="task-edit"
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && !submission.busy) setEditing(undefined);
                }}
                onSubmit={async (event) => {
                  event.preventDefault();
                  await submission.run(async () => {
                    try {
                      await invoke('todos', 'update', {
                        id: item.id,
                        revision: editing.revision,
                        title: editing.title,
                        date: editing.date || null,
                      });
                      setEditing(undefined);
                    } catch (error) {
                      app.error(error);
                    }
                  });
                }}
              >
                <input
                  aria-label="Task title"
                  autoFocus
                  required
                  maxLength={1000}
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                />
                <div className="task-edit-actions">
                  <label className="task-date-field">
                    <span>Date (optional)</span>
                    <input
                      type="date"
                      aria-label="Task date (optional)"
                      min="0001-01-01"
                      max="9999-12-31"
                      value={editing.date || ''}
                      onChange={(event) =>
                        setEditing({ ...editing, date: event.target.value })
                      }
                    />
                  </label>
                  {editing.date && (
                    <button type="button" onClick={() => setEditing({ ...editing, date: '' })}>
                      Clear date
                    </button>
                  )}
                  <button
                    className="primary"
                    disabled={submission.busy || !editing.title.trim()}
                  >
                    {submission.busy ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    disabled={submission.busy}
                    onClick={() => setEditing(undefined)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="task-title" onClick={() => setEditing({ ...item })}>
                <span className="task-name">{item.title}</span>
                {item.date && (
                  <time className="task-date" dateTime={item.date}>
                    {new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </button>
            )}
            <DeleteButton
              compact
              name={item.title}
              onDelete={async () => {
                await invoke('todos', 'remove', { id: item.id, revision: item.revision });
              }}
            />
          </li>
        ))}
      </ul>
      {list.data?.truncated && <p className="muted">Showing the most recent 2,000 tasks.</p>}
    </section>
  );
}
