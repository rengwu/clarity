import React, { useEffect, useRef, useState } from 'react';
import { call, useApp } from '../api';
import { parseItemLink } from '../../shared/navigation';
import { Icon } from '../icons';

export function WikiReader({ version }: { version: number }) {
  const app = useApp();
  const frame = useRef<HTMLIFrameElement>(null);
  const [path, setPath] = useState(app.target?.module === 'wiki' ? app.target.path || '' : '');
  const currentPath = useRef(path);
  currentPath.current = path;
  const currentAnchor = useRef('');
  const anchors = useRef(new Map<string, string>());
  const previousActive = useRef(app.active);
  const loaded = useRef(false);
  const scrolls = useRef(new Map<string, number>());
  const pendingScroll = useRef<number | undefined>(undefined);
  const [src, setSrc] = useState('');
  useEffect(() => {
    const requested =
      app.target?.module === 'wiki'
        ? app.target.path || currentPath.current
        : currentPath.current;
    if (requested !== currentPath.current) {
      currentAnchor.current = anchors.current.get(requested) || '';
      pendingScroll.current = scrolls.current.get(requested) || 0;
    }
    const destination =
      `clarity://wiki/index.html?v=${version}&theme=${app.bootstrap.settings.theme}&motion=${app.bootstrap.settings.reducedMotion ? 'reduced' : 'system'}${requested ? '#' + encodeURIComponent(requested) + (currentAnchor.current ? '#' + currentAnchor.current : '') : ''}`;
    if (app.active === 'wiki' && previousActive.current !== 'wiki') {
      const top = scrolls.current.get(requested);
      if (top !== undefined) {
        pendingScroll.current = top;
        if (destination === src) {
          pendingScroll.current = undefined;
          requestAnimationFrame(() => {
            frame.current?.contentWindow?.postMessage({ type: 'wiki-restore', top }, '*');
          });
        }
      }
    }
    previousActive.current = app.active;
    setSrc(destination);
  }, [
    version,
    app.bootstrap.settings.theme,
    app.bootstrap.settings.reducedMotion,
    app.target,
    app.active,
  ]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (
        event.data?.type === 'wiki-position' &&
        app.active === 'wiki' &&
        !!frame.current?.getClientRects().length &&
        typeof event.data.path === 'string' &&
        Number.isFinite(event.data.top)
      )
        scrolls.current.set(event.data.path, event.data.top);
      if (event.data?.type === 'wiki-page' && typeof event.data.path === 'string') {
        currentPath.current = event.data.path;
        currentAnchor.current =
          typeof event.data.anchor === 'string' ? event.data.anchor : '';
        anchors.current.set(event.data.path, currentAnchor.current);
        setPath(event.data.path);
        if (pendingScroll.current !== undefined) {
          frame.current?.contentWindow?.postMessage(
            { type: 'wiki-restore', top: pendingScroll.current },
            '*',
          );
          pendingScroll.current = undefined;
        }
        if (app.active === 'wiki' && app.target?.path !== event.data.path) {
          if (loaded.current) app.navigate('wiki', { path: event.data.path });
          else app.rememberLocation?.({ module: 'wiki', path: event.data.path });
        }
        loaded.current = true;
      }
      if (event.data?.type === 'navigate' && typeof event.data.url === 'string') {
        const target = parseItemLink(event.data.url);
        if (target) app.navigate(target.module, target);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [app.navigate]);
  return (
    <section className="wiki-view">
      <div className="wiki-toolbar">
        <span className="wiki-pane-label">Pages</span>
        <span className="wiki-page-label">
          <Icon name="wiki" size={14} />
          {path.split('/').pop()?.replace(/\.md$/, '') || 'Wiki'}
        </span>
        <button className="quiet" onClick={() => app.navigate('chat', { contextPath: path })}>
          <Icon name="chat" size={14} />
          Ask in chat
        </button>
        <button
          className="icon-button quiet"
          aria-label="Open in browser"
          title="Open in browser"
          onClick={() => void call('wiki.open').catch(app.error)}
        >
          <Icon name="external" size={14} />
        </button>
      </div>
      <iframe
        ref={frame}
        title="Wiki reader"
        sandbox="allow-scripts allow-popups"
        src={src || undefined}
      />
    </section>
  );
}
