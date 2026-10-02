import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const source = resolve(process.env.CLARITY_QA_SOURCE || '.');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = process.env.CLARITY_QA_EVIDENCE || join(cache, 'adversarial-services-evidence');
await mkdir(evidence, { recursive: true });
const bundle = join(cache, 'adversarial-services-tests.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export {Store} from './src/main/store'; export {Files} from './src/main/files'; export {Modules} from './src/main/modules'; export {Integrations} from './src/main/integrations';",
    resolveDir: source,
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files, Modules, Integrations } = await import(pathToFileURL(bundle));
const enabled = [
  'chat',
  'notes',
  'wiki',
  'todos',
  'calendar',
  'expenses',
  'bookmarks',
  'news',
  'board',
  'automations',
];
const outcomes = [];
const hashes = {};
for (const file of ['src/main/files.ts', 'src/main/modules.ts', 'src/main/integrations.ts'])
  hashes[file] = createHash('sha256')
    .update(await readFile(join(source, file)))
    .digest('hex');
await writeFile(join(evidence, 'service-source.json'), JSON.stringify({ source, hashes }, null, 2));
async function record(name, value) {
  outcomes.push({ name, ...value });
  await writeFile(join(evidence, 'results.json'), JSON.stringify(outcomes, null, 2));
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'clarity-adversarial-services-'));
  const files = new Files(root);
  await files.initialize();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  const integrations = new Integrations({}, store);
  const modules = new Modules(store, files, integrations, {}, () => {});
  await modules.saveSettings({ enabled });
  return { root, files, store, modules };
}
test('QA05 rejects undiscoverable create, folder and move destinations without touching documents', async () => {
  const { store, modules, files, root } = await fixture();
  try {
    let note = await modules.invoke('notes', 'create', {
      title: 'Discoverable',
    });
    note = await modules.invoke('notes', 'write', {
      ...note,
      text: 'Retained human content',
    });
    for (const to of [
      '.hidden.md',
      '.private/Moved.md',
      'assets/Moved.md',
      'Assets/Moved.md',
      'Visible/.private/Moved.md',
      'Visible/../.hidden.md',
    ])
      await assert.rejects(modules.invoke('notes', 'move', { path: note.path, to }), /dot|assets/);
    for (const path of ['.private', 'Visible/.private', 'assets', 'Assets'])
      await assert.rejects(modules.invoke('notes', 'folder', { path }), /dot|assets/);
    for (const args of [
      { title: '.hidden' },
      { folder: '.private', title: 'Hidden' },
      { title: '.md' },
    ])
      await assert.rejects(modules.invoke('notes', 'create', args), /dot|assets/);
    assert.equal((await files.read('Notes', note.path)).text, 'Retained human content');
    assert.equal((await files.list('Notes', 'Retained human')).length, 1);
    await assert.rejects(access(join(root, 'Notes', '.hidden.md')));
    await modules.invoke('notes', 'folder', { path: 'Projects' });
    await modules.invoke('notes', 'move', {
      path: note.path,
      to: 'Projects/Visible.md',
    });
    assert.equal((await files.list('Notes', 'Visible'))[0].path, 'Projects/Visible.md');
    assert.equal((await files.read('Notes', 'Projects/Visible.md')).text, note.text);
    await record('QA05 service', {
      rejectedHiddenDestinations: 13,
      visibleMove: 'Projects/Visible.md',
      contentPreserved: true,
    });
  } finally {
    await store.close();
  }
});

