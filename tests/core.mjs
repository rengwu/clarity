import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, mkdir, symlink, access } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const bundle = join(cache, 'core-tests.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export {Files} from './src/main/files'; export {Store} from './src/main/store'; export {Modules,catalog} from './src/main/modules'; export * from './src/shared/agent-actions'; export {Integrations} from './src/main/integrations'; export {Wiki} from './src/main/wiki'; export {Browser} from './src/main/browser'; export {Music} from './src/main/music'; export {SpotifyPlayer} from './src/main/spotify-player'; export {Automations} from './src/main/automations'; export * from './src/main/environment'; export {defaultSettings} from './src/shared/types';",
    resolveDir: resolve('.'),
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const {
  Files,
  Store,
  Modules,
  catalog,
  agentActionIds,
  Integrations,
  Wiki,
  Browser,
  Music,
  SpotifyPlayer,
  Automations,
  currentEnvironment,
  approximateLocation,
  requestLocationOnStartup,
  defaultSettings,
} = await import(pathToFileURL(bundle));
test('agent context uses the device timezone without guessing a physical location', () => {
  const now = new Date('2026-09-28T20:15:00Z');
  const context = currentEnvironment('', undefined, now, 'Asia/Kuala_Lumpur');
  assert.equal(context.timeZone, 'Asia/Kuala_Lumpur');
  assert.match(context.localTime, /Tuesday, 29 September 2026.*04:15:00/);
  assert.equal(context.location, null);
  const next = currentEnvironment('', undefined, new Date(+now + 60000), 'Asia/Kuala_Lumpur');
  assert.match(next.localTime, /04:16:00/);
  assert.notEqual(next.utcTime, context.utcTime);
  assert.match(currentEnvironment('', undefined, now, 'Asia/Kathmandu').localTime, /02:00:00/);
  for (const [date, time] of [
    ['2026-01-01T12:00:00Z', '07:00:00'],
    ['2026-07-01T12:00:00Z', '08:00:00'],
  ])
    assert.match(
      currentEnvironment('', undefined, new Date(date), 'America/New_York').localTime,
      new RegExp(time),
    );
  assert.deepEqual(currentEnvironment(' Test city ').location, {
    name: 'Test city',
    source: 'user',
  });
});

test('device readings are approximate and dated; startup does not repeat refused requests', () => {
  const now = Date.now();
  const reading = {
    latitude: 3.139876,
    longitude: 101.686789,
    accuracy: 24,
    timestamp: now,
  };
  const location = approximateLocation(reading, now);
  assert.deepEqual(location, {
    latitude: 3.14,
    longitude: 101.69,
    accuracyMetres: 1500,
    measuredAt: now,
  });
  assert.equal(currentEnvironment('', location).location.measuredAt, new Date(now).toISOString());
  assert.equal(currentEnvironment('', location).location.source, 'device');
  assert.equal(approximateLocation({ ...reading, accuracy: 12000 }, now).accuracyMetres, 12000);
  for (const invalid of [
    { latitude: 91 },
    { longitude: -181 },
    { accuracy: -1 },
    { timestamp: now - 360000 },
    { timestamp: now + 120000 },
    { latitude: '3.14' },
  ])
    assert.throws(() => approximateLocation({ ...reading, ...invalid }, now), /valid location/);
  assert.equal(requestLocationOnStartup(defaultSettings), true);
  assert.equal(
    requestLocationOnStartup({
      ...defaultSettings,
      locationRequested: true,
      locationPermission: 'denied',
    }),
    false,
  );
  assert.equal(requestLocationOnStartup({ ...defaultSettings, locationRequested: true }), false);
  assert.equal(
    requestLocationOnStartup({
      ...defaultSettings,
      locationRequested: true,
      locationPermission: 'granted',
    }),
    true,
  );
  assert.equal(
    requestLocationOnStartup({
      ...defaultSettings,
      useDeviceLocation: false,
      locationPermission: 'granted',
    }),
    false,
  );
});
async function workspace() {
  const root = await mkdtemp(join(tmpdir(), 'clarity-core-'));
  const files = new Files(root);
  await files.initialize();
  return { root, files };
}

test('files preserve conflicts, reject escapes and expire only owned chat copies', async () => {
  const { root, files } = await workspace();
  const note = await files.create('Notes', '', 'Example');
  await writeFile(join(root, 'Notes', note.path), 'External edit');
  let conflict;
  try {
    await files.save('Notes', note.path, 'Unsaved human draft', note.version, true);
  } catch (error) {
    conflict = error;
  }
  assert.equal(conflict.code, 'CONFLICT');
  assert.equal(await readFile(join(root, 'Notes', note.path), 'utf8'), 'External edit');
  assert.equal(
    await readFile(join(root, 'Notes', conflict.details.copy), 'utf8'),
    'Unsaved human draft',
  );
  await assert.rejects(files.path('Notes', '../../outside.md'), /outside/);
  await assert.rejects(files.trash('Notes', ''), /Markdown/);
  await symlink(tmpdir(), join(root, 'Notes', 'escape'));
  await assert.rejects(files.path('Notes', 'escape/private.md', true), /Symbolic/);
  await assert.rejects(files.attach('huge.txt', Buffer.alloc(30_000_000)), /smaller/);
  const attachment = await files.attach('example.txt', Buffer.from('original'));
  assert.equal(attachment.supported, true);
  const image = await files.asset('Notes', note.path, 'image.png', Buffer.from([137, 80, 78, 71]));
  const current = await files.read('Notes', note.path);
  const embedded = await files.embed('Notes', note.path, attachment.id, current.version);
  assert.match(embedded.text, /\[example.txt\]\(assets\//);
  await writeFile(
    join(root, 'Attachments', attachment.id, '.metadata.json'),
    JSON.stringify({ ...attachment, createdAt: Date.now() - 91 * 86400000 }),
  );
  await files.trash('Notes', conflict.details.copy);
  await writeFile(join(root, 'Trash', `${Date.now() - 31 * 86400000}-expired.md`), 'old');
  await files.cleanup();
  await assert.rejects(access(join(root, 'Attachments', attachment.id)));
  await access(join(root, 'Notes', image.path));
  assert.equal(await readFile(join(root, 'Notes', embedded.asset), 'utf8'), 'original');
  assert.equal((await readdir(join(root, 'Trash'))).length, 1);
});

test('music keeps track identity and stops Spotify before starting Navidrome', async () => {
  const events = [],
    commands = [];
  const auth = {
    secrets: { get: (provider) => (provider === 'spotify' ? {} : undefined) },
  };
  const api = {
    spotify: async () => ({
      tracks: {
        items: [
          {
            id: 'song-id',
            name: 'Song title',
            type: 'track',
            artists: [{ name: 'Artist' }],
            album: {
              id: 'album-id',
              name: 'Album title',
              images: [{ url: 'https://example.com/cover.png' }],
            },
            uri: 'spotify:track:song-id',
            duration_ms: 180000,
          },
        ],
      },
    }),
  };
  const music = new Music(
    api,
    auth,
    { put: async () => {} },
    (event) => events.push(event),
    'unused',
    'unused',
  );
  music.native = {
    command: async (name, args) => commands.push({ name, args }),
    close: async () => events.push({ stopped: true }),
  };
  const search = await music.invoke('search', { query: 'Song' });
  assert.equal(search.items[0].id, 'song-id');
  assert.equal(search.items[0].title, 'Song title');
  await music.invoke('play', search.items[0]);
  assert.equal(commands[0].args.uri, 'spotify:track:song-id');
  await music.invoke('control', { action: 'seek', position: 42.5 });
  assert.deepEqual(commands.at(-1), {
    name: 'seek',
    args: { position: 42500 },
  });
  await music.invoke('control', { action: 'seek', position: 1000 });
  assert.deepEqual(commands.at(-1), {
    name: 'seek',
    args: { position: 180000 },
  });
  for (const position of [-1, NaN, Infinity, '12'])
    await assert.rejects(
      music.invoke('control', { action: 'seek', position }),
      /number of seconds/,
    );
  await music.invoke('play', {
    source: 'navidrome',
    id: 'local-song',
    title: 'Local song',
    type: 'song',
    replayGain: undefined,
  });
  assert.ok(
    events.findIndex((event) => event.stopped) <
      events.findIndex(
        (event) => event.data?.action === 'play' && event.data.source === 'navidrome',
      ),
  );
  const count = commands.length;
  await music.invoke('control', { action: 'seek', position: 12 });
  assert.equal(commands.length, count);
  assert.equal(events.at(-1).data.command, 'seek');
  assert.equal(events.at(-1).data.position, 12);
  await music.close();
  assert.equal(events.at(-2).data.action, 'stop');
});

test(
  'Spotify helper crashes surface an error and reconnect; intentional shutdown stays quiet',
  { timeout: 10000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-player-test-'));
    const executable = join(root, 'player.cjs');
    await writeFile(
      executable,
      `#!${process.execPath}
const emit = value => console.log(JSON.stringify(value));
require('node:readline').createInterface({input: process.stdin}).on('line', line => {
  const value = JSON.parse(line);
  if (value.token) emit({event:'ready'});
  if (value.command === 'load' && value.uri === 'crash') process.exit(17);
  if (value.command === 'load') emit({event:'state',playing:true,position:0});
  if (value.command === 'quit') process.exit(0);
});
`,
      { mode: 0o700 },
    );
    const events = [];
    let crash, playing;
    const crashed = new Promise((resolve) => {
      crash = resolve;
    });
    const started = new Promise((resolve) => {
      playing = resolve;
    });
    const player = new SpotifyPlayer(
      executable,
      root,
      {
        token: async () => 'fixture',
        secrets: { get: () => ({ expires: Date.now() + 3600000 }) },
      },
      (event) => {
        events.push(event);
        if (event.event === 'error') crash(event);
        if (event.playing) playing();
      },
    );
    try {
      await player.command('load', { uri: 'crash' });
      assert.match((await crashed).message, /stopped unexpectedly \(exit 17\)/);
      await player.command('load', { uri: 'working' });
      await started;
      await player.close();
      assert.equal(events.filter((event) => event.event === 'error').length, 1);
    } finally {
      await player.close();
    }
  },
);

test(
  'Spotify silently renews a rejected playback token, with a single retry',
  { timeout: 10000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-player-renew-'));
    const executable = join(root, 'player.cjs');
    await writeFile(
      executable,
      `#!${process.execPath}
const emit = value => console.log(JSON.stringify(value));
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
  const value = JSON.parse(line);
  if (value.token === 'stale') emit({event:'error',code:'authentication',message:'Rejected token'});
  else if (value.token) emit({event:'ready'});
  if (value.command === 'quit') process.exit(0);
});
`,
      { mode: 0o700 },
    );
    const requests = [],
      events = [];
    let rejectRenewed = false;
    const player = new SpotifyPlayer(
      executable,
      root,
      {
        token: async (provider, rejected) => {
          requests.push({ provider, rejected });
          return rejected && !rejectRenewed ? 'renewed' : 'stale';
        },
        secrets: { get: () => ({ expires: Date.now() + 3600000 }) },
      },
      (event) => events.push(event),
    );
    try {
      await player.command('load', { uri: 'song' });
      assert.deepEqual(requests, [
        { provider: 'spotify-playback', rejected: undefined },
        { provider: 'spotify-playback', rejected: 'stale' },
      ]);
      assert.equal(events.length, 0);
      await player.close();
      rejectRenewed = true;
      await assert.rejects(
        player.command('load', { uri: 'song' }),
        /rejected the renewed playback sign-in/,
      );
      assert.equal(requests.length, 4);
    } finally {
      await player.close();
    }
  },
);

test('Spotify renews an active helper token without restarting and ignores renewal after close', { timeout: 10000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'clarity-player-token-'));
  const executable = join(root, 'player.cjs');
  await writeFile(executable, `#!${process.execPath}
const emit = value => console.log(JSON.stringify(value));
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
  const value = JSON.parse(line);
  if (value.token && !value.command) emit({event:'ready'});
  if (value.command === 'token') emit({event:'renewed',pid:process.pid,expires:value.expires});
  if (value.command === 'quit') process.exit(0);
});
`, { mode: 0o700 });
  const events = [];
  let expires, requests = 0, waitForRenewal, releaseRenewal, renewalStarted;
  const began = new Promise(resolve => { renewalStarted = resolve; });
  const player = new SpotifyPlayer(executable, root, {
    secrets: { get: () => ({ expires }) },
    token: async () => {
      requests++;
      if (waitForRenewal && requests === 2) {
        renewalStarted();
        await new Promise(resolve => { releaseRenewal = resolve; });
      }
      expires = Date.now() + (requests === 1 ? 60050 : 3600000);
      return `fixture-${requests}`;
    },
  }, event => events.push(event));
  try {
    await player.command('load', { uri: 'fixture' });
    const pid = player.child.pid;
    const deadline = Date.now() + 3000;
    while (!events.some(event => event.event === 'renewed') && Date.now() < deadline)
      await new Promise(resolve => setTimeout(resolve, 20));
    const renewed = events.find(event => event.event === 'renewed');
    assert.ok(renewed, 'the active helper receives a fresh token before expiry');
    assert.equal(renewed.pid, pid, 'renewal does not restart the audio process');
    assert.ok(renewed.expires > Date.now() + 3500000);
    assert.equal(requests, 2);
    await player.close();

    events.length = 0;
    requests = 0;
    waitForRenewal = true;
    await player.command('load', { uri: 'fixture' });
    await began;
    await player.close();
    releaseRenewal();
    await new Promise(resolve => setTimeout(resolve, 50));
    assert.equal(events.length, 0, 'a late token neither revives playback nor emits a false error');
    assert.equal(player.child, undefined);
  } finally {
    releaseRenewal?.();
    await player.close();
  }
});

test('Spotify recovers an interrupted track once, preserves position and respects pause and source changes', async () => {
  const events = [],
    commands = [];
  const music = new Music({}, {}, {}, (event) => events.push(event), 'unused', 'unused');
  const nativeEvent = music.native.event;
  music.native = {
    close: async () => {},
    command: async (name, args, current = () => true) => {
      if (current()) commands.push({ name, args });
    },
  };
  const song = { source: 'spotify', id: 'one', type: 'song', title: 'One' };
  const interrupted = () =>
    nativeEvent({
      event: 'error',
      recoverable: true,
      message: 'Connection interrupted',
    });
  const loads = () => commands.filter((command) => command.name === 'load');
  await music.invoke('play', song);
  nativeEvent({ event: 'position', position: 42 });
  interrupted();
  await music.changes;
  assert.equal(loads().length, 2);
  assert.equal(loads()[1].args.position, 42000);
  assert.equal(events.filter((event) => event.data?.action === 'error').length, 0);
  interrupted();
  await music.changes;
  assert.equal(loads().length, 2);
  assert.equal(events.at(-1).data.action, 'error');
  await music.invoke('play', song);
  interrupted();
  await music.invoke('control', { action: 'pause' });
  assert.equal(loads().length, 3);
  await music.invoke('control', { action: 'resume' });
  assert.equal(loads().length, 4, 'resume after cancelled recovery reloads the track');
  await music.invoke('play', song);
  interrupted();
  await music.invoke('play', { ...song, source: 'navidrome', replayGain: undefined });
  assert.equal(loads().length, 5);
  await music.invoke('play', song);
  nativeEvent({ event: 'ended' });
  await music.changes;
  interrupted();
  await music.changes;
  assert.equal(loads().length, 6, 'a completed single song must not restart on reconnect');
  await music.close();
});

test('automations skip missed runs, preserve failed inputs and keep output outside chats', async () => {
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  const modules = new Modules(store, files, {}, {}, () => {});
  await modules.saveSettings({
    enabled: ['chat', 'notes', 'todos', 'wiki', 'automations'],
  });
  let prompts = 0;
  const chats = {
    makeAgent: async () => ({
      state: {
        messages: [
          {
            content: [{ type: 'text', text: 'Checked new information.' }],
            stopReason: 'stop',
          },
        ],
      },
      prompt: async () => {
        prompts++;
      },
      abort: () => {},
    }),
  };
  const automations = new Automations(
    modules,
    chats,
    { codexToken: async () => 'fixture' },
    () => {},
  );
  try {
    const rule = await modules.invoke('automations', 'add', {
      title: 'Research',
      instruction: 'Track relevant tasks',
      topicPath: 'Topic.md',
      frequency: 'daily',
      hour: 10,
      minute: 0,
    });
    await store.patch('automations', rule.id, {
      nextRun: Date.now() - 100000,
      status: 'running',
    });
    await automations.start();
    const recovered = await store.get('automations', rule.id);
    assert.equal(recovered.status, 'interrupted');
    assert.ok(recovered.nextRun > Date.now());
    await automations.run(rule.id);
    assert.equal(prompts, 0);
    const completed = await store.get('automations', rule.id);
    await store.put('todos', 'new-task', {
      title: 'New research fact',
      done: false,
    });
    await store.patch('automations', rule.id, { since: completed.since - 1 });
    await automations.run(rule.id);
    assert.equal(prompts, 1);
    assert.equal((await store.get('automations', rule.id)).result, 'Checked new information.');
    assert.equal((await store.list('chats')).length, 0);
    const failedBaseline = Date.now() - 5000;
    await store.patch('automations', rule.id, { since: failedBaseline });
    chats.makeAgent = async () => {
      throw new Error('Fixture offline');
    };
    await assert.rejects(automations.run(rule.id), /offline/);
    assert.equal((await store.get('automations', rule.id)).since, failedBaseline);
    assert.equal((await store.get('automations', rule.id)).status, 'failed');
  } finally {
    await automations.stop();
    await store.close();
  }
});

test('approval claims prevent duplicate effects; optimistic revisions prevent stale updates', async () => {
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    const modules = new Modules(store, files, {}, {}, () => {});
    const result = await modules.agent('test-chat', 'todos', 'add', {
      title: 'Apply once',
    });
    assert.equal(result.status, 'pending-approval');
    assert.equal((await store.list('todos')).length, 0);
    const reviews = await Promise.allSettled([
      modules.approve(result.actionId, true),
      modules.approve(result.actionId, true),
    ]);
    assert.equal(reviews.filter((result) => result.status === 'fulfilled').length, 1);
    const [task] = await store.list('todos');
    assert.equal((await store.list('todos')).length, 1);
    await modules.invoke('todos', 'update', {
      id: task.id,
      revision: task.revision,
      title: 'Updated',
    });
    await assert.rejects(
      modules.invoke('todos', 'update', {
        id: task.id,
        revision: task.revision,
        title: 'Stale',
      }),
      /changed/,
    );
    const rejected = await modules.agent('test-chat', 'todos', 'add', {
      title: 'Never applied',
    });
    await modules.approve(rejected.actionId, false);
    assert.equal((await store.list('todos')).length, 1);
  } finally {
    await store.close();
  }
});

