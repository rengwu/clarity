import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

type Model = { id: string; name: string; efforts: string[] };
export function ModelPicker({
  models,
  model,
  effort,
  onChange,
}: {
  models: Model[];
  model: string;
  effort: string;
  onChange: (model: string, effort: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const chosen = models.find((item) => item.id === model);
  const available = chosen?.efforts || [];
  const filtered = models.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (open)
      container.current
        ?.querySelector('[data-highlighted=true]')
        ?.scrollIntoView({ block: 'nearest' });
  }, [open, selected]);
  useEffect(() => {
    if (!open) return;
    setSelected(0);
    const close = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  function choose(item: Model) {
    onChange(
      item.id,
      item.efforts.includes(effort)
        ? effort
        : item.efforts.includes('medium')
          ? 'medium'
          : item.efforts[0],
    );
    setOpen(false);
    setQuery('');
    trigger.current?.focus();
  }
  return (
    <div className="model-control" ref={container}>
      <button
        ref={trigger}
        type="button"
        className="model-trigger"
        aria-label={`Model: ${chosen?.name || model}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {chosen?.name || 'Select model'}
        <Icon name="down" size={12} />
      </button>
      <select
        aria-label="Effort"
        value={available.includes(effort) ? effort : available[0] || ''}
        onChange={(event) => onChange(model, event.target.value)}
      >
        {available.map((level) => (
          <option value={level} key={level}>
            {level === 'xhigh' ? 'Max' : level[0].toUpperCase() + level.slice(1)}
          </option>
        ))}
      </select>
      {open && (
        <div
          className="model-popover"
          role="dialog"
          aria-label="Select model and effort"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          <div className="model-search">
            <Icon name="search" size={14} />
            <input
              autoFocus
              type="search"
              role="combobox"
              aria-label="Search models"
              aria-expanded={open}
              aria-controls="model-options"
              aria-activedescendant={filtered.length ? `model-option-${selected}` : undefined}
              placeholder="Search models…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(0);
              }}
              onKeyDown={(event) => {
                if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
                  event.preventDefault();
                  setSelected(
                    (index) =>
                      (index + (event.key === 'ArrowDown' ? 1 : filtered.length - 1)) %
                      Math.max(1, filtered.length),
                  );
                }
                if (event.key === 'Enter' && filtered[selected]) {
                  event.preventDefault();
                  choose(filtered[selected]);
                }
              }}
            />
          </div>
          <div className="model-options" id="model-options" role="listbox" aria-label="Models">
            {filtered.map((item, index) => (
              <button
                key={item.id}
                id={`model-option-${index}`}
                type="button"
                role="option"
                aria-selected={item.id === model}
                data-highlighted={index === selected}
                onMouseMove={() => setSelected(index)}
                onClick={() => choose(item)}
              >
                <span>{item.name}</span>
                {item.id === model && <Icon name="check" size={14} />}
              </button>
            ))}
            {!filtered.length && <p className="muted">No matching models</p>}
          </div>
          {!!available.length && (
            <div className="model-effort">
              <div className="row">
                <span>Effort</span>
                <strong>
                  {effort === 'xhigh' ? 'Max' : effort[0]?.toUpperCase() + effort.slice(1)}
                </strong>
              </div>
              <input
                aria-label="Model effort"
                type="range"
                min={0}
                max={Math.max(0, available.length - 1)}
                step={1}
                value={Math.max(0, available.indexOf(effort))}
                aria-valuetext={effort}
                onChange={(event) => onChange(model, available[Number(event.target.value)])}
              />
              <div className="effort-labels">
                {available.map((level) => (
                  <span key={level}>
                    {level === 'xhigh' ? 'Max' : level[0].toUpperCase() + level.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
