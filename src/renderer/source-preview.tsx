import React, { useEffect, useState } from 'react';
import type { ItemTarget } from '../shared/navigation';
import { call, ErrorText, invoke, labels, useApp, useResource } from './api';
import { Icon } from './icons';
import { Markdown } from './markdown';

export function SourcePreview({
  target,
  width,
  onWidth,
  onClose,
}: {
  target: ItemTarget;
  width: number;
  onWidth: (width: number) => void;
  onClose: () => void;
}) {
  const app = useApp();
  const [dragging, setDragging] = useState(false);
  const source = useResource<any>(
    async () => {
      if (['notes', 'wiki'].includes(target.module))
        return invoke(target.module, 'read', { path: target.path });
      if (target.module === 'chat') return call('chats.get', { id: target.id });
      if (target.module === 'music') return invoke('music', 'collection', target);
      return invoke(target.module, 'read', { id: target.id });
    },
    [target.module, target.path, target.id, target.source, target.type],
    target.module,
  );
  useEffect(() => () => document.body.classList.remove('resizing-pane'), []);
  const item =
    target.module === 'board'
      ? source.data?.thread
      : target.module === 'music'
        ? source.data?.item
        : source.data;
  const title =
    item?.title ||
    item?.subject ||
    item?.topic ||
    target.path?.split('/').pop() ||
    labels[target.module];
  const limit = () =>
    Math.max(
      260,
      Math.min(640, (document.querySelector('.workspace-body')?.clientWidth || 900) - 360),
    );
  const resize = (next: number) => onWidth(Math.max(260, Math.min(limit(), Math.round(next))));
  return (
    <aside
      className={`source-pane${dragging ? ' is-resizing' : ''}`}
      aria-label="Source preview"
      style={{ width }}
    >
      <div
        className="source-resizer"
        role="separator"
        tabIndex={0}
        aria-label="Resize source preview"
        aria-orientation="vertical"
        aria-controls="source-preview-body"
        aria-valuemin={260}
        aria-valuemax={limit()}
        aria-valuenow={width}
        aria-valuetext={`${width} pixels wide`}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          document.body.classList.add('resizing-pane');
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          resize(event.currentTarget.parentElement!.getBoundingClientRect().right - event.clientX);
        }}
        onLostPointerCapture={() => {
          setDragging(false);
          document.body.classList.remove('resizing-pane');
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 40 : 16;
          const next: Record<string, number> = {
            ArrowLeft: width + step,
            ArrowRight: width - step,
            Home: 260,
            End: limit(),
          };
          if (event.key in next) {
            event.preventDefault();
            resize(next[event.key]);
          }
        }}
      />
      <header className="source-pane-header">
        <Icon name={target.module} />
        <span title={title}>{title}</span>
        <button
          className="icon-button quiet"
          aria-label="Close source preview"
          title="Close source preview"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </header>
      <div className="source-pane-body" id="source-preview-body">
        {target.path && <p className="muted source-path">{target.path}</p>}
        {source.loading && (
          <p className="muted" role="status">
            Loading…
          </p>
        )}
        <ErrorText>{source.error}</ErrorText>
        {item && (
          <>
            {!['notes', 'wiki'].includes(target.module) && <h2>{title}</h2>}
            {typeof item.text === 'string' && (
              <Markdown
                text={item.text}
                source={target.path ? { module: target.module, path: target.path } : undefined}
              />
            )}
            {typeof item.body === 'string' && <p className="preserve-lines">{item.body}</p>}
            {item.description && <p>{item.description}</p>}
            {item.instruction && <p>{item.instruction}</p>}
            {target.module === 'todos' && (
              <p className="muted">
                {item.done ? 'Completed' : 'Open'}
                {item.date ? ` · ${item.date}` : ''}
              </p>
            )}
            {item.start && (
              <p className="muted">
                {new Date(item.start).toLocaleString()}
                {item.end
                  ? ` – ${new Date(item.end).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                  : ''}
              </p>
            )}
            {Number.isFinite(item.amountCents) && (
              <p>
                {app.bootstrap.settings.currency}
                {(item.amountCents / 100).toFixed(2)} · {item.category} · {item.date}
              </p>
            )}
            {item.from && <p className="muted">{item.from}</p>}
            {target.module === 'music' && (
              <>
                <p className="muted">{[item.artist, item.source].filter(Boolean).join(' · ')}</p>
                {source.data?.items?.slice(0, 20).map((track: any, index: number) => (
                  <p key={index}>{track.title}</p>
                ))}
              </>
            )}
            {item.url && (
              <button
                className="link"
                onClick={() => void call('external.open', { url: item.url }).catch(app.error)}
              >
                {item.url}
              </button>
            )}
            {item.messages && (
              <>
                <p className="muted">{item.messages.length} messages</p>
                {item.messages
                  .filter((message: any) => ['user', 'assistant'].includes(message.role))
                  .slice(-3)
                  .map((message: any, index: number) => (
                    <div key={index}>
                      <p className="muted">{message.role === 'user' ? 'You' : 'Clarity'}</p>
                      <Markdown
                        text={
                          typeof message.content === 'string'
                            ? message.content
                            : (message.content || [])
                                .filter((part: any) => part.type === 'text')
                                .map((part: any) => part.text)
                                .join('\n')
                        }
                      />
                    </div>
                  ))}
              </>
            )}
          </>
        )}
      </div>
      <footer className="source-pane-footer">
        <button onClick={() => app.navigate(target.module, target)}>
          Open in {labels[target.module] || target.module}
          <Icon name="external" size={13} />
        </button>
      </footer>
    </aside>
  );
}
