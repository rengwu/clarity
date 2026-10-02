import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const bundle = join(cache, 'music-recent-tests.mjs');
await require('esbuild').build({
  stdin: {
    contents: "export {Music} from './src/main/music'; export {Store} from './src/main/store';",
    resolveDir: resolve('.'),
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const { Music, Store } = await import(pathToFileURL(bundle));

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'clarity-recent-'));
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  const requests = [],
    commands = [],
    failures = new Set(),
    connected = new Set(['spotify', 'navidrome']);
  const api = {
    spotify: async (path) => {
      requests.push(path);
      const [kind, id, contents] = path.split('?')[0].split('/');
      if (failures.has(id)) throw new Error('Fixture unavailable');
      if (kind === 'me' || contents === 'tracks' || contents === 'items')
        return {
          items: [
            {
              id: 'song',
              name: 'Fixture song',
              type: 'track',
              uri: 'spotify:track:song',
            },
          ],
          next: null,
        };
      if (contents === 'albums') return { items: [{ id: 'artist-album', name: 'Artist album' }] };
      return {
        id,
        name: `Spotify ${kind} ${id}`,
        type: kind.slice(0, -1),
        images: [{ url: 'https://fixture/cover.png' }],
        artists: [{ name: 'Fixture artist' }],
      };
    },
    navidrome: async (method, { id }) => {
      requests.push(`${method}:${id}`);
      if (failures.has(id)) throw new Error('Fixture unavailable');
      const type = method.slice(3).toLowerCase();
      return {
        [type]: {
          id,
          name: `Navidrome ${type} ${id}`,
          artist: 'Fixture artist',
          coverArt: 'cover',
          song:
            type === 'artist'
              ? undefined
              : [
                  { id: 'song', title: 'Fixture song' },
                  { id: 'second', title: 'Second song' },
                ],
          album: [{ id: 'artist-album', name: 'Artist album' }],
        },
      };
    },
  };
  const music = new Music(
    api,
    { secrets: { get: (source) => connected.has(source) } },
    store,
    () => {},
    'unused',
    root,
  );
  music.native = {
    close: async () => {},
    command: async (name, args) => commands.push({ name, args }),
  };
  return {
    root,
    store,
    music,
    api,
    requests,
    commands,
    failures,
    connected,
    close: async () => {
      await music.close();
      await store.close();
    },
  };
}

test('recent playback preserves collection metadata and provider IDs through real storage and restart', async () => {
  const f = await fixture();
  try {
    await f.music.invoke('collection', {
      source: 'spotify',
      type: 'album',
      id: 'shared-id',
    });
    assert.equal((await f.store.list('music-recent')).length, 0, 'Browsing is not playing');
    for (const source of ['spotify', 'navidrome']) {
      for (const type of ['album', 'playlist', 'artist']) {
        await f.music.invoke('play', { source, type, id: 'shared-id' });
        const record = await f.store.get('music-recent', `${source}-${type}-shared-id`);
        assert.equal(record.itemId, 'shared-id');
        assert.ok(
          record.title.includes(type),
          'Artist history must describe the artist, not its first album',
        );
        assert.ok(record.cover);
        assert.equal(record.index, undefined);
        assert.ok(record.playedAt > 0);
      }
    }
    await f.music.invoke('play', {
      source: 'spotify',
      type: 'playlist',
      id: 'liked',
    });
    assert.equal(
      (await f.store.get('music-recent', 'spotify-playlist-liked')).title,
      'Liked Songs',
    );
    await f.music.invoke('play', {
      source: 'navidrome',
      type: 'album',
      id: 'shared-id',
      index: 1,
    });
    const before = (await f.music.invoke('recent', {})).items;
    assert.equal(before.length, 7);
    assert.equal(before[0].source, 'navidrome');
    assert.equal(before[0].id, 'shared-id');
    assert.equal(before[0].index, undefined);
    assert.equal(
      (await f.music.invoke('play', before[0])).playing.id,
      'song',
      'Replaying starts at the beginning',
    );
    await f.music.invoke('play', {
      source: 'spotify',
      type: 'song',
      id: 'single',
      title: 'Single',
    });
    assert.equal((await f.store.list('music-recent')).length, 7);
    f.music.native.command = async () => {
      throw new Error('Playback failed');
    };
    await assert.rejects(
      f.music.invoke('play', {
        source: 'spotify',
        type: 'album',
        id: 'failed',
      }),
      /Playback failed/,
    );
    assert.equal(await f.store.get('music-recent', 'spotify-album-failed'), null);
    await f.store.close();
    await f.store.start();
    f.requests.length = 0;
    const reopened = await f.music.invoke('recent', {});
    assert.equal(reopened.items.length, 7);
    assert.deepEqual(reopened.errors, []);
    assert.deepEqual(f.requests, [], 'Complete recent records need no provider reads');
  } finally {
    await f.close();
  }
});