test('automatic action approvals are explicit, current, persisted and keep a result trail', async () => {
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    const modules = new Modules(store, files, {}, {}, () => {});
    assert.deepEqual((await modules.settings()).autoApproveActions, []);
    const pending = await modules.agent('chat', 'todos', 'add', {
      title: 'Still pending',
    });
    await modules.saveSettings({
      autoApproveActions: ['todos.add', 'music.play', 'notes.write'],
    });
    assert.equal((await store.get('actions', pending.actionId)).status, 'pending');
    const task = await modules.agent('chat', 'todos', 'add', {
      title: 'Immediate task',
    });
    assert.equal(task.title, 'Immediate task');
    assert.equal((await store.list('todos')).length, 1);
    const applied = (await store.list('actions')).find((action) => action.result?.id === task.id);
    assert.equal(applied.status, 'applied');
    assert.equal(applied.autoApproved, true);
    await assert.rejects(modules.approve(applied.id, true), /no longer pending/);
    assert.equal((await store.list('todos')).length, 1);
    const removal = await modules.agent('chat', 'todos', 'remove', {
      id: task.id,
      revision: task.revision,
    });
    assert.equal(removal.status, 'pending-approval');
    let plays = 0;
    modules.music = { invoke: async () => ({ plays: ++plays }) };
    await assert.rejects(modules.agent('chat', 'music', 'play', {}), /disabled/);
    await modules.saveSettings({
      enabled: [...defaultSettings.enabled, 'music'],
    });
    assert.deepEqual(await modules.agent('chat', 'music', 'play', { id: 'fixture' }), { plays: 1 });
    const control = await modules.agent('chat', 'music', 'control', {
      action: 'pause',
    });
    assert.equal(control.status, 'pending-approval');
    assert.equal(plays, 1);
    const note = await files.create('Notes', '', 'Approval fixture');
    await writeFile(join(root, 'Notes', note.path), 'External edit');
    await assert.rejects(
      modules.agent('chat', 'notes', 'write', {
        ...note,
        text: 'Stale agent write',
      }),
      /changed/,
    );
    assert.equal(await readFile(join(root, 'Notes', note.path), 'utf8'), 'External edit');
    const failed = (await store.list('actions')).find((action) => action.module === 'notes');
    assert.equal(failed.status, 'failed');
    assert.equal(failed.autoApproved, true);
    await assert.rejects(modules.saveSettings({ autoApproveActions: ['*'] }), /checklist/);
    await assert.rejects(modules.saveSettings({ autoApproveActions: ['mail.send'] }), /checklist/);
    await assert.rejects(modules.saveSettings({ autoApproveActions: 'all' }), /checklist/);
    await assert.rejects(
      modules.agent('chat', 'settings', 'save', {
        autoApproveActions: agentActionIds,
      }),
      /Unknown agent action/,
    );
    await modules.saveSettings({ autoApproveActions: [] });
    assert.equal((await modules.agent('chat', 'music', 'play', {})).status, 'pending-approval');
    assert.equal(plays, 1);
    await modules.saveSettings({
      autoApproveActions: ['music.play', 'music.play'],
    });
    await store.close();
    await store.start();
    const reopened = new Modules(store, files, {}, {}, () => {});
    assert.deepEqual((await reopened.settings()).autoApproveActions, ['music.play']);
  } finally {
    await store.close();
  }
});