test('QA07 every structured update and delete requires a valid revision and preserves newer edits', async () => {
  const { store, modules, files } = await fixture();
  const definitions = {
    todos: { title: 'Task' },
    calendar: {
      title: 'Event',
      start: '2026-10-02T09:00:00+08:00',
      end: '2026-10-02T10:00:00+08:00',
    },
    expenses: {
      amountCents: 100,
      category: 'Food',
      description: 'Lunch',
      date: '2026-10-02',
    },
    bookmarks: { title: 'Bookmark', url: 'https://example.com/' },
    automations: {
      title: 'Job',
      instruction: 'Maintain this topic',
      topicPath: 'Topic.md',
      frequency: 'daily',
      hour: 12,
      minute: 0,
    },
  };
  try {
    for (const [module, fields] of Object.entries(definitions)) {
      const item = await modules.invoke(module, 'add', fields);
      for (const revision of [
        undefined,
        null,
        0,
        -1,
        '1',
        1.5,
        true,
        Number.MAX_SAFE_INTEGER + 1,
      ]) {
        await assert.rejects(
          modules.invoke(module, 'update', {
            id: item.id,
            ...fields,
            revision,
          }),
          /revision/,
        );
        await assert.rejects(
          modules.invoke(module, 'remove', { id: item.id, revision }),
          /revision/,
        );
      }
      const queuedUpdate = await modules.agent('fixture-chat', module, 'update', {
        id: item.id,
        ...fields,
      });
      const queuedRemove = await modules.agent('fixture-chat', module, 'remove', { id: item.id });
      const newer = await modules.invoke(module, 'update', {
        id: item.id,
        ...fields,
        revision: item.revision,
        ...(module === 'expenses'
          ? { description: 'Newer human edit' }
          : { title: 'Newer human edit' }),
      });
      for (const pending of [queuedUpdate, queuedRemove]) {
        await assert.rejects(modules.approve(pending.actionId, true), /revision/);
        assert.equal((await store.get('actions', pending.actionId)).status, 'failed');
      }
      assert.deepEqual(await store.get(module, item.id), newer);
      for (const method of ['update', 'remove'])
        await assert.rejects(
          modules.invoke(module, method, {
            id: item.id,
            ...fields,
            revision: item.revision,
          }),
          /changed|conflict/i,
        );
      await modules.saveSettings({
        autoApproveActions: [`${module}.update`, `${module}.remove`],
      });
      for (const method of ['update', 'remove'])
        await assert.rejects(
          modules.agent('fixture-chat', module, method, {
            id: item.id,
            ...fields,
          }),
          /revision/,
        );
      assert.deepEqual(await store.get(module, item.id), newer);
      const actions = (await store.list('actions')).filter(
        (action) => action.module === module && action.autoApproved,
      );
      assert.equal(actions.length, 2);
      assert.ok(actions.every((action) => action.status === 'failed'));
      await modules.invoke(module, 'remove', {
        id: item.id,
        revision: newer.revision,
      });
      assert.equal(await store.get(module, item.id), null);
      await modules.saveSettings({ autoApproveActions: [] });
    }
    const source = await modules.invoke('news', 'addSource', {
      title: 'Feed',
      url: 'https://example.com/feed',
    });
    await assert.rejects(modules.invoke('news', 'removeSource', { id: source.id }), /revision/);
    const pending = await modules.agent('fixture-chat', 'news', 'removeSource', { id: source.id });
    await assert.rejects(modules.approve(pending.actionId, true), /revision/);
    const newer = await store.patch('news-sources', source.id, {
      title: 'Newer feed',
    });
    await assert.rejects(
      modules.invoke('news', 'removeSource', {
        id: source.id,
        revision: source.revision,
      }),
      /changed|conflict/i,
    );
    await modules.invoke('news', 'removeSource', {
      id: source.id,
      revision: newer.revision,
    });
    await record('QA07 revisions', {
      modules: Object.keys(definitions),
      directMalformedRevisions: 80,
      pendingAndAutomaticFailuresPreserveHumanEdits: true,
      newsSourceDeletionGuarded: true,
    });
  } finally {
    await store.close();
  }
});