test('legacy recents repair IDs and metadata without changing play order; failures retain history for retry', async () => {
  const f = await fixture();
  try {
    const seeds = [
      { source: 'spotify', type: 'album', id: 'hyphen-id', playedAt: 10 },
      {
        source: 'navidrome',
        type: 'playlist',
        id: 'hyphen-id',
        playedAt: 20,
        index: 1,
      },
      { source: 'spotify', type: 'artist', id: 'artist', playedAt: 30 },
      { source: 'spotify', type: 'playlist', id: 'liked', playedAt: 40 },
      {
        source: 'spotify',
        type: 'album',
        id: 'complete',
        title: 'Already complete',
        playedAt: 50,
      },
      { source: 'navidrome', type: 'album', id: 'offline', playedAt: 60 },
    ];
    for (const seed of seeds)
      await f.store.put('music-recent', `${seed.source}-${seed.type}-${seed.id}`, seed);
    f.failures.add('offline');
    const first = await f.music.invoke('recent', {});
    assert.deepEqual(
      first.items.map((item) => item.id),
      [...seeds].reverse().map((item) => item.id),
    );
    assert.ok(first.items.every((item) => item.title.trim()));
    assert.equal(first.items[0].title, 'Unavailable album');
    assert.equal(first.items[4].index, undefined);
    assert.equal(first.errors.length, 1);
    assert.match(first.errors[0], /Navidrome/);
    assert.ok(
      !f.requests.some((path) => /items|tracks|\/albums|complete|liked/.test(path)),
      'Repair reads metadata without fetching Spotify track pages',
    );
    const repaired = await f.store.get('music-recent', 'spotify-album-hyphen-id');
    assert.equal(repaired.itemId, 'hyphen-id');
    assert.equal(repaired.playedAt, 10);
    assert.equal(repaired.revision, 2);
    assert.equal((await f.store.get('music-recent', 'navidrome-album-offline')).revision, 1);
    f.failures.clear();
    f.connected.delete('navidrome');
    f.requests.length = 0;
    assert.equal((await f.music.invoke('recent', {})).errors.length, 1);
    assert.deepEqual(f.requests, [], 'Disconnected providers are not called');
    f.connected.add('navidrome');
    const recovered = await f.music.invoke('recent', {});
    assert.deepEqual(recovered.errors, []);
    assert.equal(recovered.items[0].title, 'Navidrome album offline');
    assert.deepEqual(
      recovered.items.map((item) => item.id),
      first.items.map((item) => item.id),
    );
    await f.store.close();
    await f.store.start();
    f.requests.length = 0;
    assert.deepEqual((await f.music.invoke('recent', {})).items, recovered.items);
    assert.deepEqual(f.requests, []);
  } finally {
    await f.close();
  }
});

test('late history repairs preserve a newer play and cannot persist an old-account response', async () => {
  const f = await fixture();
  try {
    const key = 'spotify-album-late';
    const seed = { source: 'spotify', type: 'album', id: 'late' };
    let release, entered;
    const hold = () =>
      new Promise((resolve) => {
        entered = resolve;
        f.api.spotify = async () => {
          entered();
          return new Promise((done) => {
            release = done;
          });
        };
      });
    await f.store.put('music-recent', key, seed);
    const legacyTime = (await f.store.get('music-recent', key)).updatedAt;
    let started = hold();
    let pending = f.music.invoke('recent', {});
    await started;
    const newer = await f.store.put('music-recent', key, {
      ...seed,
      itemId: 'late',
      title: 'Newer play',
      playedAt: legacyTime + 10,
    });
    release({ id: 'late', name: 'Old repair' });
    await pending;
    assert.deepEqual(await f.store.get('music-recent', key), newer);
    await f.store.put('music-recent', key, seed);
    started = hold();
    pending = f.music.invoke('recent', {});
    await started;
    f.music.clearCollections();
    release({ id: 'late', name: 'Old account' });
    await assert.rejects(pending, /connection changed/);
    assert.equal((await f.store.get('music-recent', key)).title, undefined);
    for (let i = 0; i < 35; i++)
      await f.store.put('music-recent', `spotify-album-${i}`, {
        ...seed,
        itemId: String(i),
        title: `Album ${i}`,
        playedAt: Date.now() + i,
      });
    const recent = await f.music.invoke('recent', {});
    assert.equal(recent.items.length, 30);
    assert.equal(recent.items[0].id, '34');
    assert.equal(recent.items.at(-1).id, '5');
  } finally {
    await f.close();
  }
});

