import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const bundle = join(cache, 'music-volume-tests.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export * from './src/shared/music-volume'; export {Music} from './src/main/music'; export {SpotifyPlayer} from './src/main/spotify-player';",
    resolveDir: resolve('.'),
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const { volumeGain, normalizationGain, readReplayGain, Music, SpotifyPlayer } = await import(
  pathToFileURL(bundle)
);
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 0.00001, `${actual} != ${expected}`);

test('gain metadata handles absent, invalid, quiet and peak-limited recordings', () => {
  near(volumeGain(70), 0.7);
  near(volumeGain(50), 0.5);
  assert.equal(volumeGain(0), 0);
  assert.equal(volumeGain(-10), 0);
  near(volumeGain(0.0001), 0.000001);
  assert.equal(volumeGain(100), 1);
  assert.equal(volumeGain(500), 1);
  assert.equal(volumeGain(NaN), 0);
  const tagged = readReplayGain({ trackGain: -10, albumGain: -16, trackPeak: 0.5, albumPeak: 0.8 });
  near(normalizationGain(tagged, false), 0.501187234);
  near(normalizationGain(tagged, true), 0.251188643);
  for (const raw of [
    undefined,
    {},
    { trackGain: null },
    { trackGain: '0' },
    { trackGain: NaN },
    { trackGain: -1000 },
  ])
    assert.equal(normalizationGain(readReplayGain(raw), false), 1);
  assert.equal(
    normalizationGain(readReplayGain({ trackGain: -10 }), true),
    1,
    'missing album gain stays unadjusted',
  );
  assert.equal(
    normalizationGain(readReplayGain({ trackGain: 6, trackPeak: 0.1 }), false),
    1,
    'quiet tracks are not amplified',
  );
  near(normalizationGain(readReplayGain({ trackGain: 0, trackPeak: 2 }), false), 0.5);
  near(normalizationGain(readReplayGain({ trackGain: -10, baseGain: 4 }), false), 0.316227766);
  near(normalizationGain(readReplayGain({ trackGain: -10, trackPeak: -1 }), false), 0.501187234);
});

test('Music chooses album/track normalization and sends volume before native playback', async () => {
  const commands = [],
    events = [];
  const music = new Music(
    {
      navidrome: async () => ({
        song: { id: 'nav', title: 'Nav', replayGain: { trackGain: -10 } },
      }),
    },
    {},
    { put: async () => {} },
    (event) => events.push(event),
    'unused',
    'unused',
  );
  music.native = {
    close: async () => {},
    command: async (name, args) => commands.push({ name, args }),
  };
  const song = { source: 'spotify', type: 'song', id: 'one', title: 'One' };
  const original = music.invoke.bind(music);
  music.invoke = (method, args) =>
    method === 'collection' && args.source === 'spotify'
      ? Promise.resolve({
          items:
            args.type === 'artist' ? [{ ...args, type: 'album' }] : [song, { ...song, id: 'two' }],
        })
      : original(method, args);
  const lastLoad = () => commands.filter((command) => command.name === 'load').at(-1).args;
  await music.invoke('control', { volume: 0 });
  await music.invoke('play', { ...song, type: 'album' });
  assert.equal(lastLoad().volume, 0);
  assert.equal(lastLoad().albumGain, true);
  assert.equal(lastLoad().normalization, true);
  await music.invoke('control', { shuffle: true });
  await music.invoke('control', { action: 'next' });
  assert.equal(lastLoad().albumGain, false);
  await music.invoke('control', { shuffle: false });
  await music.invoke('play', { ...song, type: 'playlist' });
  assert.equal(lastLoad().albumGain, false);
  await music.invoke('play', { ...song, type: 'artist' });
  assert.equal(lastLoad().albumGain, true);
  music.setNormalization(false);
  await music.invoke('control', { action: 'next' });
  assert.equal(lastLoad().normalization, false);
  await music.invoke('play', { source: 'navidrome', type: 'song', id: 'nav' });
  assert.equal(
    events.at(-1).data.queue[0].replayGain.trackGain,
    -10,
    'agent ID-only plays retrieve metadata',
  );
  await music.invoke('control', { volume: 120 });
  assert.equal(events.at(-1).data.volume, 100);
  for (const volume of [null, NaN, Infinity, '70'])
    await assert.rejects(music.invoke('control', { volume }), /finite number/);
  await music.close();
});