test('QA08 Expenses rejects impossible dates on add/update and approved execution', async () => {
  const { store, modules } = await fixture();
  const fields = { amountCents: 100, category: 'Food', description: 'Lunch' };
  try {
    const item = await modules.invoke('expenses', 'add', {
      ...fields,
      date: '2028-02-29',
    });
    for (const date of [
      '2026-02-30',
      '2026-13-40',
      '0000-00-00',
      '2026-04-31',
      '1900-02-29',
      '0000-01-01',
      '2026-1-02',
      true,
      ['2026-10-02'],
    ]) {
      await assert.rejects(
        modules.invoke('expenses', 'add', { ...fields, date }),
        /valid expense date/,
      );
      await assert.rejects(
        modules.invoke('expenses', 'update', {
          id: item.id,
          revision: item.revision,
          date,
        }),
        /valid expense date/,
      );
    }
    const pending = await modules.agent('fixture-chat', 'expenses', 'add', {
      ...fields,
      date: '2026-02-30',
    });
    await assert.rejects(modules.approve(pending.actionId, true), /valid expense date/);
    for (const date of ['0001-01-01', '2000-02-29', '9999-12-31'])
      assert.equal((await modules.invoke('expenses', 'add', { ...fields, date })).date, date);
    assert.deepEqual(await store.get('expenses', item.id), item);
    assert.equal((await store.list('expenses')).length, 4);
    await record('QA08 expense dates', {
      invalidAddsAndUpdatesRejected: 18,
      approvalRejected: true,
      validLeapCenturyAndYearBoundsPreserved: true,
    });
  } finally {
    await store.close();
  }
});

test('QA08 Calendar validates original date and time components before timezone conversion', async () => {
  const { store, modules } = await fixture();
  try {
    const item = await modules.invoke('calendar', 'add', {
      title: 'Leap event',
      start: '2028-02-29T23:30:00-08:00',
      end: '2028-03-01T00:30:00-08:00',
    });
    for (const start of [
      '2026-02-30T09:00:00+08:00',
      '2026-04-31T09:00:00Z',
      '1900-02-29T09:00:00Z',
      '0000-01-01T09:00:00Z',
      '2026-10-02T24:00:00Z',
      '2026-10-02T09:60:00Z',
      '2026-10-02T09:00:60Z',
      '2026-10-02',
      0,
    ]) {
      await assert.rejects(
        modules.invoke('calendar', 'add', {
          title: 'Invalid',
          start,
          end: '2028-03-02T10:00:00Z',
        }),
        /valid start and end/,
      );
      await assert.rejects(
        modules.invoke('calendar', 'update', {
          id: item.id,
          revision: item.revision,
          start,
        }),
        /valid start and end/,
      );
    }
    await assert.rejects(
      modules.invoke('calendar', 'update', {
        id: item.id,
        revision: item.revision,
        end: '2028-02-30T10:00:00Z',
      }),
      /valid start and end/,
    );
    await assert.rejects(
      modules.invoke('calendar', 'add', {
        title: 'Reversed',
        start: item.end,
        end: item.start,
      }),
      /after the start/,
    );
    const pending = await modules.agent('fixture-chat', 'calendar', 'add', {
      title: 'Invalid approved',
      start: '2026-02-30T09:00:00+08:00',
      end: '2026-02-30T10:00:00+08:00',
    });
    await assert.rejects(modules.approve(pending.actionId, true), /valid start and end/);
    assert.deepEqual(await store.get('calendar', item.id), item);
    for (const [start, end] of [
      ['2000-02-29T09:00', '2000-02-29T10:00'],
      ['0001-01-01T09:00:00Z', '0001-01-01T10:00:00Z'],
      ['9999-12-31T09:00:00+05:45', '9999-12-31T10:00:00+05:45'],
    ])
      assert.equal(
        (
          await modules.invoke('calendar', 'add', {
            title: 'Valid',
            start,
            end,
          })
        ).start,
        start,
      );
    await record('QA08 calendar dates', {
      originalComponentsChecked: true,
      invalidEndAndReversedRangeRejected: true,
      validOffsetsLeapAndLocalDateTimesPreserved: true,
    });
  } finally {
    await store.close();
  }
});

