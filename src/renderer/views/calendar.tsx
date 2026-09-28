import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { invoke, useApp, useResource, Dialog, Field, ErrorText } from '../api';
import { localDate } from './expenses';

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
  const events = useResource<any>(
    () => invoke('calendar', 'list', { limit: 2000 }),
    [],
    'calendar',
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
    if (view === 'week' && weekScroller.current) weekScroller.current.scrollTop = 7 * 60;
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
          <button className={view === 'week' ? 'selected' : ''} onClick={() => setView('week')}>
            Week
          </button>
          <button className={view === 'month' ? 'selected' : ''} onClick={() => setView('month')}>
            Month
          </button>
        </div>
        <span className="spacer" />
        <button aria-label="Previous period" onClick={() => navigate(-1)}>
          ‹
        </button>
        <button onClick={() => setDate(new Date())}>Today</button>
        <button aria-label="Next period" onClick={() => navigate(1)}>
          ›
        </button>
        <button className="primary" onClick={() => add(date)}>
          + Event
        </button>
      </div>
      <ErrorText>{events.error}</ErrorText>
      {view === 'week' ? (
        <>
          <div className="week-heading">
            <span />
            {dayNames.map((name, index) => {
              const day = plusDays(week, index);
              return (
                <div className={localDate(day) === localDate() ? 'today' : ''} key={name}>
                  {name} {day.getDate()}
                </div>
              );
            })}
          </div>
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
                            (event.clientY - event.currentTarget.getBoundingClientRect().top) / 30,
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
                          key={item.id}
                          style={{
                            top,
                            height: Math.max(24, (end - start) / 60000),
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
                      day.getDate() === 1 ? `${day.getFullYear()}-${day.getMonth()}` : undefined
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
          onClose={() => setEditing(undefined)}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
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
                <button
                  type="button"
                  onClick={() =>
                    void invoke('calendar', 'remove', {
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
