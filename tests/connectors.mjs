import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const { _electron: electron } = require('playwright-core');

test(
  'OAuth state/PKCE, encrypted tokens, refresh and read-only Gmail with controlled responses',
  { timeout: 60000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-auth-test-'));
    let application;
    try {
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      await application.evaluate(({ shell }) => {
        const originalFetch = globalThis.fetch;
        globalThis.fixture = {
          refreshes: 0,
          wrongState: 0,
          pkce: false,
          methods: [],
          scopes: [],
        };
        shell.openExternal = async (address) => {
          const url = new URL(address);
          globalThis.fixture.pkce =
            url.searchParams.get('code_challenge_method') === 'S256' &&
            url.searchParams.get('code_challenge').length > 30;
          globalThis.fixture.scopes.push(url.searchParams.get('scope'));
          const redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({
            state: 'wrong-state',
            code: 'fixture-code',
          });
          globalThis.fixture.wrongState = (await originalFetch(redirect)).status;
          redirect.searchParams.set('state', url.searchParams.get('state'));
          await originalFetch(redirect);
        };
        globalThis.fetch = async (address, options = {}) => {
          const url = String(address);
          const json = (value) =>
            new Response(JSON.stringify(value), {
              headers: { 'content-type': 'application/json' },
            });
          if (
            url.includes('oauth2.googleapis.com/token') ||
            url.includes('accounts.spotify.com/api/token')
          ) {
            const body = new URLSearchParams(options.body);
            const refresh = body.get('grant_type') === 'refresh_token';
            if (refresh) globalThis.fixture.refreshes++;
            else if (!body.get('code_verifier') || body.get('code') !== 'fixture-code')
              throw new Error('Missing authorization proof');
            return json({
              access_token: 'fixture-access-only',
              refresh_token: 'fixture-refresh-only',
              expires_in: refresh ? 3600 : 0,
            });
          }
          if (url.startsWith('https://gmail.googleapis.com/')) {
            globalThis.fixture.methods.push(options.method || 'GET');
            if (options.headers.Authorization !== 'Bearer fixture-access-only')
              throw new Error('Wrong fixture authorization');
            if (new URL(url).pathname.endsWith('/messages'))
              return json({ messages: [{ id: 'mail-one' }] });
            return json({
              id: 'mail-one',
              labelIds: ['INBOX', 'UNREAD'],
              snippet: 'A fixture message',
              payload: {
                mimeType: 'text/plain',
                headers: [
                  { name: 'Subject', value: 'Fixture mail' },
                  { name: 'From', value: 'reader@example.com' },
                ],
                body: {
                  data: Buffer.from('Read-only message body.').toString('base64url'),
                },
              },
            });
          }
          return originalFetch(address, options);
        };
      });
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki', 'mail', 'music'],
        }),
      );
      const status = await page.evaluate(() =>
        window.clarity.call('auth.oauth', {
          provider: 'google',
          clientId: 'fixture-client',
        }),
      );
      assert.equal(status.google, true);
      const inbox = await page.evaluate(() =>
        window.clarity.call('module', { module: 'mail', method: 'list' }),
      );
      assert.equal(inbox.messages[0].subject, 'Fixture mail');
      const message = await page.evaluate(() =>
        window.clarity.call('module', {
          module: 'mail',
          method: 'read',
          args: { id: 'mail-one' },
        }),
      );
      assert.equal(message.text, 'Read-only message body.');
      const fixture = await application.evaluate(() => globalThis.fixture);
      assert.equal(fixture.wrongState, 400);
      assert.equal(fixture.pkce, true);
      assert.equal(fixture.refreshes, 1);
      assert.ok(fixture.methods.every((method) => method === 'GET'));
      assert.equal(fixture.scopes[0], 'https://www.googleapis.com/auth/gmail.readonly');
      const encrypted = await readFile(join(root, '.clarity', 'credentials.bin'));
      assert.ok(!encrypted.includes(Buffer.from('fixture-access-only')));
      await page.reload();
      await page.getByRole('button', { name: 'Mail', exact: true }).click();
      await page.getByText('Fixture mail', { exact: true }).first().click();
      await page.getByText('Read-only message body.', { exact: true }).waitFor();
      await page.evaluate(() =>
        window.clarity.call('auth.oauth', {
          provider: 'spotify',
          clientId: 'fixture-spotify',
        }),
      );
      await page.evaluate(() => window.clarity.call('music.connectPlayback'));
      assert.equal(
        (await page.evaluate(() => window.clarity.call('auth.status'))).spotifyPlayback,
        true,
      );
      await page.evaluate(() => window.clarity.call('auth.disconnect', { provider: 'spotify' }));
      assert.equal((await page.evaluate(() => window.clarity.call('auth.status'))).spotify, false);
      assert.equal(
        (await page.evaluate(() => window.clarity.call('auth.status'))).spotifyPlayback,
        true,
        'Disconnecting the library must retain the independently authorized playback connection',
      );
      await page.evaluate(() =>
        window.clarity.call('auth.disconnect', {
          provider: 'spotify-playback',
        }),
      );
      assert.equal(
        (await page.evaluate(() => window.clarity.call('auth.status'))).spotifyPlayback,
        false,
      );
      await application.close();
      application = undefined;
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const reopened = await application.firstWindow();
      await reopened.waitForFunction(() => !!window.clarity);
      assert.equal(
        (await reopened.evaluate(() => window.clarity.call('auth.status'))).google,
        true,
      );
      await application.close();
      application = undefined;
      await writeFile(join(root, '.clarity', 'credentials.bin'), 'unreadable fixture');
      const codex = join(root, 'codex-fixture');
      await mkdir(codex);
      await writeFile(
        join(codex, 'auth.json'),
        JSON.stringify({ tokens: { access_token: 'fixture-never-sent' } }),
      );
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root, CODEX_HOME: codex },
      });
      const recovered = await application.firstWindow();
      await recovered.waitForFunction(() => !!window.clarity);
      assert.match(
        (await recovered.evaluate(() => window.clarity.call('auth.status'))).credentialWarning,
        /cannot be decrypted/,
      );
      await recovered.evaluate(() => window.clarity.call('auth.existingCodex'));
      const backups = (await readdir(join(root, '.clarity'))).filter((name) =>
        name.startsWith('credentials-recovery-'),
      );
      assert.equal(backups.length, 1);
      assert.equal(
        await readFile(join(root, '.clarity', backups[0]), 'utf8'),
        'unreadable fixture',
      );
    } finally {
      await application?.close();
    }
  },
);

