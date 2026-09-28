import React, { useEffect, useRef, useState } from 'react';
import { invoke, useApp, useResource, ErrorText, Source } from '../api';

const duration = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export function Music() {
  const app = useApp();
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [grid, setGrid] = useState(true);
  const [selected, setSelected] = useState<any>();
  const [busy, setBusy] = useState(false);
  const list = useResource<any>(
    async () =>
      tab === 'home'
        ? { items: await invoke('music', 'recent') }
        : tab === 'search'
          ? search
            ? invoke('music', 'search', { query: search, type: 'all' })
            : { items: [] }
          : invoke('music', 'library', { type: tab }),
    [tab, search],
    'music',
  );
  const collection = useResource<any>(
    () => (selected ? invoke('music', 'collection', selected) : Promise.resolve(null)),
    [selected?.source, selected?.id, selected?.type],
    'music',
  );
  async function play(item: any) {
    setBusy(true);
    try {
      await invoke('music', 'play', item);
    } catch (error) {
      app.error(error);
    } finally {
      setBusy(false);
    }
  }
  const items = ((selected ? collection.data?.items : list.data?.items) || []).filter(
    (item: any) => selected || tab !== 'search' || type === 'all' || item.type === type,
  );
  return (
    <section className="page music-view">
      <div className="toolbar">
        <h1>Music</h1>
        <form
          className="music-search"
          onSubmit={(event) => {
            event.preventDefault();
            setSelected(undefined);
            setTab('search');
            setSearch(query);
          }}
        >
          <input
            type="search"
            aria-label="Search music"
            placeholder="Search songs, artists, albums, playlists"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button>Search</button>
        </form>
      </div>
      <div className="toolbar music-tabs">
        {['home', 'albums', 'playlists', 'artists'].map((name) => (
          <button
            key={name}
            className={tab === name && !selected ? 'selected' : ''}
            onClick={() => {
              setTab(name);
              setSelected(undefined);
            }}
          >
            {name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
        <span className="spacer" />
        <button
          aria-label={grid ? 'Show list' : 'Show grid'}
          onClick={() => setGrid((value) => !value)}
        >
          {grid ? 'List' : 'Grid'}
        </button>
      </div>
      {!app.bootstrap.auth.spotify && !app.bootstrap.auth.navidrome && (
        <p>
          Connect Spotify or Navidrome in{' '}
          <button className="link" onClick={() => app.navigate('settings')}>
            Settings
          </button>
          .
        </p>
      )}
      {tab === 'artists' && !selected && (
        <p className="muted">
          Browse Navidrome artists here. Search to find artists across both sources.
        </p>
      )}
      {tab === 'search' && !selected && (
        <div className="segmented search-types">
          {['all', 'playlist', 'album', 'artist', 'song'].map((kind) => (
            <button
              className={type === kind ? 'selected' : ''}
              key={kind}
              onClick={() => setType(kind)}
            >
              {kind === 'all' ? 'All' : kind[0].toUpperCase() + kind.slice(1) + 's'}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="collection-heading">
          <button onClick={() => setSelected(undefined)}>‹ Back</button>
          <h2>{collection.data?.item?.title || selected.title}</h2>
          <Source source={selected.source} />
          {selected.type !== 'artist' && (
            <button className="primary" disabled={busy} onClick={() => void play(selected)}>
              Play
            </button>
          )}
        </div>
      )}
      <ErrorText>
        {selected ? collection.error : list.error || list.data?.errors?.join('\n')}
      </ErrorText>
      {(selected ? collection.loading : list.loading) && <p role="status">Loading…</p>}
      {(selected && selected.type !== 'artist') || !grid ? (
        <table className="music-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Artist</th>
              <th>Source</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item: any, index: number) => (
              <tr key={`${item.source}-${item.id}-${index}`}>
                <td>
                  <button
                    disabled={busy}
                    onClick={() =>
                      item.type === 'song'
                        ? void play(selected ? { ...selected, index } : item)
                        : setSelected(item)
                    }
                  >
                    {item.title}
                  </button>
                </td>
                <td>{item.artist}</td>
                <td>
                  <Source source={item.source} />
                </td>
                <td>{item.duration ? duration(item.duration) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="music-grid">
          {items?.map((item: any, index: number) => (
            <button
              className="music-card"
              key={`${item.source}-${item.id}-${index}`}
              onClick={() => (item.type === 'song' ? void play(item) : setSelected(item))}
              disabled={busy}
            >
              {item.cover ? (
                <img loading="lazy" src={item.cover} alt="" />
              ) : (
                <div className="cover-placeholder" aria-hidden="true">
                  ♪
                </div>
              )}
              <strong>{item.title}</strong>
              {item.artist && <span className="muted">{item.artist}</span>}
              <Source source={item.source} />
            </button>
          ))}
        </div>
      )}
      {tab === 'home' && !selected && !list.loading && !items?.length && (
        <p className="muted">Albums, artists, and playlists you play in Clarity appear here.</p>
      )}
    </section>
  );
}

export function Player() {
  const app = useApp();
  const [state, setState] = useState<any>();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [position, setPosition] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const current = useRef<any>(undefined);
  const preferences = useRef({ volume, shuffle, repeat });
  preferences.current = { volume, shuffle, repeat };
  const visited = useRef(new Set<number>());
  const error = useRef(app.error);
  error.current = app.error;
  async function begin(next: any) {
    current.current = next;
    setState(next);
    setPosition(0);
    if (next.source !== 'navidrome') return;
    const element = audio.current!;
    element.pause();
    element.src = `clarity://stream/${encodeURIComponent(next.queue[next.index].id)}`;
    element.volume = preferences.current.volume / 100;
    try {
      await element.play();
    } catch (failure) {
      error.current(failure);
    }
  }
  async function step(direction: number, ended = false) {
    const now = current.current;
    if (!now || now.source !== 'navidrome') return;
    const settings = preferences.current;
    if (ended && settings.repeat === 'track') {
      audio.current!.currentTime = 0;
      await audio.current!.play();
      return;
    }
    let next = now.index + direction;
    if (settings.shuffle && direction > 0) {
      visited.current.add(now.index);
      let remaining = now.queue
        .map((_: any, index: number) => index)
        .filter((index: number) => !visited.current.has(index));
      if (!remaining.length && settings.repeat === 'context') {
        visited.current.clear();
        remaining = now.queue.map((_: any, index: number) => index);
      }
      next = remaining.length
        ? remaining[Math.floor(Math.random() * remaining.length)]
        : now.queue.length;
    }
    if (next >= now.queue.length) {
      if (settings.repeat === 'context') next = 0;
      else {
        audio.current!.pause();
        setPlaying(false);
        return;
      }
    }
    if (next < 0) {
      audio.current!.currentTime = 0;
      return;
    }
    await begin({ ...now, index: next });
  }
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type !== 'playback') return;
        const data = event.data;
        if (data.action === 'stop') {
          audio.current?.pause();
          audio.current?.removeAttribute('src');
          audio.current?.load();
          current.current = undefined;
          setState(undefined);
          setPlaying(false);
          return;
        }
        if (data.action === 'play') {
          visited.current.clear();
          void begin(data);
          return;
        }
        if (data.action === 'error') {
          setPlaying(false);
          error.current(new Error(data.message));
          return;
        }
        if (data.action === 'state') {
          if (data.source === 'spotify') {
            if (data.playing !== undefined) setPlaying(data.playing);
            if (data.position !== undefined) setPosition(data.position);
            if (data.item) setState((state: any) => ({ ...state, ...data }));
          }
          return;
        }
        if (data.action !== 'control') return;
        if (data.volume !== undefined) {
          setVolume(data.volume);
          if (audio.current) audio.current.volume = data.volume / 100;
        }
        if (data.shuffle !== undefined) {
          setShuffle(data.shuffle);
          visited.current.clear();
        }
        if (data.repeat !== undefined) setRepeat(data.repeat);
        if (current.current?.source === 'navidrome') {
          if (data.actionName === 'pause' || data.command === 'pause') audio.current?.pause();
          if (data.actionName === 'resume' || data.command === 'resume')
            void audio.current?.play().catch(error.current);
          if (data.command === 'next') void step(1).catch(error.current);
          if (data.command === 'previous') void step(-1).catch(error.current);
        }
      }),
    [],
  );
  const control = (args: any) => invoke('music', 'control', args).catch(app.error);
  const item = state?.item || state?.queue?.[state.index];
  return (
    <>
      <audio
        ref={audio}
        onTimeUpdate={() => setPosition(audio.current!.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => void step(1, true).catch(app.error)}
        onError={() => {
          if (audio.current?.getAttribute('src'))
            app.error(
              new Error(
                'This track could not be played. Check the music connection and audio format.',
              ),
            );
        }}
      />
      {item && (
        <div className="player">
          <div className="player-track">
            {item.cover && <img src={item.cover} alt="" />}
            <div>
              <strong>{item.title}</strong>
              <span>{item.artist}</span>
            </div>
            <Source source={state.source} />
          </div>
          <button aria-label="Previous track" onClick={() => void control({ action: 'previous' })}>
            ⏮
          </button>
          <button
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={() => void control({ action: playing ? 'pause' : 'resume' })}
          >
            {playing ? 'Ⅱ' : '▶'}
          </button>
          <button aria-label="Next track" onClick={() => void control({ action: 'next' })}>
            ⏭
          </button>
          <span className="player-time">
            {duration(position)}
            {item.duration ? ` / ${duration(item.duration)}` : ''}
          </span>
          <button
            aria-label="Shuffle"
            aria-pressed={shuffle}
            className={shuffle ? 'selected' : ''}
            onClick={() => void control({ shuffle: !shuffle })}
          >
            Shuffle
          </button>
          <select
            aria-label="Repeat"
            value={repeat}
            onChange={(event) => void control({ repeat: event.target.value })}
          >
            <option value="off">Repeat off</option>
            <option value="context">Repeat all</option>
            <option value="track">Repeat one</option>
          </select>
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => {
              const value = Number(event.target.value);
              setVolume(value);
              if (audio.current) audio.current.volume = value / 100;
            }}
            onPointerUp={(event) => void control({ volume: Number(event.currentTarget.value) })}
            onKeyUp={(event) => void control({ volume: Number(event.currentTarget.value) })}
          />
        </div>
      )}
    </>
  );
}
