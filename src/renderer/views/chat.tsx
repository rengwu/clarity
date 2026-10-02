import { AttachmentChip } from '../attachment';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { call, useApp, useResource, ErrorText } from '../api';
import { Markdown } from '../markdown';
import type { Action, Attachment } from '../../shared/types';

import { readDraft, readDraftRevision, useRememberedState, writeDraft } from '../state';
import { ActionCard } from '../action-card';
import { Icon } from '../icons';
import { ModelPicker } from '../model-picker';

function Message({ message }: { message: any }) {
  if (message.role === 'user' && message.clarity)
    return (
      <article className="message message-user">
        <Markdown text={message.clarity.text} />
        <div className="attachment-list">
          {message.clarity.attachments.map((item: Attachment) => (
            <AttachmentChip key={item.id} attachment={item} />
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
  const actions = useResource<Action[]>(
    () => (id ? call('actions.list', { owner: id }) : Promise.resolve([])),
    [id],
    'actions',
  );
  const [live, setLive] = useState<any>();
  const [text, setText] = useRememberedState(`chat:${id || 'new'}:text`, '', true);
  const composerInput = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const input = composerInput.current;
    if (!input || app.active !== 'chat') return;
    input.style.height = 'auto';
    input.style.height = `${Math.max(40, Math.min(240, input.scrollHeight))}px`;
  }, [text, app.active]);
  const [contextPath, setContextPath] = useRememberedState(
    `chat:${id || 'new'}:context`,
    '',
    true,
  );
  useEffect(() => {
    if (app.target?.module === 'chat' && app.target.contextPath)
      setContextPath(app.target.contextPath);
  }, [app.target]);
  const [attachments, setAttachments] = useRememberedState<Attachment[]>(
    `chat:${id || 'new'}:attachments`,
    [],
    true,
  );
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const sendPending = useRef(false);
  const [model, setModel] = useState(app.bootstrap.settings.model);
  const [effort, setEffort] = useState(app.bootstrap.settings.effort);
  const bottom = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
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
  const timeline = [
    ...[...messages, ...(live?.streaming ? [live.streaming] : [])].map((message, index) => ({
      kind: 'message' as const,
      key: `message:${index}`,
      timestamp: message.timestamp || 0,
      message,
    })),
    ...(actions.data || []).map((action) => ({
      kind: 'action' as const,
      key: `action:${action.id}`,
      timestamp: action.createdAt,
      action,
    })),
  ].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    if (a.kind !== b.kind) return a.kind === 'message' ? -1 : 1;
    return a.kind === 'action' ? a.key.localeCompare(b.key) : 0;
  });
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
    if (sendPending.current || running || (!text.trim() && !attachments.length)) return;
    sendPending.current = true;
    const submitted = { text, attachments, contextPath };
    const sourcePrefix = `chat:${id || 'new'}`;
    const submittedTextRevision = readDraftRevision(`${sourcePrefix}:text`);
    const submittedContextRevision = readDraftRevision(`${sourcePrefix}:context`);
    setSending(true);
    setError('');
    let created = false;
    try {
      const target = id || (await onCreate());
      created = !id;
      const targetPrefix = `chat:${target}`;
      const textUnchanged = readDraftRevision(`${sourcePrefix}:text`) === submittedTextRevision;
      const contextUnchanged =
        readDraftRevision(`${sourcePrefix}:context`) === submittedContextRevision;
      if (!id) {
        writeDraft(`${targetPrefix}:text`, readDraft(`${sourcePrefix}:text`, submitted.text));
        writeDraft(
          `${targetPrefix}:attachments`,
          readDraft(`${sourcePrefix}:attachments`, submitted.attachments),
        );
        writeDraft(`${targetPrefix}:context`, readDraft(`${sourcePrefix}:context`, submitted.contextPath));
        app.navigate('chat', { id: target });
      }
      const targetTextRevision = readDraftRevision(`${targetPrefix}:text`);
      const targetContextRevision = readDraftRevision(`${targetPrefix}:context`);
      await call('chats.send', {
        id: target,
        text: contextPath ? `About Wiki/${contextPath}:\n\n${text}` : text,
        attachments,
        model,
        effort,
      });
      const draftKeys = id ? [target] : ['new', target];
      for (const key of draftKeys) {
        const prefix = `chat:${key}`;
        const expectedTextRevision = key === target ? targetTextRevision : submittedTextRevision;
        if (textUnchanged && readDraftRevision(`${prefix}:text`) === expectedTextRevision)
          writeDraft(`${prefix}:text`, '');
        const currentAttachments = readDraft<Attachment[]>(`${prefix}:attachments`, []);
        writeDraft(
          `${prefix}:attachments`,
          currentAttachments.filter(
            (item) => !submitted.attachments.some((sent) => sent.id === item.id),
          ),
        );
        const expectedContextRevision = key === target ? targetContextRevision : submittedContextRevision;
        if (contextUnchanged && readDraftRevision(`${prefix}:context`) === expectedContextRevision)
          writeDraft(`${prefix}:context`, '');
      }
      follow.current = true;
      await resource.reload();
    } catch (failure: any) {
      if (created) app.error(failure);
      else setError(failure.message);
    } finally {
      sendPending.current = false;
      setSending(false);
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
          follow.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 100;
        }}
      >
        <div className="chat-content">
          {!messages.length && (
            <h1>
              {app.bootstrap.auth.codex ? 'New chat' : 'Connect Codex to start chatting'}
            </h1>
          )}
          {!app.bootstrap.auth.codex && (
            <button onClick={() => app.navigate('settings', { section: 'codex' })}>
              Connect Codex
            </button>
          )}
          {timeline.map((item) =>
            item.kind === 'message' ? (
              <Message key={item.key} message={item.message} />
            ) : (
              <ActionCard key={item.key} action={item.action} />
            ),
          )}
          {running && (
            <div className="working" role="status">
              Working…
            </div>
          )}
          {chat?.status === 'interrupted' && (
            <p className="muted">Response interrupted. You can continue this chat.</p>
          )}
          <ErrorText>{chat?.error || resource.error}</ErrorText>
          <div ref={bottom} />
        </div>
      </div>
      <form className="composer" onSubmit={send}>
        <ErrorText>{error}</ErrorText>
        {contextPath && (
          <div className="attachment-chip">
            Wiki/{contextPath}
            <button
              type="button"
              aria-label="Remove wiki context"
              onClick={() => setContextPath('')}
            >
              ×
            </button>
          </div>
        )}
        {!!attachments.length && (
          <div className="attachment-list">
            {attachments.map((attachment) => (
              <AttachmentChip
                key={attachment.id}
                attachment={attachment}
                onRemove={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== attachment.id),
                  )
                }
              />
            ))}
          </div>
        )}
        <textarea
          ref={composerInput}
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
            <Icon name="plus" />
          </button>
          <ModelPicker
            models={app.bootstrap.models}
            model={model}
            effort={effort}
            onChange={(nextModel, nextEffort) => {
              setModel(nextModel);
              setEffort(nextEffort);
              void call('settings.save', { model: nextModel, effort: nextEffort }).catch(
                app.error,
              );
            }}
          />
          <span className="spacer" />
          {running ? (
            <button
              type="button"
              className="icon-button"
              aria-label="Stop"
              title="Stop"
              onClick={() => void call('chats.stop', { id }).catch(app.error)}
            >
              <Icon name="stop" />
            </button>
          ) : (
            <button
              className="primary icon-button"
              aria-label="Send"
              title="Send"
              disabled={(!text.trim() && !attachments.length) || !app.bootstrap.auth.codex}
            >
              <Icon name="send" />
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
