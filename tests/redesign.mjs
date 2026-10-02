import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const cache =
  process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = join(cache, 'redesign-port-20261001');
await mkdir(evidence, { recursive: true });
const bundle = join(evidence, 'redesign-core.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export {Store} from './src/main/store'; export {Files} from './src/main/files'; export {searchLocal} from './src/main/launcher'; export * from './src/shared/commands';",
    resolveDir: resolve('.'),
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files, searchLocal, parseCommand, normalizeCommand, similarCommand } =
  await import(pathToFileURL(bundle));
const enabled = [
  'chat',
  'notes',
  'todos',
  'wiki',
  'calendar',
  'expenses',
  'mail',
  'news',
  'bookmarks',
  'music',
  'board',
  'automations',
];
async function eventually(check) {
  let failure;
  for (let i = 0; i < 80; i++) {
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

test('command parsing proposes bounded editable fields and local search never calls providers', async () => {
  const now = new Date(2026, 9, 1, 12);
  assert.deepEqual(parseCommand('task Review draft tomorrow', now), {
    command: 'task',
    fields: { title: 'Review draft', date: '2026-10-02' },
  });
  assert.equal(parseCommand('task Meet 2026-02-30', now).fields.date, '');
  assert.equal(parseCommand('task Meet 2026-02-30', now).fields.title, 'Meet 2026-02-30');
  assert.equal(parseCommand('open Safari'), undefined);
  assert.equal(parseCommand('spent RM 14.50 lunch today', now).fields.amount, '14.50');
  assert.equal(
    parseCommand('event Review tomorrow at 4pm', now).fields.start,
    '2026-10-02T16:00',
  );
  assert.equal(
    parseCommand('event Review tomorrow at 4pm', now).fields.end,
    '2026-10-02T17:00',
  );
  assert.equal(parseCommand('event Review tomorrow at 0am', now).fields.start, '');
  assert.equal(parseCommand('event Review tomorrow at 4:99pm', now).fields.start, '');
  assert.equal(
    parseCommand('bookmark Reading https://example.com/path?a=b', now).fields.url,
    'https://example.com/path?a=b',
  );
  assert.equal(similarCommand('taks Review'), undefined);
  assert.equal(similarCommand('tssk Review').id, 'task');
  assert.throws(
    () => normalizeCommand({ command: 'delete', fields: {} }, enabled),
    /supported/,
  );
  assert.throws(
    () => normalizeCommand({ command: 'expense', fields: {} }, ['notes']),
    /supported/,
  );
  assert.throws(
    () => normalizeCommand({ command: 'task', fields: { title: { tool: 'run' } } }, enabled),
    /invalid field/,
  );
  assert.deepEqual(
    normalizeCommand(
      { command: 'task', fields: { title: 'Review', date: 'nonsense', execute: 'true' } },
      enabled,
    ),
    { command: 'task', fields: { title: 'Review', date: '' } },
  );
  const reads = [];
  const local = {
    settings: async () => ({ enabled: ['notes', 'todos', 'mail', 'music'] }),
    files: {
      list: async (area) => {
        reads.push(area);
        return [{ title: 'Review', path: 'Review.md' }];
      },
    },
    store: {
      list: async (module) => {
        reads.push(module);
        return [{ id: 'task', title: 'Review the work' }];
      },
    },
  };
  const results = await searchLocal(local, 'review');
  assert.deepEqual(reads, ['Notes', 'todos']);
  assert.deepEqual(
    results.map((item) => item.target.module),
    ['notes', 'todos'],
  );
  assert.deepEqual(await searchLocal(local, ''), []);
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'clarity-redesign-'));
  const files = new Files(root);
  await files.initialize();
  await writeFile(
    join(root, 'Notes', 'Alpha.md'),
    '# Alpha\n\nA focused morning.\n\n' +
      Array.from(
        { length: 40 },
        (_, i) => `Paragraph ${i}: preserve the reading position.\n\n`,
      ).join(''),
  );
  await writeFile(join(root, 'Notes', 'Beta.md'), '# Beta\n\nA second document.\n');
  await writeFile(
    join(root, 'Wiki', 'Focus.md'),
    '# Focus\n\n[Next](Next.md)\n\nA useful source.\n',
  );
  await writeFile(join(root, 'Wiki', 'Next.md'), '# Next\n\nA second topic.\n');
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    await store.put('settings', 'default', {
      enabled,
      theme: 'dark',
      useDeviceLocation: false,
      locationRequested: true,
      lastChat: 'chat-a',
      currency: 'RM ',
    });
    for (const id of ['chat-a', 'chat-b'])
      await store.put('chats', id, {
        title: id === 'chat-a' ? 'Planning' : 'Reading',
        status: 'idle',
        grants: [],
        attachments: [],
        messages: [
          {
            role: 'assistant',
            content: [
              {
                type: 'text',
                text:
                  '[Alpha source](clarity://item/notes?path=Alpha.md)\n\n' +
                  'Keep the morning clear.\n\n'.repeat(35),
              },
            ],
            timestamp: Date.now(),
          },
        ],
      });
    for (let i = 0; i < 14; i++)
      await store.put('news', 'news-' + i, {
        title: `Headline ${i}: a useful update`,
        source: 'Design journal',
        sourceId: 'feed',
        url: 'https://example.com/' + i,
        published: Date.now() - i * 3600000,
      });
    for (let i = 0; i < 3; i++)
      await store.put('expenses', 'expense-' + i, {
        description: ['Lunch', 'Coffee', 'Groceries'][i],
        amountCents: [1400, 890, 3800][i],
        category: 'Food',
        date: '2026-10-01',
      });
    for (let i = 0; i < 3; i++)
      await store.put('todos', 'task-' + i, { title: `Review item ${i}`, done: false });
    for (let i = 0; i < 3; i++)
      await store.put('bookmarks', 'bookmark-' + i, {
        title: `Reference ${i}`,
        description: 'Design reference',
        url: `https://example.com/${i}`,
        tags: ['design'],
        source: 'local',
      });
    for (let i = 0; i < 2; i++)
      await store.put('board', 'thread-' + i, {
        topic: `Thread ${i}`,
        text: `Review ${i}`,
        threadId: null,
      });
  } finally {
    await store.close();
  }
  return root;
}

