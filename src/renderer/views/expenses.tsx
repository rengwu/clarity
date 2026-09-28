import React, { useState } from 'react';
import { invoke, useApp, useResource, Field, ErrorText } from '../api';

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function Expenses() {
  const app = useApp();
  const list = useResource<any>(() => invoke('expenses', 'list', { limit: 2000 }), [], 'expenses');
  const [editing, setEditing] = useState<any>();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(localDate());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(30);
  const entries: any[] = list.data?.items || [];
  function open(item?: any, selectedDate = localDate()) {
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
    if (busy) return;
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
      } else setEditing(undefined);
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
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
        .filter((entry) => !category || entry.category.toLowerCase() === category.toLowerCase())
        .map((entry) => entry.description),
    ),
  ]
    .filter((value) => value.toLowerCase().includes(description.toLowerCase()))
    .slice(0, 6);
  return (
    <section className="page">
      <div className="toolbar">
        <h1>{editing ? (editing.id ? 'Edit expense' : 'New expense') : 'Expenses'}</h1>
        {!editing && (
          <button className="primary" onClick={() => open()}>
            + New expense
          </button>
        )}
      </div>
      {editing ? (
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
                setAmount(event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11))
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
            <button type="button" onClick={() => setEditing(undefined)}>
              Cancel
            </button>
            {editing.id && (
              <button
                type="button"
                onClick={() =>
                  void invoke('expenses', 'remove', { id: editing.id, revision: editing.revision })
                    .then(() => setEditing(undefined))
                    .catch(app.error)
                }
              >
                Delete
              </button>
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
          <ErrorText>{list.error}</ErrorText>
          <div className="daily-expenses">
            {[...dates]
              .sort()
              .reverse()
              .map((day) => {
                const items = entries.filter((entry) => entry.date === day);
                return (
                  <div className="expense-day" key={day}>
                    <time dateTime={day}>
                      {new Date(day + 'T12:00').toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                      })}
                    </time>
                    <div>
                      {items.map((item) => (
                        <button className="expense-entry" key={item.id} onClick={() => open(item)}>
                          <span>{item.description}</span>
                          <span className="muted">{item.category}</span>
                          <span>{money(item.amountCents)}</span>
                        </button>
                      ))}
                      <button
                        className="add-expense"
                        aria-label={`Add expense on ${day}`}
                        onClick={() => open(undefined, day)}
                      >
                        +
                      </button>
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
          {list.data?.truncated && <p className="muted">Showing the most recent 2,000 expenses.</p>}
        </>
      )}
    </section>
  );
}
