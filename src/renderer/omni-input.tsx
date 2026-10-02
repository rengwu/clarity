import React, { useEffect, useMemo, useRef, useState } from 'react';
import { call, ErrorText, Field, invoke, labels, useApp } from './api';
import { Icon } from './icons';
import {
  commands,
  localDay,
  normalizeCommand,
  parseCommand,
  similarCommand,
  type CommandDraft,
} from '../shared/commands';
import type { ItemTarget } from '../shared/navigation';
import { useSubmission } from './state';

type Result = { title: string; detail: string; target: ItemTarget };
type Choice = { key: string; title: string; detail: string; icon: string; run: () => void };
const fieldLabels: Record<string, string> = {
  title: 'Title',
  date: 'Date',
  folder: 'Folder',
  amount: 'Amount',
  category: 'Category',
  description: 'Description',
  start: 'Start',
  end: 'End',
  url: 'URL',
  tags: 'Tags',
};

export function OmniInput({
  onClose,
  onNewChat,
}: {
  onClose: () => void;
  onNewChat: () => Promise<string>;
}) {
  const app = useApp();
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const interpretation = useRef(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [remote, setRemote] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingProvider, setSearchingProvider] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [suggestion, setSuggestion] = useState<CommandDraft>();
  const [draft, setDraft] = useState<CommandDraft>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(0);
  const submission = useSubmission();
  const available = commands.filter((command) =>
    app.bootstrap.settings.enabled.includes(command.module),
  );
  const parsed = useMemo(() => parseCommand(query), [query]);
  const recognized =
    parsed && available.some((command) => command.id === parsed.command) ? parsed : undefined;

  useEffect(() => {
    dialog.current?.showModal();
    search.current?.focus();
    return () => {
      request.current++;
      interpretation.current++;
      void call('launcher.cancel').catch(() => {});
    };
  }, []);
  useEffect(() => {
    const version = ++request.current;
    interpretation.current++;
    void call('launcher.cancel').catch(() => {});
    setInterpreting(false);
    setSuggestion(undefined);
    setResults([]);
    setRemote([]);
    setSearchingProvider('');
    setSelected(0);
    setError('');
    setLoading(Boolean(query.trim()));
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      void call<Result[]>('launcher.search', { query })
        .then((items) => {
          if (request.current === version) setResults(items);
        })
        .catch((failure) => {
          if (request.current === version) setError(failure.message);
        })
        .finally(() => {
          if (request.current === version) setLoading(false);
        });
    }, 140);
    return () => clearTimeout(timer);
  }, [query]);

  async function interpret() {
    const version = ++interpretation.current;
    setInterpreting(true);
    setError('');
    try {
      const proposed = await call('launcher.interpret', { query });
      if (version === interpretation.current)
        setSuggestion(normalizeCommand(proposed, app.bootstrap.settings.enabled));
    } catch (failure: any) {
      if (version === interpretation.current) setError(failure.message);
    } finally {
      if (version === interpretation.current) setInterpreting(false);
    }
  }
  useEffect(() => {
    if (
      !app.bootstrap.settings.autoInterpretCommands ||
      !app.bootstrap.auth.codex ||
      draft ||
      recognized ||
      query.trim().length < 6
    )
      return;
    const timer = setTimeout(() => void interpret(), 700);
    return () => clearTimeout(timer);
  }, [query, draft, app.bootstrap.settings.autoInterpretCommands, app.bootstrap.auth.codex]);

  function edit(value: CommandDraft) {
    interpretation.current++;
    void call('launcher.cancel').catch(() => {});
    setInterpreting(false);
    setError('');
    setDraft(normalizeCommand(value, app.bootstrap.settings.enabled));
  }
  function open(target: ItemTarget) {
    if (app.active === 'chat' && app.inspect) app.inspect(target);
    else app.navigate(target.module, target);
    onClose();
  }
  async function provider(module: 'mail' | 'music') {
    const version = request.current;
    setSearchingProvider(module);
    setError('');
    try {
      const response = await invoke(module, module === 'mail' ? 'list' : 'search', {
        query,
        type: 'all',
      });
      const items = module === 'mail' ? response.messages : response.items;
      if (request.current === version)
        setRemote(
          (items || [])
            .slice(0, 40)
            .map((item: any) => ({
              title: item.subject || item.title,
              detail: item.from || item.artist || item.source || '',
              target: { module, id: item.id, source: item.source, type: item.type },
            })),
        );
    } catch (failure: any) {
      if (request.current === version) setError(failure.message);
    } finally {
      if (request.current === version) setSearchingProvider('');
    }
  }
  const choices: Choice[] = [];
  if (recognized) {
    const command = available.find((command) => command.id === recognized.command)!;
    choices.push({
      key: 'parsed',
      title: command.label,
      detail: recognized.fields.title || recognized.fields.description || query,
      icon: command.module,
      run: () => edit(recognized),
    });
  }
  if (suggestion) {
    const command = available.find((command) => command.id === suggestion.command)!;
    choices.push({
      key: 'interpreted',
      title: command.label,
      detail: 'Interpreted · Review fields',
      icon: command.module,
      run: () => edit(suggestion),
    });
  }
  const typo = !recognized && similarCommand(query);
  if (typo && available.some((command) => command.id === typo.id))
    choices.push({
      key: 'suggested',
      title: typo.label,
      detail: 'Suggested command',
      icon: typo.module,
      run: () =>
        edit(parseCommand(`${typo.aliases[0]} ${query.trim().split(/\s+/).slice(1).join(' ')}`)!),
    });
  const needle = query.toLowerCase().trim();
  for (const command of available) {
    if (recognized?.command === command.id) continue;
    if (!needle || command.label.toLowerCase().includes(needle))
      choices.push({
        key: command.id,
        title: command.label,
        detail: labels[command.module],
        icon: command.module,
        run: () =>
          edit({
            command: command.id,
            fields: command.id === 'expense' ? { date: localDay() } : {},
          }),
      });
  }
  for (const module of [
    ...app.bootstrap.settings.enabled.filter((name: string) => name !== 'chat'),
    'settings',
  ]) {
    const label = labels[module] || 'Settings';
    if (!needle || label.toLowerCase().includes(needle))
      choices.push({
        key: `module:${module}`,
        title: `Open ${label}`,
        detail: 'Navigation',
        icon: module,
        run: () => {
          app.navigate(module);
          onClose();
        },
      });
  }
  if (!needle || 'new chat'.includes(needle))
    choices.push({
      key: 'chat',
      title: 'New chat',
      detail: 'Conversation',
      icon: 'chat',
      run: () =>
        void onNewChat()
          .then(onClose)
          .catch((failure) => setError(failure.message)),
    });
  for (const [index, item] of [...results, ...remote].entries())
    choices.push({
      key: `result:${index}`,
      title: item.title,
      detail: `${labels[item.target.module]}${item.detail ? ` · ${item.detail}` : ''}`,
      icon: item.target.module,
      run: () => open(item.target),
    });
  useEffect(
    () => setSelected((index) => Math.min(index, Math.max(0, choices.length - 1))),
    [choices.length],
  );
  useEffect(() => {
    dialog.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    await submission.run(async () => {
      setError('');
      try {
        const fields = draft.fields;
        let result: any;
        if (draft.command === 'task')
          result = await invoke('todos', 'add', {
            title: fields.title,
            ...(fields.date ? { date: fields.date } : {}),
          });
        if (draft.command === 'note')
          result = await invoke('notes', 'create', {
            title: fields.title,
            folder: fields.folder || '',
          });
        if (draft.command === 'expense') {
          if (!/^\d+(?:\.\d{1,2})?$/.test(fields.amount))
            throw new Error('Enter an amount with at most two decimal places.');
          result = await invoke('expenses', 'add', {
            amountCents: Math.round(Number(fields.amount) * 100),
            category: fields.category,
            description: fields.description,
            date: fields.date,
          });
        }
        if (draft.command === 'event')
          result = await invoke('calendar', 'add', {
            title: fields.title,
            start: new Date(fields.start).toISOString(),
            end: new Date(fields.end).toISOString(),
          });
        if (draft.command === 'bookmark')
          result = await invoke('bookmarks', 'add', {
            title: fields.title,
            url: fields.url,
            description: fields.description,
            tags: (fields.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          });
        const command = available.find((command) => command.id === draft.command)!;
        if (app.active === 'chat' && app.inspect)
          app.inspect({ module: command.module, id: result.id, path: result.path });
        else app.navigate(command.module, { id: result.id, path: result.path });
        onClose();
      } catch (failure: any) {
        setError(failure.message);
      }
    });
  }
  const definition = available.find((command) => command.id === draft?.command);
  return (
    <dialog
      className="omni-dialog"
      ref={dialog}
      aria-label="Search and commands"
      onCancel={(event) => {
        event.preventDefault();
        if (!submission.busy) onClose();
      }}
    >
      <div className="omni-search">
        <Icon name="search" size={18} />
        <input
          ref={search}
          autoFocus
          aria-label="Search Clarity"
          role="combobox"
          aria-expanded={!draft}
          aria-controls="omni-results"
          aria-activedescendant={!draft && choices.length ? `omni-choice-${selected}` : undefined}
          placeholder="Search Clarity or type a command…"
          value={query}
          maxLength={2000}
          readOnly={!!draft}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (draft) return;
            if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
              event.preventDefault();
              setSelected(
                (index) =>
                  (index + (event.key === 'ArrowDown' ? 1 : choices.length - 1)) %
                  Math.max(1, choices.length),
              );
            }
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && choices[selected]) {
              event.preventDefault();
              choices[selected].run();
            }
          }}
        />
        <button
          className="icon-button quiet"
          aria-label="Close search"
          disabled={submission.busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {draft && definition ? (
        <form className="omni-form" onSubmit={save}>
          <div className="row">
            <button
              type="button"
              className="icon-button quiet"
              aria-label="Back to search"
              disabled={submission.busy}
              onClick={() => {
                setDraft(undefined);
                requestAnimationFrame(() => search.current?.focus());
              }}
            >
              <Icon name="left" />
            </button>
            <h2>{definition.label}</h2>
          </div>
          <p className="omni-original">{query}</p>
          <div className="omni-fields">
            {definition.fields.map((name, index) => (
              <Field key={name} label={fieldLabels[name]}>
                <input
                  autoFocus={index === 0}
                  name={name}
                  required={
                    ![
                      'folder',
                      'tags',
                      ...(draft.command === 'task' ? ['date'] : []),
                      ...(draft.command === 'bookmark' ? ['description'] : []),
                    ].includes(name)
                  }
                  type={
                    name === 'date'
                      ? 'date'
                      : ['start', 'end'].includes(name)
                        ? 'datetime-local'
                        : name === 'url'
                          ? 'url'
                          : 'text'
                  }
                  inputMode={name === 'amount' ? 'decimal' : undefined}
                  value={draft.fields[name] || ''}
                  onChange={(event) =>
                    setDraft({ ...draft, fields: { ...draft.fields, [name]: event.target.value } })
                  }
                />
              </Field>
            ))}
          </div>
          <ErrorText>{error}</ErrorText>
          <div className="form-actions">
            <button type="button" disabled={submission.busy} onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={submission.busy}>
              {submission.busy ? 'Saving…' : definition.label}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="omni-results" id="omni-results" role="listbox" aria-label="Results">
            {choices.map((choice, index) => (
              <button
                key={choice.key}
                id={`omni-choice-${index}`}
                role="option"
                aria-selected={selected === index}
                onMouseMove={() => setSelected(index)}
                onClick={choice.run}
              >
                <Icon name={choice.icon} />
                <span>
                  <strong>{choice.title}</strong>
                  <small>{choice.detail}</small>
                </span>
                {selected === index && <kbd>↵</kbd>}
              </button>
            ))}
            {!choices.length && (
              <p className="muted">
                {loading ? 'Searching…' : 'No results. Try a command or different words.'}
              </p>
            )}
          </div>
          <div className="omni-feedback">
            <ErrorText>{error}</ErrorText>
            {(interpreting || searchingProvider) && (
              <p className="muted" role="status">
                {interpreting ? 'Interpreting…' : `Searching ${labels[searchingProvider]}…`}
              </p>
            )}
          </div>
          <footer className="omni-footer">
            <span className="muted">↑↓ Navigate · ↵ Open</span>
            <span className="spacer" />
            {query.trim() && (
              <>
                {app.bootstrap.settings.enabled.includes('mail') && (
                  <button disabled={!!searchingProvider} onClick={() => void provider('mail')}>
                    Search Mail
                  </button>
                )}
                {app.bootstrap.settings.enabled.includes('music') && (
                  <button disabled={!!searchingProvider} onClick={() => void provider('music')}>
                    Search Music
                  </button>
                )}
                <button
                  disabled={interpreting || !app.bootstrap.auth.codex}
                  title={
                    !app.bootstrap.auth.codex
                      ? 'Connect Codex in Settings to interpret commands'
                      : 'Interpret with your selected model'
                  }
                  onClick={() => void interpret()}
                >
                  Interpret
                </button>
              </>
            )}
          </footer>
        </>
      )}
    </dialog>
  );
}