test(
  'Spotify login survives expiry and restart; renewal preserves and rotates refresh tokens',
  { timeout: 60000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-spotify-renew-'));
    let application;
    try {
      for (const phase of [0, 1]) {
        application = await electron.launch({
          executablePath: require('electron'),
          args: [join(cache, 'output/main.mjs')],
          env: { ...process.env, CLARITY_TEST_ROOT: root },
        });
        const page = await application.firstWindow();
        await page.waitForFunction(() => !!window.clarity);
        await application.evaluate(({ shell }, phase) => {
          const originalFetch = globalThis.fetch;
          globalThis.renewal = {
            refreshes: 0,
            requests: 0,
            mode: 'normal',
            refreshToken: '',
          };
          shell.openExternal = async (address) => {
            const url = new URL(address),
              redirect = new URL(url.searchParams.get('redirect_uri'));
            redirect.search = new URLSearchParams({
              state: url.searchParams.get('state'),
              code: 'fixture',
            });
            await originalFetch(redirect);
          };
          globalThis.fetch = async (address, options = {}) => {
            const url = String(address),
              state = globalThis.renewal;
            const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
            if (url === 'https://accounts.spotify.com/api/token') {
              const body = new URLSearchParams(options.body);
              if (body.get('grant_type') !== 'refresh_token')
                return json({
                  access_token: 'expired',
                  refresh_token: 'refresh-1',
                  expires_in: 0,
                });
              state.refreshes++;
              state.refreshToken = body.get('refresh_token');
              await new Promise((resolve) => setTimeout(resolve, 20));
              if (state.mode === 'outage') return json({ error: 'temporarily_unavailable' }, 503);
              if (state.mode === 'revoked') return json({ error: 'invalid_grant' }, 400);
              return json({
                access_token: `access-${phase + 1}`,
                expires_in: 3600,
                ...(phase ? { refresh_token: 'refresh-2' } : {}),
              });
            }
            if (url.startsWith('https://api.spotify.com/')) {
              state.requests++;
              if (
                state.mode !== 'normal' ||
                options.headers.Authorization !== `Bearer access-${phase + 1}`
              )
                return json({ error: { message: 'Expired access token' } }, 401);
              return json({ tracks: { items: [] } });
            }
            return originalFetch(address, options);
          };
        }, phase);
        if (!phase) {
          await page.evaluate(() =>
            window.clarity.call('settings.save', {
              enabled: ['chat', 'music'],
            }),
          );
          await page.evaluate(() =>
            window.clarity.call('auth.oauth', {
              provider: 'spotify',
              clientId: 'fixture',
            }),
          );
        }
        assert.equal((await page.evaluate(() => window.clarity.call('auth.status'))).spotify, true);
        const searches = await page.evaluate(() =>
          Promise.all(
            [1, 2, 3].map((query) =>
              window.clarity.call('module', {
                module: 'music',
                method: 'search',
                args: { query: String(query) },
              }),
            ),
          ),
        );
        assert.ok(searches.every((result) => result.errors.length === 0));
        const state = await application.evaluate(() => globalThis.renewal);
        assert.equal(state.refreshes, 1, 'concurrent expiry/401 failures share one renewal');
        assert.equal(state.refreshToken, 'refresh-1');
        const saved = await application.evaluate(({ safeStorage }, root) => {
          const fs = process.getBuiltinModule('node:fs');
          const value = JSON.parse(
            safeStorage.decryptString(fs.readFileSync(root + '/.clarity/credentials.bin')),
          );
          return value.spotify.refresh_token;
        }, root);
        assert.equal(saved, phase ? 'refresh-2' : 'refresh-1');
        if (phase) {
          for (const mode of ['outage', 'revoked', 'rejected']) {
            await application.evaluate((_, mode) => {
              globalThis.renewal.mode = mode;
            }, mode);
            const before = await application.evaluate(() => ({
              ...globalThis.renewal,
            }));
            const result = await page.evaluate(() =>
              window.clarity.call('module', {
                module: 'music',
                method: 'search',
                args: { query: 'Song' },
              }),
            );
            assert.match(
              result.errors[0],
              mode === 'outage'
                ? /503.*sign-in is still saved/
                : mode === 'revoked'
                  ? /saved sign-in was rejected.*Reconnect/
                  : /Spotify request failed \(401\)/,
            );
            const after = await application.evaluate(() => ({
              ...globalThis.renewal,
            }));
            assert.equal(after.refreshes - before.refreshes, 1);
            assert.equal(after.requests - before.requests, mode === 'rejected' ? 2 : 1);
            assert.equal(after.refreshToken, 'refresh-2');
            assert.equal(
              (await page.evaluate(() => window.clarity.call('auth.status'))).spotify,
              true,
            );
          }
        }
        const encrypted = await readFile(join(root, '.clarity', 'credentials.bin'));
        assert.ok(!encrypted.includes(Buffer.from('refresh-')));
        await application.close();
        application = undefined;
      }
    } finally {
      await application?.close();
    }
  },
);

