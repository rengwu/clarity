import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const bundle = join(cache, 'music-pagination-tests.mjs');
await require('esbuild').build({
  stdin: { contents: "export {Music} from './src/main/music';", resolveDir: resolve('.') },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const { Music } = await import(pathToFileURL(bundle));

test('Spotify collection pages continue past 5000 and playback reuses all fetched pages', async () => {
  const requests = [],
    commands = [];
  const total = 5055;
  const music = new Music(
    {
      spotify: async (path) => {
        const offset = Number(new URL(path, 'https://fixture/').searchParams.get('offset'));
        requests.push(offset);
        return {
          total,
          items: Array.from({ length: Math.min(50, total - offset) }, (_, index) => ({
            track:
              offset + index === 1
                ? null
                : {
                    id: `song-${offset + index}`,
                    name: `Song ${offset + index}`,
                    type: 'track',
                    track: true,
                    uri: `spotify:track:song-${offset + index}`,
                  },
          })),
          next:
            offset + 50 < total
              ? `https://api.spotify.com/v1/me/tracks?offset=${offset + 50}&limit=50`
              : null,
        };
      },
    },
    {},
    { put: async () => {} },
    () => {},
    'unused',
    'unused',
  );
  music.native = {
    command: async (name, args) => commands.push({ name, args }),
    close: async () => {},
  };
  const args = { source: 'spotify', type: 'playlist', id: 'liked' };
  const first = await music.invoke('collection', { ...args, offset: 0 });
  assert.equal(first.item.title, 'Liked Songs');
  assert.equal(first.items.length, 49);
  assert.equal(first.nextOffset, 50);
  assert.deepEqual(requests, [0]);
  await Promise.all([
    music.invoke('collection', { ...args, offset: 50 }),
    music.invoke('collection', { ...args, offset: 50 }),
  ]);
  assert.deepEqual(requests, [0, 50]);
  const all = await music.invoke('collection', args);
  assert.equal(all.items.length, 5054);
  assert.equal(all.items.at(-1).id, 'song-5054');
  assert.equal(requests.length, 102);
  const playing = await music.invoke('play', { ...args, index: 5053 });
  assert.equal(playing.playing.id, 'song-5054');
  assert.equal(playing.count, 5054);
  assert.equal(
    commands.find((command) => command.name === 'load').args.uri,
    'spotify:track:song-5054',
  );
  assert.equal(requests.length, 102, 'Playback must reuse the loaded collection');
  await assert.rejects(music.invoke('collection', { ...args, offset: -1 }), /offset/);
  music.clearCollections();
  await music.invoke('collection', { ...args, offset: 0 });
  assert.equal(requests.filter((offset) => offset === 0).length, 2);
  await music.close();
});

test('Spotify rejects non-advancing pages and discards an account change during a full read', async () => {
  let malformed = true,
    release;
  const music = new Music(
    {
      spotify: async (path) => {
        const offset = Number(new URL(path, 'https://fixture/').searchParams.get('offset'));
        if (offset === 50)
          await new Promise((resolve) => {
            release = resolve;
          });
        return {
          items: [],
          next:
            offset === 50
              ? null
              : `https://api.spotify.com/v1/me/tracks?offset=${malformed ? 0 : 50}`,
        };
      },
    },
    {},
    {},
    () => {},
    'unused',
    'unused',
  );
  const args = { source: 'spotify', type: 'playlist', id: 'liked' };
  await assert.rejects(music.invoke('collection', { ...args, offset: 0 }), /invalid next page/);
  malformed = false;
  const reading = music.invoke('collection', args);
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  music.clearCollections();
  const rejected = assert.rejects(reading, /collection changed/);
  release();
  await rejected;
  await music.close();
});

test(
  'native Music loads the first page, scrolls beyond 5000, retries a page and reuses results',
  { timeout: 240000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-music-pages-'));
    const evidence =
      process.env.CLARITY_PAGINATION_EVIDENCE || join(cache, 'music-pagination-evidence');
    await mkdir(evidence, { recursive: true });
    const observations = [];
    let application;
    try {
      application = await require('playwright-core')._electron.launch({
        executablePath: process.env.CLARITY_PAGINATION_EXECUTABLE || require('electron'),
        args: [
          ...(process.env.CLARITY_PAGINATION_EXECUTABLE ? [] : [join(cache, 'output/main.mjs')]),
          '--use-mock-keychain',
        ],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      page.setDefaultTimeout(12000);
      await page.locator('.sidebar').waitFor();
      await application.evaluate(({ shell }) => {
        const originalFetch = globalThis.fetch;
        const fixture = (globalThis.pagesFixture = {
          account: 0,
          requests: [],
          holds: new Set(['0']),
          releases: new Map(),
          failures: new Set(),
        });
        const json = (value, status = 200) =>
          new Response(JSON.stringify(value), {
            status,
            headers: { 'content-type': 'application/json' },
          });
        shell.openExternal = async (address) => {
          const url = new URL(address),
            redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({
            state: url.searchParams.get('state'),
            code: 'fixture',
          });
          await originalFetch(redirect);
        };
        globalThis.fetch = async (address, options) => {
          const url = new URL(String(address));
          if (url.href === 'https://accounts.spotify.com/api/token')
            return json({ access_token: `fixture-${++fixture.account}`, expires_in: 3600 });
          if (url.origin !== 'https://api.spotify.com') return originalFetch(address, options);
          if (url.pathname === '/v1/me') return json({ id: 'fixture' });
          if (url.pathname === '/v1/me/playlists') return json({ items: [], next: null });
          if (url.pathname === '/v1/me/tracks') {
            const offset = Number(url.searchParams.get('offset'));
            const account = fixture.account,
              total = 5055;
            fixture.requests.push({ offset, account });
            const failed = fixture.failures.delete(String(offset));
            if (fixture.holds.has(String(offset)))
              await new Promise((resolve) => fixture.releases.set(String(offset), resolve));
            if (failed) return json({ error: { message: 'Temporary page failure' } }, 503);
            return json({
              total,
              items: Array.from({ length: Math.min(50, total - offset) }, (_, index) => ({
                track: {
                  id: `${account}-${offset + index}`,
                  name: `Account ${account} song ${offset + index}`,
                  type: 'track',
                  track: true,
                  duration_ms: 180000,
                  artists: [{ name: 'Fixture artist' }],
                },
              })),
              next:
                offset + 50 < total
                  ? `https://api.spotify.com/v1/me/tracks?offset=${offset + 50}&limit=50`
                  : null,
            });
          }
          throw new Error(`Unexpected fixture endpoint: ${url.pathname}`);
        };
      });
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'todos', 'music'],
          reducedMotion: true,
          theme: 'dark',
        }),
      );
      const connect = () =>
        page.evaluate(() =>
          window.clarity.call('auth.oauth', { provider: 'spotify', clientId: 'fixture' }),
        );
      await connect();
      const nav = (name) =>
        page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
      const music = page.locator('.music-view');
      const rows = music.locator('.music-table tbody tr');
      const requests = () => application.evaluate(() => globalThis.pagesFixture.requests);
      const hold = (offset) =>
        application.evaluate(
          (_, offset) => globalThis.pagesFixture.holds.add(String(offset)),
          offset,
        );
      const release = (offset) =>
        application.evaluate((_, offset) => {
          globalThis.pagesFixture.holds.delete(String(offset));
          globalThis.pagesFixture.releases.get(String(offset))?.();
        }, offset);
      const waitRows = (count) =>
        page.waitForFunction(
          (count) => document.querySelectorAll('.music-table tbody tr').length === count,
          count,
        );
      const bottom = () =>
        music.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
      await nav('Music');
      await music.locator('.music-tabs').getByRole('button', { name: 'Playlists' }).click();
      await music.getByRole('button', { name: /Liked Songs/ }).click();
      await music.getByRole('heading', { name: 'Liked Songs' }).waitFor();
      await music.getByText('Loading…', { exact: true }).waitFor();
      await release(0);
      await waitRows(50);
      assert.deepEqual(await requests(), [{ offset: 0, account: 1 }]);
      observations.push({
        scenario: 'First page appears without requesting the remainder',
        requests: await requests(),
        rows: await rows.count(),
      });
      await page.screenshot({ path: join(evidence, 'first-page.png') });
      console.log('First page displayed with one provider request.');

      await hold(50);
      await bottom();
      await music.getByText(/Loading more songs/).waitFor();
      assert.equal(await rows.count(), 50);
      assert.equal(
        await music.getByRole('button', { name: 'Load more', exact: true }).isDisabled(),
        true,
      );
      await nav('Todos');
      await nav('Music');
      assert.equal((await requests()).filter((request) => request.offset === 50).length, 1);
      await release(50);
      await waitRows(100);
      await application.evaluate(() => globalThis.pagesFixture.failures.add('100'));
      await bottom();
      await music.getByRole('alert').waitFor();
      assert.match(await music.getByRole('alert').innerText(), /503.*Temporary page failure/);
      assert.equal(await rows.count(), 100);
      await music.getByRole('button', { name: 'Try again', exact: true }).click();
      await waitRows(150);
      assert.equal(await music.getByRole('alert').count(), 0);
      assert.equal((await requests()).filter((request) => request.offset === 0).length, 1);
      assert.equal((await requests()).filter((request) => request.offset === 100).length, 2);
      observations.push({
        scenario: 'Pending navigation shares a read; failed continuation retries only its page',
        requests: await requests(),
        rows: await rows.count(),
      });

      const started = Date.now();
      for (let count = 150; count < 5055; ) {
        await bottom();
        count = Math.min(count + 50, 5055);
        await waitRows(count);
      }
      await bottom();
      await music.getByRole('button', { name: 'Account 1 song 5054', exact: true }).waitFor();
      assert.equal(await music.getByRole('button', { name: 'Load more', exact: true }).count(), 0);
      assert.equal(await music.getByText('5,055 songs', { exact: true }).count(), 1);
      const completed = await requests();
      assert.equal(completed.length, 103);
      assert.equal(new Set(await rows.locator('.song-title').allTextContents()).size, 5055);
      observations.push({
        scenario: 'Real scrolling continues beyond the old 100-page limit to the last song',
        rows: await rows.count(),
        last: await rows.last().innerText(),
        requests: completed,
        scrollingMs: Date.now() - started,
      });
      await page.screenshot({ path: join(evidence, 'past-5000.png') });
      console.log('Scrolled through 5,055 songs and reached the final page.');
      await music.getByRole('button', { name: 'Account 1 song 5054', exact: true }).click();
      await page.locator('.player-error').waitFor();
      assert.match(await page.locator('.player-error').innerText(), /Connect Spotify playback/);
      assert.deepEqual(await requests(), completed, 'Playback must not refetch loaded pages');
      await music.getByRole('button', { name: 'Back to music list', exact: true }).click();
      await music.getByRole('button', { name: /Liked Songs/ }).click();
      await waitRows(5055);
      assert.deepEqual(await requests(), completed);
      observations.push({
        scenario: 'Playback and reopening reuse all pages',
        requests: await requests(),
      });

      await music.getByRole('button', { name: 'Refresh music', exact: true }).click();
      await waitRows(50);
      assert.equal((await requests()).filter((request) => request.offset === 0).length, 2);
      await hold(50);
      await bottom();
      await music.getByText(/Loading more songs/).waitFor();
      await nav('Todos');
      await connect();
      await nav('Music');
      await music.getByRole('button', { name: 'Account 2 song 0', exact: true }).waitFor();
      await release(50);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      assert.equal(await music.getByRole('button', { name: /Account 1 song/ }).count(), 0);
      observations.push({
        scenario: 'Refresh resets pages; account replacement discards an old pending page',
        requests: await requests(),
        rows: await rows.count(),
      });
    } finally {
      await writeFile(join(evidence, 'observations.json'), JSON.stringify(observations, null, 2));
      await application?.close();
    }
  },
);
