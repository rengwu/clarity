import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';

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
        globalThis.fixture = { refreshes: 0, wrongState: 0, pkce: false, methods: [], scopes: [] };
        shell.openExternal = async (address) => {
          const url = new URL(address);
          globalThis.fixture.pkce =
            url.searchParams.get('code_challenge_method') === 'S256' &&
            url.searchParams.get('code_challenge').length > 30;
          globalThis.fixture.scopes.push(url.searchParams.get('scope'));
          const redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({ state: 'wrong-state', code: 'fixture-code' });
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
                body: { data: Buffer.from('Read-only message body.').toString('base64url') },
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
        window.clarity.call('auth.oauth', { provider: 'google', clientId: 'fixture-client' }),
      );
      assert.equal(status.google, true);
      const inbox = await page.evaluate(() =>
        window.clarity.call('module', { module: 'mail', method: 'list' }),
      );
      assert.equal(inbox.messages[0].subject, 'Fixture mail');
      const message = await page.evaluate(() =>
        window.clarity.call('module', { module: 'mail', method: 'read', args: { id: 'mail-one' } }),
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
        window.clarity.call('auth.oauth', { provider: 'spotify', clientId: 'fixture-spotify' }),
      );
      await page.evaluate(() => window.clarity.call('auth.disconnect', { provider: 'spotify' }));
      assert.equal((await page.evaluate(() => window.clarity.call('auth.status'))).spotify, false);
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
  'Navidrome HTTP stream plays inside Clarity and ends a single-song queue',
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
    const song = { id: 'song-1', title: 'Silent fixture', artist: 'Fixture artist', duration: 30 };
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://fixture');
      if (url.pathname.endsWith('/stream.view')) {
        response.setHeader('content-type', 'audio/wav');
        response.setHeader('content-length', wave.length);
        response.end(wave);
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
      await page.getByRole('button', { name: 'Play', exact: true }).last().click();
      await page.waitForFunction(() => !document.querySelector('audio').paused);
      await page.getByRole('button', { name: 'Next track', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('audio').paused);
      await page.evaluate(() =>
        window.clarity.call('settings.save', { enabled: ['chat', 'notes', 'todos', 'wiki'] }),
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
