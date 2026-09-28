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
      "export {Files} from './src/main/files'; export {Store} from './src/main/store'; export {Modules} from './src/main/modules'; export {Integrations} from './src/main/integrations'; export {Wiki} from './src/main/wiki'; export {Browser} from './src/main/browser'; export {Music} from './src/main/music'; export {Automations} from './src/main/automations';",
    resolveDir: resolve('.'),
  },
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  outfile: bundle,
});
const { Files, Store, Modules, Integrations, Wiki, Browser, Music, Automations } = await import(
  pathToFileURL(bundle)
);
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
  const auth = { secrets: { get: (provider) => (provider === 'spotify' ? {} : undefined) } };
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
  await music.invoke('play', {
    source: 'navidrome',
    id: 'local-song',
    title: 'Local song',
    type: 'song',
  });
  assert.ok(
    events.findIndex((event) => event.stopped) <
      events.findIndex(
        (event) => event.data?.action === 'play' && event.data.source === 'navidrome',
      ),
  );
  await music.close();
  assert.equal(events.at(-2).data.action, 'stop');
});

test('automations skip missed runs, preserve failed inputs and keep output outside chats', async () => {
  const { root, files } = await workspace();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  const modules = new Modules(store, files, {}, {}, () => {});
  await modules.saveSettings({ enabled: ['chat', 'notes', 'todos', 'wiki', 'automations'] });
  let prompts = 0;
  const chats = {
    makeAgent: async () => ({
      state: {
        messages: [
          { content: [{ type: 'text', text: 'Checked new information.' }], stopReason: 'stop' },
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
    await store.patch('automations', rule.id, { nextRun: Date.now() - 100000, status: 'running' });
    await automations.start();
    const recovered = await store.get('automations', rule.id);
    assert.equal(recovered.status, 'interrupted');
    assert.ok(recovered.nextRun > Date.now());
    await automations.run(rule.id);
    assert.equal(prompts, 0);
    const completed = await store.get('automations', rule.id);
    await store.put('todos', 'new-task', { title: 'New research fact', done: false });
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
    const result = await modules.agent('test-chat', 'todos', 'add', { title: 'Apply once' });
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
      modules.invoke('todos', 'update', { id: task.id, revision: task.revision, title: 'Stale' }),
      /changed/,
    );
    const rejected = await modules.agent('test-chat', 'todos', 'add', { title: 'Never applied' });
    await modules.approve(rejected.actionId, false);
    assert.equal((await store.list('todos')).length, 1);
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
    secrets: { get: (key) => secrets.get(key), set: async (key, value) => secrets.set(key, value) },
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
      response.end(JSON.stringify({ 'subsonic-response': { status: 'ok', version: '1.16.1' } }));
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
    await store.patch('bookmarks', bookmark.id, { description: 'My annotation' });
    assert.equal((await api.importLinkding()).imported, 0);
    assert.equal((await store.get('bookmarks', bookmark.id)).description, 'My annotation');
    await store.put('news-sources', 'fixture', {
      title: 'Fixture',
      url: url + '/feed',
      enabled: true,
    });
    assert.equal((await api.refreshNews()).imported, 1);
    assert.equal((await api.refreshNews()).imported, 0);
    await api.configure('navidrome', { url, username: 'reader', password: 'test-password' });
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
    } finally {
      await browser.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
