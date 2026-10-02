import { useSubmission, useRememberedState } from '../state';
import { flushDocuments } from '../lifecycle';
import React, { useEffect, useState } from 'react';
import { call, labels, useApp, Field, ErrorText } from '../api';
import { modules } from '../../shared/types';
import { Permissions } from './permissions';
import { AgentApprovals } from './agent-approvals';
import { Icon } from '../icons';
import { useViewMotion } from '../motion';
import { SettingRow, SettingToggle } from './settings-controls';

export function Settings() {
  const app = useApp();
  const submission = useSubmission();
  const { settings, auth, root } = app.bootstrap;
  const [error, setError] = useState({ section: '', message: '' });
  const [busy, setBusy] = useState('');
  const [section, setSection] = useRememberedState('settings:section', 'appearance');
  useViewMotion('.settings-content', section);
  const [enabled, setEnabled] = useState<string[]>(settings.enabled);
  const [savingModules, setSavingModules] = useState(false);
  useEffect(() => {
    if (!savingModules) setEnabled(settings.enabled);
  }, [settings.enabled, savingModules]);
  const [preferences, setPreferences] = useState({
    reducedMotion: settings.reducedMotion,
    autoInterpretCommands: settings.autoInterpretCommands,
    musicNormalization: settings.musicNormalization,
  });
  useEffect(
    () =>
      setPreferences({
        reducedMotion: settings.reducedMotion,
        autoInterpretCommands: settings.autoInterpretCommands,
        musicNormalization: settings.musicNormalization,
      }),
    [settings.reducedMotion, settings.autoInterpretCommands, settings.musicNormalization],
  );
  async function setPreference(
    key: 'reducedMotion' | 'autoInterpretCommands' | 'musicNormalization',
    value: boolean,
  ) {
    const previous = preferences[key];
    setPreferences((current) => ({ ...current, [key]: value }));
    setBusy(key);
    setError({ section: '', message: '' });
    try {
      await call('settings.save', { [key]: value });
    } catch (error) {
      setPreferences((current) => ({ ...current, [key]: previous }));
      setError({
        section:
          key === 'reducedMotion'
            ? 'appearance'
            : key === 'musicNormalization'
              ? 'music'
              : 'search',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy('');
    }
  }
  const [prompt, setPrompt] = useState<any>();
  const [answer, setAnswer] = useState('');
  const [google, setGoogle] = useState({
    clientId: auth.googleClientId || '',
    clientSecret: '',
  });
  const [spotify, setSpotify] = useState({
    clientId: auth.spotifyClientId || '',
  });
  const [navidrome, setNavidrome] = useState({
    url: auth.navidromeUrl || '',
    username: auth.navidromeUsername || '',
    password: '',
  });
  const [linkding, setLinkding] = useState({
    url: auth.linkdingUrl || '',
    token: '',
  });
  useEffect(
    () =>
      window.clarity.subscribe((event) => {
        if (event.type === 'auth' && event.data?.kind === 'prompt') {
          setPrompt(event.data);
          setAnswer('');
        }
      }),
    [],
  );
  async function run(label: string, method: string, args?: any) {
    await submission.run(async () => {
      setError({ section: '', message: '' });
      setBusy(label);
      try {
        await call(method, args);
        await app.refresh();
      } catch (failure: any) {
        setError({ section: label, message: failure.message });
      } finally {
        setBusy('');
        setPrompt(undefined);
      }
    });
  }
  const sectionGroups = [
    {
      title: 'Workspace',
      sections: [
        ['appearance', 'Appearance', 'appearance'],
        ['modules', 'Modules', 'grid'],
        ['data', 'Data folder', 'folder'],
        ['search', 'Search and commands', 'search'],
      ],
    },
    {
      title: 'Agent',
      sections: [
        ['permissions', 'Permissions', 'shield'],
        ['agent-approvals', 'Agent approvals', 'check'],
      ],
    },
    {
      title: 'Connections',
      sections: [
        ['codex', 'Codex', 'chat'],
        ...(enabled.includes('mail') ? [['google', 'Google', 'mail']] : []),
        ...(enabled.includes('music')
          ? [
              ['spotify', 'Spotify', 'music'],
              ['navidrome', 'Navidrome', 'music'],
            ]
          : []),
        ...(enabled.includes('bookmarks')
          ? [
              ['linkding', 'Linkding', 'bookmarks'],
              ['x', 'X bookmarks', 'bookmarks'],
            ]
          : []),
      ],
    },
    {
      title: 'Preferences',
      sections: [
        ...(enabled.includes('music') ? [['music', 'Music', 'music']] : []),
        ...(enabled.includes('expenses') ? [['expenses', 'Expenses', 'expenses']] : []),
      ],
    },
  ];
  const sections = sectionGroups.flatMap((group) => group.sections);
  async function toggleModule(module: string, checked: boolean) {
    const previous = enabled;
    const next = checked ? [...enabled, module] : enabled.filter((name) => name !== module);
    setEnabled(next);
    setSavingModules(true);
    setError({ section: '', message: '' });
    try {
      if (module === 'notes' && !checked) await flushDocuments();
      await call('settings.save', { enabled: next });
      await app.refresh();
    } catch (failure: any) {
      setEnabled(previous);
      setError({ section: 'modules', message: failure.message });
    } finally {
      setSavingModules(false);
    }
  }
  function jump(section: string) {
    setSection(section === 'spotify-playback' ? 'spotify' : section);
    requestAnimationFrame(() => {
      document.querySelector('.settings-scroll')?.scrollTo({ top: 0 });
      document
        .getElementById(`settings-${section === 'spotify-playback' ? 'spotify' : section}`)
        ?.focus({ preventScroll: true });
    });
  }
  useEffect(() => {
    if (app.target?.module === 'settings' && app.target.section) jump(app.target.section);
  }, [app.target]);
  useEffect(() => {
    if (!sections.some(([id]) => id === section)) setSection('appearance');
  }, [enabled.join(','), section]);
  const disconnect = (provider: string) => run(provider, 'auth.disconnect', { provider });
  return (
    <section className="settings-page">
      <nav className="settings-nav" aria-label="Settings sections">
        {sectionGroups
          .filter((group) => group.sections.length)
          .map((group) => (
            <div className="settings-nav-group" key={group.title}>
              <div className="settings-nav-heading">{group.title}</div>
              {group.sections.map(([id, title, icon]) => (
                <button
                  key={id}
                  className={section === id ? 'selected' : ''}
                  aria-current={section === id ? 'page' : undefined}
                  onClick={() => jump(id)}
                >
                  <Icon name={icon} size={15} />
                  <span>{title}</span>
                </button>
              ))}
            </div>
          ))}
      </nav>
      <div className="settings-scroll">
        <div className="settings-content">
          <section id="settings-data" tabIndex={-1} hidden={section !== 'data'}>
            <h2>Data folder</h2>
            <ErrorText>{error.section === 'data' ? error.message : ''}</ErrorText>
            <p className="settings-intro">Your files and app data live in this folder.</p>
            <div className="settings-group">
              <SettingRow
                title="Location"
                description={<code className="folder-path">{root}</code>}
              >
                <button onClick={() => void call('root.pick').catch(app.error)}>Open folder</button>
              </SettingRow>
            </div>
          </section>
          <section id="settings-modules" tabIndex={-1} hidden={section !== 'modules'}>
            <h2>Modules</h2>
            <ErrorText>{error.section === 'modules' ? error.message : ''}</ErrorText>
            <p className="settings-intro">
              Choose what appears in your workspace. Turning a module off keeps its data.
            </p>
            <div className="settings-group module-toggles">
              {modules
                .filter((module) => module !== 'chat')
                .map((module) => (
                  <SettingToggle
                    key={module}
                    label={labels[module]}
                    icon={module}
                    checked={enabled.includes(module)}
                    disabled={savingModules}
                    onChange={(checked) => void toggleModule(module, checked)}
                  />
                ))}
            </div>
          </section>
          <section id="settings-appearance" tabIndex={-1} hidden={section !== 'appearance'}>
            <h2>Appearance</h2>
            <ErrorText>{error.section === 'appearance' ? error.message : ''}</ErrorText>
            <h3 className="settings-group-heading">Theme</h3>
            <div className="theme-previews" role="radiogroup" aria-label="Theme">
              {['system', 'light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  role="radio"
                  aria-checked={settings.theme === theme}
                  tabIndex={settings.theme === theme ? 0 : -1}
                  className={`theme-option${settings.theme === theme ? ' active' : ''}`}
                  onKeyDown={(event) => {
                    if (
                      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                        event.key,
                      )
                    )
                      return;
                    event.preventDefault();
                    const options = Array.from(
                      event.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>(
                        '[role="radio"]',
                      ),
                    );
                    const index = options.indexOf(event.currentTarget);
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? options.length - 1
                          : (index +
                              (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) +
                              options.length) %
                            options.length;
                    options[next].focus();
                    options[next].click();
                  }}
                  onClick={() => void call('settings.save', { theme }).catch(app.error)}
                >
                  <span className={`theme-preview theme-${theme}`} aria-hidden="true">
                    <span className="mini-sidebar">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="mini-workspace">
                      <i />
                      <i />
                      <i />
                      <b />
                    </span>
                  </span>
                  <span className="theme-label">
                    {theme[0].toUpperCase() + theme.slice(1)}
                    {settings.theme === theme && <Icon name="check" size={14} />}
                  </span>
                </button>
              ))}
            </div>
            <div className="settings-group">
              <SettingToggle
                label="Reduce motion"
                description="Limit transitions and feedback animations."
                checked={preferences.reducedMotion}
                disabled={busy === 'reducedMotion'}
                onChange={(checked) => void setPreference('reducedMotion', checked)}
              />
            </div>
          </section>
          <section id="settings-music" tabIndex={-1} hidden={section !== 'music'}>
            <h2>Music</h2>
            <ErrorText>{error.section === 'music' ? error.message : ''}</ErrorText>
            <div className="settings-group">
              <SettingToggle
                label="Normalize volume"
                description="Reduce differences between recordings and preserve album dynamics. Quiet or untagged tracks stay unchanged. Applies to the next track."
                checked={preferences.musicNormalization}
                disabled={busy === 'musicNormalization'}
                onChange={(checked) => void setPreference('musicNormalization', checked)}
              />
            </div>
          </section>
          <section id="settings-search" tabIndex={-1} hidden={section !== 'search'}>
            <h2>Search and commands</h2>
            <ErrorText>{error.section === 'search' ? error.message : ''}</ErrorText>
            <div className="settings-group">
              <SettingToggle
                label="Automatically interpret commands"
                description="Use your selected model after you pause typing. Review the fields before saving. Mail and Music searches still require their search action."
                checked={preferences.autoInterpretCommands}
                disabled={busy === 'autoInterpretCommands'}
                onChange={(checked) => void setPreference('autoInterpretCommands', checked)}
              />
            </div>
          </section>
          <div id="settings-permissions" tabIndex={-1} hidden={section !== 'permissions'}>
            <Permissions />
          </div>
          <div id="settings-agent-approvals" tabIndex={-1} hidden={section !== 'agent-approvals'}>
            <AgentApprovals />
          </div>
          <section id="settings-codex" tabIndex={-1} hidden={section !== 'codex'}>
            <h2>Codex</h2>
            <ErrorText>{error.section === 'codex' ? error.message : ''}</ErrorText>
            <ErrorText>{auth.credentialWarning}</ErrorText>
            {auth.codex ? (
              <div className="settings-group">
                <SettingRow
                  title="ChatGPT subscription"
                  description={<span className="connection-status">Connected</span>}
                >
                  <button disabled={!!busy} onClick={() => void disconnect('codex')}>
                    Disconnect
                  </button>
                </SettingRow>
              </div>
            ) : (
              <>
                <p className="settings-intro">
                  Use your ChatGPT subscription for chats and automations.
                </p>
                <div className="settings-group settings-detail">
                  <div className="row">
                    {auth.installedCodex && (
                      <button
                        disabled={!!busy}
                        onClick={() => void run('codex', 'auth.existingCodex')}
                      >
                        Use installed Codex sign-in
                      </button>
                    )}
                    <button
                      className="primary"
                      disabled={!!busy}
                      onClick={() => void run('codex', 'auth.codex')}
                    >
                      Sign in to ChatGPT
                    </button>
                  </div>
                </div>
              </>
            )}
            {busy === 'codex' && (
              <div className="row">
                <span role="status">Complete sign-in in your browser.</span>
                <button onClick={() => void call('auth.cancel')}>Cancel</button>
              </div>
            )}
            {prompt && (
              <form
                className="settings-form settings-group"
                onSubmit={(event) => {
                  event.preventDefault();
                  void call('auth.answer', {
                    id: prompt.id,
                    value: answer,
                  }).catch(app.error);
                  setPrompt(undefined);
                }}
              >
                <Field label={prompt.message}>
                  <input
                    autoFocus
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                  />
                </Field>
                <button>Continue</button>
              </form>
            )}
          </section>
          {settings.enabled.includes('mail') && (
            <section id="settings-google" tabIndex={-1} hidden={section !== 'google'}>
              <h2>Google</h2>
              <ErrorText>{error.section === 'google' ? error.message : ''}</ErrorText>
              {auth.google ? (
                <div className="settings-group">
                  <SettingRow
                    title="Gmail"
                    description={<span className="connection-status">Connected · read-only</span>}
                  >
                    <button disabled={!!busy} onClick={() => void disconnect('google')}>
                      Disconnect
                    </button>
                  </SettingRow>
                </div>
              ) : (
                <form
                  className="settings-form settings-group"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run('google', 'auth.oauth', {
                      provider: 'google',
                      ...google,
                    });
                  }}
                >
                  <Field label="Google OAuth client ID">
                    <input
                      required
                      value={google.clientId}
                      onChange={(event) => setGoogle({ ...google, clientId: event.target.value })}
                    />
                  </Field>
                  <Field label="Client secret (if required)">
                    <input
                      type="password"
                      value={google.clientSecret}
                      onChange={(event) =>
                        setGoogle({
                          ...google,
                          clientSecret: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <p className="muted">
                    Use a desktop OAuth client with Gmail API enabled. Redirect:
                    http://127.0.0.1:43828/callback
                  </p>
                  <button disabled={!!busy}>
                    {busy === 'google' ? 'Waiting for sign-in…' : 'Connect Google'}
                  </button>
                </form>
              )}
            </section>
          )}
          {settings.enabled.includes('music') && (
            <>
              <section id="settings-spotify" tabIndex={-1} hidden={section !== 'spotify'}>
                <h2>Spotify</h2>
                <h3 className="settings-group-heading">Library</h3>
                <ErrorText>{error.section === 'spotify' ? error.message : ''}</ErrorText>
                {auth.spotify ? (
                  <div className="settings-group">
                    <SettingRow
                      title="Library access"
                      description={<span className="connection-status">Connected</span>}
                    >
                      <button disabled={!!busy} onClick={() => void disconnect('spotify')}>
                        Disconnect library
                      </button>
                    </SettingRow>
                  </div>
                ) : (
                  <form
                    className="settings-form settings-group"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void run('spotify', 'auth.oauth', {
                        provider: 'spotify',
                        ...spotify,
                      });
                    }}
                  >
                    <Field label="Spotify client ID">
                      <input
                        required
                        value={spotify.clientId}
                        onChange={(event) => setSpotify({ clientId: event.target.value })}
                      />
                    </Field>
                    <p className="muted">
                      Register http://127.0.0.1:43827/callback in your Spotify app. Playback
                      requires Premium.
                    </p>
                    <button disabled={!!busy}>
                      {busy === 'spotify' ? 'Waiting for sign-in…' : 'Connect Spotify'}
                    </button>
                  </form>
                )}
                <div id="settings-spotify-playback" className="connection-section">
                  <h3 className="settings-group-heading">Playback</h3>
                  <ErrorText>{error.section === 'spotify-playback' ? error.message : ''}</ErrorText>
                  {auth.spotifyPlayback ? (
                    <div className="settings-group">
                      <SettingRow
                        title="Playback access"
                        description={
                          <span className="connection-status">
                            Connected · plays inside Clarity
                          </span>
                        }
                      >
                        <button
                          disabled={!!busy}
                          onClick={() => void disconnect('spotify-playback')}
                        >
                          Disconnect playback
                        </button>
                      </SettingRow>
                    </div>
                  ) : (
                    <div className="settings-group">
                      <SettingRow
                        title="Listen inside Clarity"
                        description="Connect playback separately from your library. Requires Spotify Premium."
                      >
                        <button
                          disabled={!!busy}
                          onClick={() => void run('spotify-playback', 'music.connectPlayback')}
                        >
                          {busy === 'spotify-playback'
                            ? 'Waiting for sign-in…'
                            : 'Enable Spotify playback'}
                        </button>
                      </SettingRow>
                    </div>
                  )}
                </div>
              </section>
              <section id="settings-navidrome" tabIndex={-1} hidden={section !== 'navidrome'}>
                <h2>Navidrome</h2>
                <p className="settings-intro">Connect your server to browse and play your music.</p>
                <ErrorText>{error.section === 'navidrome' ? error.message : ''}</ErrorText>
                {auth.navidrome && (
                  <div className="settings-group">
                    <SettingRow
                      title="Server connection"
                      description={<span className="connection-status">Connected</span>}
                    >
                      <button disabled={!!busy} onClick={() => void disconnect('navidrome')}>
                        Disconnect
                      </button>
                    </SettingRow>
                  </div>
                )}
                <form
                  className="settings-form settings-group"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run('navidrome', 'auth.configure', {
                      provider: 'navidrome',
                      ...navidrome,
                    });
                  }}
                >
                  <Field label="Server address">
                    <input
                      required
                      type="url"
                      placeholder="http://localhost:4533"
                      value={navidrome.url}
                      onChange={(event) => setNavidrome({ ...navidrome, url: event.target.value })}
                    />
                  </Field>
                  <Field label="Username">
                    <input
                      required
                      autoComplete="username"
                      value={navidrome.username}
                      onChange={(event) =>
                        setNavidrome({
                          ...navidrome,
                          username: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={navidrome.password}
                      onChange={(event) =>
                        setNavidrome({
                          ...navidrome,
                          password: event.target.value,
                        })
                      }
                    />
                  </Field>
                  <button disabled={!!busy}>
                    {busy === 'navidrome' ? 'Connecting…' : 'Connect Navidrome'}
                  </button>
                </form>
              </section>
            </>
          )}
          {settings.enabled.includes('bookmarks') && (
            <>
              <section id="settings-linkding" tabIndex={-1} hidden={section !== 'linkding'}>
                <h2>Linkding</h2>
                <div className="settings-form settings-group">
                  <Field label="Refresh bookmarks">
                    <select
                      value={settings.linkdingRefreshMinutes}
                      disabled={!!busy}
                      onChange={(event) =>
                        void run('linkding', 'settings.save', {
                          linkdingRefreshMinutes: Number(event.target.value),
                        })
                      }
                    >
                      <option value={0}>Manually</option>
                      <option value={60}>Every hour</option>
                      <option value={1440}>Every day</option>
                    </select>
                  </Field>
                  <p className="muted">
                    Scheduled refresh runs while Clarity is open. Local edits are preserved.
                  </p>
                </div>
                <ErrorText>{error.section === 'linkding' ? error.message : ''}</ErrorText>
                {auth.linkding && (
                  <div className="settings-group">
                    <SettingRow
                      title="Server connection"
                      description={<span className="connection-status">Connected</span>}
                    >
                      <button disabled={!!busy} onClick={() => void disconnect('linkding')}>
                        Disconnect
                      </button>
                    </SettingRow>
                  </div>
                )}
                <form
                  className="settings-form settings-group"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void run('linkding', 'auth.configure', {
                      provider: 'linkding',
                      ...linkding,
                    });
                  }}
                >
                  <Field label="Server address">
                    <input
                      required
                      type="url"
                      value={linkding.url}
                      onChange={(event) => setLinkding({ ...linkding, url: event.target.value })}
                    />
                  </Field>
                  <Field label="API token">
                    <input
                      required
                      type="password"
                      value={linkding.token}
                      onChange={(event) => setLinkding({ ...linkding, token: event.target.value })}
                    />
                  </Field>
                  <button disabled={!!busy}>
                    {busy === 'linkding' ? 'Connecting…' : 'Connect Linkding'}
                  </button>
                </form>
              </section>
              <section id="settings-x" tabIndex={-1} hidden={section !== 'x'}>
                <h2>X bookmarks</h2>
                <ErrorText>{error.section === 'x' ? error.message : ''}</ErrorText>
                <div className="settings-group">
                  <SettingRow
                    title="Open bookmarks"
                    description="Use your default browser and its existing X sign-in."
                  >
                    <button
                      disabled={!!busy}
                      onClick={() =>
                        void run('x', 'external.open', {
                          url: 'https://x.com/i/bookmarks',
                        })
                      }
                    >
                      Open X
                    </button>
                  </SettingRow>
                  <SettingRow
                    title="Import bookmarks"
                    description="Import still needs a separate browser sign-in. Your default browser’s login isn’t shared with Clarity."
                  >
                    <button
                      disabled={!!busy}
                      onClick={() =>
                        void run('x', 'browser.login', {
                          url: 'https://x.com/i/bookmarks',
                        })
                      }
                    >
                      Sign in for import
                    </button>
                  </SettingRow>
                </div>
              </section>
            </>
          )}
          {settings.enabled.includes('expenses') && (
            <section id="settings-expenses" tabIndex={-1} hidden={section !== 'expenses'}>
              <h2>Expenses</h2>
              <ErrorText>{error.section === 'expenses' ? error.message : ''}</ErrorText>
              <div className="settings-form settings-group">
                <Field label="Currency symbol">
                  <input
                    maxLength={10}
                    defaultValue={settings.currency}
                    onBlur={(event) =>
                      void call('settings.save', {
                        currency: event.target.value,
                      }).catch(app.error)
                    }
                  />
                </Field>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}
