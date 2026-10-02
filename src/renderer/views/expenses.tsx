import { useSubmission, useRememberedState } from '../state';
import React, { useEffect, useState } from 'react';
import { Icon } from '../icons';
import {
  invoke,
  useApp,
  useResource,
  Field,
  ErrorText,
  listAll,
  DeleteButton,
  ListState,
  useItemFocus,
} from '../api';

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function Expenses() {
  const app = useApp();
  const submission = useSubmission();
  const list = useResource<any>(() => listAll('expenses'), [], 'expenses');
  const [editing, setEditing] = useRememberedState<any>('expenses:editing', null, true);
  const [amount, setAmount] = useRememberedState('expenses:amount', '', true);
  const [category, setCategory] = useRememberedState('expenses:category', '', true);
  const [description, setDescription] = useRememberedState('expenses:description', '', true);
  const [date, setDate] = useRememberedState('expenses:date', localDate(), true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(30);
  const entries: any[] = list.data?.items || [];
  const [showDraft, setShowDraft] = useState(true);
  useEffect(() => {
    if (app.target?.module === 'expenses' && app.target.id) setShowDraft(false);
  }, [app.target]);
  const focus = useItemFocus(
    'expenses',
    list.data?.items,
    list.loading || (!!editing && showDraft),
  );
  function open(item?: any, selectedDate = localDate()) {
    setShowDraft(true);
    setEditing(item || {});
    setAmount(item ? String(item.amountCents) : '');
    setCategory(item?.category || '');
    setDescription(item?.description || '');
    setDate(item?.date || selectedDate);
    setError('');
  }
  const money = (cents: number) =>
    `${app.bootstrap.settings.currency}${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  async function save(another: boolean) {
    await submission.run(async () => {
      setBusy(true);
      setError('');
      try {
        await invoke('expenses', editing.id ? 'update' : 'add', {
          ...editing,
          amountCents: Number(amount),
          category,
          description,
          date,
        });
        if (another) {
          setEditing({});
          setAmount('');
          setDescription('');
          document.querySelector<HTMLInputElement>('[aria-label="Amount"]')?.focus();
        } else setEditing(null);
      } catch (failure: any) {
        setError(failure.message);
      } finally {
        setBusy(false);
      }
    });
  }
  const dates = new Set(entries.map((entry) => entry.date));
  for (let day = 0; day < days; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    dates.add(localDate(date));
  }
  const categories = [...new Set(entries.map((entry) => entry.category))]
    .filter((value) => value.toLowerCase().includes(category.toLowerCase()))
    .slice(0, 8);
  const descriptions = [
    ...new Set(
      entries
        .filter(
          (entry) => !category || entry.category.toLowerCase() === category.toLowerCase(),
        )
        .map((entry) => entry.description),
    ),
  ]
    .filter((value) => value.toLowerCase().includes(description.toLowerCase()))
    .slice(0, 6);
  return (
    <section className="page">
      <div className="toolbar">
        <h1>
          {editing && showDraft ? (editing.id ? 'Edit expense' : 'New expense') : 'Expenses'}
        </h1>
        {editing && !showDraft && (
          <button onClick={() => setShowDraft(true)}>Resume expense draft</button>
        )}
        {!editing && (
          <button className="primary" onClick={() => open()}>
            <Icon name="plus" size={14} />
            New expense
          </button>
        )}
      </div>
      {editing && showDraft ? (
        <form
          className="expense-form"
          onSubmit={(event) => {
            event.preventDefault();
            void save(false);
          }}
        >
          <Field label="Amount">
            <input
              autoFocus
              required
              aria-label="Amount"
              inputMode="numeric"
              placeholder="0.00"
              value={amount ? (Number(amount) / 100).toFixed(2) : ''}
              onChange={(event) =>
                setAmount(
                  event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11),
                )
              }
            />
          </Field>
          <Field label="Category">
            <input
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. groceries"
            />
          </Field>
          <div className="suggestions">
            {categories.map((value) => (
              <button type="button" key={value} onClick={() => setCategory(value)}>
                {value}
              </button>
            ))}
          </div>
          <Field label="Description">
            <input
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. lunch"
            />
          </Field>
          <div className="suggestions">
            {descriptions.map((value) => (
              <button type="button" key={value} onClick={() => setDescription(value)}>
                {value}
              </button>
            ))}
          </div>
          <Field label="Date">
            <input
              required
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="form-actions">
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
            {editing.id && (
              <DeleteButton
                name={editing.title || editing.description || 'this item'}
                onDelete={async () => {
                  await invoke('expenses', 'remove', {
                    id: editing.id,
                    revision: editing.revision,
                  });
                  setEditing(null);
                }}
              />
            )}
            <button className="primary" disabled={busy}>
              {editing.id ? 'Save' : 'Create'}
            </button>
            {!editing.id && (
              <button
                type="button"
                disabled={busy}
                onClick={(event) => {
                  if (event.currentTarget.form?.reportValidity()) void save(true);
                }}
              >
                Create & add another
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          <ErrorText>{list.error || focus.error}</ErrorText>
          {list.loading && <p role="status">Loading expenses…</p>}
          <div className="daily-expenses">
            {[...dates]
              .sort()
              .reverse()
              .map((day) => {
                const items = entries.filter((entry) => entry.date === day);
                return (
                  <div className="expense-day" key={day} data-empty={!items.length}>
                    <time dateTime={day}>
                      {new Date(day + 'T12:00').toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                      <button
                        className="add-expense icon-button quiet"
                        disabled={!!editing}
                        aria-label={`Add expense on ${day}`}
                        title="Add expense"
                        onClick={() => open(undefined, day)}
                      >
                        <Icon name="plus" size={14} />
                      </button>
                    </time>
                    <div>
                      {items.map((item) => (
                        <button
                          className="expense-entry"
                          key={item.id}
                          data-item-id={item.id}
                          data-focused={focus.id === item.id}
                          disabled={!!editing}
                          onClick={() => open(item)}
                        >
                          <Icon name="expenses" size={15} />
                          <span className="expense-copy">
                            <strong>{item.description}</strong>
                            <small>{item.category}</small>
                          </span>
                          <span>{money(item.amountCents)}</span>
                        </button>
                      ))}
                    </div>
                    <strong>
                      {items.length
                        ? money(items.reduce((sum, item) => sum + item.amountCents, 0))
                        : ''}
                    </strong>
                  </div>
                );
              })}
          </div>
          <button onClick={() => setDays((value) => value + 30)}>Show earlier days</button>
          {list.data?.truncated && (
            <p className="muted">Showing the most recent 2,000 expenses.</p>
          )}
        </>
      )}
    </section>
  );
}
