import { useRememberedState } from '../state';
import React, { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { invoke, useApp, Source, ListState } from '../api';
import { updateMusicCache, useMusicResource } from '../music-resource';
import { Icon } from '../icons';
import { useViewMotion } from '../motion';
import { normalizationGain, volumeGain } from '../../shared/music-volume';

const duration = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const musicTypes = [
  { type: 'song', label: 'Song' },
  { type: 'artist', label: 'Artist' },
  { type: 'album', label: 'Album' },
  { type: 'playlist', label: 'Playlist' },
];
const typeLabel = (type: string) => musicTypes.find((kind) => kind.type === type)?.label;
const searchPreviewLimit = 6;
let nowPlaying = { id: '', source: '', playing: false, failure: '' };
const playbackListeners = new Set<() => void>();
const subscribePlayback = (listener: () => void) => {
  playbackListeners.add(listener);
  return () => {
    playbackListeners.delete(listener);
  };
};
function setPlaybackFailure(failure: string) {
  if (nowPlaying.failure === failure) return;
  nowPlaying = { ...nowPlaying, failure };
  playbackListeners.forEach((listener) => listener());
}

const artwork = (item: any, className = '') =>
  item?.cover ? (
    <img className={`music-art ${className}`} loading="lazy" src={item.cover} alt="" />
  ) : (
    <span className={`music-art cover-placeholder ${className}`} aria-hidden="true">
      <Icon name="music" size={24} />
    </span>
  );

const MusicRow = memo(function MusicRow({
  item,
  index,
  selected,
  busy,
  active,
  playing,
  play,
  open,
}: {
  item: any;
  index: number;
  selected: any;
  busy: boolean;
  active: boolean;
  playing: boolean;
  play: (item: any) => Promise<void>;
  open: (item: any) => void;
}) {
  return (
    <tr className={active ? 'playing' : ''} data-item-id={item.id}>
      <td className="song-number">
        {active && playing ? (
          <span className="equalizer" aria-label="Playing">
            <i />
            <i />
            <i />
          </span>
        ) : (
          index + 1
        )}
      </td>
      <td>
        <button
          className="song-title"
          aria-label={item.title}
          disabled={busy}
          onClick={() =>
            item.type === 'song' ? void play(selected ? { ...selected, index } : item) : open(item)
          }
        >
          {artwork(item, 'tiny-art')}
          <span>
            <strong>{item.title}</strong>
            <span className="muted">
              {[!selected && typeLabel(item.type), item.artist].filter(Boolean).join(' · ')}
            </span>
          </span>
        </button>
      </td>
      <td>
        <Source source={item.source} />
      </td>
      <td className="song-duration">{item.duration ? duration(item.duration) : ''}</td>
    </tr>
  );
});

export function Music() {
  const app = useApp();
  const auth = app.bootstrap.auth;
  const playback = useSyncExternalStore(subscribePlayback, () => nowPlaying);
  const [tab, setTab] = useRememberedState('music:tab', 'home');
  const [query, setQuery] = useRememberedState('music:query', '');
  const [search, setSearch] = useRememberedState('music:search', '');
  const [type, setType] = useRememberedState('music:type', 'all');
  const [source, setSource] = useState('');
  const [grid, setGrid] = useState(true);
  const [songsGrid, setSongsGrid] = useState(false);
  const [history, setHistory] = useRememberedState<any[]>('music:history', []);
  const [busy, setBusy] = useState(false);
  const pagination = useRef<HTMLDivElement>(null);
  const selected = history.at(-1);
  const open = useCallback(
    (item: any) =>
      app.navigate('music', {
        id: item.id,
        source: item.source,
        type: item.type,
      }),
    [app.navigate],
  );
  useEffect(() => {
    if (app.active !== 'music') setSongsGrid(false);
  }, [app.active]);
  useEffect(() => {
    if (app.target?.module !== 'music') return;
    if (app.target.id && app.target.source && app.target.type) {
      const index = history.findIndex(
        (item) =>
          item.id === app.target!.id &&
          item.source === app.target!.source &&
          item.type === app.target!.type,
      );
      setHistory(index < 0 ? [...history, app.target] : history.slice(0, index + 1));
    } else setHistory([]);
  }, [app.target]);
  const isSongsTab = tab === 'search' && type === 'song' && !selected;
  const showGrid = isSongsTab ? songsGrid : grid;
  const resource = useMusicResource(
    app.bootstrap.root,
    selected ? 'collection' : tab === 'home' ? 'recent' : tab === 'search' ? 'search' : 'library',
    selected
      ? { source: selected.source, id: selected.id, type: selected.type }
      : tab === 'search'
        ? { query: search, type: 'all' }
        : tab === 'home'
          ? {}
          : { type: tab },
  );
  useViewMotion('.music-results', `${selected?.id || tab}:${type}:${showGrid}`);
  const play = useCallback(
    async (item: any) => {
      if (busy) return;
      setBusy(true);
      try {
        await invoke('music', 'play', item);
      } catch (error: any) {
        setPlaybackFailure(error.message);
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );
  const items = (resource.data?.items || []).filter(
    (item: any) =>
      (!source || item.source === source) &&
      (selected || tab !== 'search' || type === 'all' || item.type === type),
  );
  const failure = resource.error || resource.data?.errors?.join('\n');
  useEffect(() => {
    if (
      !pagination.current ||
      !resource.hasMore ||
      resource.loading ||
      failure ||
      app.active !== 'music'
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void resource.loadMore();
      },
      {
        root: pagination.current.closest('.music-view'),
        rootMargin: '0px 0px 300px 0px',
      },
    );
    observer.observe(pagination.current);
    return () => observer.disconnect();
  }, [resource.data, resource.loading, failure, app.active]);
  const failureNotice = failure && (
    <div className="music-load-notice" role="alert">
      <div>
        <strong>{items.length ? 'Some music couldn’t be loaded.' : 'Couldn’t load music.'}</strong>
        <p>{failure}</p>
      </div>
      <button disabled={resource.loading} onClick={() => void resource.retry()}>
        <Icon name="refresh" size={14} />
        {resource.loading ? 'Retrying…' : 'Try again'}
      </button>
    </div>
  );
  function changeTab(name: string) {
    setTab(name);
    setHistory([]);
    if (selected) app.navigate('music', {});
  }
  function renderItems(visibleItems: any[], label?: string) {
    return (selected && selected.type !== 'artist') || !showGrid ? (
      <table className="music-table" aria-label={label}>
        <thead>
          <tr>
            <th className="song-number">#</th>
            <th>Title</th>
            <th>Source</th>
            <th className="song-duration">
              <Icon name="clock" size={12} />
              <span className="sr-only">Time</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleItems.map((item: any, index: number) => (
            <MusicRow
              key={`${item.source}-${item.id}-${index}`}
              item={item}
              index={index}
              selected={selected}
              busy={busy}
              active={playback.id === item.id && playback.source === item.source}
              playing={
                playback.id === item.id && playback.source === item.source && playback.playing
              }
              play={play}
              open={open}
            />
          ))}
        </tbody>
      </table>
    ) : (
      <div className="music-grid">
        {visibleItems.map((item: any, index: number) => (
          <button
            className="music-card"
            key={`${item.source}-${item.id}-${index}`}
            onClick={() => (item.type === 'song' ? void play(item) : open(item))}
            disabled={busy}
          >
            {artwork(item)}
            <span className="music-card-copy">
              <strong>{item.title}</strong>
              {item.artist && <span>{item.artist}</span>}
              <span className="music-card-meta">
                <span>{typeLabel(item.type)}</span>
                <span aria-hidden="true"> · </span>
                <Source source={item.source} />
              </span>
            </span>
            <span className="art-action">
              <Icon name={item.type === 'song' ? 'play' : 'right'} size={14} />
            </span>
          </button>
        ))}
      </div>
    );
  }
  const groupedSearch = tab === 'search' && type === 'all' && !selected;
  return (
    <section className="page music-view">
      <div className="toolbar">
        <h1>Music</h1>
        <select
          aria-label="Music source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        >
          <option value="">All sources</option>
          {auth.spotify && <option value="spotify">Spotify</option>}
          {auth.navidrome && <option value="navidrome">Navidrome</option>}
        </select>
      </div>
      <div className="music-toolbar">
        <div className="music-tabs">
          {['home', 'playlists', 'albums', 'artists'].map((name) => (
            <button
              key={name}
              aria-pressed={tab === name && !selected}
              className={tab === name && !selected ? 'selected' : ''}
              onClick={() => changeTab(name)}
            >
              {name[0].toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
        <form
          className="music-search module-search"
          onSubmit={(event) => {
            event.preventDefault();
            changeTab('search');
            setSearch(query.trim());
          }}
        >
          <Icon name="search" size={14} />
          <input
            type="search"
            aria-label="Search music"
            placeholder="Search music…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="icon-button quiet"
            aria-label="Search"
            title="Search music"
            type="submit"
          >
            <Icon name="right" size={14} />
          </button>
        </form>
        <button
          className="icon-button quiet"
          aria-label={showGrid ? 'Show list' : 'Show grid'}
          title={showGrid ? 'Show list' : 'Show grid'}
          onClick={() => (isSongsTab ? setSongsGrid : setGrid)((value) => !value)}
        >
          <Icon name={showGrid ? 'list' : 'grid'} />
        </button>
        <button
          className="icon-button quiet"
          aria-label="Refresh music"
          title="Refresh music"
          disabled={resource.loading}
          onClick={() => void resource.reload()}
        >
          <Icon name="refresh" />
        </button>
      </div>
      {!auth.spotify && !auth.navidrome && (
        <p className="connection-notice">
          Connect Spotify or Navidrome to browse your music.{' '}
          <button onClick={() => app.navigate('settings', { section: 'spotify' })}>
            Connections
          </button>
        </p>
      )}
      {auth.spotify && !auth.spotifyPlayback && (
        <div className="connection-notice" role="status">
          <Icon name="music" size={14} />
          <span>Spotify library connected. Enable playback to listen in Clarity.</span>
          <button onClick={() => app.navigate('settings', { section: 'spotify-playback' })}>
            Connect playback
          </button>
        </div>
      )}
      {tab === 'artists' && !selected && (
        <p className="muted">
          Browse Navidrome artists here. Search to find artists across both sources.
        </p>
      )}
      {tab === 'search' && !selected && (
        <div className="list-filters search-types">
          {['all', 'playlist', 'album', 'artist', 'song'].map((kind) => (
            <button
              aria-pressed={type === kind}
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
        <>
          <button
            className="quiet music-back"
            aria-label="Back to music list"
            onClick={() => app.navigate('music', history.at(-2) || {})}
          >
            <Icon name="left" size={14} />
            Back
          </button>
          <div className="collection-heading">
            {artwork(resource.data?.item || selected)}
            <div>
              <Source source={selected.source} />
              <h2>
                {resource.data?.item?.title ||
                  selected.title ||
                  (selected.source === 'spotify' && selected.id === 'liked'
                    ? 'Liked Songs'
                    : 'Collection')}
              </h2>
              {resource.data?.item?.artist && <p className="muted">{resource.data.item.artist}</p>}
              {selected.type !== 'artist' && (
                <button
                  className="primary"
                  disabled={busy || !items.length}
                  onClick={() => void play(selected)}
                >
                  <Icon name="play" size={14} />
                  Play
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {!resource.more && failureNotice}
      <ListState
        loading={resource.loading && !resource.loadingMore}
        count={items.length}
        query={tab === 'search' && !selected ? search : undefined}
        error={failure}
        empty={
          tab === 'home' && !selected
            ? 'Albums, artists, and playlists you play in Clarity appear here.'
            : 'No music in this view.'
        }
      />
      {tab === 'home' && !selected && items.length > 0 && (
        <h2 className="music-section-title">Recently played</h2>
      )}
      <div className="music-results">
        {groupedSearch
          ? musicTypes.map((kind) => {
              const matches = items.filter((item: any) => item.type === kind.type);
              if (!matches.length) return null;
              const label = `${kind.label}s`;
              return (
                <section className="music-search-section" key={kind.type} aria-label={label}>
                  <div className="music-search-heading">
                    <h2>{label}</h2>
                    {matches.length > searchPreviewLimit && (
                      <button
                        className="quiet"
                        aria-label={`Show all ${label.toLowerCase()}`}
                        onClick={() => setType(kind.type)}
                      >
                        Show all
                        <Icon name="right" size={14} />
                      </button>
                    )}
                  </div>
                  {renderItems(matches.slice(0, searchPreviewLimit), label)}
                </section>
              );
            })
          : renderItems(items)}
      </div>
      {resource.data?.nextOffset !== undefined && (
        <div className="music-pagination" ref={pagination}>
          {resource.more && failureNotice}
          <div className="row">
            <span className="muted" role="status">
              {resource.loadingMore ? 'Loading more songs… ' : ''}
              {items.length.toLocaleString()} songs
              {resource.hasMore ? ' loaded' : ''}
            </span>
            {resource.hasMore && (
              <button disabled={resource.loading} onClick={() => void resource.loadMore()}>
                Load more
              </button>
            )}
          </div>
        </div>
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
  const [seekPosition, setSeekPosition] = useState<number | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const failure = useSyncExternalStore(subscribePlayback, () => nowPlaying.failure);
  const setFailure = setPlaybackFailure;
  const audio = useRef<HTMLAudioElement>(null);
  const trackGain = useRef(1);
  const pendingVolume = useRef(0);
  const current = useRef<any>(undefined);
  const normalization = app.bootstrap.settings.musicNormalization;
  const preferences = useRef({ volume, shuffle, repeat, normalization });
  preferences.current = { volume, shuffle, repeat, normalization };
  const visited = useRef(new Set<number>());
  const error = useRef(app.error);
  error.current = app.error;
  async function begin(next: any) {
    current.current = next;
    setState(next);
    setPosition(0);
    setSeekPosition(null);
    setAudioDuration(0);
    setFailure('');
    setPlaying(false);
    if (next.source !== 'navidrome') return;
    const element = audio.current!;
    element.pause();
    element.src = `clarity://stream/${encodeURIComponent(next.queue[next.index].id)}`;
    const settings = preferences.current;
    trackGain.current = settings.normalization
      ? normalizationGain(
          next.queue[next.index].replayGain,
          next.context?.type === 'album' && !settings.shuffle,
        )
      : 1;
    element.volume = volumeGain(settings.volume) * trackGain.current;
    try {
      await element.play();
    } catch (failure) {
      setFailure(failure instanceof Error ? failure.message : String(failure));
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
        updateMusicCache(event);
        if (event.type !== 'playback') return;
        const data = event.data;
        if (data.action === 'stop') {
          audio.current?.pause();
          audio.current?.removeAttribute('src');
          audio.current?.load();
          current.current = undefined;
          setState(undefined);
          setPlaying(false);
          setSeekPosition(null);
          setFailure('');
          return;
        }
        if (data.action === 'play') {
          visited.current.clear();
          void begin(data);
          return;
        }
        if (data.action === 'error') {
          setPlaying(false);
          setFailure(data.message);
          return;
        }
        if (data.action === 'state') {
          if (data.source === 'spotify' && current.current?.source === 'spotify') {
            if (data.playing !== undefined) setPlaying(data.playing);
            if (data.position !== undefined) setPosition(data.position);
            if (data.item) setState((state: any) => ({ ...state, ...data }));
          }
          return;
        }
        if (data.action !== 'control') return;
        if (data.volume !== undefined && pendingVolume.current === 0) {
          preferences.current.volume = data.volume;
          setVolume(data.volume);
          if (audio.current) audio.current.volume = volumeGain(data.volume) * trackGain.current;
        }
        if (data.shuffle !== undefined) {
          preferences.current.shuffle = data.shuffle;
          setShuffle(data.shuffle);
          visited.current.clear();
        }
        if (data.repeat !== undefined) {
          preferences.current.repeat = data.repeat;
          setRepeat(data.repeat);
        }
        if (data.command === 'seek' && current.current) {
          if (current.current.source === 'navidrome' && audio.current) {
            const length = audio.current.duration;
            audio.current.currentTime = Math.min(
              data.position,
              Number.isFinite(length) ? length : data.position,
            );
            setPosition(audio.current.currentTime);
          } else setPosition(data.position);
        }
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
  const control = (args: any) =>
    invoke('music', 'control', args).catch((failure: any) => {
      setFailure(failure.message);
    });
  const item = state?.item || state?.queue?.[state.index];
  useEffect(() => {
    nowPlaying = {
      ...nowPlaying,
      id: item?.id || '',
      source: state?.source || '',
      playing,
    };
    playbackListeners.forEach((listener) => listener());
  }, [item?.id, state?.source, playing]);
  const length = audioDuration || item?.duration || 0;
  const shownPosition = Math.max(0, Math.min(seekPosition ?? position, length || Infinity));
  async function seek(value: number) {
    setPosition(value);
    setSeekPosition(null);
    await control({ action: 'seek', position: value });
  }
  return (
    <>
      <audio
        ref={audio}
        onTimeUpdate={() => {
          if (current.current?.source === 'navidrome') setPosition(audio.current!.currentTime);
        }}
        onDurationChange={() => {
          const value = audio.current!.duration;
          if (current.current?.source === 'navidrome')
            setAudioDuration(Number.isFinite(value) ? value : 0);
        }}
        onPlay={() => {
          if (current.current?.source === 'navidrome') {
            setPlaying(true);
            setFailure('');
          }
        }}
        onPause={() => {
          if (current.current?.source === 'navidrome') setPlaying(false);
        }}
        onEnded={() => void step(1, true).catch(app.error)}
        onError={() => {
          if (current.current?.source === 'navidrome' && audio.current?.getAttribute('src')) {
            setPlaying(false);
            setFailure(
              'This track could not be played. Check the music connection and audio format.',
            );
          }
        }}
      />
      {!item && failure && (
        <p className="player-error" role="alert">
          {failure}
        </p>
      )}
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
          <div className="player-center">
            <div className="player-transport">
              <button
                aria-label="Shuffle"
                title="Shuffle"
                aria-pressed={shuffle}
                className={`icon-button quiet${shuffle ? ' selected' : ''}`}
                onClick={() => void control({ shuffle: !shuffle })}
              >
                <Icon name="shuffle" size={14} />
              </button>
              <button
                className="icon-button quiet"
                aria-label="Previous track"
                title="Previous track"
                onClick={() => void control({ action: 'previous' })}
              >
                <Icon name="previous" />
              </button>
              <button
                className="icon-button player-play"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={() => void control({ action: playing ? 'pause' : 'resume' })}
              >
                <Icon name={playing ? 'pause' : 'play'} />
              </button>
              <button
                className="icon-button quiet"
                aria-label="Next track"
                title="Next track"
                onClick={() => void control({ action: 'next' })}
              >
                <Icon name="next" />
              </button>
              <button
                className={`icon-button quiet${repeat !== 'off' ? ' selected' : ''}`}
                aria-label="Repeat"
                title={`Repeat ${repeat === 'context' ? 'all' : repeat === 'track' ? 'one' : 'off'}`}
                aria-pressed={repeat !== 'off'}
                onClick={() =>
                  void control({
                    repeat: repeat === 'off' ? 'context' : repeat === 'context' ? 'track' : 'off',
                  })
                }
              >
                <Icon name="repeat" size={14} />
                {repeat === 'track' && <small className="repeat-one">1</small>}
              </button>
            </div>
            <div className="player-progress">
              <span className="player-time">{duration(shownPosition)}</span>
              <input
                aria-label="Playback position"
                aria-valuetext={`${duration(shownPosition)} of ${duration(length)}`}
                type="range"
                min="0"
                max={length || 1}
                step="1"
                value={shownPosition}
                style={
                  {
                    '--progress': `${length ? (shownPosition / length) * 100 : 0}%`,
                  } as React.CSSProperties
                }
                disabled={!length || !!failure}
                onChange={(event) => setSeekPosition(Number(event.target.value))}
                onPointerUp={(event) => void seek(Number(event.currentTarget.value))}
                onKeyUp={(event) => {
                  if (
                    [
                      'ArrowLeft',
                      'ArrowRight',
                      'ArrowUp',
                      'ArrowDown',
                      'Home',
                      'End',
                      'PageUp',
                      'PageDown',
                    ].includes(event.key)
                  )
                    void seek(Number(event.currentTarget.value));
                }}
                onPointerCancel={() => setSeekPosition(null)}
                onBlur={() => setSeekPosition(null)}
              />
              <span className="player-time">{duration(length)}</span>
            </div>
          </div>
          <div className="player-volume-group">
            <Icon name="volume" size={14} />
            <input
              aria-label="Volume"
              className="player-volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              style={{ '--progress': `${volume}%` } as React.CSSProperties}
              onChange={(event) => {
                const value = Number(event.target.value);
                preferences.current.volume = value;
                setVolume(value);
                if (audio.current) audio.current.volume = volumeGain(value) * trackGain.current;
                pendingVolume.current++;
                void control({ volume: value }).finally(() => pendingVolume.current--);
              }}
            />
          </div>
          {failure && (
            <p className="player-error" role="alert">
              {failure}
              {state.source === 'spotify' && !app.bootstrap.auth.spotifyPlayback && (
                <button onClick={() => app.navigate('settings', { section: 'spotify-playback' })}>
                  Connect playback
                </button>
              )}
            </p>
          )}
        </div>
      )}
    </>
  );
}