test('QA09 replies require an existing root and valid IDs, with approval and restart checks', async () => {
  let { store, modules, files, root } = await fixture();
  try {
    const thread = await modules.invoke('board', 'post', {
      topic: 'Research',
      text: 'Root thread',
    });
    const reply = await modules.invoke('board', 'post', {
      topic: 'Research',
      text: 'Reply needle',
      threadId: thread.id,
    });
    for (const threadId of ['missing-parent', reply.id, 123, {}, '', false])
      await assert.rejects(
        modules.invoke('board', 'post', {
          topic: 'Research',
          text: 'Invalid reply',
          threadId,
        }),
        /root thread|Thread ID/,
      );
    const pending = await modules.agent('fixture-chat', 'board', 'post', {
      topic: 'Research',
      text: 'Orphan',
      threadId: 'missing-parent',
    });
    await assert.rejects(modules.approve(pending.actionId, true), /root thread/);
    assert.equal((await store.list('board')).length, 2);
    assert.equal((await modules.invoke('board', 'read', { id: reply.id })).thread.id, thread.id);
    assert.equal(
      (
        await modules.invoke('board', 'list', {
          query: 'needle',
          threads: true,
        })
      ).items[0].id,
      thread.id,
    );
    await store.close();
    store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    modules = new Modules(store, files, {}, {}, () => {});
    const read = await modules.invoke('board', 'read', { id: reply.id });
    assert.equal(read.thread.id, thread.id);
    assert.equal(read.replies.length, 1);
    await record('QA09 board parent', {
      malformedMissingAndReplyParentsRejected: 6,
      approvalRejected: true,
      readSearchAndRestartPreserved: true,
    });
  } finally {
    await store.close();
  }
});

