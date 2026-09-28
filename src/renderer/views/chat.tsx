import React, { useEffect, useRef, useState } from 'react';
import { call, useApp, useResource, ErrorText } from '../api';
import { Markdown } from '../markdown';
import type { Attachment } from '../../shared/types';

const drafts = new Map<string, { text: string; attachments: Attachment[] }>();

function Message({ message }: { message: any }) {
  if (message.role === 'user' && message.clarity)
    return (
      <article className="message message-user">
        <Markdown text={message.clarity.text} />
        <div className="attachment-list">
          {message.clarity.attachments.map((item: Attachment) => (
            <span className="attachment-chip" key={item.id}>
              {item.name}
              {Date.now() - item.createdAt > 90 * 86400000
                ? ' · expired'
                : !item.supported
                  ? ' · stored only'
                  : ''}
            </span>
          ))}
        </div>
      </article>
    );
  if (message.role === 'toolResult')
    return (
      <details className="tool-result">
        <summary>{message.isError ? 'Tool failed' : 'Tool result'}</summary>
        <pre>
          {message.content
            ?.filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('\n')}
        </pre>
      </details>
    );
  const parts =
    typeof message.content === 'string'
      ? [{ type: 'text', text: message.content }]
      : message.content || [];
  return (
    <article className={`message message-${message.role}`}>
      {parts.map((part: any, index: number) =>
        part.type === 'text' ? (
          <Markdown key={index} text={part.text} />
        ) : part.type === 'toolCall' ? (
          <details className="tool-call" key={index}>
            <summary>
              {part.arguments?.module || part.name} · {part.arguments?.method || 'Working'}
            </summary>
            <pre>{JSON.stringify(part.arguments?.args || part.arguments, null, 2)}</pre>
          </details>
        ) : part.type === 'image' ? (
          <span key={index} className="attachment-chip">
            Attached image
          </span>
        ) : null,
      )}
    </article>
  );
}