test(
  'Spotify keeps the helper until normalization changes at a new load',
  { timeout: 15000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-volume-host-'));
    const executable = join(root, 'helper.cjs');
    await writeFile(
      executable,
      `#!${process.execPath}
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
  const input = JSON.parse(line);
  if (!input.command) { console.log(JSON.stringify({event:'ready'})); console.log(JSON.stringify({event:'configured',normalization:input.normalization,pid:process.pid})); }
  if (input.command === 'load') console.log(JSON.stringify({event:'loaded',...input,pid:process.pid}));
  if (input.command === 'volume') console.log(JSON.stringify({event:'volume',volume:input.volume}));
  if (input.command === 'quit') process.exit(0);
});\n`,
      { mode: 0o700 },
    );
    const events = [];
    const player = new SpotifyPlayer(
      executable,
      root,
      { token: async () => 'fixture', secrets: { get: () => ({ expires: Date.now() + 3600000 }) } },
      (event) => events.push(event),
    );
    async function waitForLoads(count) {
      const deadline = Date.now() + 3000;
      while (
        events.filter((event) => event.event === 'loaded').length < count &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(events.filter((event) => event.event === 'loaded').length, count);
    }
    try {
      await player.command('load', { uri: 'one', normalization: true, albumGain: true, volume: 0 });
      await waitForLoads(1);
      const first = player.child.pid;
      await player.command('load', {
        uri: 'two',
        normalization: true,
        albumGain: false,
        volume: 70,
      });
      await waitForLoads(2);
      assert.equal(player.child.pid, first);
      for (const volume of [80, 60, 40, 20, 0, 70]) await player.command('volume', { volume });
      const volumeDeadline = Date.now() + 3000;
      while (
        events.filter((event) => event.event === 'volume').length < 6 &&
        Date.now() < volumeDeadline
      )
        await new Promise((resolve) => setTimeout(resolve, 10));
      assert.deepEqual(
        events.filter((event) => event.event === 'volume').map((event) => event.volume),
        [80, 60, 40, 20, 0, 70],
      );
      await player.command('pause');
      await player.command('resume');
      assert.equal(player.child.pid, first);
      await player.command('load', {
        uri: 'three',
        normalization: false,
        albumGain: true,
        volume: 70,
      });
      await waitForLoads(3);
      assert.notEqual(player.child.pid, first);
      assert.equal(player.normalization, false);
      await player.close();
      assert.deepEqual(
        events.filter((event) => event.event === 'configured').map((event) => event.normalization),
        [true, false],
      );
      const loaded = events.filter((event) => event.event === 'loaded');
      assert.equal(loaded[0].albumGain, true);
      assert.equal(loaded[0].volume, 0);
      assert.equal(loaded[1].albumGain, false);
      assert.equal(
        events.some((event) => event.event === 'error'),
        false,
      );
    } finally {
      await player.close();
    }
  },
);

test(
  'volume reaches main during a held drag and held key, without stale slider echoes',
  { timeout: 30000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-volume-drag-'));
    const application = await require('playwright-core')._electron.launch({
      executablePath: process.env.CLARITY_VOLUME_EXECUTABLE || require('electron'),
      args: [
        '--use-mock-keychain',
        ...(process.env.CLARITY_VOLUME_EXECUTABLE
          ? []
          : [process.env.CLARITY_VOLUME_MAIN || join(cache, 'output/main.mjs')]),
      ],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    try {
      const page = await application.firstWindow();
      await page.locator('.sidebar').waitFor();
      await page.evaluate(() =>
        window.clarity.call('settings.save', { enabled: ['chat', 'music'] }),
      );
      await application.evaluate(({ ipcMain, BrowserWindow }) => {
        globalThis.volumeChanges = [];
        globalThis.volumeDelay = false;
        globalThis.volumeFailure = false;
        const original = ipcMain._invokeHandlers.get('clarity:call');
        ipcMain.removeHandler('clarity:call');
        ipcMain.handle('clarity:call', async (event, method, args) => {
          if (
            method === 'module' &&
            args.module === 'music' &&
            args.method === 'control' &&
            args.args.volume !== undefined
          ) {
            const volume = args.args.volume;
            globalThis.volumeChanges.push(volume);
            if (globalThis.volumeDelay) {
              event.sender.send('clarity:event', {
                type: 'playback',
                data: { action: 'control', volume: 5 },
              });
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
            if (globalThis.volumeFailure)
              return { ok: false, error: 'Volume fixture disconnected' };
          }
          return original(event, method, args);
        });
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'playback',
          data: {
            action: 'play',
            source: 'spotify',
            queue: [{ id: 'fixture', title: 'Volume fixture', duration: 120 }],
            index: 0,
          },
        });
      });
      const slider = page.getByRole('slider', { name: 'Volume', exact: true });
      await slider.waitFor();
      const box = await slider.boundingBox();
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x + box.width * 0.7, y);
      await page.mouse.down();
      for (const fraction of [0.5, 0.3, 0.1, 0.8])
        await page.mouse.move(box.x + box.width * fraction, y, { steps: 4 });
      await page.waitForFunction(() => document.querySelector('.player-volume').value > 70);
      const dragValue = Number(await slider.inputValue());
      const duringDrag = await application.evaluate(() => globalThis.volumeChanges);
      assert.ok(
        new Set(duringDrag).size >= 4,
        'main must receive intermediate changes before pointer release',
      );
      assert.equal(duringDrag.at(-1), dragValue);
      await page.mouse.up();
      await slider.focus();
      await page.keyboard.down('ArrowLeft');
      const keyValue = Number(await slider.inputValue());
      const duringKey = await application.evaluate(() => globalThis.volumeChanges.at(-1));
      assert.equal(duringKey, keyValue, 'main receives keyboard changes before key release');
      assert.equal(keyValue, dragValue - 1);
      await page.keyboard.up('ArrowLeft');
      await application.evaluate(() => {
        globalThis.volumeDelay = true;
      });
      await slider.fill('90');
      await slider.fill('30');
      await page.waitForTimeout(70);
      assert.equal(
        await slider.inputValue(),
        '30',
        'older feedback must not pull the thumb backwards',
      );
      await page.waitForTimeout(200);
      assert.equal(await slider.inputValue(), '30');
      await application.evaluate(({ BrowserWindow }) => {
        globalThis.volumeDelay = false;
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'playback',
          data: { action: 'control', volume: 33 },
        });
      });
      await page.waitForFunction(() => document.querySelector('.player-volume').value === '33');
      await slider.press('Home');
      assert.equal(await application.evaluate(() => globalThis.volumeChanges.at(-1)), 0);
      await slider.press('End');
      assert.equal(await application.evaluate(() => globalThis.volumeChanges.at(-1)), 100);
      await application.evaluate(() => {
        globalThis.volumeFailure = true;
      });
      await slider.fill('40');
      await page.getByRole('alert').filter({ hasText: 'Volume fixture disconnected' }).waitFor();
      const evidence = process.env.CLARITY_VOLUME_EVIDENCE;
      if (evidence) {
        await mkdir(evidence, { recursive: true });
        await writeFile(
          join(evidence, 'volume-response.json'),
          JSON.stringify(
            {
              duringDrag,
              dragValue,
              duringKey,
              keyValue,
              staleEchoIgnored: true,
              externalVolumeAccepted: true,
              muteAndMaximum: true,
              failureVisible: true,
            },
            null,
            2,
          ) + '\n',
        );
      }
    } finally {
      await application.close();
    }
  },
);