test(
  'Spotify search/playlist compatibility and playback failure presentation',
  { timeout: 60000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-spotify-test-'));
    let application;
    try {
      application = await electron.launch({
        executablePath: process.env.CLARITY_CONNECTOR_EXECUTABLE || require('electron'),
        args: [process.env.CLARITY_CONNECTOR_MAIN || join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      await application.evaluate(({ shell }) => {
        const originalFetch = globalThis.fetch;
        globalThis.spotifyRequests = [];
        shell.openExternal = async (address) => {
          const url = new URL(address);
          const redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({
            state: url.searchParams.get('state'),
            code: 'fixture-code',
          });
          await originalFetch(redirect);
        };
        const song = {
          id: 'song-one',
          name: 'Michael fixture song',
          type: 'track',
          track: true,
          episode: false,
          duration_ms: 225000,
          artists: [{ name: 'Michael fixture artist' }],
          uri: 'spotify:track:song-one',
          album: {
            id: 'album-one',
            name: 'Fixture album',
            images: [
              {
                url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%2388aab8"/%3E%3C/svg%3E',
              },
            ],
          },
        };
        globalThis.fetch = async (address, options = {}) => {
          const url = new URL(String(address));
          const json = (value, status = 200) =>
            new Response(JSON.stringify(value), {
              status,
              headers: { 'content-type': 'application/json' },
            });
          if (url.href === 'https://accounts.spotify.com/api/token')
            return json({ access_token: 'fixture-spotify', expires_in: 3600 });
          if (url.origin !== 'https://api.spotify.com') return originalFetch(address, options);
          globalThis.spotifyRequests.push(url.pathname + url.search);
          if (options.headers.Authorization !== 'Bearer fixture-spotify')
            throw new Error('Missing fixture authorization');
          if (url.pathname === '/v1/search') {
            const query = url.searchParams.get('q');
            if (Number(url.searchParams.get('limit')) > 10)
              return json({ error: { message: 'Invalid limit' } }, 400);
            if (query === 'rejected')
              return json({ error: { message: 'Search temporarily unavailable' } }, 400);
            if (query === 'gateway') return new Response('Bad gateway', { status: 502 });
            return json({
              tracks: { items: [{ ...song, track: undefined }, null] },
              artists: {
                items: [{ id: 'artist-one', name: 'Michael fixture artist' }],
              },
              albums: { items: [{ id: 'album-one', name: 'Fixture album' }] },
              playlists: {
                items: [null, { id: 'playlist-one', name: 'Fixture playlist' }],
              },
            });
          }
          if (url.pathname === '/v1/playlists/playlist-one')
            return json({
              id: 'playlist-one',
              type: 'playlist',
              name: 'Fixture playlist',
              images: song.album.images,
            });
          if (
            url.pathname === '/v1/playlists/playlist-one/items' &&
            url.searchParams.get('offset') === '50'
          )
            return json({
              items: [
                {
                  track: {
                    ...song,
                    id: 'song-two',
                    name: 'Second fixture song',
                  },
                },
              ],
              next: null,
            });
          if (url.pathname === '/v1/playlists/playlist-one/items')
            return json({
              items: [
                { item: song },
                { item: null },
                null,
                { item: { id: 'episode', name: 'Not music', type: 'episode' } },
                { item: { ...song, id: 'local-file', is_local: true } },
                { is_local: true, item: { ...song, id: 'local-wrapper' } },
                { item: { id: 'unavailable', type: 'track', name: '' } },
              ],
              next: 'https://api.spotify.com/v1/playlists/playlist-one/items?limit=50&offset=50',
            });
          if (url.pathname === '/v1/me/tracks')
            return json({
              items: [{ track: song }, { track: null }],
              next: null,
            });
          if (url.pathname === '/v1/albums/album-one/tracks')
            return json({ items: [song], next: null });
          if (url.pathname === '/v1/albums/album-one')
            return json({
              id: 'album-one',
              name: 'Fixture album',
              images: song.album.images,
              artists: song.artists,
            });
          return json({ error: { message: 'Unsupported fixture endpoint' } }, 404);
        };
      });
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki', 'music'],
        }),
      );
      await page.evaluate(() =>
        window.clarity.call('auth.oauth', {
          provider: 'spotify',
          clientId: 'fixture-client',
        }),
      );
      await page.reload();
      await page.getByRole('button', { name: 'Music', exact: true }).click();
      const search = page.getByRole('searchbox', { name: 'Search music' });
      await search.fill('michael');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('button', { name: /Michael fixture song/ }).waitFor();
      await page.getByRole('button', { name: /Fixture playlist/ }).click();
      await page.getByRole('button', { name: 'Michael fixture song', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Second fixture song', exact: true }).waitFor();
      assert.equal(await page.locator('.music-table tbody tr').count(), 2);
      assert.match(
        await page.locator('.music-table tbody tr').first().innerText(),
        /Michael fixture artist/,
      );
      assert.match(await page.locator('.music-table tbody tr').first().innerText(), /3:45/);
      await page.getByRole('heading', { name: 'Fixture playlist', exact: true }).waitFor();
      assert.equal(await page.locator('.collection-heading img').count(), 1);
      assert.equal(await page.locator('.music-table tbody img').count(), 2);
      const playlistRequests = await application.evaluate(() => globalThis.spotifyRequests.length);
      await page.getByRole('button', { name: 'Back to music list', exact: true }).click();
      await page.getByRole('button', { name: /Fixture playlist/ }).click();
      await page.getByRole('button', { name: 'Second fixture song', exact: true }).waitFor();
      assert.equal(
        await application.evaluate(() => globalThis.spotifyRequests.length),
        playlistRequests,
      );
      if (process.env.CLARITY_PLAYLIST_EVIDENCE) {
        await mkdir(process.env.CLARITY_PLAYLIST_EVIDENCE, { recursive: true });
        await page.screenshot({
          path: join(process.env.CLARITY_PLAYLIST_EVIDENCE, 'playlist-details.png'),
        });
        await writeFile(
          join(process.env.CLARITY_PLAYLIST_EVIDENCE, 'playlist-observations.json'),
          JSON.stringify(
            {
              title: await page.locator('.collection-heading h2').innerText(),
              rows: await page.locator('.music-table tbody tr').allTextContents(),
              artworkCount: await page.locator('.music-table tbody img').count(),
              requestsBeforeAndAfterRevisit: playlistRequests,
              requests: await application.evaluate(() => globalThis.spotifyRequests),
            },
            null,
            2,
          ),
        );
      }
      await page.getByRole('button', { name: 'Michael fixture song', exact: true }).click();
      await page.locator('.player-error').waitFor();
      assert.match(await page.locator('.player-error').textContent(), /Connect Spotify playback/);
      assert.equal(
        await page.locator('.toast').count(),
        0,
        'Playback errors belong in the player once',
      );
      await application.evaluate(({ ipcMain }) => {
        const original = ipcMain._invokeHandlers.get('clarity:call');
        ipcMain.removeHandler('clarity:call');
        ipcMain.handle('clarity:call', async (event, method, args) => {
          if (method === 'module' && args.module === 'music' && args.method === 'play') {
            const message = 'Playback reconnect fixture';
            setTimeout(
              () =>
                event.sender.send('clarity:event', {
                  type: 'playback',
                  data: { action: 'error', source: 'spotify', message },
                }),
              100,
            );
            return { ok: false, error: message };
          }
          return original(event, method, args);
        });
      });
      await page.evaluate(() => {
        window.playbackFailureEvent = false;
        const unsubscribe = window.clarity.subscribe((event) => {
          if (event.type === 'playback' && event.data.message === 'Playback reconnect fixture') {
            window.playbackFailureEvent = true;
            unsubscribe();
          }
        });
      });
      await page.getByRole('button', { name: 'Michael fixture song', exact: true }).click();
      await page.waitForFunction(() => window.playbackFailureEvent);
      assert.equal(
        await page.locator('.player-error').textContent(),
        'Playback reconnect fixtureConnect playback',
      );
      assert.equal(
        await page.locator('.toast').count(),
        0,
        'Reply-before-event must not duplicate playback errors',
      );
      await application.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'playback',
          data: { action: 'stop' },
        });
      });
      await page.locator('.player').waitFor({ state: 'hidden' });
      await page.evaluate(() => {
        window.playbackFailureEvent = false;
        const unsubscribe = window.clarity.subscribe((event) => {
          if (event.type === 'playback' && event.data.message === 'Playback reconnect fixture') {
            window.playbackFailureEvent = true;
            unsubscribe();
          }
        });
      });
      await page.getByRole('button', { name: 'Michael fixture song', exact: true }).click();
      await page.waitForFunction(() => window.playbackFailureEvent);
      await page.locator('.player-error').waitFor();
      assert.equal(await page.locator('.player-error').textContent(), 'Playback reconnect fixture');
      assert.equal(
        await page.locator('.toast').count(),
        0,
        'Errors before a track loads must remain visible once',
      );
      for (const item of [
        { type: 'playlist', id: 'liked' },
        { type: 'album', id: 'album-one' },
      ]) {
        const result = await page.evaluate(
          (item) =>
            window.clarity.call('module', {
              module: 'music',
              method: 'collection',
              args: { source: 'spotify', ...item },
            }),
          item,
        );
        assert.deepEqual(
          result.items.map((song) => song.id),
          ['song-one'],
        );
        assert.equal(result.items[0].title, 'Michael fixture song');
        assert.equal(result.items[0].artist, 'Michael fixture artist');
        assert.equal(result.items[0].duration, 225);
        assert.ok(result.items[0].cover);
        if (item.id === 'liked') assert.equal(result.item.title, 'Liked Songs');
      }
      for (const [query, message] of [
        ['rejected', 'Spotify request failed (400): Search temporarily unavailable'],
        ['gateway', 'Spotify request failed (502)'],
      ]) {
        await search.fill(query);
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        await page.getByText(message, { exact: true }).waitFor();
      }
      const requests = await application.evaluate(() => globalThis.spotifyRequests);
      assert.ok(requests.includes('/v1/playlists/playlist-one/items?limit=50'));
      assert.ok(!requests.some((path) => path.includes('/playlists/playlist-one/tracks')));
      await application.evaluate(({ BrowserWindow }) => {
        const send = (data) =>
          BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
            type: 'playback',
            data,
          });
        send({
          action: 'play',
          source: 'spotify',
          index: 0,
          queue: [{ id: 'fixture', title: 'Fixture playback', duration: 180 }],
        });
        send({
          action: 'state',
          source: 'spotify',
          playing: true,
          position: 10,
        });
      });
      await page.getByRole('button', { name: 'Pause', exact: true }).waitFor();
      await page.evaluate(() => document.querySelector('audio').dispatchEvent(new Event('pause')));
      assert.equal(
        await page.getByRole('button', { name: 'Pause', exact: true }).isVisible(),
        true,
      );
      await application.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'playback',
          data: {
            action: 'error',
            source: 'spotify',
            message:
              'Spotify audio player stopped unexpectedly (exit 17). Try playing the track again.',
          },
        });
      });
      await page.locator('.player-error').waitFor();
      assert.equal(
        await page.getByRole('slider', { name: 'Playback position' }).isDisabled(),
        true,
      );
      assert.equal(await page.locator('.toast').count(), 0);
      await page.getByRole('button', { name: 'Play', exact: true }).click({ trial: true });
    } finally {
      await application?.close();
    }
  },
);

