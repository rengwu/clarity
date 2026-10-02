import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppContext, call, labels } from './api';
import { Chat } from './views/chat';
import { Notes } from './views/notes';
import { Todos, Expenses, Bookmarks, News, Mail, Board, Automations } from './views/lists';
import { Calendar } from './views/calendar';
import { Settings } from './views/settings';
import { Music, Player } from './views/music';
import { WikiReader } from './views/wiki';
import { Icon } from './icons';
import { SourcePreview } from './source-preview';
import { OmniInput } from './omni-input';
import { useInteractionFeedback, useViewMotion } from './motion';
import type { ItemTarget } from '../shared/navigation';
import './style.css';
import './workspace.css';
import './settings.css';

type ScrollPosition = { selector: string; index: number; top: number; left: number };
type Visit = {
  module: string;
  chatId?: string;
  target?: ItemTarget;
  preview?: ItemTarget;
  scroll: ScrollPosition[];
};
const scrollSelectors = [
  '.page',
  '.chat-scroll',
  '.note-document',
  '.file-sidebar',
  '.settings-scroll',
  '.mail-list',
  '.mail-reader',
  '.month-scroll',
  '.week-scroll',
];

function App() {
  useInteractionFeedback();
  const [bootstrap, setBootstrap] = useState<any>();
  const [visit, setVisit] = useState<Visit>({ module: 'chat', scroll: [] });
  const [visited, setVisited] = useState(new Set(['chat']));
  const [chats, setChats] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [wikiVersion, setWikiVersion] = useState(0);
  const [sidebar, setSidebar] = useState(true);
  const [launcher, setLauncher] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(344);
  const history = useRef<Visit[]>([visit]);
  const historyIndex = useRef(0);
  const lastVisits = useRef(new Map<string, Visit>());
  const stopRestoring = useRef<() => void>(() => {});
  const activeVisit = useRef(visit);
  activeVisit.current = visit;
  const sourceTrigger = useRef<HTMLElement | null>(null);
  const creatingForSend = useRef(false);
  const workspace = useRef<HTMLDivElement>(null);
  useViewMotion(
    `.module-host[data-module="${visit.module}"]`,
    visit.module === 'chat' ? visit.chatId : visit.module,
  );
  const navigator = useRef<(module: string, target?: Omit<ItemTarget, 'module'>) => void>(
    () => {},
  );
  const showError = (value: any) => setError(value?.message || String(value));
  const refresh = async () => {
    const data = await call('bootstrap');
    setBootstrap(data);
    if (data.root) {
      setChats(await call('chats.list'));
      if (!creatingForSend.current && !activeVisit.current.chatId && data.settings.lastChat) {
        const next = { ...activeVisit.current, chatId: data.settings.lastChat };
        history.current[historyIndex.current] = next;
        activeVisit.current = next;
        setVisit(next);
      }
    }
  };
  const takeNavigation = async () => {
    const pending = await call<ItemTarget | undefined>('navigation.take');
    if (pending) navigator.current(pending.module, pending);
  };
  useEffect(() => {
    void refresh().catch(showError);
    return window.clarity.subscribe((event) => {
      if (event.type === 'navigate') void takeNavigation().catch(showError);
      if (
        event.type === 'auth' ||
        (event.type === 'changed' && ['settings', 'chats'].includes(event.module || ''))
      )
        void refresh().catch(showError);
      if (event.type === 'changed' && event.module === 'wiki')
        setWikiVersion((value) => value + 1);
    });
  }, []);
  useEffect(() => {
    if (!bootstrap) return;
    document.documentElement.dataset.theme = bootstrap.settings.theme;
    document.documentElement.dataset.motion = bootstrap.settings.reducedMotion
      ? 'reduced'
      : 'system';
  }, [bootstrap?.settings.theme, bootstrap?.settings.reducedMotion]);
  useEffect(() => {
    if (bootstrap?.root) void takeNavigation().catch(showError);
  }, [bootstrap?.root]);
  useEffect(() => {
    if (!workspace.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setPreviewWidth((width) =>
        Math.max(260, Math.min(width, entry.contentRect.width - 360)),
      ),
    );
    observer.observe(workspace.current);
    return () => observer.disconnect();
  }, [bootstrap?.root, sidebar]);

  function capture() {
    const host = document.querySelector(
      `.module-host[data-module="${activeVisit.current.module}"]`,
    );
    if (!host) return;
    const scroll = scrollSelectors.flatMap((selector) =>
      [...host.querySelectorAll<HTMLElement>(selector)].map((element, index) => ({
        selector,
        index,
        top: element.scrollTop,
        left: element.scrollLeft,
      })),
    );
    const snapshot = { ...activeVisit.current, scroll };
    history.current[historyIndex.current] = snapshot;
    lastVisits.current.set(snapshot.module, snapshot);
  }
  function activate(next: Visit, restoring = false) {
    stopRestoring.current();
    activeVisit.current = next;
    setVisited((current) => new Set([...current, next.module]));
    setVisit(next);
    if (next.chatId) void call('settings.save', { lastChat: next.chatId }).catch(showError);
    if (restoring) {
      const restore = () => {
        const host = document.querySelector(`.module-host[data-module="${next.module}"]`);
        for (const position of next.scroll) {
          const element = host?.querySelectorAll<HTMLElement>(position.selector)[
            position.index
          ];
          if (element) {
            element.scrollTop = position.top;
            element.scrollLeft = position.left;
          }
        }
      };
      requestAnimationFrame(() => {
        restore();
        const host = document.querySelector(`.module-host[data-module="${next.module}"]`);
        if (!host) return;
        const observer = new MutationObserver(restore);
        observer.observe(host, { childList: true, subtree: true });
        const stop = () => {
          observer.disconnect();
          host.removeEventListener('wheel', stop);
          host.removeEventListener('pointerdown', stop);
        };
        stopRestoring.current = stop;
        host.addEventListener('wheel', stop, { once: true, passive: true });
        host.addEventListener('pointerdown', stop, { once: true });
        setTimeout(stop, 1500);
      });
    }
  }
  function navigate(module: string, item?: Omit<ItemTarget, 'module'>) {
    if (
      !['chat', 'settings'].includes(module) &&
      !bootstrap?.settings.enabled.includes(module)
    ) {
      showError(
        `${labels[module] || module} is disabled. Enable it in Settings to open this item.`,
      );
      return;
    }
    const current = activeVisit.current;
    const chatId = module === 'chat' && item?.id ? item.id : current.chatId;
    const previous = !item ? lastVisits.current.get(module) : undefined;
    const target = { ...(item || previous?.target), module, key: Date.now() };
    const identity = (value?: ItemTarget) =>
      ['id', 'path', 'section', 'source', 'type', 'contextPath']
        .map((key) => value?.[key as keyof ItemTarget] || '')
        .join('\0');
    if (module === current.module && (!item || identity(target) === identity(current.target)))
      return;
    capture();
    const next = {
      module,
      chatId,
      target,
      scroll: previous?.scroll || [],
      preview: module === 'chat' ? previous?.preview : undefined,
    };
    history.current.splice(historyIndex.current + 1);
    history.current.push(next);
    historyIndex.current++;
    activate(next, !!previous);
  }
  navigator.current = navigate;
  function rememberLocation(target: ItemTarget) {
    if (target.module !== activeVisit.current.module) return;
    const next = { ...activeVisit.current, target };
    activeVisit.current = next;
    history.current[historyIndex.current] = next;
    lastVisits.current.set(next.module, next);
    setVisit(next);
  }
  function traverse(delta: number) {
    const index = historyIndex.current + delta;
    if (index < 0 || index >= history.current.length) return;
    capture();
    historyIndex.current = index;
    activate(history.current[index], true);
  }
  const newChat = async (deferNavigation = false) => {
    if (deferNavigation) creatingForSend.current = true;
    try {
      const chat = await call('chats.create');
      if (!deferNavigation) navigate('chat', { id: chat.id });
      await refresh();
      return chat.id as string;
    } finally {
      if (deferNavigation) creatingForSend.current = false;
    }
  };
  function inspect(target: ItemTarget) {
    sourceTrigger.current = document.activeElement as HTMLElement;
    const next = { ...activeVisit.current, preview: target };
    activeVisit.current = next;
    history.current[historyIndex.current] = next;
    setVisit(next);
  }
  function closePreview() {
    const next = { ...activeVisit.current, preview: undefined };
    activeVisit.current = next;
    history.current[historyIndex.current] = next;
    setVisit(next);
    const trigger = sourceTrigger.current?.isConnected
      ? sourceTrigger.current
      : document.querySelector<HTMLElement>('.chat-view textarea');
    trigger?.focus({ preventScroll: true });
  }
  useEffect(() => {
    if (
      bootstrap &&
      !['chat', 'settings'].includes(visit.module) &&
      !bootstrap.settings.enabled.includes(visit.module)
    )
      navigate('chat');
  }, [bootstrap?.settings.enabled, visit.module]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !(event.metaKey || event.ctrlKey)) return;
      if (document.querySelector('dialog:modal')) return;
      const name = event.key.toLowerCase();
      if (name === 'k') {
        event.preventDefault();
        setLauncher((value) => !value);
      }
      const editing =
        event.target instanceof Element &&
        event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
      if (name === 'b' && !editing) {
        event.preventDefault();
        setSidebar((value) => !value);
      }
      if (name === '[') {
        event.preventDefault();
        traverse(-1);
      }
      if (name === ']') {
        event.preventDefault();
        traverse(1);
      }
      if (name === 'l') {
        event.preventDefault();
        if (event.shiftKey) void newChat().catch(showError);
        else navigate('chat');
        requestAnimationFrame(() =>
          document.querySelector<HTMLTextAreaElement>('.chat-view textarea')?.focus(),
        );
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [bootstrap, visit]);

  if (!bootstrap) return <div className="startup">{error || 'Opening Clarity…'}</div>;
  if (!bootstrap.root)
    return (
      <main className="setup">
        <h1>Choose your Clarity folder</h1>
        <p>Notes, wiki pages, conversations, and app data live here.</p>
        <button className="primary" onClick={() => void call('root.pick').catch(showError)}>
          Choose folder
        </button>
        {error && <p role="alert">{error}</p>}
      </main>
    );
  const views: Record<string, React.ReactNode> = {
    chat: <Chat key={visit.chatId || 'new'} id={visit.chatId} onCreate={() => newChat(true)} />,
    notes: (
      <Notes openPath={visit.target?.module === 'notes' ? visit.target.path : undefined} />
    ),
    todos: <Todos />,
    calendar: <Calendar />,
    expenses: <Expenses />,
    bookmarks: <Bookmarks />,
    news: <News />,
    mail: <Mail />,
    board: <Board />,
    automations: <Automations />,
    music: <Music />,
    settings: <Settings />,
    wiki: <WikiReader version={wikiVersion} />,
  };
  const title =
    visit.module === 'chat'
      ? chats.find((chat) => chat.id === visit.chatId)?.title || 'New chat'
      : labels[visit.module] || 'Settings';
  return (
    <AppContext.Provider
      value={{
        bootstrap,
        refresh,
        navigate,
        target: visit.target,
        active: visit.module,
        inspect,
        rememberLocation,
        error: showError,
      }}
    >
      <div className={`shell${sidebar ? '' : ' sidebar-collapsed'}`}>
        <aside
          className="sidebar"
          aria-label="Workspace navigation"
          inert={!sidebar}
          aria-hidden={!sidebar}
        >
          <div className="sidebar-brand">
            Clarity
            <button
              className="icon-button quiet"
              aria-label="Hide sidebar"
              title="Toggle sidebar · ⌘B"
              onClick={() => setSidebar(false)}
            >
              <Icon name="sidebar" />
            </button>
          </div>
          <div className="sidebar-scroll">
            <button
              className="sidebar-action"
              aria-label="New chat"
              onClick={() => void newChat().catch(showError)}
            >
              <Icon name="edit" />
              <span>New chat</span>
              <kbd>⇧⌘L</kbd>
            </button>
            <button className="sidebar-search" onClick={() => setLauncher(true)}>
              <Icon name="search" />
              <span>Search</span>
              <kbd>⌘K</kbd>
            </button>
            <div className="sidebar-title">
              Workspace
              <button
                className="icon-button quiet"
                aria-label="Manage modules"
                title="Manage modules"
                onClick={() => navigate('settings', { section: 'modules' })}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
            <nav aria-label="Modules">
              {[
                'notes',
                'todos',
                'wiki',
                'calendar',
                'expenses',
                'mail',
                'news',
                'bookmarks',
                'music',
                'board',
                'automations',
              ]
                .filter((name) => bootstrap.settings.enabled.includes(name))
                .map((name: string) => (
                  <button
                    key={name}
                    className={visit.module === name ? 'selected' : ''}
                    aria-current={visit.module === name ? 'page' : undefined}
                    onClick={() => navigate(name)}
                  >
                    <Icon name={name} />
                    <span>{labels[name]}</span>
                  </button>
                ))}
            </nav>
            <div className="sidebar-title">Recent chats</div>
            <nav className="recent-chats" aria-label="Recent chats">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  className={
                    visit.module === 'chat' && visit.chatId === chat.id ? 'selected' : ''
                  }
                  onClick={() => navigate('chat', { id: chat.id })}
                  title={chat.title}
                >
                  {chat.status === 'running' ? (
                    <span className="running-dot" />
                  ) : (
                    <Icon name="chat" size={14} />
                  )}
                  <span>{chat.title}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="sidebar-bottom">
            <button
              className={visit.module === 'settings' ? 'selected' : ''}
              onClick={() => navigate('settings')}
            >
              <Icon name="settings" />
              <span>Settings</span>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header className="workspace-header">
            <button
              className="icon-button quiet"
              hidden={sidebar}
              aria-label={sidebar ? 'Hide sidebar' : 'Show sidebar'}
              title="Toggle sidebar · ⌘B"
              onClick={() => setSidebar((value) => !value)}
            >
              <Icon name="sidebar" />
            </button>
            <div className="history-controls">
              <button
                className="icon-button quiet"
                aria-label="Back"
                title="Back · ⌘["
                disabled={historyIndex.current === 0}
                onClick={() => traverse(-1)}
              >
                <Icon name="left" />
              </button>
              <button
                className="icon-button quiet"
                aria-label="Forward"
                title="Forward · ⌘]"
                disabled={historyIndex.current >= history.current.length - 1}
                onClick={() => traverse(1)}
              >
                <Icon name="right" />
              </button>
            </div>
            <span className="workspace-title" title={title}>
              {title}
            </span>
            <button
              className="quiet header-search"
              aria-label="Search and commands"
              title="Search and commands · ⌘K"
              onClick={() => setLauncher(true)}
            >
              <Icon name="search" />
              <kbd>⌘K</kbd>
            </button>
          </header>
          <div className="workspace-body" ref={workspace}>
            <main className="module-container">
              {[...visited]
                .filter(
                  (module) =>
                    ['chat', 'settings'].includes(module) ||
                    bootstrap.settings.enabled.includes(module),
                )
                .map((module) => (
                  <div
                    key={module}
                    className="module-host"
                    data-module={module}
                    hidden={visit.module !== module}
                  >
                    {views[module]}
                  </div>
                ))}
            </main>
            {visit.module === 'chat' && visit.preview && (
              <SourcePreview
                target={visit.preview}
                width={previewWidth}
                onWidth={setPreviewWidth}
                onClose={closePreview}
              />
            )}
          </div>
          <Player />
          {error && (
            <div className="toast" role="alert">
              <span>{error}</span>
              <button
                className="icon-button quiet"
                aria-label="Dismiss error"
                onClick={() => setError('')}
              >
                <Icon name="close" />
              </button>
            </div>
          )}
        </div>
      </div>
      {launcher && <OmniInput onClose={() => setLauncher(false)} onNewChat={newChat} />}
    </AppContext.Provider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
