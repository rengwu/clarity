import React, { useEffect, useRef, useState } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import { call, invoke, useApp, useResource, Dialog, Field, ErrorText } from '../api';
import type { Document, Note } from '../../shared/types';
import { flushDocument, registerDocument } from '../lifecycle';
import { preserveMarkdownLists } from '../markdown-lists';

function RichEditor({
  document,
  change,
  reader,
}: {
  document: Document;
  change: (text: string) => void;
  reader: React.RefObject<(() => string) | undefined>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const onChange = useRef(change);
  onChange.current = change;
  const app = useApp();
  useEffect(() => {
    let ready = false;
    let disposed = false;
    const editor = new Crepe({
      root: root.current!,
      defaultValue: document.text,
      features: { [Crepe.Feature.Latex]: false, [Crepe.Feature.BlockEdit]: false },
      featureConfigs: {
        [Crepe.Feature.ImageBlock]: {
          onUpload: async (file) => {
            const result = await call('notes.image', {
              path: document.path,
              name: file.name,
              bytes: new Uint8Array(await file.arrayBuffer()),
            });
            return `assets/${result.path.split('/').pop()}`;
          },
          proxyDomURL: (url) => {
            if (/^(https?:|data:)/i.test(url)) return '';
            const folder = document.path.split('/').slice(0, -1).join('/');
            return new URL(url, `clarity://assets/Notes/${folder ? folder + '/' : ''}`).toString();
          },
        },
      },
    });
    editor.editor.config(preserveMarkdownLists);
    editor.on((listener) => {
      listener.markdownUpdated((_ctx, value, previous) => {
        if (ready && value !== previous) onChange.current(value);
      });
      // Milkdown's queued notification must not serialize an already destroyed view.
      listener.destroy(() => {
        listener.listeners.markdownUpdated.length = 0;
      });
    });
    editor.setReadonly(true);
    void editor
      .create()
      .then(() => {
        if (disposed) void editor.destroy();
        else {
          ready = true;
          const original = editor.getMarkdown();
          reader.current = () => {
            const text = editor.getMarkdown();
            return text === original ? document.text : text;
          };
          editor.setReadonly(false);
        }
      })
      .catch(app.error);
    return () => {
      ready = false;
      disposed = true;
      reader.current = undefined;
      void editor.destroy().catch(() => {});
    };
  }, [document.path]);
  return <div className="note-rich-editor" ref={root} />;
}

function NoteEditor({ initial, active }: { initial: Document; active: boolean }) {
  const [document, setDocument] = useState(initial);
  const [draft, setDraft] = useState(initial.text);
  const [source, setSource] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const current = useRef({ document: initial, draft: initial.text, dirty: false, blocked: false });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saving = useRef<Promise<void> | undefined>(undefined);
  const mounted = useRef(true);
  const reader = useRef<(() => string) | undefined>(undefined);
  const capture = () => {
    const text = reader.current?.();
    if (text !== undefined && text !== current.current.draft) {
      current.current.draft = text;
      current.current.dirty = text !== current.current.document.text;
      if (mounted.current) setDraft(text);
    }
  };
  const flush = () => {
    capture();
    if (saving.current) return saving.current;
    saving.current = (async () => {
      while (current.current.dirty && !current.current.blocked) {
        const snapshot = current.current;
        const value = snapshot.draft;
        if (mounted.current) setStatus('Saving…');
        try {
          const saved = await invoke('notes', 'write', {
            path: snapshot.document.path,
            text: value,
            version: snapshot.document.version,
            preserveDraft: true,
          });
          current.current.document = saved;
          current.current.dirty = current.current.draft !== value;
          if (mounted.current) {
            setDocument(saved);
            setStatus('');
          }
        } catch (failure: any) {
          current.current.blocked = true;
          if (mounted.current) {
            setError(failure.message);
            setStatus('Not saved');
          }
          break;
        }
      }
    })().finally(() => {
      saving.current = undefined;
    });
    return saving.current;
  };
  function change(text: string) {
    current.current.draft = text;
    current.current.dirty = text !== current.current.document.text;
    setDraft(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 400);
  }
  useEffect(() => {
    mounted.current = true;
    const unregister = registerDocument(initial.path, async () => {
      clearTimeout(timer.current);
      await flush();
      if (current.current.dirty)
        throw new Error(
          `Save a copy of ${initial.path} before closing. Your draft is still in the editor.`,
        );
    });
    const unsubscribe = window.clarity.subscribe((event) => {
      if (
        event.type !== 'changed' ||
        event.module !== 'notes' ||
        current.current.dirty ||
        saving.current ||
        current.current.blocked
      )
        return;
      capture();
      if (current.current.dirty) return;
      void invoke('notes', 'read', { path: initial.path })
        .then((fresh) => {
          if (
            current.current.dirty ||
            saving.current ||
            current.current.blocked ||
            fresh.version === current.current.document.version
          )
            return;
          current.current = { document: fresh, draft: fresh.text, dirty: false, blocked: false };
          setDocument(fresh);
          setDraft(fresh.text);
          setGeneration((value) => value + 1);
        })
        .catch((failure) => setError(failure.message));
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      unregister();
      clearTimeout(timer.current);
      void flush();
    };
  }, [initial.path]);
  return (
    <div className="note-document" hidden={!active}>
      <div className="note-controls">
        <span className="muted" role="status">
          {status}
        </span>
        <button
          onClick={async () => {
            await flush();
            setDocument({ ...current.current.document, text: current.current.draft });
            setGeneration((value) => value + 1);
            setSource((value) => !value);
          }}
        >
          {source ? 'Editor' : 'Markdown'}
        </button>
      </div>
      <ErrorText>{error}</ErrorText>
      {current.current.blocked && (
        <button
          onClick={async () => {
            try {
              const copy = await invoke('notes', 'create', {
                folder: initial.path.split('/').slice(0, -1).join('/'),
                title: initial.path.split('/').pop()!.replace(/\.md$/, '') + ' (recovered)',
              });
              await invoke('notes', 'write', {
                path: copy.path,
                text: current.current.draft,
                version: copy.version,
              });
              current.current.dirty = false;
              setError(
                `Draft saved to ${copy.path}. Reopen the original to load its latest content.`,
              );
              setStatus('Draft preserved');
            } catch (failure: any) {
              setError(failure.message);
            }
          }}
        >
          Save another copy
        </button>
      )}
      {source ? (
        <textarea
          className="markdown-source"
          aria-label="Markdown source"
          value={draft}
          onChange={(event) => change(event.target.value)}
          onBlur={() => void flush()}
        />
      ) : (
        <RichEditor
          key={`${initial.path}-${generation}`}
          document={document}
          change={change}
          reader={reader}
        />
      )}
    </div>
  );
}

export function Notes({ openPath }: { openPath?: string } = {}) {
  const app = useApp();
  const [query, setQuery] = useState('');
  const files = useResource<Note[]>(() => invoke('notes', 'list', { query }), [query], 'notes');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [active, setActive] = useState('');
  const [folder, setFolder] = useState('');
  const [collapsed, setCollapsed] = useState(new Set<string>());
  const [dialog, setDialog] = useState<'folder' | 'rename' | 'remove' | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  async function open(path: string) {
    try {
      if (!documents.some((document) => document.path === path)) {
        const document = await invoke('notes', 'read', { path });
        setDocuments((current) => [...current.filter((item) => item.path !== path), document]);
      }
      setActive(path);
      setFolder(path.split('/').slice(0, -1).join('/'));
    } catch (failure: any) {
      app.error(failure);
    }
  }
  async function close(path: string) {
    try {
      await flushDocument(path);
      const next = documents.filter((document) => document.path !== path);
      setDocuments(next);
      if (active === path) {
        const selected = next.at(-1)?.path || '';
        setActive(selected);
        setFolder(selected.split('/').slice(0, -1).join('/'));
      }
    } catch (error) {
      app.error(error);
    }
  }
  useEffect(() => {
    if (openPath) void open(openPath);
  }, [openPath]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (active && dialog !== 'folder') await flushDocument(active);
      if (dialog === 'folder') {
        await invoke('notes', 'folder', { path: [folder, name].filter(Boolean).join('/') });
        setFolder([folder, name].filter(Boolean).join('/'));
      }
      if (dialog === 'rename') {
        await invoke('notes', 'move', {
          path: active,
          to: [folder, name.endsWith('.md') ? name : `${name}.md`].filter(Boolean).join('/'),
        });
        close(active);
      }
      if (dialog === 'remove') {
        await invoke('notes', 'remove', { path: active });
        close(active);
      }
      setDialog(null);
      await files.reload();
    } catch (failure: any) {
      setError(failure.message);
    }
  }
  return (
    <section className="notes-view">
      <aside className="file-sidebar">
        <div className="row">
          <button
            className="primary"
            onClick={async () => {
              try {
                const document = await invoke('notes', 'create', { folder });
                await files.reload();
                await open(document.path);
              } catch (failure: any) {
                app.error(failure);
              }
            }}
          >
            New note
          </button>
          <button
            aria-label="New folder"
            onClick={() => {
              setName('');
              setDialog('folder');
            }}
          >
            ＋ Folder
          </button>
        </div>
        <input
          aria-label="Search notes"
          type="search"
          placeholder="Search notes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className={`file-root ${folder === '' ? 'selected' : ''}`}
          onClick={() => setFolder('')}
        >
          Notes
        </button>
        <ErrorText>{files.error}</ErrorText>
        <nav aria-label="Note files">
          {files.data
            ?.filter((file) => ![...collapsed].some((path) => file.path.startsWith(path + '/')))
            .map((file) => (
              <button
                key={file.path}
                className={(file.folder ? folder : active) === file.path ? 'selected' : ''}
                style={{ paddingLeft: 10 + file.path.split('/').length * 12 }}
                onClick={() => {
                  if (!file.folder) {
                    void open(file.path);
                    return;
                  }
                  setFolder(file.path);
                  setCollapsed((current) => {
                    const next = new Set(current);
                    next.has(file.path) ? next.delete(file.path) : next.add(file.path);
                    return next;
                  });
                }}
              >
                {file.folder ? `${collapsed.has(file.path) ? '›' : '⌄'} ` : ''}
                {file.title}
              </button>
            ))}
        </nav>
      </aside>
      <div className="notes-main">
        <div className="note-tabs" role="tablist">
          {documents.map((document) => (
            <div className={document.path === active ? 'active' : ''} key={document.path}>
              <button
                role="tab"
                aria-selected={document.path === active}
                onClick={() => {
                  setActive(document.path);
                  setFolder(document.path.split('/').slice(0, -1).join('/'));
                }}
              >
                {document.path.split('/').pop()}
              </button>
              <button aria-label={`Close ${document.path}`} onClick={() => close(document.path)}>
                ×
              </button>
            </div>
          ))}
          <span className="spacer" />
          {active && (
            <>
              <button
                onClick={() => {
                  setName(active.split('/').pop()!.replace(/\.md$/, ''));
                  setDialog('rename');
                }}
              >
                Rename
              </button>
              <button onClick={() => setDialog('remove')}>Trash</button>
            </>
          )}
        </div>
        {documents.map((document) => (
          <NoteEditor key={document.path} initial={document} active={document.path === active} />
        ))}
        {!active && <div className="empty">Select a note or create one.</div>}
      </div>
      {dialog && (
        <Dialog
          title={
            dialog === 'folder'
              ? 'New folder'
              : dialog === 'rename'
                ? 'Rename note'
                : 'Move note to Trash'
          }
          onClose={() => setDialog(null)}
        >
          <form onSubmit={submit}>
            {dialog === 'remove' ? (
              <p>{active}</p>
            ) : (
              <Field label="Name">
                <input
                  autoFocus
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
            )}
            <ErrorText>{error}</ErrorText>
            <div className="form-actions">
              <button type="button" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button className="primary">{dialog === 'remove' ? 'Move to Trash' : 'Save'}</button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
