import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppContext, call, labels } from './api';
import { Chat } from './views/chat';
import { Notes } from './views/notes';
import { Todos, Expenses, Bookmarks, News, Mail, Board, Automations } from './views/lists';
import { Calendar } from './views/calendar';
import { Settings } from './views/settings';
import { Music, Player } from './views/music';
import './style.css';

function App() {
  const [bootstrap, setBootstrap] = useState<any>();
  const [active, setActive] = useState('chat');
  const [target, setTarget] = useState<{ module: string; id?: string; path?: string }>();
  const [notesOpened, setNotesOpened] = useState(false);
  useEffect(() => {
    if (active === 'notes') setNotesOpened(true);
  }, [active]);
  const [chatId, setChatId] = useState<string>();
  const [chats, setChats] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [wikiVersion, setWikiVersion] = useState(0);
  const showError = (value: any) => setError(value?.message || String(value));
  const refresh = async () => {
    const data = await call('bootstrap');
    setBootstrap(data);
    if (data.root) {
      setChats(await call('chats.list'));
      setChatId((current) => current || data.settings.lastChat);
    }
  };
  useEffect(() => {
    void refresh().catch(showError);
    return window.clarity.subscribe((event) => {
      if (event.type === 'changed' && ['settings', 'chats'].includes(event.module || ''))
        void refresh().catch(showError);
      if (event.type === 'changed' && event.module === 'wiki') setWikiVersion((value) => value + 1);
    });
  }, []);
  useEffect(() => {
    if (bootstrap) document.documentElement.dataset.theme = bootstrap.settings.theme;
  }, [bootstrap?.settings.theme]);
  useEffect(() => {
    if (
      bootstrap &&
      active !== 'chat' &&
      active !== 'settings' &&
      !bootstrap.settings.enabled.includes(active)
    )
      setActive('chat');
  }, [bootstrap?.settings.enabled, active]);
  const newChat = async () => {
    const chat = await call('chats.create');
    setChatId(chat.id);
    setActive('chat');
    await refresh();
    return chat.id as string;
  };
  const selectChat = (id: string) => {
    setChatId(id);
    setActive('chat');
    void call('settings.save', { lastChat: id }).catch(showError);
  };
  const navigate = (module: string, item?: { id?: string; path?: string }) => {
    setTarget({ module, ...item });
    if (module === 'chat' && item?.id) selectChat(item.id);
    else setActive(module);
  };
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
    chat: <Chat id={chatId} onCreate={newChat} />,
    notes: <Notes />,
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
    wiki: (
      <section className="wiki-view">
        <div className="toolbar">
          <h1>Wiki</h1>
          <button
            onClick={() => {
              setActive('chat');
            }}
          >
            Ask in chat
          </button>
          <button onClick={() => void call('wiki.open').catch(showError)}>Open in browser</button>
        </div>
        <iframe
          key={wikiVersion}
          title="Wiki reader"
          sandbox="allow-scripts allow-popups"
          src={`clarity://wiki/index.html?v=${wikiVersion}${target?.module === 'wiki' && target.path ? '#' + encodeURIComponent(target.path) : ''}`}
        />
      </section>
    ),
  };
  return (
    <AppContext.Provider value={{ bootstrap, refresh, navigate, error: showError }}>
      <div className="shell">
        <aside className="sidebar">
          <div className="window-drag" />
          <button className="new-chat" onClick={() => void newChat().catch(showError)}>
            + New chat
          </button>
          <nav aria-label="Modules">
            {bootstrap.settings.enabled
              .filter((name: string) => name !== 'chat')
              .map((name: string) => (
                <button
                  key={name}
                  className={active === name ? 'selected' : ''}
                  onClick={() => navigate(name)}
                >
                  {labels[name]}
                </button>
              ))}
          </nav>
          <div className="sidebar-title">Chats</div>
          <nav className="recent-chats" aria-label="Recent chats">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={active === 'chat' && chatId === chat.id ? 'selected' : ''}
                onClick={() => selectChat(chat.id)}
                title={chat.title}
              >
                {chat.status === 'running' && <span className="running-dot" />}
                {chat.title}
              </button>
            ))}
          </nav>
          <button
            className={active === 'settings' ? 'selected' : ''}
            onClick={() => setActive('settings')}
          >
            Settings
          </button>
        </aside>
        <div className="workspace">
          <div className="workspace-drag" />
          {notesOpened && bootstrap.settings.enabled.includes('notes') && (
            <div className="persistent-notes" hidden={active !== 'notes'}>
              <Notes openPath={target?.module === 'notes' ? target.path : undefined} />
            </div>
          )}
          {active !== 'notes' && (views[active] || views.chat)}
          <Player />
          {error && (
            <div className="toast" role="alert">
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </AppContext.Provider>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