test('action checklist covers the agent catalog, browser grants and scheduled-run approvals', async () => {
  const reads = new Set(['list', 'read', 'sources', 'library', 'search', 'collection', 'recent']);
  const advertised = Object.entries(catalog).flatMap(([module, methods]) =>
    methods
      .split(';')
      .map((method) => method.trim().match(/^(\w+)(?=\s*(?:\{|$))/)?.[1])
      .filter(Boolean)
      .filter((method) => !reads.has(method))
      .map((method) => `${module}.${method}`),
  );
  assert.deepEqual(
    [...agentActionIds].sort(),
    [...advertised, 'browser.authorize', 'browser.batch'].sort(),
  );
  assert.equal(new Set(agentActionIds).size, agentActionIds.length);
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    const batches = [];
    const browser = {
      batch: async (owner, actions, grants) => {
        batches.push({ owner, actions, grants });
        return { executed: true };
      },
    };
    const modules = new Modules(store, files, {}, browser, () => {});
    await store.put('chats', 'chat', { grants: [] });
    await modules.saveSettings({ autoApproveActions: ['browser.batch'] });
    const permission = await modules.agent('chat', 'browser', 'authorize', {
      url: 'https://example.com/path',
    });
    assert.equal(permission.status, 'pending-approval');
    assert.deepEqual((await store.get('chats', 'chat')).grants, []);
    await modules.saveSettings({ autoApproveActions: ['browser.authorize'] });
    assert.deepEqual(
      await modules.agent('chat', 'browser', 'authorize', {
        url: 'https://example.com/path',
      }),
      { authorized: 'https://example.com' },
    );
    const actions = [{ kind: 'click', selector: 'button' }];
    assert.equal(
      (
        await modules.agent('chat', 'browser', 'batch', {
          actions,
          consequential: true,
        })
      ).status,
      'pending-approval',
    );
    assert.equal(batches.length, 0);
    await modules.saveSettings({
      autoApproveActions: ['browser.batch', 'todos.add'],
    });
    assert.deepEqual(
      await modules.agent('chat', 'browser', 'batch', {
        actions,
        consequential: true,
      }),
      { executed: true },
    );
    assert.deepEqual(batches[0].grants, ['https://example.com']);
    await modules.agent('chat', 'browser', 'batch', {
      actions,
      consequential: false,
    });
    assert.equal(batches.length, 2);
    await assert.rejects(
      modules.agent('automation:fixture', 'browser', 'authorize', {
        url: 'https://example.com',
      }),
      /chats only/,
    );
    const task = await modules.agent(
      'automation:fixture',
      'todos',
      'add',
      { title: 'Scheduled fixture' },
      'Topic.md',
    );
    assert.equal(task.title, 'Scheduled fixture');
    assert.equal(
      (await store.list('actions')).find((action) => action.result?.id === task.id).owner,
      'automation:fixture',
    );
    await modules.saveSettings({ autoApproveActions: [] });
    const topic = await modules.agent(
      'automation:fixture',
      'wiki',
      'write',
      { path: 'Topic.md', version: null, text: '# Scheduled' },
      'Topic.md',
    );
    assert.equal(topic.text, '# Scheduled');
    assert.equal(
      (
        await modules.agent(
          'automation:fixture',
          'wiki',
          'write',
          { path: 'Other.md', version: null, text: '# Needs approval' },
          'Topic.md',
        )
      ).status,
      'pending-approval',
    );
    assert.equal(
      (
        await modules.agent(
          'automation:fixture',
          'todos',
          'add',
          { title: 'Needs approval' },
          'Topic.md',
        )
      ).status,
      'pending-approval',
    );
  } finally {
    await store.close();
  }
});