test(
  'native Home repairs old cards, retries missing metadata and records collection-row playback',
  { timeout: 90000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-recent-ui-'));
    const evidence = process.env.CLARITY_RECENT_EVIDENCE || join(cache, 'music-recent-evidence');
    await mkdir(evidence, { recursive: true });
    const store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    for (const [source, type, id] of [
      ['spotify', 'album', 'shared-id'],
      ['navidrome', 'album', 'shared-id'],
      ['spotify', 'artist', 'artist'],
      ['navidrome', 'playlist', 'list'],
      ['spotify', 'album', 'unavailable'],
    ])
      await store.put('music-recent', `${source}-${type}-${id}`, {
        source,
        type,
        id,
        index: 1,
      });
    const before = await store.list('music-recent');
    await store.close();
    let application;
    try {
      application = await require('playwright-core')._electron.launch({
        executablePath: process.env.CLARITY_RECENT_EXECUTABLE || require('electron'),
        args: [
          ...(process.env.CLARITY_RECENT_EXECUTABLE ? [] : [join(cache, 'output/main.mjs')]),
          '--use-mock-keychain',
        ],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      page.setDefaultTimeout(10000);
      await page.locator('.sidebar').waitFor();
      await application.evaluate(({ shell }) => {
        const original = globalThis.fetch;
        const fixture = (globalThis.recentFixture = {
          requests: [],
          unavailable: true,
        });
        const json = (value, status = 200) =>
          new Response(JSON.stringify(value), {
            status,
            headers: { 'content-type': 'application/json' },
          });
        const image = Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#243745"/><circle cx="150" cy="95" r="75" fill="#75b5b0"/><circle cx="85" cy="140" r="55" fill="#d6986e"/><text x="20" y="215" font-family="sans-serif" font-size="18" fill="white">Fixture cover</text></svg>',
        );
        const cover = `data:image/svg+xml;base64,${image.toString('base64')}`;
        shell.openExternal = async (address) => {
          const url = new URL(address),
            redirect = new URL(url.searchParams.get('redirect_uri'));
          redirect.search = new URLSearchParams({
            state: url.searchParams.get('state'),
            code: 'fixture',
          });
          await original(redirect);
        };
        globalThis.fetch = async (address, options) => {
          const url = new URL(String(address));
          if (url.href === 'https://accounts.spotify.com/api/token')
            return json({ access_token: 'fixture-token', expires_in: 3600 });
          if (url.origin === 'https://api.spotify.com') {
            fixture.requests.push(url.pathname);
            const [kind, id, contents] = url.pathname.slice(4).split('/');
            if (id === 'unavailable' && fixture.unavailable)
              return json({ error: { message: 'Fixture temporarily unavailable' } }, 503);
            if (contents === 'albums')
              return json({
                items: [{ id: 'shared-id', name: 'Spotify album' }],
              });
            if (contents === 'tracks')
              return json({
                items: [{ id: 'song', name: 'Spotify song', type: 'track' }],
                next: null,
              });
            if (kind === 'me') return json({ items: [], next: null });
            return json({
              id,
              name: `Spotify ${kind === 'artists' ? 'artist' : 'album'} ${id}`,
              images: [{ url: cover }],
              artists: [{ name: 'Fixture artist' }],
            });
          }
          if (url.origin === 'https://navidrome.fixture') {
            const method = url.pathname.split('/').at(-1).replace('.view', '');
            const id = url.searchParams.get('id');
            fixture.requests.push(`${method}:${id || ''}`);
            if (method === 'getCoverArt')
              return new Response(image, {
                headers: { 'content-type': 'image/svg+xml' },
              });
            if (method === 'stream') {
              const wave = Buffer.alloc(44 + 48000 * 2 * 10);
              wave.write('RIFF');
              wave.writeUInt32LE(wave.length - 8, 4);
              wave.write('WAVEfmt ', 8);
              wave.writeUInt32LE(16, 16);
              wave.writeUInt16LE(1, 20);
              wave.writeUInt16LE(1, 22);
              wave.writeUInt32LE(48000, 24);
              wave.writeUInt32LE(96000, 28);
              wave.writeUInt16LE(2, 32);
              wave.writeUInt16LE(16, 34);
              wave.write('data', 36);
              wave.writeUInt32LE(wave.length - 44, 40);
              return new Response(wave, {
                headers: {
                  'content-type': 'audio/wav',
                  'content-length': String(wave.length),
                },
              });
            }
            const songs = [
              { id: 'first', title: 'First fixture song', duration: 10 },
              { id: 'second', title: 'Second fixture song', duration: 10 },
            ];
            let data = {};
            if (method === 'getAlbum')
              data = {
                album: {
                  id,
                  name: `Navidrome album ${id}`,
                  artist: 'Fixture artist',
                  coverArt: 'fixture-cover',
                  song: songs,
                },
              };
            if (method === 'getPlaylist')
              data = {
                playlist: {
                  id,
                  name: 'Navidrome playlist',
                  coverArt: 'fixture-cover',
                  entry: songs,
                },
              };
            if (method === 'getAlbumList2')
              data = {
                albumList2: {
                  album: [
                    {
                      id: 'fresh',
                      name: 'Navidrome album fresh',
                      coverArt: 'fixture-cover',
                    },
                  ],
                },
              };
            return json({ 'subsonic-response': { status: 'ok', ...data } });
          }
          return original(address, options);
        };
      });
      await page.evaluate(async () => {
        await window.clarity.call('settings.save', {
          enabled: ['chat', 'music'],
          theme: 'dark',
          reducedMotion: true,
        });
        await window.clarity.call('auth.oauth', {
          provider: 'spotify',
          clientId: 'fixture',
        });
        await window.clarity.call('auth.configure', {
          provider: 'navidrome',
          url: 'https://navidrome.fixture',
          username: 'fixture',
          password: 'fixture',
        });
        window.recentPlays = [];
        window.clarity.subscribe((event) => {
          if (event.type === 'playback' && event.data?.action === 'play')
            window.recentPlays.push(event.data);
        });
      });
      await page.locator('.sidebar').getByRole('button', { name: 'Music', exact: true }).click();
      await page.getByRole('button', { name: /Unavailable album/ }).waitFor();
      const cards = page.locator('.music-card');
      assert.equal(await cards.count(), 5);
      assert.ok((await cards.locator('strong').allTextContents()).every((name) => name.trim()));
      assert.equal(await cards.locator('img').count(), 4);
      await page.waitForFunction(() =>
        [...document.querySelectorAll('.music-card img')].every(
          (img) => img.complete && img.naturalWidth > 0,
        ),
      );
      await page.getByRole('alert').filter({ hasText: 'Spotify' }).waitFor();
      await page.screenshot({ path: join(evidence, 'partial-repair.png') });
      await application.evaluate(() => {
        globalThis.recentFixture.unavailable = false;
      });
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await page.getByRole('button', { name: /Spotify album unavailable/ }).waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      await page.getByRole('button', { name: /Navidrome album shared-id/ }).click();
      await page
        .getByRole('heading', {
          name: 'Navidrome album shared-id',
          exact: true,
        })
        .waitFor();
      assert.equal(await page.locator('.music-table tbody tr').count(), 2);
      await page.getByRole('button', { name: 'Home', exact: true }).click();
      await page.getByRole('button', { name: /Spotify album shared-id/ }).click();
      await page.getByRole('heading', { name: 'Spotify album shared-id', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Albums', exact: true }).click();
      await page.getByRole('button', { name: /Navidrome album fresh/ }).click();
      await page.getByRole('button', { name: 'Second fixture song', exact: true }).click();
      await page.waitForFunction(() => window.recentPlays.at(-1)?.index === 1);
      await page.getByRole('button', { name: 'Home', exact: true }).click();
      await page.getByRole('button', { name: /Navidrome album fresh/ }).waitFor();
      assert.equal(await cards.count(), 6);
      assert.match(await cards.first().innerText(), /Navidrome album fresh/);
      await page.getByRole('button', { name: /Navidrome album fresh/ }).click();
      await page
        .locator('.collection-heading')
        .getByRole('button', { name: 'Play', exact: true })
        .click();
      await page.waitForFunction(() => window.recentPlays.at(-1)?.index === 0);
      await page.getByRole('button', { name: 'Home', exact: true }).click();
      await page.getByRole('button', { name: /Navidrome album fresh/ }).waitFor();
      await page.screenshot({ path: join(evidence, 'repaired-home.png') });
      await page.reload();
      await page.locator('.sidebar').getByRole('button', { name: 'Music', exact: true }).click();
      await page.getByRole('button', { name: /Navidrome album fresh/ }).waitFor();
      assert.equal(await cards.count(), 6);
      const requests = await application.evaluate(() => globalThis.recentFixture.requests);
      assert.ok(
        !requests.some((path) => /spotify-album-|navidrome-album-/.test(path)),
        'Provider calls must use provider IDs',
      );
      await application.close();
      application = undefined;
      await store.start();
      const saved = await store.list('music-recent');
      assert.equal(saved.length, 6);
      assert.ok(saved.every((item) => item.title && item.itemId && item.index === undefined));
      for (const legacy of before)
        assert.equal(saved.find((item) => item.id === legacy.id).playedAt, legacy.updatedAt);
      await writeFile(
        join(evidence, 'observations.json'),
        JSON.stringify(
          {
            requests,
            before: before.map(({ id, updatedAt }) => ({ id, updatedAt })),
            saved,
          },
          null,
          2,
        ),
      );
    } finally {
      await application?.close();
      await store.close();
    }
  },
);
