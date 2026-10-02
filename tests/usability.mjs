import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:http';
const cache =
  process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = join(cache, 'ui-fixes-2026-10-01');
await mkdir(evidence, { recursive: true });
const bundle = join(evidence, 'usability-core.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export { Store } from './src/main/store'; export { Files } from './src/main/files'; export { Modules } from './src/main/modules'; export { Integrations } from './src/main/integrations'; export * from './src/shared/navigation';",
    resolveDir: resolve('.'),
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files, Modules, Integrations, parseItemLink, itemLink } = await import(
  pathToFileURL(bundle)
);
const enabled = [
  'chat',
  'notes',
  'todos',
  'wiki',
  'calendar',
  'expenses',
  'bookmarks',
  'news',
  'mail',
  'music',
  'board',
  'automations',
];
async function eventually(check) {
  let failure;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      await check();
      return;
    } catch (error) {
      failure = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw failure;
}

test(
  'Linkding reconciles upstream changes, preserves local fields, schedules refresh and stops cleanly',
  { timeout: 30000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-linkding-ux-'));
    const store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    let incoming = {
      id: 1,
      title: 'Original',
      url: 'https://example.com/old',
      description: 'Upstream',
      tag_names: ['read'],
    };
    let requests = 0;
    const server = createServer((_, response) => {
      requests++;
      response.end(JSON.stringify({ results: [incoming], next: null }));
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const auth = {
      secrets: {
        get: () => ({ url: `http://127.0.0.1:${server.address().port}`, token: 'fixture' }),
      },
    };
    const api = new Integrations(auth, store);
    try {
      const result = await Promise.all([api.importLinkding(), api.importLinkding()]);
      assert.equal(requests, 1);
      assert.equal(result[0].imported, 1);
      const [record] = await store.list('bookmarks');
      await store.patch('bookmarks', record.id, { description: 'My annotation' });
      incoming = {
        ...incoming,
        title: 'Updated title',
        url: 'https://example.com/new',
        description: 'New upstream',
        tag_names: ['new'],
      };
      const update = await api.importLinkding();
      assert.equal(update.updated, 1);
      assert.equal(update.preserved, 1);
      const saved = await store.get('bookmarks', record.id);
      assert.equal(saved.title, 'Updated title');
      assert.equal(saved.url, incoming.url);
      assert.equal(saved.description, 'My annotation');
      assert.deepEqual(saved.tags, ['new']);
      await store.put('settings', 'default', { enabled, linkdingRefreshMinutes: 60 });
      await api.checkRefresh(1000);
      assert.equal((await api.linkdingStatus()).nextRun, 3601000);
      const before = requests;
      await api.checkRefresh(3600999);
      assert.equal(requests, before);
      incoming.title = 'Scheduled change';
      await Promise.all([api.checkRefresh(3601000), api.checkRefresh(3601000)]);
      assert.equal(requests, before + 1);
      assert.equal((await store.get('bookmarks', record.id)).title, 'Scheduled change');
      await store.patch('settings', 'default', { linkdingRefreshMinutes: 0 });
      await api.checkRefresh(4000000);
      assert.equal((await api.linkdingStatus()).nextRun, 0);
      await api.stop();
      await api.checkRefresh(99999999);
      assert.equal(requests, before + 1);
    } finally {
      await api.stop();
      await store.close();
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);

test(
  'UI audit regressions: drafts, deletes, submissions, complete lists, themes, context and readable reviews',
  { timeout: 180000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-usability-'));
    const files = new Files(root);
    await files.initialize();
    await files.folder('Notes', 'Projects');
    await writeFile(join(root, 'Notes', 'Welcome.md'), '# Welcome\n\nKeep this note here.\n');
    await writeFile(
      join(root, 'Wiki', 'Research.md'),
      '# Research\n\n[Target task](clarity://item/todos?id=target-task)\n\n[Other topic](Other.md)\n',
    );
    await writeFile(join(root, 'Wiki', 'Other.md'), '# Other\n\nDetails.\n');
    const attachment = await files.attach(
      'preview.txt',
      Buffer.from('Attachment preview evidence'),
    );
    const store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    await store.put('settings', 'default', {
      enabled,
      theme: 'light',
      useDeviceLocation: false,
      locationRequested: true,
      lastChat: 'audit-chat',
    });
    await store.put('chats', 'audit-chat', {
      title: 'Audit chat',
      status: 'idle',
      messages: [],
      grants: [],
      attachments: [],
    });
    await store.put('todos', 'target-task', { title: 'Target task', done: false });
    await store.put('actions', 'pending', {
      owner: 'audit-chat',
      module: 'todos',
      method: 'update',
      args: { id: 'target-task', title: 'Reviewed title', revision: 1 },
      before: { title: 'Target task' },
      status: 'pending',
      description: 'todos: update',
    });
    await store.put('automations', 'job', {
      title: 'Maintain research',
      topicPath: 'Research.md',
      enabled: false,
      instruction: 'Maintain research',
      frequency: 'daily',
      hour: 9,
      minute: 0,
    });
    for (const status of ['pending', 'applied', 'rejected', 'failed'])
      await store.put('actions', `job-${status}`, {
        owner: 'automation:job',
        module: 'todos',
        method: 'add',
        args: { title: `${status} task` },
        status,
        error: status === 'failed' ? 'Fixture action failed' : undefined,
      });
    await store.put('board', 'root', {
      topic: 'Root thread',
      text: 'Ordinary root',
      threadId: null,
    });
    await store.put('board', 'reply', {
      topic: 'Root thread',
      text: 'Needle only in reply',
      threadId: 'root',
    });
    // An old-created event must remain visible amongst 2,000 newer-created records.
    const day = new Date();
    day.setHours(10, 0, 0, 0);
    const isoDay = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    await store.put('calendar', 'old-event', {
      title: 'Old future event',
      start: day.toISOString(),
      end: new Date(+day + 3600000).toISOString(),
    });
    for (let i = 0; i < 2001; i++) {
      await store.put('expenses', `expense-${i}`, {
        amountCents: 100,
        description: `Expense ${i}`,
        category: 'Fixture',
        date: isoDay,
      });
      if (i < 2000)
        await store.put('calendar', `past-${i}`, {
          title: `Past ${i}`,
          start: '2020-01-01T01:00:00Z',
          end: '2020-01-01T02:00:00Z',
        });
    }
    const modules = new Modules(store, files, {}, {}, () => {});
    const first = await modules.invoke('calendar', 'list', { limit: 2000 });
    const last = await modules.invoke('calendar', 'list', { limit: 2000, offset: 2000 });
    assert.equal(first.items.length, 2000);
    assert.equal(last.items.length, 1);
    assert.equal(new Set([...first.items, ...last.items].map((item) => item.id)).size, 2001);
    await store.close();
    let application;
    const errors = [];
    try {
      application = await require('playwright-core')._electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      page.setDefaultTimeout(10000);
      page.on('pageerror', (error) => errors.push(error.message));
      const nav = (name) =>
        page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
      const call = (method, args) =>
        page.evaluate(({ method, args }) => window.clarity.call(method, args), {
          method,
          args,
        });
      const invoke = (module, method, args = {}) => call('module', { module, method, args });
      await page.locator('.sidebar').waitFor();
      await page
        .getByRole('textbox', { name: 'Message', exact: true })
        .fill('Keep my unsent message');
      await page.reload();
      await eventually(async () =>
        assert.equal(
          await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(),
          'Keep my unsent message',
        ),
      );
      await page.getByText('Before', { exact: true }).waitFor();
      await page.getByText('After', { exact: true }).waitFor();
      assert.equal(await page.locator('.action-review details').getAttribute('open'), null);
      await page.screenshot({ path: join(evidence, 'approval.png') });
      await nav('Expenses');
      await eventually(async () =>
        assert.equal(
          await page.locator('.expense-day').first().locator(':scope > strong').textContent(),
          '2,001.00',
        ),
      );
      await page.getByRole('button', { name: 'New expense' }).click();
      await page.getByLabel('Amount', { exact: true }).pressSequentially('12345');
      await page.getByLabel('Category', { exact: true }).fill('Draft category');
      await page.getByLabel('Description', { exact: true }).fill('Draft description');
      await nav('Todos');
      await nav('Expenses');
      assert.equal(await page.getByLabel('Amount', { exact: true }).inputValue(), '123.45');
      await page.reload();
      await nav('Expenses');
      assert.equal(
        await page.getByLabel('Description', { exact: true }).inputValue(),
        'Draft description',
      );
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await nav('Todos');
      await page.getByRole('button', { name: 'Delete Target task', exact: true }).click();
      const confirmation = page.getByRole('dialog', { name: 'Delete Target task?' });
      await confirmation.waitFor();
      assert.equal((await invoke('todos', 'list')).items.length, 1);
      await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal((await invoke('todos', 'list')).items.length, 1);
      await page.getByRole('button', { name: 'Delete Target task', exact: true }).click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await eventually(async () =>
        assert.equal((await invoke('todos', 'list')).items.length, 0),
      );
      await invoke('todos', 'add', { title: 'Another task' });
      await nav('Bookmarks');
      await page.getByRole('button', { name: 'Add bookmark', exact: true }).click();
      const bookmarkDialog = page.getByRole('dialog', { name: 'Add bookmark', exact: true });
      await bookmarkDialog.getByLabel('Title', { exact: true }).fill('Double click bookmark');
      await bookmarkDialog.getByLabel('URL', { exact: true }).fill('https://example.com');
      await bookmarkDialog.getByRole('button', { name: 'Save', exact: true }).dblclick();
      await eventually(async () =>
        assert.equal((await invoke('bookmarks', 'list')).items.length, 1),
      );
      await page.getByRole('searchbox', { name: 'Search bookmarks' }).fill('no-match');
      await page.getByText('No results for “no-match”.', { exact: true }).waitFor();
      await nav('Calendar');
      await page.getByRole('button', { name: /Old future event/ }).waitFor();
      await page.getByRole('button', { name: 'Month', exact: true }).click();
      const viewed = new Date(day.getFullYear(), day.getMonth() + 2, 1);
      await page
        .locator(`[data-month="${viewed.getFullYear()}-${viewed.getMonth()}"]`)
        .evaluate((element) => element.scrollIntoView({ block: 'start' }));
      const monthText = viewed.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
      await page.getByRole('heading', { name: monthText, exact: true }).waitFor();
      await page.getByRole('button', { name: 'Event', exact: true }).click();
      const eventDialog = page.getByRole('dialog', { name: 'New event' });
      const start = await eventDialog.getByLabel('Start', { exact: true }).inputValue();
      assert.equal(new Date(start).getMonth(), viewed.getMonth());
      await eventDialog.getByLabel('Title', { exact: true }).fill('Double click event');
      await eventDialog.getByRole('button', { name: 'Save', exact: true }).dblclick();
      await eventually(async () =>
        assert.equal(
          (await invoke('calendar', 'list', { query: 'Double click event' })).items.length,
          1,
        ),
      );
      await page.getByRole('button', { name: 'Week', exact: true }).click();
      await page.getByRole('button', { name: /Double click event/ }).waitFor();
      await nav('Notes');
      await page.getByRole('button', { name: 'Welcome', exact: true }).click();
      await page.getByRole('button', { name: /Projects/ }).click();
      await page.getByRole('button', { name: 'Rename', exact: true }).click();
      await page.getByRole('dialog').getByRole('textbox').fill('Renamed');
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Save', exact: true })
        .dblclick();
      await eventually(async () =>
        assert.match(
          await readFile(join(root, 'Notes', 'Renamed.md'), 'utf8'),
          /Keep this note here/,
        ),
      );
      await assert.rejects(access(join(root, 'Notes', 'Projects', 'Renamed.md')));
      await page.locator('.note-tabs').getByText('Renamed.md', { exact: true }).waitFor();
      await nav('Automations');
      const job = page
        .locator('.automation-list > article')
        .filter({ hasText: 'Maintain research' });
      for (const label of ['Needs approval', 'Completed', 'Dismissed', 'Failed'])
        await job.getByText(label, { exact: true }).waitFor();
      await job.getByText('Fixture action failed', { exact: true }).waitFor();
      await page.screenshot({ path: join(evidence, 'automation-history.png') });
      await nav('Agent board');
      await page.getByRole('searchbox', { name: 'Search board' }).fill('Needle');
      await page.getByRole('button', { name: /Root thread.*Matching reply: Needle/ }).click();
      await page.getByText('Needle only in reply', { exact: true }).waitFor();
      await nav('News');
      await page.getByRole('button', { name: 'Sources', exact: true }).click();
      await page.getByLabel('Name', { exact: true }).fill('Invalid source');
      await page.getByLabel('Feed URL', { exact: true }).fill('ftp://example.com');
      await page.getByRole('button', { name: 'Add source', exact: true }).click();
      await page.getByRole('dialog').getByRole('alert').waitFor();
      assert.equal(await page.locator('.toast').count(), 0);
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Close', exact: true })
        .click();
      await nav('Mail');
      await page.getByRole('button', { name: 'Connect Google', exact: true }).click();
      assert.ok((await page.locator('#settings-google').boundingBox()).y < 300);
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Linkding', exact: true })
        .click();
      await page
        .locator('#settings-linkding')
        .getByLabel('Server address', { exact: true })
        .fill('http://127.0.0.1:1');
      await page.getByLabel('API token', { exact: true }).fill('fixture');
      await page.getByRole('button', { name: 'Connect Linkding', exact: true }).click();
      await page.locator('#settings-linkding').getByRole('alert').waitFor();
      assert.ok((await page.locator('#settings-linkding [role=alert]').boundingBox()).y > 0);
      await page.screenshot({ path: join(evidence, 'settings-error.png') });
      await call('settings.save', { theme: 'dark' });
      await page.emulateMedia({ colorScheme: 'light' });
      await nav('Wiki');
      const wiki = page.frameLocator('iframe');
      await wiki.getByRole('link', { name: 'Research', exact: true }).click();
      const colors = await wiki.locator('html').evaluate((element) => ({
        color: getComputedStyle(element).color,
        background: getComputedStyle(element).backgroundColor,
        scheme: getComputedStyle(element).colorScheme,
      }));
      assert.equal(colors.scheme, 'dark');
      assert.notEqual(colors.color, colors.background);
      assert.equal(colors.color, 'rgb(231, 231, 231)');
      await page.screenshot({ path: join(evidence, 'wiki-dark.png') });
      await page.getByRole('button', { name: 'Ask in chat', exact: true }).click();
      await page.getByRole('button', { name: 'Remove wiki context', exact: true }).waitFor();
      assert.match(
        await page.locator('.composer .attachment-chip').first().textContent(),
        /Wiki\/Research.md/,
      );
      // The removed record is reported explicitly through the same canonical link.
      await nav('Wiki');
      await wiki.getByRole('link', { name: 'Research', exact: true }).click();
      await wiki.getByRole('link', { name: 'Target task', exact: true }).click();
      await page
        .getByText('This item is no longer available in this module.', { exact: true })
        .waitFor();
      // OS URL delivery resolves a particular record without mutating it.
      const task = (await invoke('todos', 'list')).items[0];
      await application.evaluate(
        ({ app }, url) => app.emit('open-url', { preventDefault() {} }, url),
        itemLink({ module: 'todos', id: task.id }),
      );
      await page.locator(`[data-item-id="${task.id}"][data-focused=true]`).waitFor();
      // Restore a composer attachment using the persisted draft format.
      await page.evaluate(
        (attachment) =>
          localStorage.setItem(
            'clarity:draft:chat:audit-chat:attachments',
            JSON.stringify([attachment]),
          ),
        attachment,
      );
      await page.reload();
      await page.getByRole('button', { name: 'preview.txt', exact: true }).click();
      await page
        .getByRole('dialog', { name: 'preview.txt' })
        .getByText('Attachment preview evidence', { exact: true })
        .waitFor();
      await application.evaluate(({ shell }) => {
        globalThis.revealed = [];
        shell.showItemInFolder = (path) => globalThis.revealed.push(path);
      });
      await page.getByRole('button', { name: 'Show in Finder', exact: true }).click();
      assert.match(
        (await application.evaluate(() => globalThis.revealed))[0],
        /Attachments.*preview.txt$/,
      );
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Close', exact: true })
        .click();
      assert.equal(parseItemLink('clarity://item/notes?path=..%2Fsecret'), undefined);
      assert.deepEqual(
        parseItemLink(itemLink({ module: 'notes', path: 'A folder/Note.md' })),
        {
          module: 'notes',
          path: 'A folder/Note.md',
        },
      );
      assert.deepEqual(errors, []);
      await writeFile(
        join(evidence, 'ui-regressions.json'),
        JSON.stringify({ root, colors, passed: true }, null, 2),
      );
    } catch (error) {
      const page = application && (await application.windows())[0];
      if (page) {
        await page.screenshot({ path: join(evidence, 'failure.png') }).catch(() => {});
        await writeFile(join(evidence, 'failure.html'), await page.content()).catch(() => {});
      }
      throw error;
    } finally {
      await application?.close();
    }
  },
);

test(
  'Mail and Music preserve navigation with controlled results; primary hover keeps contrast at minimum window size',
  { timeout: 60000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-navigation-ux-'));
    let application;
    try {
      application = await require('playwright-core')._electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      const page = await application.firstWindow();
      page.setDefaultTimeout(8000);
      await page.locator('.sidebar').waitFor();
      await page.evaluate(
        (enabled) => window.clarity.call('settings.save', { enabled }),
        enabled,
      );
      await application.evaluate(({ ipcMain, BrowserWindow }) => {
        const original = ipcMain._invokeHandlers.get('clarity:call');
        const artist = {
          id: 'artist',
          source: 'spotify',
          type: 'artist',
          title: 'Fixture artist',
        };
        const album = {
          id: 'album',
          source: 'spotify',
          type: 'album',
          title: 'Fixture album',
        };
        ipcMain.removeHandler('clarity:call');
        ipcMain.handle('clarity:call', async (event, method, args) => {
          if (method === 'bootstrap') {
            const result = await original(event, method, args);
            result.value.auth.google = true;
            result.value.auth.spotify = true;
            return result;
          }
          if (method === 'module' && args.module === 'mail') {
            if (args.method === 'read')
              return {
                ok: true,
                value: {
                  subject: `Subject ${args.args.id}`,
                  from: 'fixture@example.com',
                  text: `Body ${args.args.id}`,
                },
              };
            const token = args.args.pageToken || 'first';
            return {
              ok: true,
              value: {
                messages: [
                  { id: token, subject: `Subject ${token}`, from: 'fixture@example.com' },
                ],
                nextPage:
                  token === 'first' ? 'second' : token === 'second' ? 'third' : undefined,
              },
            };
          }
          if (method === 'module' && args.module === 'music') {
            if (args.method === 'collection')
              return {
                ok: true,
                value: {
                  item: args.args.id === 'artist' ? artist : album,
                  items:
                    args.args.id === 'artist'
                      ? [album]
                      : [
                          {
                            id: 'song',
                            type: 'song',
                            source: 'spotify',
                            title: 'Fixture song',
                          },
                        ],
                },
              };
            if (args.method === 'search') {
              if (args.args.query === 'no-match')
                await new Promise((resolve) => setTimeout(resolve, 400));
              return {
                ok: true,
                value: { items: args.args.query === 'no-match' ? [] : [artist] },
              };
            }
            return { ok: true, value: args.method === 'recent' ? [] : { items: [] } };
          }
          return original(event, method, args);
        });
        BrowserWindow.getAllWindows()[0].setSize(850, 600);
      });
      await page.reload();
      const nav = (name) =>
        page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
      await nav('Mail');
      await page.getByRole('button', { name: 'Older messages', exact: true }).click();
      await page.getByRole('button', { name: /Subject second/ }).click();
      await page.getByRole('heading', { name: 'Subject second', exact: true }).waitFor();
      await nav('Todos');
      await nav('Mail');
      await page.getByRole('heading', { name: 'Subject second', exact: true }).waitFor();
      await page.getByRole('button', { name: /Subject second/ }).waitFor();
      await page.getByRole('button', { name: 'Older messages', exact: true }).click();
      await page.getByRole('button', { name: /Subject third/ }).waitFor();
      await page.getByRole('button', { name: 'Previous page', exact: true }).click();
      await page.getByRole('button', { name: /Subject second/ }).waitFor();
      await nav('Music');
      await page.getByRole('searchbox', { name: 'Search music' }).fill('artist');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByRole('button', { name: /Fixture artist/ }).click();
      await page.getByRole('button', { name: /Fixture album/ }).click();
      await page.getByRole('heading', { name: 'Fixture album' }).waitFor();
      await nav('Todos');
      await nav('Music');
      await page.getByRole('heading', { name: 'Fixture album' }).waitFor();
      await page.getByRole('button', { name: 'Back to music list', exact: true }).click();
      await page.getByRole('heading', { name: 'Fixture artist' }).waitFor();
      await page.getByRole('button', { name: 'Back to music list', exact: true }).click();
      assert.equal(
        await page.getByRole('searchbox', { name: 'Search music' }).inputValue(),
        'artist',
      );
      await page.getByRole('button', { name: 'Songs', exact: true }).click();
      await page.getByRole('button', { name: 'Show grid', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Show grid', exact: true }).click();
      await nav('Todos');
      await nav('Music');
      await page.getByRole('button', { name: 'Show grid', exact: true }).waitFor();
      await page.getByRole('searchbox', { name: 'Search music' }).fill('no-match');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await page.getByText('Loading…', { exact: true }).waitFor();
      await page.getByText('No results for “no-match”.', { exact: true }).waitFor();
      await page.screenshot({ path: join(evidence, 'music-empty-minimum.png') });
      await nav('Todos');
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Hover target');
      const add = page.getByRole('button', { name: 'Add', exact: true });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => window.clarity.call('settings.save', { theme }), theme);
        await page.waitForFunction(
          (theme) => document.documentElement.dataset.theme === theme,
          theme,
        );
        await add.hover();
        await eventually(async () => {
          const colors = await add.evaluate((element) => ({
            background: getComputedStyle(element).backgroundColor,
            color: getComputedStyle(element).color,
            accent: getComputedStyle(document.documentElement)
              .getPropertyValue('--accent')
              .trim(),
          }));
          assert.equal(
            colors.background,
            theme === 'light' ? 'rgb(79, 79, 79)' : 'rgb(214, 214, 214)',
          );
          assert.equal(
            colors.color,
            theme === 'light' ? 'rgb(252, 252, 252)' : 'rgb(24, 24, 24)',
          );
        });
      }
      await page.screenshot({ path: join(evidence, 'todos-hover-minimum.png') });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
    } catch (error) {
      const page = application && (await application.windows())[0];
      if (page) {
        await page.screenshot({ path: join(evidence, 'failure.png') }).catch(() => {});
        await writeFile(join(evidence, 'failure.html'), await page.content()).catch(() => {});
      }
      throw error;
    } finally {
      await application?.close();
    }
  },
);
