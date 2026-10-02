import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = process.env.CLARITY_MUSIC_EVIDENCE || join(cache, 'music-cache-evidence');
await mkdir(evidence, { recursive: true });

test(
  'Music caches navigation reads, shares pending requests and invalidates changed accounts',
  { timeout: 120000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-music-cache-'));
    let application;
    const observations = [];
    try {
      application = await require('playwright-core')._electron.launch({
        executablePath: process.env.CLARITY_MUSIC_EXECUTABLE || require('electron'),
        args: ['--use-mock-keychain', process.env.CLARITY_MUSIC_MAIN || join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      page.setDefaultTimeout(8000);
      await page.locator('.sidebar').waitFor();
      await application.evaluate(({ shell, ipcMain }) => {
        const originalFetch = globalThis.fetch;
        const originalCall = ipcMain._invokeHandlers.get('clarity:call');
        const fixture = (globalThis.musicFixture = {
          account: 0,
          calls: [],
          requests: [],
          holds: new Set(),
          releases: new Map(),
          failures: new Set(),
          recent: [],
        });
        const song = (name) => ({
          id: 'song',
          type: 'track',
          name,
          duration_ms: 120000,
          artists: [{ name: 'Fixture artist' }],
          album: { name: 'Fixture album' },
        });
        const json = (value, status = 200) =>
          new Response(JSON.stringify(value), {
            status,
            headers: { 'content-type': 'application/json' },
          });
        shell.openExternal = async (address) => {
          const url = new URL(address);
          const redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({
            state: url.searchParams.get('state'),
            code: 'fixture-code',
          });
          await originalFetch(redirect);
        };
        globalThis.fetch = async (address, options) => {
          const url = new URL(String(address));
          if (url.href === 'https://accounts.spotify.com/api/token') {
            fixture.account++;
            return json({
              access_token: `fixture-${fixture.account}`,
              expires_in: 3600,
            });
          }
          if (url.origin === 'https://navidrome.fixture') {
            const method = url.pathname.split('/').at(-1).replace('.view', '');
            const user = url.searchParams.get('u');
            const key = `navidrome:${method}:${user}`;
            fixture.requests.push(key);
            const failed = fixture.failures.delete(key);
            if (fixture.holds.has(key))
              await new Promise((resolve) => fixture.releases.set(key, resolve));
            if (failed) throw new TypeError('fetch failed');
            let data = {};
            if (method === 'getPlaylists')
              data = {
                playlists: {
                  playlist: [{ id: 'nav-list', name: `Nav ${user}` }],
                },
              };
            if (method === 'getAlbumList2')
              data = {
                albumList2: {
                  album: [{ id: 'album', name: `Nav album ${user}` }],
                },
              };
            if (method === 'getAlbum')
              data = {
                album: {
                  id: 'album',
                  name: `Nav album ${user}`,
                  song: [{ id: 'nav-song', title: `Nav song ${user}` }],
                },
              };
            return json({ 'subsonic-response': { status: 'ok', ...data } });
          }
          if (url.origin !== 'https://api.spotify.com') return originalFetch(address, options);
          const query = url.searchParams.get('q');
          const key = query === null ? url.pathname : `search:${query}`;
          fixture.requests.push(key);
          const account = fixture.account;
          const failed = fixture.failures.delete(key);
          if (fixture.holds.has(key))
            await new Promise((resolve) => fixture.releases.set(key, resolve));
          if (failed) return json({ error: { message: 'Fixture temporarily unavailable' } }, 503);
          if (url.pathname === '/v1/me') return json({ id: `account-${account}` });
          if (url.pathname === '/v1/me/playlists')
            return json({
              items: [
                {
                  id: 'playlist',
                  name: `Playlist account ${account}`,
                  owner: { id: `account-${account}` },
                },
              ],
              next: null,
            });
          if (url.pathname === '/v1/me/albums')
            return json({
              items: [{ album: { id: 'album', name: `Album account ${account}` } }],
              next: null,
            });
          if (url.pathname === '/v1/search')
            return json(
              query === 'empty'
                ? {}
                : query === 'categories'
                  ? {
                      tracks: {
                        items: Array.from({ length: 8 }, (_, index) => ({
                          ...song(`Search song ${index + 1}`),
                          id: `song-${index + 1}`,
                        })),
                      },
                      albums: {
                        items: [{ id: 'album', name: 'Search song 1' }],
                      },
                      artists: {
                        items: [{ id: 'artist', name: 'Search artist' }],
                      },
                      playlists: {
                        items: [
                          {
                            id: 'playlist',
                            name: 'Search playlist with a long descriptive title',
                          },
                        ],
                      },
                    }
                  : {
                      tracks: { items: [song(`Song ${query}`)] },
                      albums: {
                        items: [{ id: 'album', name: 'Search album' }],
                      },
                      artists: {
                        items: [{ id: 'artist', name: 'Search artist' }],
                      },
                      playlists: { items: [] },
                    },
            );
          if (url.pathname === '/v1/artists/artist')
            return json({ id: 'artist', name: 'Search artist' });
          if (url.pathname === '/v1/artists/artist/albums')
            return json({ items: [{ id: 'album', name: 'Artist album' }] });
          if (url.pathname === '/v1/albums/album')
            return json({ id: 'album', name: 'Artist album' });
          if (url.pathname === '/v1/albums/album/tracks' || url.pathname === '/v1/me/tracks')
            return json({
              items:
                url.pathname === '/v1/me/tracks'
                  ? [{ track: song('Collection song') }]
                  : [song('Collection song')],
              next: null,
            });
          throw new Error(`Unexpected fixture endpoint: ${url.pathname}`);
        };
        ipcMain.removeHandler('clarity:call');
        ipcMain.handle('clarity:call', async (event, method, args) => {
          if (method === 'module' && args.module === 'music') {
            fixture.calls.push({ method: args.method, args: args.args });
            if (args.method === 'recent') return { ok: true, value: fixture.recent };
          }
          return originalCall(event, method, args);
        });
      });
      await page.evaluate(() =>
        window.clarity.call('settings.save', {
          enabled: ['chat', 'notes', 'todos', 'wiki', 'music'],
        }),
      );
      const connectSpotify = () =>
        page.evaluate(() =>
          window.clarity.call('auth.oauth', {
            provider: 'spotify',
            clientId: 'fixture-client',
          }),
        );
      const connectNavidrome = (username) =>
        page.evaluate(
          (username) =>
            window.clarity.call('auth.configure', {
              provider: 'navidrome',
              url: 'https://navidrome.fixture',
              username,
              password: 'fixture',
            }),
          username,
        );
      await connectSpotify();
      const nav = (name) =>
        page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
      const music = page.locator('.music-view');
      const button = (name) =>
        (['Home', 'Playlists', 'Albums', 'Artists'].includes(name)
          ? music.locator('.music-tabs')
          : music
        ).getByRole('button', { name, exact: true });
      const visible = (name) => music.getByRole('button', { name: new RegExp(name) }).waitFor();
      const search = async (query) => {
        await music.getByRole('searchbox', { name: 'Search music' }).fill(query);
        await button('Search').click();
      };
      const count = (key) =>
        application.evaluate(
          (_, key) => globalThis.musicFixture.requests.filter((request) => request === key).length,
          key,
        );
      const calls = () => application.evaluate(() => globalThis.musicFixture.calls);
      const mark = async (scenario) =>
        observations.push({
          scenario,
          calls: await calls(),
          requests: await application.evaluate(() => globalThis.musicFixture.requests),
        });
      const hold = (key) =>
        application.evaluate((_, key) => globalThis.musicFixture.holds.add(key), key);
      const release = (key) =>
        application.evaluate((_, key) => {
          globalThis.musicFixture.holds.delete(key);
          globalThis.musicFixture.releases.get(key)?.();
        }, key);
      const fail = (key) =>
        application.evaluate((_, key) => globalThis.musicFixture.failures.add(key), key);
      const settled = () =>
        music.getByText('Loading…', { exact: true }).waitFor({ state: 'hidden' });

      await nav('Music');
      await settled();
      await hold('/v1/me/playlists');
      await button('Playlists').click();
      await music.getByText('Loading…', { exact: true }).waitFor();
      await button('Albums').click();
      await visible('Album account 1');
      await button('Playlists').click();
      await music.getByText('Loading…', { exact: true }).waitFor();
      assert.equal(await count('/v1/me/playlists'), 1);
      await release('/v1/me/playlists');
      await visible('Playlist account 1');
      await button('Artists').click();
      await music.getByText('No music in this view.', { exact: true }).waitFor();
      const beforeTabs = await calls();
      for (const tab of ['Home', 'Albums', 'Artists', 'Playlists', 'Albums', 'Playlists']) {
        await button(tab).click();
        assert.equal(await music.getByText('Loading…', { exact: true }).count(), 0);
      }
      assert.deepEqual(await calls(), beforeTabs);
      await button('Show list').click();
      await music.getByLabel('Music source').selectOption('spotify');
      await button('Show grid').click();
      await music.getByLabel('Music source').selectOption('');
      await nav('Todos');
      await nav('Music');
      assert.deepEqual(await calls(), beforeTabs);
      await mark(
        'Tab, empty-list, layout, source-filter and module revisits reuse results; pending reads share one request',
      );

      await search('categories');
      await music
        .getByRole('region', { name: 'Songs', exact: true })
        .getByRole('button', { name: /Search song 1/ })
        .waitFor();
      const categoryNames = ['Songs', 'Artists', 'Albums', 'Playlists'];
      assert.deepEqual(
        await music.locator('.music-search-heading h2').allTextContents(),
        categoryNames,
      );
      const songs = music.getByRole('region', { name: 'Songs', exact: true });
      assert.equal(await songs.locator('.music-card').count(), 6);
      for (const name of categoryNames) {
        const region = music.getByRole('region', { name, exact: true });
        assert.match(
          await region.locator('.music-card-meta').first().innerText(),
          new RegExp(`${name.slice(0, -1)} · Spotify`),
        );
      }
      for (const theme of ['dark', 'light']) {
        await page.evaluate((theme) => window.clarity.call('settings.save', { theme }), theme);
        for (const [width, height] of [
          [1200, 800],
          [850, 600],
        ]) {
          await application.evaluate(
            ({ BrowserWindow }, [width, height]) =>
              BrowserWindow.getAllWindows()[0].setSize(width, height),
            [width, height],
          );
          await music.locator('.search-types').scrollIntoViewIfNeeded();
          const geometry = await music.evaluate((view) => ({
            clientWidth: view.clientWidth,
            scrollWidth: view.scrollWidth,
            groups: [...view.querySelectorAll('.music-search-section')].map((section) => ({
              name: section.getAttribute('aria-label'),
              labels: [...section.querySelectorAll('.music-card-meta')].map(
                (label) => label.textContent,
              ),
            })),
          }));
          assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1);
          observations.push({
            scenario: `Grouped search ${theme} ${width}x${height}`,
            ...geometry,
          });
          await page.screenshot({
            path: join(evidence, `search-${theme}-${width}.png`),
          });
        }
      }
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].setSize(1200, 800),
      );
      await page.evaluate(() => window.clarity.call('settings.save', { theme: 'dark' }));
      await songs.getByRole('button', { name: 'Show all songs' }).focus();
      await page.keyboard.press('Enter');
      await music.getByRole('button', { name: 'Search song 8', exact: true }).waitFor();
      assert.equal(await music.locator('.music-table tbody tr').count(), 8);
      assert.equal(
        await music
          .locator('.search-types')
          .getByRole('button', { name: 'Songs', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      );
      assert.equal(await count('search:categories'), 1);
      await button('Show grid').click();
      assert.equal(await music.locator('.music-card').count(), 8);
      await music
        .locator('.search-types')
        .getByRole('button', { name: 'All', exact: true })
        .click();
      await button('Show list').click();
      assert.equal(await songs.locator('tbody tr').count(), 6);
      assert.match(await songs.locator('tbody tr').first().innerText(), /Song · Fixture artist/);
      await music.getByLabel('Music source').selectOption('spotify');
      assert.deepEqual(
        await music.locator('.music-search-heading h2').allTextContents(),
        categoryNames,
      );
      await music.getByLabel('Music source').selectOption('');
      await button('Show grid').click();
      await music.getByRole('region', { name: 'Albums', exact: true }).getByRole('button').click();
      await visible('Collection song');
      await button('Back to music list').click();
      await songs.getByRole('button', { name: /Search song 1/ }).waitFor();
      assert.deepEqual(
        await music.locator('.music-search-heading h2').allTextContents(),
        categoryNames,
      );
      assert.equal(await count('search:categories'), 1);
      await nav('Todos');
      await nav('Music');
      await music
        .locator('.search-types')
        .getByRole('button', { name: 'Songs', exact: true })
        .click();
      assert.equal(await music.locator('.music-table tbody tr').count(), 8);
      await music
        .locator('.search-types')
        .getByRole('button', { name: 'All', exact: true })
        .click();
      await mark(
        'Search groups, duplicate-title types, bounded previews, keyboard Show all, source/layout filters, nested Back and Songs layout reset',
      );

      await search('first');
      await visible('Song first');
      assert.equal(await music.getByRole('region', { name: 'Playlists', exact: true }).count(), 0);
      for (const tab of ['Songs', 'Albums', 'Artists', 'All'])
        await music
          .locator('.search-types')
          .getByRole('button', { name: tab, exact: true })
          .click();
      await music.getByRole('button', { name: /Search artist/ }).click();
      await music.getByRole('button', { name: /Artist album/ }).click();
      await visible('Collection song');
      await button('Back to music list').click();
      await music.getByRole('heading', { name: 'Search artist' }).waitFor();
      await button('Back to music list').click();
      await visible('Song first');
      await music.getByRole('button', { name: /Search album/ }).click();
      await visible('Collection song');
      await button('Back to music list').click();
      assert.equal(await count('/v1/albums/album/tracks'), 1);
      assert.equal(await count('/v1/artists/artist'), 1);
      assert.equal(await count('search:first'), 1);
      await search('second');
      await visible('Song second');
      await search('first');
      await visible('Song first');
      assert.equal(await count('search:first'), 1);
      await button('Refresh music').click();
      await settled();
      assert.equal(await count('search:first'), 2);
      await search('empty');
      await music.getByText('No results for “empty”.', { exact: true }).waitFor();
      assert.equal(await music.locator('.music-search-section').count(), 0);
      await button('Home').click();
      await search('empty');
      await settled();
      assert.equal(await count('search:empty'), 1);
      await search('');
      await settled();
      assert.equal(await count('search:'), 0);
      await mark(
        'Search keys, type filters, source/type collection keys, nested Back, empty results and explicit refresh',
      );

      await hold('search:slow');
      await search('slow');
      await music.getByText('Loading…', { exact: true }).waitFor();
      await button('Albums').click();
      await search('slow');
      await music.getByText('Loading…', { exact: true }).waitFor();
      assert.equal(await count('search:slow'), 1);
      await search('second');
      await visible('Song second');
      await release('search:slow');
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      assert.equal(await music.getByRole('button', { name: /Song slow/ }).count(), 0);
      await search('slow');
      await visible('Song slow');
      assert.equal(await count('search:slow'), 1);
      await fail('search:retry');
      await search('retry');
      await music.getByRole('alert').waitFor();
      await button('Try again').click();
      await visible('Song retry');
      assert.equal(await music.getByRole('alert').count(), 0);
      assert.equal(await count('search:retry'), 2);
      await fail('/v1/me/tracks');
      await button('Playlists').click();
      await music.getByRole('button', { name: /Liked Songs/ }).click();
      await music.getByRole('alert').waitFor();
      await button('Back to music list').click();
      await music.getByRole('button', { name: /Liked Songs/ }).click();
      await visible('Collection song');
      assert.equal(await count('/v1/me/tracks'), 2);
      await mark(
        'Delayed reads cannot replace a newer view; rejected and partial reads remain retryable',
      );

      await button('Albums').click();
      await visible('Album account 1');
      const beforePlayback = await count('/v1/me/albums');
      await application.evaluate(({ BrowserWindow }) => {
        globalThis.musicFixture.recent = [
          {
            id: 'recent',
            type: 'album',
            source: 'spotify',
            title: 'New recent album',
          },
        ];
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'changed',
          module: 'music',
        });
      });
      await button('Home').click();
      await visible('New recent album');
      await button('Albums').click();
      assert.equal(await count('/v1/me/albums'), beforePlayback);
      await hold('/v1/me/albums');
      await button('Refresh music').click();
      await music.getByText('Loading…', { exact: true }).waitFor();
      await nav('Todos');
      await application.evaluate(() => globalThis.musicFixture.holds.delete('/v1/me/albums'));
      await connectSpotify();
      await nav('Music');
      await visible('Album account 2');
      await release('/v1/me/albums');
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      assert.equal(await music.getByRole('button', { name: /Album account 1/ }).count(), 0);
      await button('Playlists').click();
      await visible('Playlist account 2');
      await mark(
        'Playback invalidates recent history only; replacing a connected account clears visible and hidden cache entries',
      );

      await nav('Todos');
      await connectNavidrome('first');
      await nav('Music');
      await visible('Nav first');
      await nav('Todos');
      await connectNavidrome('second');
      await nav('Music');
      await visible('Nav second');
      assert.equal(await music.getByRole('button', { name: /Nav first/ }).count(), 0);
      await fail('/v1/me/playlists');
      await button('Refresh music').click();
      await music.getByRole('alert').waitFor();
      assert.match(await music.getByRole('alert').innerText(), /Spotify request failed \(503\)/);
      await visible('Nav second');
      await button('Try again').click();
      await visible('Playlist account 2');
      assert.equal(await music.getByRole('alert').count(), 0);

      const navPlaylists = 'navidrome:getPlaylists:second';
      await fail(navPlaylists);
      await button('Refresh music').click();
      const notice = music.getByRole('alert');
      await notice.waitFor();
      assert.match(await notice.innerText(), /Some music couldn’t be loaded/);
      assert.match(await notice.innerText(), /Couldn’t reach Navidrome/);
      assert.doesNotMatch(await notice.innerText(), /fetch failed/);
      await visible('Playlist account 2');
      const card = music.locator('.music-card').first();
      for (const theme of ['dark', 'light']) {
        await page.evaluate((theme) => window.clarity.call('settings.save', { theme }), theme);
        await page.waitForFunction(
          (theme) => document.documentElement.dataset.theme === theme,
          theme,
        );
        for (const [width, height] of [
          [1200, 800],
          [850, 600],
        ]) {
          await application.evaluate(
            ({ BrowserWindow }, size) => {
              BrowserWindow.getAllWindows()[0].setSize(...size);
            },
            [width, height],
          );
          await page.waitForFunction((width) => window.innerWidth === width, width);
          await page.evaluate(async () => {
            await Promise.allSettled(
              document
                .getAnimations()
                .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
                .map((animation) => animation.finished),
            );
          });
          const layout = await notice.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const retry = element.querySelector('button').getBoundingClientRect();
            const card = document.querySelector('.music-card').getBoundingClientRect();
            return {
              notice: bounds.toJSON(),
              retry: retry.toJSON(),
              card: card.toJSON(),
              overflow: element.scrollWidth > element.clientWidth,
              gap: card.top - bounds.bottom,
            };
          });
          assert.ok(layout.gap >= 16, 'Separate the notice and artwork');
          assert.equal(layout.overflow, false, 'Wrap the notice within its width');
          assert.ok(layout.retry.x >= layout.notice.x);
          assert.ok(layout.retry.right <= layout.notice.right);
          assert.ok(layout.retry.bottom <= layout.notice.bottom);
          observations.push({
            scenario: 'Partial Music error layout',
            theme,
            width,
            height,
            ...layout,
          });
          await page.screenshot({
            path: join(evidence, `partial-error-${theme}-${width}.png`),
          });
        }
      }
      const beforeRetry = await card.boundingBox();
      const requestsBeforeRetry = await count(navPlaylists);
      await hold(navPlaylists);
      await fail(navPlaylists);
      await button('Try again').click();
      await button('Retrying…').waitFor();
      assert.equal(await button('Retrying…').isDisabled(), true);
      assert.equal(await button('Refresh music').isDisabled(), true);
      assert.equal(await count(navPlaylists), requestsBeforeRetry + 1);
      await visible('Playlist account 2');
      assert.deepEqual(
        await card.boundingBox(),
        beforeRetry,
        'Keep available cards stable during retry',
      );
      await release(navPlaylists);
      await button('Try again').waitFor();
      await visible('Playlist account 2');
      await button('Try again').click();
      await visible('Nav second');
      assert.equal(await notice.count(), 0);
      await mark(
        'Source-labelled partial errors retain available cards during retry and recover without duplicates',
      );

      await button('Albums').click();
      await music.getByRole('button', { name: /Album account 2/ }).click();
      await visible('Collection song');
      await button('Back to music list').click();
      await music.getByRole('button', { name: /Nav album second/ }).click();
      await visible('Nav song second');
      assert.equal(
        await music.getByRole('button', { name: 'Collection song', exact: true }).count(),
        0,
      );
      await button('Back to music list').click();
      await page.evaluate(() => window.clarity.call('auth.disconnect', { provider: 'spotify' }));
      await visible('Nav album second');
      await settled();
      assert.equal(await music.getByRole('button', { name: /Album account 2/ }).count(), 0);
      await mark(
        'Navidrome configuration invalidates while hidden, partial-provider results retry, equal IDs stay source-specific and disconnect clears old results',
      );
      await page.screenshot({ path: join(evidence, 'cached-music.png') });
      const beforeReload = await count('navidrome:getAlbumList2:second');
      await page.reload();
      await nav('Music');
      await button('Albums').click();
      await visible('Nav album second');
      assert.equal(await count('navidrome:getAlbumList2:second'), beforeReload + 1);
      await mark('Renderer reload starts an empty result cache');
    } finally {
      await writeFile(join(evidence, 'observations.json'), JSON.stringify(observations, null, 2));
      await application?.close();
    }
  },
);
