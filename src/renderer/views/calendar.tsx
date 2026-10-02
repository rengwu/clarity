import { useSubmission } from '../state';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  invoke,
  useApp,
  useResource,
  Dialog,
  Field,
  ErrorText,
  listAll,
  DeleteButton,
  useItemFocus,
} from '../api';
import { localDate } from './expenses';
import { Icon } from '../icons';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const startOfWeek = (value: Date) => {
  const date = new Date(value);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
};
const plusDays = (value: Date, count: number) => {
  const date = new Date(value);
  date.setDate(date.getDate() + count);
  return date;
};
const inputDate = (date: Date) =>
  `${localDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

function layoutEvents(events: any[]) {
  const result: { item: any; column: number; columns: number }[] = [];
  let group: { item: any; column: number }[] = [],
    ends: number[] = [];
  const finish = () => {
    result.push(...group.map((entry) => ({ ...entry, columns: ends.length })));
    group = [];
    ends = [];
  };
  for (const item of events) {
    const start = Date.parse(item.start),
      end = Date.parse(item.end);
    if (ends.length && start >= Math.max(...ends)) finish();
    let column = ends.findIndex((value) => value <= start);
    if (column < 0) column = ends.length;
    ends[column] = end;
    group.push({ item, column });
  }
  finish();
  return result;
}

export function Calendar() {
  const app = useApp();
  const submission = useSubmission();
  const events = useResource<any>(() => listAll('calendar'), [], 'calendar');
  const todosEnabled = app.bootstrap.settings.enabled.includes('todos');
  const todos = useResource<any>(
    () => (todosEnabled ? listAll('todos') : Promise.resolve({ items: [] })),
    [todosEnabled],
    'todos',
  );
  const [view, setView] = useState<'week' | 'month'>('week');
  const [date, setDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(new Date());
  const [monthRange, setMonthRange] = useState({ before: 6, after: 12 });
  const [editing, setEditing] = useState<any>();
  const [error, setError] = useState('');
  const scroller = useRef<HTMLDivElement>(null);
  const weekScroller = useRef<HTMLDivElement>(null);
  const previousHeight = useRef(0);
  const monthBase = useRef(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const week = startOfWeek(date);
  const firstMonth = new Date(
    monthBase.current.getFullYear(),
    monthBase.current.getMonth() - monthRange.before,
    1,
  );
  const lastMonth = new Date(
    monthBase.current.getFullYear(),
    monthBase.current.getMonth() + monthRange.after + 1,
    1,
  );
  const firstDay = startOfWeek(firstMonth);
  const ordinal = (value: Date) =>
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000;
  const dayCount = Math.ceil((ordinal(lastMonth) - ordinal(firstDay)) / 7) * 7;
  const items: any[] = events.data?.items || [];
  const tasksByDate = new Map<string, any[]>();
  for (const task of [...(todosEnabled ? todos.data?.items || [] : [])].sort(
    (a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt,
  )) {
    if (!task.date) continue;
    const tasks = tasksByDate.get(task.date) || [];
    tasks.push(task);
    tasksByDate.set(task.date, tasks);
  }
  const tasksForDay = (day: Date) =>
    (tasksByDate.get(localDate(day)) || []).map((task) => (
      <button
        key={task.id}
        className={`calendar-task${task.done ? ' completed' : ''}`}
        data-todo-id={task.id}
        aria-label={`${task.done ? 'Completed task' : 'Task'}: ${task.title}`}
        title={task.title}
        onClick={() => app.navigate('todos', { id: task.id })}
      >
        <span aria-hidden="true">{task.done ? '☑' : '☐'}</span>
        <span className="task-name">{task.title}</span>
      </button>
    ));
  useEffect(() => {
    if (app.target?.module !== 'calendar' || !app.target.id || !events.data) return;
    const item = items.find((item) => item.id === app.target!.id);
    if (item) {
      setDate(new Date(item.start));
      setView('week');
    }
  }, [app.target, events.data]);
  const focus = useItemFocus('calendar', events.data?.items, events.loading);
  useEffect(() => {
    if (focus.id)
      document
        .querySelector<HTMLElement>(`[data-item-id="${CSS.escape(focus.id)}"]`)
        ?.scrollIntoView({ block: 'center' });
  }, [date, view, focus.id]);
  const forDay = (day: Date) =>
    items
      .filter((item) => new Date(item.start) < plusDays(day, 1) && new Date(item.end) > day)
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const add = (day: Date, hour = 9, minute = 0) => {
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    setError('');
    setEditing({
      title: '',
      start: inputDate(start),
      end: inputDate(new Date(start.getTime() + 3600000)),
    });
  };
  const edit = (item: any) => {
    setError('');
    setEditing({
      ...item,
      start: inputDate(new Date(item.start)),
      end: inputDate(new Date(item.end)),
    });
  };
  useEffect(() => {
    if (view === 'week' && weekScroller.current) weekScroller.current.scrollTop = 7 * 44;
  }, [view]);
  useLayoutEffect(() => {
    if (view !== 'month' || !scroller.current) return;
    if (previousHeight.current) {
      scroller.current.scrollTop += scroller.current.scrollHeight - previousHeight.current;
      previousHeight.current = 0;
    } else
      scroller.current
        .querySelector(`[data-month="${date.getFullYear()}-${date.getMonth()}"]`)
        ?.scrollIntoView({ block: 'start' });
  }, [view, date, monthRange.before]);
  function navigate(count: number) {
    if (view === 'week') setDate(plusDays(date, count * 7));
    else {
      const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + count, 1);
      const offset =
        (next.getFullYear() - monthBase.current.getFullYear()) * 12 +
        next.getMonth() -
        monthBase.current.getMonth();
      setDate(next);
      setMonthRange((range) => ({
        before: Math.max(range.before, -offset + 6),
        after: Math.max(range.after, offset + 6),
      }));
    }
  }
  return (
    <section className="calendar-view">
      <div className="toolbar">
        <h1>
          {(view === 'month' ? visibleMonth : date).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </h1>
        <div className="segmented">
          <button
            className={view === 'week' ? 'selected' : ''}
            onClick={() => {
              if (view === 'month') setDate(visibleMonth);
              setView('week');
            }}
          >
            Week
          </button>
          <button
            className={view === 'month' ? 'selected' : ''}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
        <span className="spacer" />
        <button
          className="icon-button quiet"
          aria-label="Previous period"
          onClick={() => navigate(-1)}
        >
          <Icon name="left" size={14} />
        </button>
        <button onClick={() => setDate(new Date())}>Today</button>
        <button
          className="icon-button quiet"
          aria-label="Next period"
          onClick={() => navigate(1)}
        >
          <Icon name="right" size={14} />
        </button>
        <button
          className="primary"
          onClick={() => add(view === 'month' ? visibleMonth : date)}
        >
          <Icon name="plus" size={14} />
          Event
        </button>
      </div>
      <ErrorText>{events.error || focus.error}</ErrorText>
      <ErrorText>
        {todosEnabled && todos.error ? `Could not load tasks: ${todos.error}` : ''}
      </ErrorText>
      {events.loading && <p role="status">Loading events…</p>}
      {todosEnabled && todos.loading && <p role="status">Loading tasks…</p>}
      {view === 'week' ? (
        <>
          <div className="week-heading">
            <span />
            {dayNames.map((name, index) => {
              const day = plusDays(week, index);
              return (
                <div className={localDate(day) === localDate() ? 'today' : ''} key={name}>
                  <span>{name}</span>
                  <strong>{day.getDate()}</strong>
                </div>
              );
            })}
          </div>
          {todosEnabled && (
            <div className="week-tasks" aria-label="Dated tasks">
              <span className="week-tasks-label">Tasks</span>
              {dayNames.map((name, index) => {
                const day = plusDays(week, index);
                return (
                  <div className="week-task-day" key={name} data-date={localDate(day)}>
                    {tasksForDay(day)}
                  </div>
                );
              })}
            </div>
          )}
          <div className="week-scroll" ref={weekScroller}>
            <div className="week-grid">
              <div className="hour-labels">
                {Array.from({ length: 24 }, (_, hour) => (
                  <span key={hour}>
                    {hour === 0
                      ? '12 AM'
                      : hour < 12
                        ? `${hour} AM`
                        : hour === 12
                          ? '12 PM'
                          : `${hour - 12} PM`}
                  </span>
                ))}
              </div>
              {dayNames.map((name, index) => {
                const day = plusDays(week, index);
                const dayEvents = forDay(day);
                return (
                  <div
                    className="week-day"
                    key={name}
                    onDoubleClick={(event) => {
                      if ((event.target as Element).closest('button')) return;
                      const minutes = Math.min(
                        1410,
                        Math.max(
                          0,
                          Math.floor(
                            (event.clientY - event.currentTarget.getBoundingClientRect().top) /
                              22,
                          ) * 30,
                        ),
                      );
                      add(day, Math.floor(minutes / 60), minutes % 60);
                    }}
                  >
                    {layoutEvents(dayEvents).map(({ item, column, columns }) => {
                      const start = Math.max(day.getTime(), Date.parse(item.start));
                      const end = Math.min(plusDays(day, 1).getTime(), Date.parse(item.end));
                      const startClock = new Date(start);
                      const top = startClock.getHours() * 60 + startClock.getMinutes();
                      return (
                        <button
                          className="calendar-event"
                          data-item-id={item.id}
                          data-focused={focus.id === item.id}
                          key={item.id}
                          style={{
                            top: (top * 44) / 60,
                            height: Math.max(22, (((end - start) / 60000) * 44) / 60),
                            left: `${(column / columns) * 100}%`,
                            width: `${100 / columns}%`,
                          }}
                          onClick={() => edit(item)}
                        >
                          <strong>{item.title}</strong>
                          <span>
                            {new Date(item.start).toLocaleTimeString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="month-heading">
            {dayNames.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>
          <div
            className="month-scroll"
            ref={scroller}
            onScroll={() => {
              const element = scroller.current!;
              const bounds = element.getBoundingClientRect();
              const cell = document
                .elementFromPoint(bounds.left + bounds.width / 2, bounds.top + 20)
                ?.closest('[data-date]');
              const value = cell?.getAttribute('data-date');
              if (value) {
                const month = new Date(value + 'T12:00:00');
                setVisibleMonth((current) =>
                  current.getMonth() === month.getMonth() &&
                  current.getFullYear() === month.getFullYear()
                    ? current
                    : month,
                );
              }
              if (element.scrollTop < 200 && !previousHeight.current) {
                previousHeight.current = element.scrollHeight;
                setMonthRange((range) => ({ ...range, before: range.before + 6 }));
              } else if (element.scrollHeight - element.scrollTop - element.clientHeight < 500)
                setMonthRange((range) => ({ ...range, after: range.after + 6 }));
            }}
          >
            <div className="month-grid">
              {Array.from({ length: dayCount }, (_, index) => {
                const day = plusDays(firstDay, index);
                return (
                  <div
                    className="month-day"
                    key={localDate(day)}
                    data-date={localDate(day)}
                    data-month={
                      day.getDate() === 1
                        ? `${day.getFullYear()}-${day.getMonth()}`
                        : undefined
                    }
                    onDoubleClick={(event) => {
                      if (!(event.target as Element).closest('button')) add(day);
                    }}
                  >
                    <time className={localDate(day) === localDate() ? 'today' : ''}>
                      {day.getDate() === 1
                        ? day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        : day.getDate()}
                    </time>
                    {tasksForDay(day)}
                    {forDay(day).map((item) => (
                      <button key={item.id} onClick={() => edit(item)}>
                        {item.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {editing && (
        <Dialog
          title={editing.id ? 'Edit event' : 'New event'}
          onClose={() => {
            if (!submission.busy) setEditing(undefined);
          }}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              await submission.run(async () => {
                try {
                  await invoke('calendar', editing.id ? 'update' : 'add', {
                    ...editing,
                    start: new Date(editing.start).toISOString(),
                    end: new Date(editing.end).toISOString(),
                  });
                  setEditing(undefined);
                } catch (failure: any) {
                  setError(failure.message);
                }
              });
            }}
          >
            <Field label="Title">
              <input
                required
                autoFocus
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>
            <Field label="Start">
              <input
                type="datetime-local"
                required
                value={editing.start}
                onChange={(event) => setEditing({ ...editing, start: event.target.value })}
              />
            </Field>
            <Field label="End">
              <input
                type="datetime-local"
                required
                value={editing.end}
                onChange={(event) => setEditing({ ...editing, end: event.target.value })}
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <div className="form-actions">
              {editing.id && (
                <DeleteButton
                  name={editing.title || editing.description || 'this item'}
                  onDelete={async () => {
                    await invoke('calendar', 'remove', {
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
                {submission.busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