test('Linkding preserves local edits, feeds parse and Navidrome accepts a local HTTP server', async () => {
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  const secrets = new Map();
  const auth = {
    status: async () => ({}),
    secrets: {
      get: (key) => secrets.get(key),
      set: async (key, value) => secrets.set(key, value),
    },
  };
  const server = createServer((request, response) => {
    if (request.url.startsWith('/api/bookmarks/')) {
      assert.equal(request.headers.authorization, 'Token test-token');
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          next: null,
          results: [
            {
              id: 1,
              title: 'A saved link',
              url: 'https://example.com/',
              description: 'Original',
              tag_names: ['read'],
            },
          ],
        }),
      );
    } else if (request.url.startsWith('/feed')) {
      response.setHeader('Content-Type', 'application/xml');
      response.end(
        '<rss><channel><item><title>A headline</title><link>https://example.com/news</link><pubDate>Mon, 28 Sep 2026 10:00:00 GMT</pubDate></item></channel></rss>',
      );
    } else if (request.url.startsWith('/rest/')) {
      const url = new URL(request.url, 'http://local');
      assert.equal(url.searchParams.get('u'), 'reader');
      assert.equal(url.searchParams.has('p'), false);
      assert.equal(url.searchParams.get('t').length, 32);
      response.setHeader('Content-Type', 'application/json');
      response.end(
        JSON.stringify({
          'subsonic-response': { status: 'ok', version: '1.16.1' },
        }),
      );
    } else {
      response.statusCode = 404;
      response.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const api = new Integrations(auth, store);
    await api.configure('linkding', { url, token: 'test-token' });
    assert.equal((await api.importLinkding()).imported, 1);
    const [bookmark] = await store.list('bookmarks');
    await store.patch('bookmarks', bookmark.id, {
      description: 'My annotation',
    });
    assert.equal((await api.importLinkding()).imported, 0);
    assert.equal((await store.get('bookmarks', bookmark.id)).description, 'My annotation');
    await store.put('news-sources', 'fixture', {
      title: 'Fixture',
      url: url + '/feed',
      enabled: true,
    });
    assert.equal((await api.refreshNews()).imported, 1);
    assert.equal((await api.refreshNews()).imported, 0);
    await api.configure('navidrome', {
      url,
      username: 'reader',
      password: 'test-password',
    });
    assert.equal(secrets.get('navidrome').url, url);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await store.close();
  }
});