export function Chat({ id, onCreate }: { id?: string; onCreate: () => Promise<string> }) {
  const app = useApp();
  const resource = useResource<any>(
    () => (id ? call('chats.get', { id }) : Promise.resolve(null)),
    [id],
    'chats',
  );
  const actions = useResource<any[]>(
    () => (id ? call('actions.list', { owner: id }) : Promise.resolve([])),
    [id],
    'actions',
  );
  const [live, setLive] = useState<any>();
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [reviewing, setReviewing] = useState('');
  const [model, setModel] = useState(app.bootstrap.settings.model);
  const [effort, setEffort] = useState(app.bootstrap.settings.effort);
  const bottom = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const draft = useRef({ text, attachments });
  draft.current = { text, attachments };
  useEffect(() => {
    setLive(undefined);
    setError('');
    follow.current = true;
    const saved = drafts.get(id || 'new');
    setText(saved?.text || '');
    setAttachments(saved?.attachments || []);
    return () => {
      drafts.set(id || 'new', draft.current);
    };
  }, [id]);
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type === 'chat' && event.id === id) setLive(event.data);
      }),
    [id],
  );
  const chat = live || resource.data;
  const running = chat?.status === 'running' || sending;
  const messages = chat?.messages || [];
  useEffect(() => {
    if (follow.current) bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages, live?.streaming, actions.data]);
  async function addFiles(files: File[]) {
    for (const file of files) {
      if (file.size >= 30_000_000) {
        setError(`${file.name} was skipped: files must be below 30 MB.`);
        continue;
      }
      try {
        const attachment = await call<Attachment>('attachments.add', {
          name: file.name || 'Pasted image.png',
          mime: file.type,
          bytes: new Uint8Array(await file.arrayBuffer()),
        });
        setAttachments((current) => [...current, attachment]);
      } catch (failure: any) {
        setError(failure.message);
      }
    }
  }
  async function send(event?: React.FormEvent) {
    event?.preventDefault();
    if (running || (!text.trim() && !attachments.length)) return;
    setSending(true);
    setError('');
    try {
      const target = id || (await onCreate());
      await call('chats.send', { id: target, text, attachments, model, effort });
      drafts.delete(id || 'new');
      setText('');
      setAttachments([]);
      follow.current = true;
      await resource.reload();
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setSending(false);
    }
  }
  async function review(action: any, apply: boolean) {
    setReviewing(action.id);
    setError('');
    try {
      await call('actions.review', { id: action.id, apply });
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setReviewing('');
      await actions.reload();
    }
  }
  return (
    <section
      className="chat-view"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        void addFiles([...event.dataTransfer.files]);
      }}
    >
      <div
        className="chat-scroll"
        ref={scroll}
        onScroll={() => {
          const element = scroll.current!;
          follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        }}
      >
        <div className="chat-content">
          {!messages.length && (
            <h1>{app.bootstrap.auth.codex ? 'New chat' : 'Connect Codex to start chatting'}</h1>
          )}
          {!app.bootstrap.auth.codex && (
            <button onClick={() => app.navigate('settings')}>Connect Codex</button>
          )}
          {messages.map((message: any, index: number) => (
            <Message key={index} message={message} />
          ))}
          {live?.streaming && <Message message={live.streaming} />}
          {running && (
            <div className="working" role="status">
              Working…
            </div>
          )}
          {chat?.status === 'interrupted' && (
            <p className="muted">Response interrupted. You can continue this chat.</p>
          )}
          <ErrorText>{chat?.error || resource.error}</ErrorText>
          {actions.data?.map((action) => (
            <section className="action-review" key={action.id}>
              <div className="row">
                <strong>{action.description}</strong>
                <span className="muted">
                  {action.status === 'pending' ? 'Needs approval' : action.status}
                </span>
              </div>
              <details open={action.status === 'pending'}>
                <summary>Changes</summary>
                <pre>{JSON.stringify(action.args, null, 2)}</pre>
              </details>
              <ErrorText>{action.error}</ErrorText>
              {action.status === 'applied' &&
                action.module === 'browser' &&
                action.method === 'authorize' && (
                  <button
                    onClick={() =>
                      void call('browser.login', { url: action.args.origin }).catch(app.error)
                    }
                  >
                    Open browser
                  </button>
                )}
              {action.status === 'applied' && action.module !== 'browser' && (
                <button onClick={() => app.navigate(action.module)}>
                  Open{' '}
                  {action.module === 'todos'
                    ? 'Todos'
                    : action.module === 'notes'
                      ? 'Notes'
                      : action.module === 'wiki'
                        ? 'Wiki'
                        : action.module}
                </button>
              )}
              {action.status === 'pending' && (
                <div className="row">
                  <button
                    className="primary"
                    disabled={reviewing === action.id}
                    onClick={() => void review(action, true)}
                  >
                    Apply
                  </button>
                  <button
                    disabled={reviewing === action.id}
                    onClick={() => void review(action, false)}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </section>
          ))}
          <div ref={bottom} />
        </div>
      </div>
      <form className="composer" onSubmit={send}>
        <ErrorText>{error}</ErrorText>
        {!!attachments.length && (
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <span className="attachment-chip" key={attachment.id}>
                {attachment.name}
                {!attachment.supported && ' · stored only'}
                <button
                  type="button"
                  aria-label={`Remove ${attachment.name}`}
                  onClick={() =>
                    setAttachments((current) => current.filter((item) => item.id !== attachment.id))
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <textarea
          aria-label="Message"
          placeholder="Message Clarity"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onPaste={(event) => {
            const files = [...event.clipboardData.files];
            if (files.length) {
              event.preventDefault();
              void addFiles(files);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <div className="composer-controls">
          <button
            type="button"
            aria-label="Attach files"
            onClick={async () => {
              try {
                const result = await call('attachments.pick');
                setAttachments((current) => [...current, ...result.attachments]);
                setError(result.errors.join('\n'));
              } catch (failure: any) {
                setError(failure.message);
              }
            }}
          >
            ＋
          </button>
          <select
            aria-label="Model"
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              void call('settings.save', { model: event.target.value }).catch(app.error);
            }}
          >
            {app.bootstrap.models.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Effort"
            value={effort}
            onChange={(event) => {
              setEffort(event.target.value);
              void call('settings.save', { effort: event.target.value }).catch(app.error);
            }}
          >
            {(
              app.bootstrap.models.find((item: any) => item.id === model)?.efforts || [
                'low',
                'medium',
                'high',
              ]
            ).map((level: string) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <span className="spacer" />
          {running ? (
            <button type="button" onClick={() => void call('chats.stop', { id }).catch(app.error)}>
              Stop
            </button>
          ) : (
            <button
              className="primary"
              disabled={(!text.trim() && !attachments.length) || !app.bootstrap.auth.codex}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