test(
  'native redesign preserves source context, history, drafts, commands and compact controls',
  { timeout: 180000 },
  async () => {
    const root = await fixture();
    const application = await require('playwright-core')._electron.launch({
      executablePath: require('electron'),
      args: [join(cache, 'output/main.mjs')],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    const page = await application.firstWindow();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const call = (method, args) =>
      page.evaluate(({ method, args }) => window.clarity.call(method, args), { method, args });
    const nav = (name) =>
      page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
    const back = () =>
      page
        .locator('.workspace-header')
        .getByRole('button', { name: 'Back', exact: true })
        .click();
    const forward = () =>
      page
        .locator('.workspace-header')
        .getByRole('button', { name: 'Forward', exact: true })
        .click();
    const openSearch = async (text) => {
      await page
        .locator('.workspace-header')
        .getByRole('button', { name: 'Search and commands' })
        .click();
      await page.getByRole('combobox', { name: 'Search Clarity' }).fill(text);
      return page.getByRole('dialog', { name: 'Search and commands' });
    };
    const countTasks = async () =>
      (await call('module', { module: 'todos', method: 'list' })).items.length;
    const observations = {};
    try {
      await page.locator('.sidebar').waitFor();
      await page
        .getByRole('textbox', { name: 'Message', exact: true })
        .fill('Keep this draft');
      await page.locator('.chat-scroll').evaluate((element) => {
        element.scrollTop = 80;
      });
      await page.getByRole('link', { name: 'Alpha source' }).click();
      const preview = page.getByRole('complementary', { name: 'Source preview' });
      await preview.getByRole('heading', { name: 'Alpha', exact: true }).waitFor();
      assert.equal(await page.locator('.workspace-title').textContent(), 'Planning');
      assert.equal(
        await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(),
        'Keep this draft',
      );
      const resizer = preview.getByRole('separator');
      const before = await preview.boundingBox();
      await resizer.focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal(Math.round((await preview.boundingBox()).width - before.width), 16);
      const box = await resizer.boundingBox();
      await page.mouse.move(box.x + 4, box.y + 80);
      await page.mouse.down();
      await page.mouse.move(box.x - 50, box.y + 80);
      await page.mouse.up();
      assert.ok((await preview.boundingBox()).width > before.width + 30);
      await page.locator('.chat-scroll').evaluate((element) => {
        element.scrollTop = 80;
      });
      const readingTop = await page
        .locator('.chat-scroll')
        .evaluate((element) => element.scrollTop);
      await preview.screenshot({ path: join(evidence, 'preview-verified.png') });
      await preview.getByRole('button', { name: 'Open in Notes' }).click();
      await page.getByRole('tab', { name: 'Alpha.md' }).waitFor();
      await back();
      assert.equal(
        await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(),
        'Keep this draft',
      );
      await eventually(async () =>
        assert.ok(
          Math.abs(
            (await page.locator('.chat-scroll').evaluate((element) => element.scrollTop)) -
              readingTop,
          ) < 2,
        ),
      );
      await forward();
      await page.locator('.note-document:visible').evaluate((element) => {
        element.scrollTop = 240;
      });
      await page.getByRole('button', { name: 'Beta', exact: true }).click();
      await page.getByRole('tab', { name: 'Beta.md', selected: true }).waitFor();
      await back();
      await page.getByRole('tab', { name: 'Alpha.md', selected: true }).waitFor();
      await eventually(async () =>
        assert.equal(
          await page
            .locator('.note-document:visible')
            .evaluate((element) => element.scrollTop),
          240,
        ),
      );
      await page.getByRole('button', { name: 'Markdown', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'Markdown source' })
        .fill('# Alpha\n\nA saved edit.');
      await nav('Todos');
      await eventually(async () =>
        assert.match(await readFile(join(root, 'Notes', 'Alpha.md'), 'utf8'), /A saved edit/),
      );
      await back();
      await page.getByRole('tab', { name: 'Alpha.md', selected: true }).waitFor();
      await nav('Planning');
      let dialog = await openSearch('task Review tomorrow');
      const beforeTasks = await countTasks();
      await dialog.getByRole('option', { name: /Add task/ }).click();
      assert.equal(await countTasks(), beforeTasks);
      await dialog.getByLabel('Title', { exact: true }).fill('Review carefully');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal(await countTasks(), beforeTasks);
      dialog = await openSearch('task Review tomorrow');
      await page.getByRole('combobox', { name: 'Search Clarity' }).press('Enter');
      await dialog.getByLabel('Title', { exact: true }).fill('One explicit task');
      await dialog.getByRole('button', { name: 'Add task', exact: true }).dblclick();
      await eventually(async () => assert.equal(await countTasks(), beforeTasks + 1));
      assert.equal(await page.locator('.workspace-title').textContent(), 'Planning');
      await preview.getByRole('heading', { name: 'One explicit task' }).waitFor();
      await preview.getByRole('button', { name: 'Close source preview' }).click();
      assert.equal(
        await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(),
        'Keep this draft',
      );
      dialog = await openSearch('note Quick capture');
      await dialog.getByRole('option', { name: /New note/ }).click();
      await dialog.getByRole('button', { name: 'New note', exact: true }).click();
      await eventually(async () =>
        assert.equal(await readFile(join(root, 'Notes', 'Quick capture.md'), 'utf8'), ''),
      );
      await preview.getByRole('button', { name: 'Close source preview' }).click();
      dialog = await openSearch('expense 8.90 coffee today');
      await dialog.getByRole('option', { name: /Add expense/ }).click();
      await dialog.getByLabel('Category', { exact: true }).fill('Food');
      await dialog.getByRole('button', { name: 'Add expense', exact: true }).click();
      await eventually(async () =>
        assert.equal(
          (await call('module', { module: 'expenses', method: 'list' })).items.filter(
            (item) => item.description === 'coffee' && item.amountCents === 890,
          ).length,
          1,
        ),
      );
      await preview.getByRole('button', { name: 'Close source preview' }).click();
      dialog = await openSearch('event Design review tomorrow at 4pm');
      await dialog.getByRole('option', { name: /Add event/ }).click();
      await dialog.getByRole('button', { name: 'Add event', exact: true }).click();
      await eventually(async () =>
        assert.equal(
          (await call('module', { module: 'calendar', method: 'list' })).items.filter(
            (item) => item.title === 'Design review',
          ).length,
          1,
        ),
      );
      await preview.getByRole('button', { name: 'Close source preview' }).click();
      dialog = await openSearch('bookmark Useful reference https://example.com/reference');
      await dialog.getByRole('option', { name: /Add bookmark/ }).click();
      await dialog.getByRole('button', { name: 'Add bookmark', exact: true }).click();
      await eventually(async () =>
        assert.equal(
          (await call('module', { module: 'bookmarks', method: 'list' })).items.filter(
            (item) => item.url === 'https://example.com/reference',
          ).length,
          1,
        ),
      );
      await preview.getByRole('button', { name: 'Close source preview' }).click();
      await page.getByRole('button', { name: /^Model:/ }).click();
      const picker = page.getByRole('dialog', { name: 'Select model and effort' });
      const models = (await call('bootstrap')).models;
      await picker.getByRole('combobox', { name: 'Search models' }).fill(models.at(-1).name);
      await picker.getByRole('option', { name: models.at(-1).name, exact: true }).click();
      await page
        .getByRole('combobox', { name: 'Effort', exact: true })
        .selectOption(models.at(-1).efforts[0]);
      assert.equal(await page.locator('.workspace-title').textContent(), 'Planning');
      await nav('Reading');
      await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Second draft');
      await back();
      assert.equal(
        await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(),
        'Keep this draft',
      );
      await nav('Agent board');
      await page.getByRole('button', { name: /Thread 0/ }).click();
      await page.getByLabel('Reply', { exact: true }).fill('Unsent reply');
      await page.getByRole('button', { name: 'All threads', exact: true }).click();
      await page.getByRole('button', { name: /Thread 1/ }).click();
      assert.equal(await page.getByLabel('Reply', { exact: true }).inputValue(), '');
      await back();
      await page.getByRole('searchbox', { name: 'Search board' }).waitFor();
      await back();
      assert.equal(
        await page.getByLabel('Reply', { exact: true }).inputValue(),
        'Unsent reply',
      );
      await nav('Settings');
      const sections = page.getByRole('navigation', { name: 'Settings sections' });
      await sections.getByRole('button', { name: 'Search and commands', exact: true }).click();
      assert.equal(
        await page
          .getByRole('checkbox', { name: 'Automatically interpret commands' })
          .isChecked(),
        false,
      );
      assert.equal(await page.locator('.settings-content > [id]:visible').count(), 1);
      await sections.getByRole('button', { name: 'Appearance', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Reduce motion' }).check();
      await eventually(async () =>
        assert.equal((await call('bootstrap')).settings.reducedMotion, true),
      );
      await nav('News');
      await page.getByRole('searchbox', { name: 'Search headlines' }).fill('Headline');
      await page.locator('.news-list article').first().waitFor();
      observations.news = await page.locator('.news-list article').evaluateAll((items) => ({
        count: items.length,
        height: items[0].getBoundingClientRect().height,
        visible: items.filter((item) => item.getBoundingClientRect().bottom <= innerHeight)
          .length,
      }));
      assert.equal(observations.news.count, 14);
      assert.ok(observations.news.height <= 38);
      assert.ok(observations.news.visible >= 12);
      assert.equal(
        await page
          .locator('.module-host[data-module=news]')
          .evaluate((element) => getComputedStyle(element).animationName),
        'none',
      );
      await page.screenshot({ path: join(evidence, 'news-verified.png') });
      await nav('Expenses');
      observations.expenses = await page
        .locator('.expense-day')
        .first()
        .evaluate((day) => ({
          total: day.querySelector(':scope > strong').getBoundingClientRect().right - 8,
          amounts: [...day.querySelectorAll('.expense-entry > span:last-child')].map(
            (item) => item.getBoundingClientRect().right,
          ),
        }));
      assert.ok(
        observations.expenses.amounts.every(
          (right) => Math.abs(right - observations.expenses.total) <= 1,
        ),
      );
      await page.screenshot({ path: join(evidence, 'expenses-verified.png') });
      await nav('Todos');
      await page.locator('.tasks .task-title').first().click();
      await page
        .locator('.task-edit')
        .getByRole('button', { name: 'Cancel', exact: true })
        .click();
      assert.equal(
        await page
          .locator('.tasks .task-title')
          .first()
          .evaluate((element) => getComputedStyle(element).outlineStyle),
        'none',
      );
      await nav('Wiki');
      const wiki = page.frameLocator('iframe');
      await wiki.getByRole('link', { name: 'Focus', exact: true }).click();
      await wiki.locator('main').getByRole('link', { name: 'Next', exact: true }).click();
      await wiki.getByRole('heading', { name: 'Next', exact: true }).waitFor();
      await back();
      await wiki.getByRole('heading', { name: 'Focus', exact: true }).waitFor();
      await forward();
      await wiki.getByRole('heading', { name: 'Next', exact: true }).waitFor();
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].setSize(850, 600),
      );
      for (const theme of ['light', 'dark']) {
        await call('settings.save', { theme });
        for (const name of [
          'Todos',
          'Notes',
          'News',
          'Expenses',
          'Settings',
          'Mail',
          'Music',
          'Calendar',
          'Automations',
          'Bookmarks',
          'Agent board',
        ]) {
          await nav(name);
          const overflow = await page.evaluate(() => ({
            body: document.documentElement.scrollWidth > innerWidth,
            host:
              document.querySelector('.module-host:not([hidden])').getBoundingClientRect()
                .right >
              innerWidth + 1,
          }));
          assert.deepEqual(
            overflow,
            { body: false, host: false },
            `${name} at minimum window size in ${theme}`,
          );
        }
      }
      assert.deepEqual(errors, []);
      await writeFile(
        join(evidence, 'redesign-observations.json'),
        JSON.stringify({ root, observations, errors }, null, 2),
      );
    } catch (error) {
      await page.screenshot({ path: join(evidence, 'redesign-failure.png') });
      await writeFile(join(evidence, 'redesign-failure.html'), await page.content());
      throw error;
    } finally {
      await application.close();
    }
  },
);
test(
  'omni interpretation is opt-in, discards stale proposals and requires explicit provider queries',
  { timeout: 90000 },
  async () => {
    const root = await fixture();
    const application = await require('playwright-core')._electron.launch({
      executablePath: require('electron'),
      args: [join(cache, 'output/main.mjs')],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    const page = await application.firstWindow();
    page.setDefaultTimeout(10000);
    const call = (method, args) =>
      page.evaluate(({ method, args }) => window.clarity.call(method, args), { method, args });
    const counters = () => application.evaluate(() => globalThis.redesignRequests);
    try {
      await page.locator('.sidebar').waitFor();
      await application.evaluate(({ ipcMain }) => {
        const original = ipcMain._invokeHandlers.get('clarity:call');
        globalThis.redesignRequests = { interpretations: [], mail: [], music: [] };
        ipcMain.removeHandler('clarity:call');
        ipcMain.handle('clarity:call', async (event, method, args) => {
          if (method === 'bootstrap') {
            const result = await original(event, method, args);
            result.value.auth.codex = true;
            result.value.auth.google = true;
            result.value.auth.spotify = true;
            return result;
          }
          if (method === 'launcher.interpret') {
            globalThis.redesignRequests.interpretations.push(args.query);
            await new Promise((resolve) =>
              setTimeout(resolve, args.query.includes('slow') ? 900 : 50),
            );
            if (args.query.includes('failure'))
              return { ok: false, error: 'Interpretation fixture failure' };
            return {
              ok: true,
              value: {
                command: 'task',
                fields: { title: `Proposed: ${args.query}`, date: '' },
              },
            };
          }
          if (method === 'module' && ['mail', 'music'].includes(args.module)) {
            globalThis.redesignRequests[args.module].push(args.args?.query || args.method);
            if (args.args?.query?.includes('slow'))
              await new Promise((resolve) => setTimeout(resolve, 700));
            if (args.module === 'mail')
              return {
                ok: true,
                value: {
                  messages: [
                    {
                      id: 'mail-fixture',
                      subject: `Mail: ${args.args.query}`,
                      from: 'fixture@example.com',
                    },
                  ],
                },
              };
            return {
              ok: true,
              value: {
                items: [
                  {
                    id: 'album-fixture',
                    title: `Music: ${args.args.query}`,
                    type: 'album',
                    source: 'spotify',
                  },
                ],
              },
            };
          }
          return original(event, method, args);
        });
      });
      await page.reload();
      await page.locator('.sidebar').waitFor();
      const initial = (await call('module', { module: 'todos', method: 'list' })).items.length;
      await page.getByRole('button', { name: 'Search and commands', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Search and commands' });
      const input = dialog.getByRole('combobox', { name: 'Search Clarity' });
      await input.fill('Please remind me to review the plan');
      await page.waitForTimeout(850);
      assert.deepEqual(await counters(), { interpretations: [], mail: [], music: [] });
      await dialog.getByRole('button', { name: 'Interpret', exact: true }).click();
      await dialog.getByRole('option', { name: /Interpreted/ }).click();
      assert.equal(
        await dialog.getByLabel('Title', { exact: true }).inputValue(),
        'Proposed: Please remind me to review the plan',
      );
      assert.equal(
        (await call('module', { module: 'todos', method: 'list' })).items.length,
        initial,
      );
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page
        .locator('.sidebar')
        .getByRole('button', { name: 'Settings', exact: true })
        .click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Search and commands' })
        .click();
      await page.getByRole('checkbox', { name: 'Automatically interpret commands' }).check();
      await eventually(async () =>
        assert.equal((await call('bootstrap')).settings.autoInterpretCommands, true),
      );
      await page
        .locator('.workspace-header')
        .getByRole('button', { name: 'Search and commands' })
        .click();
      await input.fill('slow previous proposal');
      await eventually(async () =>
        assert.ok((await counters()).interpretations.includes('slow previous proposal')),
      );
      await input.fill('task Current editable title');
      await dialog.getByRole('option', { name: /Add task/ }).click();
      await dialog.getByLabel('Title', { exact: true }).fill('My revised title');
      await page.waitForTimeout(950);
      assert.equal(
        await dialog.getByLabel('Title', { exact: true }).inputValue(),
        'My revised title',
      );
      assert.equal(
        (await call('module', { module: 'todos', method: 'list' })).items.length,
        initial,
      );
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page
        .locator('.workspace-header')
        .getByRole('button', { name: 'Search and commands' })
        .click();
      await input.fill('A new ambiguous request');
      await dialog.getByRole('option', { name: /Interpreted/ }).waitFor();
      assert.deepEqual((await counters()).mail, []);
      assert.deepEqual((await counters()).music, []);
      await dialog.getByRole('button', { name: 'Search Mail', exact: true }).click();
      await dialog.getByRole('option', { name: /Mail: A new ambiguous request/ }).waitFor();
      assert.deepEqual((await counters()).mail, ['A new ambiguous request']);
      await dialog.getByRole('button', { name: 'Search Music', exact: true }).click();
      await dialog.getByRole('option', { name: /Music: A new ambiguous request/ }).waitFor();
      assert.deepEqual((await counters()).music, ['A new ambiguous request']);
      await input.fill('slow stale search');
      await dialog.getByRole('button', { name: 'Search Mail', exact: true }).click();
      await input.fill('task Fresh command');
      await page.waitForTimeout(850);
      assert.equal(await dialog.getByRole('option', { name: /Mail:/ }).count(), 0);
      assert.equal(await dialog.getByRole('option', { name: /Interpreted/ }).count(), 0);
      await dialog.screenshot({ path: join(evidence, 'launcher-verified.png') });
      await input.fill('Interpretation failure');
      await dialog.getByRole('alert').waitFor();
      assert.match(await dialog.getByRole('alert').textContent(), /fixture failure/);
      await dialog.getByRole('button', { name: 'Close search' }).click();
      await page.reload();
      await page.locator('.sidebar').waitFor();
      assert.equal((await call('bootstrap')).settings.autoInterpretCommands, true);
      assert.equal(
        (await call('module', { module: 'todos', method: 'list' })).items.length,
        initial,
      );
      await writeFile(
        join(evidence, 'request-observations.json'),
        JSON.stringify(await counters(), null, 2),
      );
    } finally {
      await application.close();
    }
  },
);

test(
  'model interpretation uses the existing model with no tools and rejects cancelled or invalid output',
  { timeout: 30000 },
  async () => {
    const modelBundle = join(evidence, 'interpretation-core.mjs');
    await require('esbuild').build({
      stdin: {
        contents:
          "export {Chats} from './src/main/chat'; export {Agent} from '@earendil-works/pi-agent-core'; export {defaultSettings} from './src/shared/types';",
        resolveDir: resolve('.'),
      },
      outfile: modelBundle,
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'esm',
    });
    const root = await fixture();
    const application = await require('playwright-core')._electron.launch({
      executablePath: require('electron'),
      args: [join(cache, 'output/main.mjs')],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    try {
      const ready = await application.firstWindow();
      await ready.locator('.sidebar').waitFor();
      const observation = await application.evaluate(async (_, url) => {
        const { Chats, Agent, defaultSettings } = process
          .getBuiltinModule('module')
          .createRequire(url)(process.getBuiltinModule('url').fileURLToPath(url));
        const original = Agent.prototype.prompt;
        const settings = { ...defaultSettings, enabled: ['chat', 'todos'], model: 'gpt-5.5' };
        const seen = [];
        let finish;
        Agent.prototype.prompt = async function (query) {
          seen.push({
            query,
            tools: this.state.tools.length,
            model: this.state.model.id,
            effort: this.state.thinkingLevel,
          });
          if (query === 'slow')
            await new Promise((resolve) => {
              finish = resolve;
            });
          this.state.messages.push({
            role: 'assistant',
            content: [
              {
                type: 'text',
                text:
                  query === 'bad'
                    ? '{invalid'
                    : query === 'unsupported'
                      ? '{"command":"delete","fields":{}}'
                      : '{"command":"task","fields":{"title":"Review","date":"2026-10-02","execute":"yes"}}',
              },
            ],
          });
        };
        const chats = new Chats(
          { settings: async () => settings },
          { codexToken: async () => 'fixture' },
          () => {},
        );
        const result = {};
        try {
          result.proposal = await chats.interpretCommand('task tomorrow');
          for (const query of ['bad', 'unsupported']) {
            try {
              await chats.interpretCommand(query);
            } catch (error) {
              result[query] = error.message;
            }
          }
          const pending = chats.interpretCommand('slow').catch((error) => error.message);
          for (let attempt = 0; !finish && attempt < 200; attempt++)
            await new Promise((resolve) => setTimeout(resolve, 5));
          if (!finish)
            throw new Error(
              'Interpretation never reached the controlled model: ' + JSON.stringify(seen),
            );
          chats.cancelInterpretation();
          finish();
          result.cancelled = await pending;
          await chats.close();
          try {
            await chats.interpretCommand('after close');
          } catch (error) {
            result.closed = error.message;
          }
          return { ...result, seen };
        } finally {
          Agent.prototype.prompt = original;
        }
      }, pathToFileURL(modelBundle).href);
      assert.deepEqual(observation.proposal, {
        command: 'task',
        fields: { title: 'Review', date: '2026-10-02' },
      });
      assert.ok(
        observation.seen.every(
          (request) => request.tools === 0 && request.model === 'gpt-5.5',
        ),
      );
      assert.match(observation.bad, /Could not interpret/);
      assert.match(observation.unsupported, /supported command/);
      assert.match(observation.cancelled, /cancelled/);
      assert.match(observation.closed, /closing/);
      await writeFile(
        join(evidence, 'interpretation-observations.json'),
        JSON.stringify(observation, null, 2),
      );
    } finally {
      await application.close();
    }
  },
);

test(
  'spike parity: real motion, compact rows, connected tabs and reduced-motion keyboard controls',
  { timeout: 90000 },
  async () => {
    const root = await fixture();
    const application = await require('playwright-core')._electron.launch({
      executablePath: require('electron'),
      args: [join(cache, 'output/main.mjs')],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    const page = await application.firstWindow();
    page.setDefaultTimeout(10000);
    const observations = {};
    const directory = join(cache, 'redesign-repair-20261001');
    await mkdir(directory, { recursive: true });
    const nav = (name) =>
      page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
    const settle = () =>
      page.evaluate(async () => {
        await Promise.allSettled(
          document
            .getAnimations()
            .filter((animation) => animation.effect.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished),
        );
      });
    try {
      await page.locator('.sidebar').waitFor();
      await page.keyboard.press('Meta+b');
      observations.sidebarMotion = await page
        .locator('.shell')
        .evaluate((element) => ({
          animations: element
            .getAnimations()
            .map((a) => ({
              duration: a.effect.getTiming().duration,
              property: a.transitionProperty,
            })),
          width: document.querySelector('.sidebar').getBoundingClientRect().width,
        }));
      assert.ok(
        observations.sidebarMotion.animations.some(
          (a) => a.duration === 220 && a.property === 'grid-template-columns',
        ),
      );
      await settle();
      assert.equal(
        await page
          .locator('.sidebar')
          .evaluate((element) => element.getBoundingClientRect().width),
        0,
      );
      assert.equal(await page.locator('.sidebar').evaluate((element) => element.inert), true);
      await page.keyboard.press('Meta+b');
      await settle();
      await nav('Todos');
      await page
        .getByRole('checkbox', { name: 'Complete Review item 0', exact: true })
        .waitFor();
      await settle();
      observations.tasks = await page
        .locator('.tasks > li')
        .evaluateAll((elements) =>
          elements.map((element, index) => ({
            height: element.getBoundingClientRect().height,
            gap: index
              ? element.getBoundingClientRect().top -
                elements[index - 1].getBoundingClientRect().bottom
              : null,
          })),
        );
      assert.ok(
        observations.tasks.every(
          (row) => row.height === 36 && (row.gap === null || row.gap === 2),
        ),
      );
      await page
        .getByRole('checkbox', { name: 'Complete Review item 0', exact: true })
        .check();
      observations.reorder = await page
        .locator('.tasks')
        .evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .map((animation) => ({
              duration: animation.effect.getTiming().duration,
              frames: animation.effect.getKeyframes().map((frame) => frame.transform),
            })),
        );
      assert.ok(
        observations.reorder.some(
          (animation) =>
            animation.duration === 220 &&
            animation.frames.some((frame) => frame && frame !== 'translateY(0px)'),
        ),
      );
      await settle();
      assert.equal(
        await page.locator('.tasks > li').last().getAttribute('data-item-id'),
        'task-0',
      );
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      await page.getByRole('textbox', { name: 'New task', exact: true }).fill('A modal task');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page
        .getByRole('checkbox', { name: 'Complete A modal task', exact: true })
        .waitFor();
      await nav('Notes');
      await page.getByRole('button', { name: 'Alpha', exact: true }).click();
      await page.getByRole('tab', { name: 'Alpha.md', selected: true }).waitFor();
      await page.getByRole('button', { name: 'Beta', exact: true }).click();
      await page.getByRole('tab', { name: 'Beta.md', selected: true }).waitFor();
      await settle();
      observations.notes = await page.evaluate(() => {
        const view = document.querySelector('.notes-view').getBoundingClientRect(),
          sidebar = document.querySelector('.file-sidebar').getBoundingClientRect();
        return {
          divider: sidebar.height,
          view: view.height,
          tabs: [...document.querySelectorAll('.note-tabs > div')].map((element) => ({
            height: element.getBoundingClientRect().height,
            radius: getComputedStyle(element).borderRadius,
            separator: getComputedStyle(element, '::after').opacity,
          })),
        };
      });
      assert.equal(observations.notes.divider, observations.notes.view);
      assert.ok(
        observations.notes.tabs.every(
          (tab) => tab.height === 35 && tab.radius === '0px' && tab.separator === '0',
        ),
      );
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.getByRole('tab', { name: 'Alpha.md', selected: true }).waitFor();
      assert.ok(
        await page
          .locator('.note-document:visible')
          .evaluate((element) => element.scrollHeight > element.clientHeight),
      );
      await nav('News');
      await page.locator('.news-list > article').first().waitFor();
      await settle();
      observations.news = await page
        .locator('.news-list > article')
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      assert.equal(observations.news.length, 14);
      assert.ok(observations.news.every((height) => height === 36));
      await nav('Bookmarks');
      await page.locator('.bookmark').first().waitFor();
      await settle();
      observations.bookmarks = await page
        .locator('.bookmark')
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      assert.ok(observations.bookmarks.every((height) => height <= 56));
      await page.locator('.bookmark').nth(1).hover();
      await settle();
      observations.separators = await page
        .locator('.bookmark')
        .evaluateAll((elements) =>
          elements.map((element) => getComputedStyle(element, '::after').opacity),
        );
      assert.equal(observations.separators[0], '0');
      assert.equal(observations.separators[1], '0');
      await nav('Settings');
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Appearance', exact: true })
        .click();
      await page.getByRole('radio', { name: 'Light', exact: true }).click();
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
      await page.getByRole('checkbox', { name: 'Reduce motion', exact: true }).check();
      await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduced');
      await nav('Todos');
      await page
        .getByRole('checkbox', { name: 'Complete Review item 0', exact: true })
        .uncheck();
      observations.reduced = await page.evaluate(() => ({
        animations: document.getAnimations().length,
        sidebar: getComputedStyle(document.querySelector('.shell')).transitionDuration,
      }));
      assert.equal(observations.reduced.animations, 0);
      assert.equal(observations.reduced.sidebar, '0s');
      await page.keyboard.press('Meta+b');
      assert.equal(
        await page
          .locator('.sidebar')
          .evaluate((element) => element.getBoundingClientRect().width),
        0,
      );
      await page.keyboard.press('Meta+b');
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].setSize(850, 600),
      );
      await page.getByRole('button', { name: 'Search and commands', exact: true }).hover();
      await page.getByRole('tooltip').waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'New task', exact: true })
        .fill('Keyboard cancel');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.screenshot({ path: join(directory, 'compact-light-verified.png') });
      await writeFile(
        join(directory, 'motion-observations.json'),
        JSON.stringify(observations, null, 2),
      );
    } finally {
      await application.close();
    }
  },
);