async function feedServer() {
  const server = createServer((request, response) => {
    if (request.url === '/failed') {
      response.writeHead(503);
      response.end('Fixture unavailable');
      return;
    }
    response.setHeader('Content-Type', 'application/xml');
    if (request.url === '/entities') {
      response.end(
        '<!DOCTYPE rss [<!ENTITY custom "unsupported">]><rss><channel><item><title>&custom;</title><link>https://example.com/forbidden</link></item></channel></rss>',
      );
      return;
    }
    if (request.url === '/atom') {
      response.end(
        '<feed><entry><title>Atom &#x1F680; &amp; Science</title><link href="https://example.com/atom?a=1&amp;b=2"/><updated>2026-10-02T09:00:00Z</updated></entry></feed>',
      );
      return;
    }
    response.end(
      '<rss><channel><item><title>QA Research &amp; Development &#8212; &#x1F680;</title><link>https://example.com/news</link></item><item><title><![CDATA[<b>Readable</b> &amp; safe<script>forbidden()</script>]]></title><link>https://example.com/safe</link></item><item><title>&lt;b&gt;Encoded&lt;/b&gt; &amp; safe&lt;script&gt;forbidden()&lt;/script&gt;</title><link>https://example.com/encoded</link></item></channel></rss>',
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
test('QA10 RSS and Atom decode text and URLs, sanitize markup and reject entity declarations', async () => {
  const { store, modules } = await fixture();
  const { server, url } = await feedServer();
  try {
    for (const path of ['/rss', '/atom', '/failed', '/entities'])
      await modules.invoke('news', 'addSource', {
        title: path,
        url: url + path,
      });
    const result = await modules.invoke('news', 'refresh');
    assert.equal(result.imported, 4);
    assert.equal(result.errors.length, 2);
    assert.ok(result.errors.some((error) => error.includes('HTTP 503')));
    assert.ok(result.errors.some((error) => error.includes('entities')));
    const articles = await store.list('news');
    assert.ok(articles.some((article) => article.title === 'QA Research & Development — 🚀'));
    assert.ok(articles.some((article) => article.title === 'Atom 🚀 & Science'));
    assert.ok(articles.some((article) => article.title === 'Readable & safe'));
    assert.ok(articles.some((article) => article.title === 'Encoded & safe'));
    assert.ok(
      articles.every(
        (article) => !article.title.includes('forbidden') && !article.title.includes('<script'),
      ),
    );
    assert.ok(
      articles
        .filter((article) => article.url.includes('?'))
        .every((article) => article.url.endsWith('?a=1&b=2')),
    );
    const headline = articles.find((article) => article.title.startsWith('QA Research'));
    const encoded = await store.patch('news', headline.id, {
      title: 'QA Research &amp; Development &#8212; &#x1F680;',
    });
    assert.equal((await modules.invoke('news', 'refresh')).imported, 0);
    const repaired = await store.get('news', headline.id);
    assert.equal(repaired.title, headline.title);
    assert.equal(repaired.id, encoded.id);
    assert.equal(repaired.published, encoded.published);
    assert.equal(repaired.createdAt, encoded.createdAt);
    assert.equal((await store.list('news')).length, 4);
    await record('QA10 feed text', {
      titles: articles.map((article) => article.title),
      errors: result.errors,
      decodedQueryStrings: true,
      duplicateRefreshImported: 0,
      existingTitleRepairedWithOriginalDates: true,
    });
  } finally {
    await store.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

test(
  'QA05 and QA10 native Rename and News Sources preserve visible and saved outcomes',
  { timeout: 60000 },
  async () => {
    const { root, files, store } = await fixture();
    let note = await files.create('Notes', '', 'Discoverable');
    await files.save('Notes', note.path, 'Retained native human content', note.version);
    await store.close();
    const { server, url } = await feedServer();
    const { _electron: electron } = require('playwright-core');
    let app;
    try {
      app = await electron.launch({
        executablePath: process.env.CLARITY_TEST_EXECUTABLE || require('electron'),
        args: [process.env.CLARITY_TEST_MAIN || join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await app.firstWindow();
      await page.locator('.sidebar').waitFor();
      const nav = (name) =>
        page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
      await nav('Notes');
      await page.getByRole('button', { name: 'Discoverable', exact: true }).click();
      await page.getByRole('button', { name: 'Rename', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Rename note' });
      await dialog.getByRole('textbox').fill('.hidden-draft');
      await dialog.getByRole('button', { name: 'Save', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      assert.match(await dialog.getByRole('alert').innerText(), /dot/);
      assert.equal(
        await readFile(join(root, 'Notes', 'Discoverable.md'), 'utf8'),
        'Retained native human content',
      );
      await assert.rejects(access(join(root, 'Notes', '.hidden-draft.md')));
      await page.screenshot({
        path: join(evidence, 'QA05-rename-rejected.png'),
      });
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.locator('.note-tabs').getByText('Discoverable.md', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Discoverable', exact: true }).waitFor();
      await nav('News');
      await page.getByRole('button', { name: 'Sources', exact: true }).click();
      for (const [name, path] of [
        ['RSS fixture', '/rss'],
        ['Unavailable fixture', '/failed'],
      ]) {
        await page.getByLabel('Name', { exact: true }).fill(name);
        await page.getByLabel('Feed URL', { exact: true }).fill(url + path);
        await page.getByRole('button', { name: 'Add source', exact: true }).click();
        await page.getByRole('dialog').getByText(name, { exact: true }).waitFor();
      }
      await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Refresh', exact: true }).click();
      await page.getByRole('button', { name: /QA Research & Development — 🚀/ }).waitFor();
      await page.getByText(/Unavailable fixture: HTTP 503/).waitFor();
      const invoke = (module, method, args) =>
        page.evaluate(
          async ({ module, method, args }) => {
            return window.clarity.call('module', {
              module,
              method,
              args,
            });
          },
          { module, method, args },
        );
      const saved = await invoke('news', 'list', {});
      assert.ok(saved.items.some((article) => article.title === 'QA Research & Development — 🚀'));
      assert.ok(saved.items.some((article) => article.title === 'Readable & safe'));
      await page.screenshot({
        path: join(evidence, 'QA10-news-entities-and-error.png'),
      });
      await page.reload();
      await page.locator('.sidebar').waitFor();
      await nav('Notes');
      await page.getByRole('button', { name: 'Discoverable', exact: true }).waitFor();
      await nav('News');
      await page.getByRole('button', { name: /QA Research & Development — 🚀/ }).waitFor();
      await record('QA05/QA10 native Electron', {
        renameRejectedLocally: true,
        originalTabTreeAndFilePreserved: true,
        headlinesAndFailureVisible: true,
        savedTitlesAndReloadVerified: true,
      });
    } finally {
      if (app) await app.close();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
