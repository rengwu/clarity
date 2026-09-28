import { flushDocuments } from '../lifecycle';
import React, { useEffect, useState } from 'react';
import { call, labels, useApp, Field, ErrorText } from '../api';
import { modules } from '../../shared/types';

export function Settings() {
  const app = useApp();
  const { settings, auth, root } = app.bootstrap;
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [enabled, setEnabled] = useState<string[]>(settings.enabled);
  const [prompt, setPrompt] = useState<any>();
  const [answer, setAnswer] = useState('');
  const [google, setGoogle] = useState({ clientId: auth.googleClientId || '', clientSecret: '' });
  const [spotify, setSpotify] = useState({ clientId: auth.spotifyClientId || '' });
  const [navidrome, setNavidrome] = useState({
    url: auth.navidromeUrl || '',
    username: auth.navidromeUsername || '',
    password: '',
  });
  const [linkding, setLinkding] = useState({ url: auth.linkdingUrl || '', token: '' });
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
    setError('');
    setBusy(label);
    try {
      await call(method, args);
      await app.refresh();
    } catch (failure: any) {
      setError(failure.message);
    } finally {
      setBusy('');
      setPrompt(undefined);
    }
  }
  const disconnect = (provider: string) => run(provider, 'auth.disconnect', { provider });
  return (
    <section className="page settings-page">
      <h1>Settings</h1>
      <ErrorText>{error}</ErrorText>
      <section>
        <h2>Data folder</h2>
        <div className="row">
          <code className="folder-path">{root}</code>
          <button onClick={() => void call('root.pick').catch(app.error)}>Open folder</button>
        </div>
      </section>
      <section>
        <h2>Modules</h2>
        <div className="module-toggles">
          {modules
            .filter((module) => module !== 'chat')
            .map((module) => (
              <label key={module}>
                <input
                  type="checkbox"
                  checked={enabled.includes(module)}
                  onChange={async (event) => {
                    const next = event.target.checked
                      ? [...enabled, module]
                      : enabled.filter((name) => name !== module);
                    setEnabled(next);
                    try {
                      if (module === 'notes' && !next.includes('notes')) await flushDocuments();
                      await call('settings.save', { enabled: next });
                    } catch (error) {
                      setEnabled(enabled);
                      app.error(error);
                    }
                  }}
                />
                {labels[module]}
              </label>
            ))}
        </div>
      </section>
      <section>
        <h2>Appearance</h2>
        <Field label="Theme">
          <select
            value={settings.theme}
            onChange={(event) =>
              void call('settings.save', { theme: event.target.value }).catch(app.error)
            }
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </section>
      <section>
        <h2>Codex</h2>
        <ErrorText>{auth.credentialWarning}</ErrorText>
        {auth.codex ? (
          <div className="row">
            <span>Connected</span>
            <button disabled={!!busy} onClick={() => void disconnect('codex')}>
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <p>Use your ChatGPT subscription.</p>
            <div className="row">
              {auth.installedCodex && (
                <button disabled={!!busy} onClick={() => void run('codex', 'auth.existingCodex')}>
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
            onSubmit={(event) => {
              event.preventDefault();
              void call('auth.answer', { id: prompt.id, value: answer }).catch(app.error);
              setPrompt(undefined);
            }}
          >
            <Field label={prompt.message}>
              <input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} />
            </Field>
            <button>Continue</button>
          </form>
        )}
      </section>
      {settings.enabled.includes('mail') && (
        <section>
          <h2>Google</h2>
          {auth.google ? (
            <div className="row">
              <span>Connected · Gmail read-only</span>
              <button disabled={!!busy} onClick={() => void disconnect('google')}>
                Disconnect
              </button>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run('google', 'auth.oauth', { provider: 'google', ...google });
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
                  onChange={(event) => setGoogle({ ...google, clientSecret: event.target.value })}
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
          <section>
            <h2>Spotify</h2>
            {auth.spotify ? (
              <div className="row">
                <span>Connected</span>
                <button disabled={!!busy} onClick={() => void disconnect('spotify')}>
                  Disconnect
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void run('spotify', 'auth.oauth', { provider: 'spotify', ...spotify });
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
                  Register http://127.0.0.1:43827/callback in your Spotify app. Playback requires
                  Premium.
                </p>
                <button disabled={!!busy}>
                  {busy === 'spotify' ? 'Waiting for sign-in…' : 'Connect Spotify'}
                </button>
              </form>
            )}
          </section>
          <section>
            <h2>Spotify playback</h2>
            {auth.spotifyPlayback ? (
              <div className="row">
                <span>Connected · plays inside Clarity</span>
                <button disabled={!!busy} onClick={() => void disconnect('spotify-playback')}>
                  Disconnect
                </button>
              </div>
            ) : (
              <>
                <p>Spotify requires a separate sign-in for native audio playback.</p>
                <button
                  disabled={!!busy}
                  onClick={() => void run('spotify-playback', 'music.connectPlayback')}
                >
                  {busy === 'spotify-playback' ? 'Waiting for sign-in…' : 'Enable Spotify playback'}
                </button>
              </>
            )}
          </section>
          <section>
            <h2>Navidrome</h2>
            {auth.navidrome && (
              <div className="row">
                <span>Connected</span>
                <button disabled={!!busy} onClick={() => void disconnect('navidrome')}>
                  Disconnect
                </button>
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run('navidrome', 'auth.configure', { provider: 'navidrome', ...navidrome });
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
                  onChange={(event) => setNavidrome({ ...navidrome, username: event.target.value })}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={navidrome.password}
                  onChange={(event) => setNavidrome({ ...navidrome, password: event.target.value })}
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
          <section>
            <h2>Linkding</h2>
            {auth.linkding && (
              <div className="row">
                <span>Connected</span>
                <button disabled={!!busy} onClick={() => void disconnect('linkding')}>
                  Disconnect
                </button>
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run('linkding', 'auth.configure', { provider: 'linkding', ...linkding });
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
          <section>
            <h2>X bookmarks</h2>
            <p>Sign in once in Clarity’s browser, then refresh from Bookmarks.</p>
            <button
              onClick={() => void run('x', 'browser.login', { url: 'https://x.com/i/bookmarks' })}
            >
              Sign in to X
            </button>
          </section>
        </>
      )}
      {settings.enabled.includes('expenses') && (
        <section>
          <h2>Expenses</h2>
          <Field label="Currency symbol">
            <input
              maxLength={10}
              defaultValue={settings.currency}
              onBlur={(event) =>
                void call('settings.save', { currency: event.target.value }).catch(app.error)
              }
            />
          </Field>
        </section>
      )}
    </section>
  );
}