test('wiki is self-contained and sanitizes page scripts and event handlers', async () => {
  const { root, files } = await workspace();
  await writeFile(
    join(root, 'Wiki', 'Topic.md'),
    '# Topic\n\n<script>alert("bad")</script><img src="https://example.com/tracker" onerror="alert(1)">\n\n- [x] Done\n',
  );
  const wiki = new Wiki(files);
  await wiki.build();
  const html = await readFile(join(root, 'Wiki', 'index.html'), 'utf8');
  assert.ok(!html.includes('<script>alert('));
  const data = html.match(/const pages=(.*?); const list=/s)[1];
  const pages = JSON.parse(data);
  assert.ok(!pages[0].html.includes('onerror'));
  assert.ok(!pages[0].html.includes('https://example.com/tracker'));
  assert.match(pages[0].html, /disabled/);
});

test(
  'browser batches focus main content and block ungranted navigation',
  { timeout: 45000 },
  async () => {
    const { root } = await workspace();
    const server = createServer((request, response) => {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        '<nav>Navigation clutter</nav><main><h1>Fixture</h1><input aria-label="Query"><button onclick="document.querySelector(\'h1\').textContent=\'Updated\'">Read more</button></main>',
      );
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const browser = new Browser(root);
    try {
      await assert.rejects(browser.batch('thread', [{ kind: 'navigate', url }], []), /Authorize/);
      const result = await browser.batch(
        'thread',
        [
          { kind: 'navigate', url },
          { kind: 'fill', selector: 'input', text: 'Test' },
          { kind: 'click', selector: 'button' },
          { kind: 'read' },
        ],
        [url],
      );
      assert.match(result.results[0].text, /Updated/);
      assert.ok(!result.results[0].text.includes('Navigation clutter'));
      await assert.rejects(
        browser.batch('thread', [{ kind: 'navigate', url: 'https://example.com' }], [url]),
        /Authorize/,
      );
      await browser.batch('other-thread', [{ kind: 'navigate', url }], [url]);
      const queued = browser.batch('thread', [{ kind: 'navigate', url }], [url]);
      const rejected = assert.rejects(queued, /access changed/);
      await browser.revoke('thread', url);
      await rejected;
      await assert.rejects(browser.batch('thread', [{ kind: 'navigate', url }], []), /Authorize/);
      assert.match(
        (await browser.batch('other-thread', [{ kind: 'read' }], [url])).results[0].text,
        /Fixture/,
      );
    } finally {
      await browser.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