test(
  'native Music UI applies normalization, album/shuffle modes, settings and persistence',
  { timeout: 90000 },
  async () => {
    const songs = [
      {
        id: 'one',
        title: 'Tagged one',
        replayGain: { trackGain: -10, albumGain: -16, trackPeak: 0.5, albumPeak: 0.5 },
      },
      {
        id: 'two',
        title: 'Tagged two',
        replayGain: { trackGain: -16, albumGain: -16, trackPeak: 0.5, albumPeak: 0.5 },
      },
      {
        id: 'quiet',
        title: 'Quiet recording',
        replayGain: { trackGain: 6, albumGain: 6, trackPeak: 0.1, albumPeak: 0.1 },
      },
      { id: 'untagged', title: 'Untagged recording' },
      { id: 'peak', title: 'Peak recording', replayGain: { trackGain: 0, trackPeak: 2 } },
    ].map((song) => ({ ...song, artist: 'Fixture artist', duration: 30 }));
    const wave = Buffer.alloc(44 + 8000 * 30 * 2);
    wave.write('RIFF');
    wave.writeUInt32LE(wave.length - 8, 4);
    wave.write('WAVEfmt ', 8);
    wave.writeUInt32LE(16, 16);
    wave.writeUInt16LE(1, 20);
    wave.writeUInt16LE(1, 22);
    wave.writeUInt32LE(8000, 24);
    wave.writeUInt32LE(16000, 28);
    wave.writeUInt16LE(2, 32);
    wave.writeUInt16LE(16, 34);
    wave.write('data', 36);
    wave.writeUInt32LE(wave.length - 44, 40);
    const requests = [];
    const server = createServer((request, response) => {
      const url = new URL(request.url, 'http://fixture');
      requests.push(url.pathname.split('/').at(-1));
      if (url.pathname.endsWith('/stream.view')) {
        response.setHeader('content-type', 'audio/wav');
        response.end(wave);
        return;
      }
      const data = { status: 'ok', version: '1.16.1', openSubsonic: true };
      if (url.pathname.includes('getAlbumList2'))
        data.albumList2 = { album: [{ id: 'album', name: 'Volume album' }] };
      if (url.pathname.includes('getAlbum.view'))
        data.album = { id: 'album', name: 'Volume album', song: songs.slice(0, 2) };
      if (url.pathname.includes('getPlaylists'))
        data.playlists = { playlist: [{ id: 'playlist', name: 'Volume playlist' }] };
      if (url.pathname.includes('getPlaylist.view'))
        data.playlist = { id: 'playlist', name: 'Volume playlist', entry: songs };
      if (url.pathname.includes('search3')) data.searchResult3 = { song: songs };
      if (url.pathname.includes('getSong'))
        data.song = songs.find((song) => song.id === url.searchParams.get('id'));
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ 'subsonic-response': data }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const root = await mkdtemp(join(tmpdir(), 'clarity-volume-ui-'));
    const launch = () =>
      require('playwright-core')._electron.launch({
        executablePath: process.env.CLARITY_VOLUME_EXECUTABLE || require('electron'),
        args: [
          '--use-mock-keychain',
          ...(process.env.CLARITY_VOLUME_EXECUTABLE ? [] : [join(cache, 'output/main.mjs')]),
        ],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
    let application;
    const observations = [];
    try {
      application = await launch();
      let page = await application.firstWindow();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.waitForFunction(() => !!window.clarity);
      await page.evaluate(async (url) => {
        await window.clarity.call('auth.configure', {
          provider: 'navidrome',
          url,
          username: 'fixture',
          password: 'fixture',
        });
        await window.clarity.call('settings.save', { enabled: ['chat', 'music'] });
      }, `http://127.0.0.1:${server.address().port}`);
      const openMusic = () =>
        page.locator('.sidebar').getByRole('button', { name: 'Music', exact: true }).click();
      const openPreferences = async () => {
        await page.getByRole('button', { name: 'Settings', exact: true }).click();
        await page
          .getByRole('navigation', { name: 'Settings sections' })
          .getByRole('button', { name: 'Music', exact: true })
          .click();
        return page.getByRole('checkbox', { name: 'Normalize volume' });
      };
      const observe = async (label, expected) => {
        await page.waitForFunction((value) => {
          const audio = document.querySelector('audio');
          return audio && !audio.paused && Math.abs(audio.volume - value) < 0.00001;
        }, expected);
        const state = await page.locator('audio').evaluate((audio) => ({
          gain: audio.volume,
          playing: !audio.paused,
          source: audio.getAttribute('src'),
        }));
        observations.push({ label, ...state });
        near(state.gain, expected);
      };
      await openMusic();
      await page.getByRole('button', { name: 'Albums', exact: true }).click();
      await page.getByRole('button', { name: /Volume album/ }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      const slider = page.getByRole('slider', { name: 'Volume', exact: true });
      await slider.press('End');
      await observe('album one', 0.251188643);
      await page.getByRole('button', { name: 'Next track', exact: true }).click();
      await observe('album two preserves gain', 0.251188643);
      await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
      await page.getByRole('button', { name: 'Previous track', exact: true }).click();
      await observe('shuffled album uses track gain', 0.501187234);
      await page.getByRole('button', { name: 'Shuffle', exact: true }).click();
      await page.getByRole('button', { name: 'Playlists', exact: true }).click();
      await page.getByRole('button', { name: /Volume playlist/ }).click();
      await page.getByRole('button', { name: 'Play', exact: true }).click();
      await observe('playlist uses track gain', 0.501187234);
      await slider.fill('70');
      await slider.press('Enter');
      await observe('slider combines volume and normalization', volumeGain(70) * 0.501187234);
      const checkbox = await openPreferences();
      assert.equal(await checkbox.isChecked(), true);
      await checkbox.uncheck();
      near(
        await page.locator('audio').evaluate((audio) => audio.volume),
        volumeGain(70) * 0.501187234,
      );
      await openMusic();
      await page.getByRole('button', { name: 'Tagged one', exact: true }).click();
      await observe('disabled applies next track', volumeGain(70));
      for (const volume of [0, 25, 50, 70, 100]) {
        await slider.fill(String(volume));
        await slider.press('Enter');
        await observe(`common curve ${volume}`, volumeGain(volume));
      }
      await (await openPreferences()).check();
      await openMusic();
      for (const [title, gain] of [
        ['Quiet recording', 1],
        ['Untagged recording', 1],
        ['Peak recording', 0.5],
      ]) {
        await page.getByRole('button', { name: title, exact: true }).click();
        await observe(title, gain);
      }
      await (await openPreferences()).uncheck();
      await page.waitForFunction(() => !document.querySelector('#settings-music input').disabled);
      assert.equal(
        await page.evaluate(
          async () => (await window.clarity.call('bootstrap')).settings.musicNormalization,
        ),
        false,
        'wait for the saved setting before quitting',
      );
      const evidence = process.env.CLARITY_VOLUME_EVIDENCE;
      if (evidence) {
        await mkdir(evidence, { recursive: true });
        await page.screenshot({ path: join(evidence, 'music-normalization.png') });
      }
      await application.close();
      application = await launch();
      page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      assert.equal(
        await (await openPreferences()).isChecked(),
        false,
        'normalization preference survives Quit/reopen',
      );
      assert.equal(
        await page.evaluate(() =>
          window.clarity.call('settings.save', { musicNormalization: 'true' }).then(
            () => 'accepted',
            (error) => error.message,
          ),
        ),
        'Choose an enabled or disabled setting.',
      );
      assert.deepEqual(errors, []);
      if (evidence)
        await writeFile(
          join(evidence, 'observations.json'),
          JSON.stringify({ observations, requests, persisted: true, errors }, null, 2) + '\n',
        );
    } finally {
      await application?.close();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