test(
  'Navidrome connection errors guide retry and preserve the saved account',
  { timeout: 60000 },
  async () => {
    let authenticated = 0;
    let providerFailure = '';
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://fixture');
      const query = url.searchParams;
      const valid =
        query.get('u') === 'reader' &&
        query.get('t') ===
          createHash('md5')
            .update('fixture-secret' + query.get('s'))
            .digest('hex');
      if (valid) authenticated++;
      response.setHeader('content-type', 'application/json');
      if (providerFailure === 'http') response.statusCode = 503;
      response.end(
        JSON.stringify({
          'subsonic-response':
            valid && !providerFailure
              ? { status: 'ok', version: '1.16.1' }
              : {
                  status: 'failed',
                  error: { code: 40, message: 'Wrong username or password' },
                },
        }),
      );
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = `http://127.0.0.1:${server.address().port}`;
    const root = await mkdtemp(join(tmpdir(), 'clarity-navidrome-connection-'));
    const observations = [];
    let application;
    try {
      application = await electron.launch({
        executablePath: process.env.CLARITY_CONNECTOR_EXECUTABLE || require('electron'),
        // This isolated HTTP/UI fixture does not test the user's macOS Keychain.
        args: [
          process.env.CLARITY_CONNECTOR_MAIN || join(cache, 'output/main.mjs'),
          '--use-mock-keychain',
        ],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      await page.locator('.sidebar').waitFor();
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki', 'music'],
        }),
      );
      await application.evaluate((_, address) => {
        const original = globalThis.fetch;
        globalThis.navidromeFailure = '';
        globalThis.fetch = (url, options) => {
          if (String(url).startsWith(address) && globalThis.navidromeFailure)
            return Promise.reject(
              new TypeError('fetch failed', {
                cause: Object.assign(new Error('private transport details: fixture-secret'), {
                  code: globalThis.navidromeFailure,
                }),
              }),
            );
          return original(url, options);
        };
      }, address);
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Navidrome', exact: true })
        .click();
      const section = page.locator('#settings-navidrome');
      await section.getByLabel('Server address', { exact: true }).fill(address);
      await section.getByLabel('Username', { exact: true }).fill('reader');
      await section.getByLabel('Password', { exact: true }).fill('fixture-secret');
      const connect = section.getByRole('button', {
        name: 'Connect Navidrome',
      });
      for (const [code, expected] of [
        ['EHOSTUNREACH', /server is unreachable.*System Settings.*Local Network/],
        ['ECONNREFUSED', /refused the connection.*port is correct/],
        ['ENOTFOUND', /Could not find the Navidrome server/],
        ['ETIMEDOUT', /took too long to respond/],
        ['UNKNOWN', /Couldn’t reach Navidrome/],
      ]) {
        await application.evaluate((_, code) => {
          globalThis.navidromeFailure = code;
        }, code);
        await connect.click();
        await section.locator('.error').waitFor();
        const message = await section.locator('.error').innerText();
        assert.match(message, expected);
        assert.doesNotMatch(message, /fixture-secret|private transport|fetch failed/);
        assert.equal(
          (await page.evaluate(() => window.clarity.call('auth.status'))).navidrome,
          false,
        );
        observations.push({ code, message, connected: false });
      }
      await application.evaluate(() => {
        globalThis.navidromeFailure = '';
      });
      await connect.click();
      await section.getByText('Connected', { exact: true }).waitFor();
      assert.equal(authenticated, 1);
      assert.equal(await section.locator('.error').count(), 0);
      const saved = await page.evaluate(() => window.clarity.call('auth.status'));
      assert.equal(saved.navidrome, true);
      for (const [failure, expected] of [
        ['auth', /Wrong username or password/],
        ['http', /Navidrome request failed \(503\)/],
      ]) {
        providerFailure = failure;
        await section.getByLabel('Username', { exact: true }).fill('replacement');
        await connect.click();
        await section.locator('.error').waitFor();
        const message = await section.locator('.error').innerText();
        assert.match(message, expected);
        const status = await page.evaluate(() => window.clarity.call('auth.status'));
        assert.equal(status.navidrome, true);
        assert.equal(status.navidromeUsername, saved.navidromeUsername);
        observations.push({ failure, message, savedAccountPreserved: true });
      }
      const evidence = process.env.CLARITY_NAVIDROME_EVIDENCE;
      if (evidence) {
        await mkdir(evidence, { recursive: true });
        await application.evaluate(() => {
          globalThis.navidromeFailure = 'EHOSTUNREACH';
        });
        await connect.click();
        await page.waitForFunction(() =>
          document
            .querySelector('#settings-navidrome .error')
            ?.textContent.includes('Local Network'),
        );
        await page.screenshot({
          path: join(evidence, 'connection-guidance.png'),
        });
        await writeFile(
          join(evidence, 'observations.json'),
          JSON.stringify({ authenticated, observations }, null, 2),
        );
      }
    } finally {
      await application?.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);

test(
  'Navidrome HTTP stream plays, seeks through the player bar and ends a single-song queue',
  { timeout: 60000 },
  async () => {
    const sampleRate = 8000,
      samples = sampleRate * 30;
    const wave = Buffer.alloc(44 + samples * 2);
    wave.write('RIFF');
    wave.writeUInt32LE(wave.length - 8, 4);
    wave.write('WAVEfmt ', 8);
    wave.writeUInt32LE(16, 16);
    wave.writeUInt16LE(1, 20);
    wave.writeUInt16LE(1, 22);
    wave.writeUInt32LE(sampleRate, 24);
    wave.writeUInt32LE(sampleRate * 2, 28);
    wave.writeUInt16LE(2, 32);
    wave.writeUInt16LE(16, 34);
    wave.write('data', 36);
    wave.writeUInt32LE(samples * 2, 40);
    const song = {
      id: 'song-1',
      title: 'Silent fixture',
      artist: 'Fixture artist',
      duration: 30,
    };
    const ranges = [];
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://fixture');
      if (url.pathname.endsWith('/stream.view')) {
        response.setHeader('content-type', 'audio/wav');
        response.setHeader('accept-ranges', 'bytes');
        const range = request.headers.range;
        ranges.push(range);
        const match = /^bytes=(\d+)-(\d*)$/.exec(range || '');
        const start = match ? Number(match[1]) : 0;
        const end = match?.[2] ? Number(match[2]) : wave.length - 1;
        if (match) {
          response.statusCode = 206;
          response.setHeader('content-range', `bytes ${start}-${end}/${wave.length}`);
        }
        response.setHeader('content-length', end - start + 1);
        response.end(wave.subarray(start, end + 1));
        return;
      }
      const data = { status: 'ok', version: '1.16.1' };
      if (url.pathname.includes('getAlbumList2'))
        data.albumList2 = {
          album: [{ id: 'album-1', name: 'Fixture album', artist: 'Fixture artist' }],
        };
      if (url.pathname.includes('/getAlbum.view'))
        data.album = { id: 'album-1', name: 'Fixture album', song: [song] };
      if (url.pathname.includes('search3')) data.searchResult3 = { song: [song] };
      if (url.pathname.includes('getPlaylists')) data.playlists = { playlist: [] };
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ 'subsonic-response': data }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const root = await mkdtemp(join(tmpdir(), 'clarity-audio-test-'));
    let application;
    try {
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.evaluate(
        (url) =>
          window.clarity.call('auth.configure', {
            provider: 'navidrome',
            url,
            username: 'reader',
            password: 'fixture',
          }),
        `http://127.0.0.1:${server.address().port}`,
      );
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki', 'music'],
        }),
      );
      await page.getByRole('button', { name: 'Music', exact: true }).click();
      await page.getByRole('button', { name: 'Albums', exact: true }).click();
      await page.getByRole('button', { name: /Fixture album/ }).click();
      await page.getByRole('button', { name: 'Silent fixture', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return audio && !audio.paused && audio.currentTime > 0;
      });
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('audio').paused);
      const seek = page.getByRole('slider', { name: 'Playback position' });
      const slider = await seek.boundingBox();
      await seek.click({
        position: { x: slider.width / 2, y: slider.height / 2 },
      });
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return audio.paused && audio.currentTime >= 14 && audio.currentTime <= 16;
      });
      await seek.press('Home');
      await page.waitForFunction(() => document.querySelector('audio').currentTime === 0);
      await seek.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('audio').currentTime === 1);
      const partial = await application.evaluate(async ({ BrowserWindow }) => {
        const response = await BrowserWindow.getAllWindows()[0].webContents.session.fetch(
          'clarity://stream/song-1',
          {
            headers: { Range: 'bytes=100-199' },
          },
        );
        return {
          status: response.status,
          length: (await response.arrayBuffer()).byteLength,
        };
      });
      assert.deepEqual(partial, { status: 206, length: 100 });
      assert.ok(ranges.includes('bytes=100-199'));
      await page.getByRole('button', { name: 'Play', exact: true }).last().click();
      await page.waitForFunction(() => !document.querySelector('audio').paused);
      await seek.click({
        position: { x: slider.width * 0.65, y: slider.height / 2 },
      });
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !audio.paused && audio.currentTime > 18;
      });
      await page.getByRole('button', { name: 'Next track', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('audio').paused);
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki'],
        }),
      );
      await page.locator('.player').waitFor({ state: 'detached' });
      assert.deepEqual(errors, []);
    } finally {
      await application?.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
