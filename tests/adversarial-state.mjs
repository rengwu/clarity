import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const evidence = process.env.CLARITY_QA_EVIDENCE || join(cache, 'adversarial-state');
const require = createRequire(join(cache, 'loader.cjs'));
await mkdir(evidence, { recursive: true });
const bundle = join(cache, 'adversarial-state-core.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export {Store} from './src/main/store'; export {Files} from './src/main/files'; export {Modules} from './src/main/modules';",
    resolveDir: resolve(process.env.CLARITY_TEST_SOURCE || '.'),
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files, Modules } = await import(pathToFileURL(bundle));

async function eventually(check) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail('Fixture did not reach the expected boundary');
}

async function launch(seed = async () => {}) {
  const root = await mkdtemp(join(tmpdir(), 'clarity-adversarial-state-'));
  const files = new Files(root);
  await files.initialize();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  let fixtures;
  try {
    await store.put('settings', 'default', {
      enabled: ['chat', 'notes', 'todos', 'wiki', 'bookmarks', 'mail', 'board'],
      theme: 'light',
      useDeviceLocation: false,
      locationRequested: true,
    });
    fixtures = await seed(new Modules(store, files, {}, {}, () => {}));
  } finally {
    await store.close();
  }
  const application = await require('playwright-core')._electron.launch({
    executablePath: process.env.CLARITY_TEST_EXECUTABLE || require('electron'),
    args: [process.env.CLARITY_TEST_MAIN || join(cache, 'output/main.mjs')],
    env: { ...process.env, CLARITY_TEST_ROOT: root },
  });
  const page = await application.firstWindow();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.locator('.sidebar').waitFor();
  await application.evaluate(({ ipcMain }) => {
    const original = ipcMain._invokeHandlers.get('clarity:call');
    globalThis.stateQA = {
      bookmarkRequests: 0,
      bookmarkCompleted: 0,
      mailRequests: [],
      external: [],
    };
    ipcMain.removeHandler('clarity:call');
    ipcMain.handle('clarity:call', async (event, method, args) => {
      const fixture = globalThis.stateQA;
      if (method === 'bootstrap') {
        const result = await original(event, method, args);
        if (fixture.mail) result.value.auth.google = fixture.mail.connected;
        return result;
      }
      if (method === 'external.open') {
        fixture.external.push(args.url);
        return { ok: true, value: null };
      }
      if (method === 'module' && args.module === 'bookmarks' && args.method === 'remove' && fixture.holdDelete)
        await new Promise((resolve) => fixture.releaseDelete = resolve);
      if (method === 'module' && args.module === 'bookmarks' && args.method === 'add') {
        fixture.bookmarkRequests++;
        if (fixture.holdBookmark) {
          const fail = await new Promise((resolve) => (fixture.releaseBookmark = resolve));
          if (fail) {
            fixture.bookmarkCompleted++;
            return { ok: false, error: 'Fixture bookmark save failed' };
          }
        }
        if (fixture.failBookmark) return { ok: false, error: 'Fixture bookmark save failed' };
      }
      if (method === 'module' && args.module === 'mail' && fixture.mail) {
        const account = { ...fixture.mail };
        fixture.mailRequests.push({
          method: args.method,
          account: account.name,
          args: args.args,
        });
        const message = {
          id: `${account.name}-message`,
          subject: `${account.name} subject`,
          from: `${account.name}@example.invalid`,
          date: '2026-10-01T12:00:00+08:00',
          text: `${account.name} private fixture body`,
        };
        if (args.method === 'read' && account.holdRead) {
          await new Promise((resolve) => (fixture.releaseRead = resolve));
          fixture.oldReadCompleted = true;
        }
        if (args.method === 'list' && account.holdList) {
          await new Promise((resolve) => (fixture.releaseList = resolve));
          fixture.oldListCompleted = true;
        }
        if (account.fail) return { ok: false, error: 'Fixture current mailbox unavailable' };
        return {
          ok: true,
          value: args.method === 'list' ? { messages: [message], nextPage: null } : message,
        };
      }
      const result = await original(event, method, args);
      if (method === 'module' && args.module === 'bookmarks' && args.method === 'add')
        fixture.bookmarkCompleted++;
      return result;
    });
  });
  const call = (method, args) =>
    page.evaluate(({ method, args }) => window.clarity.call(method, args), {
      method,
      args,
    });
  const invoke = (module, method, args) => call('module', { module, method, args });
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  const nav = async (name) => {
    await page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
    await settle();
  };
  const capture = async (name, observations) => {
    await settle();
    await page.screenshot({ path: join(evidence, `${name}.png`) });
    await writeFile(join(evidence, `${name}.json`), JSON.stringify(observations, null, 2));
  };
  const close = async () => {
    await application.close();
    assert.deepEqual(errors, [], 'No renderer exception');
  };
  return {
    application,
    page,
    fixtures,
    call,
    invoke,
    nav,
    settle,
    capture,
    close,
  };
}

test(
  'QA04 bookmark completion preserves a reopened draft on success and failure, and retry preserves input',
  { timeout: 60000 },
  async () => {
    const app = await launch();
    const { application, page, nav, invoke, capture } = app;
    const open = async (title, url) => {
      await page.getByRole('button', { name: 'Add bookmark', exact: true }).click();
      await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
      await page.getByRole('textbox', { name: 'URL', exact: true }).fill(url);
    };
    try {
      await nav('Bookmarks');
      for (const fail of [false, true]) {
        const completedBefore = await application.evaluate(
          () => globalThis.stateQA.bookmarkCompleted,
        );
        await application.evaluate(() => (globalThis.stateQA.holdBookmark = true));
        await open(`Submitted ${fail}`, `https://example.com/submitted-${fail}`);
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await eventually(() => application.evaluate(() => !!globalThis.stateQA.releaseBookmark));
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await open(`New unsaved ${fail}`, `https://example.com/new-${fail}`);
        await application.evaluate((_, failure) => {
          globalThis.stateQA.holdBookmark = false;
          globalThis.stateQA.releaseBookmark(failure);
          delete globalThis.stateQA.releaseBookmark;
        }, fail);
        await eventually(() =>
          application.evaluate(
            (_, before) => globalThis.stateQA.bookmarkCompleted > before,
            completedBefore,
          ),
        );
        await page.evaluate(async () => {
          await window.clarity.call('bootstrap');
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
        });
        const saved = (await invoke('bookmarks', 'list')).items.map((item) => item.title);
        await capture(`QA04-late-${fail ? 'failure' : 'success'}`, {
          fail,
          saved,
          dialogs: await page.getByRole('dialog').count(),
          draft: (await page.getByRole('textbox', { name: 'Title', exact: true }).count())
            ? await page.getByRole('textbox', { name: 'Title', exact: true }).inputValue()
            : null,
        });
        assert.equal(
          await page.getByRole('dialog', { name: 'Add bookmark', exact: true }).count(),
          1,
        );
        assert.equal(
          await page.getByRole('textbox', { name: 'Title', exact: true }).inputValue(),
          `New unsaved ${fail}`,
        );
        assert.equal(
          await page.getByRole('textbox', { name: 'URL', exact: true }).inputValue(),
          `https://example.com/new-${fail}`,
        );
        assert.equal(await page.getByRole('dialog').getByRole('alert').count(), 0);
        assert.deepEqual(saved, ['Submitted false']);
        await page.keyboard.press('Escape');
      }
      await application.evaluate(() => (globalThis.stateQA.failBookmark = true));
      await open('Retry draft', 'https://example.com/retry');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByRole('alert').getByText('Fixture bookmark save failed').waitFor();
      assert.equal(
        await page.getByRole('textbox', { name: 'Title', exact: true }).inputValue(),
        'Retry draft',
      );
      await application.evaluate(() => (globalThis.stateQA.failBookmark = false));
      await page.getByRole('button', { name: 'Save', exact: true }).dblclick();
      await page.getByRole('dialog').waitFor({ state: 'hidden' });
      const items = (await invoke('bookmarks', 'list')).items;
      assert.equal(items.filter((item) => item.title === 'Retry draft').length, 1);
      await capture('QA04-retry', {
        titles: items.map((item) => item.title),
        requests: await application.evaluate(() => globalThis.stateQA.bookmarkRequests),
      });
      const row = page.locator(`[data-item-id="${items.find((item) => item.title === 'Retry draft').id}"]`);
      await row.getByRole('button', { name: 'Edit', exact: true }).click();
      await page.getByRole('button', { name: 'Delete Retry draft', exact: true }).click();
      await application.evaluate(() => globalThis.stateQA.holdDelete = true);
      await page.getByRole('dialog', { name: 'Delete Retry draft?', exact: true }).getByRole('button', { name: 'Delete', exact: true }).click();
      await eventually(() => application.evaluate(() => !!globalThis.stateQA.releaseDelete));
      await page.keyboard.press('Escape');
      await page.getByRole('dialog', { name: 'Edit bookmark', exact: true }).waitFor({ state: 'hidden' });
      await open('After deletion draft', 'https://example.com/after-delete');
      await application.evaluate(() => {
        globalThis.stateQA.holdDelete = false;
        globalThis.stateQA.releaseDelete();
      });
      await eventually(async () => !(await invoke('bookmarks', 'list')).items.some((item) => item.title === 'Retry draft'));
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.getByRole('dialog', { name: 'Add bookmark', exact: true }).count(), 1);
      assert.equal(await page.getByRole('textbox', { name: 'Title', exact: true }).inputValue(), 'After deletion draft');
      await capture('QA04-delete', { preservedDraft: 'After deletion draft', saved: (await invoke('bookmarks', 'list')).items.map((item) => item.title) });
    } finally {
      await app.close();
    }
  },
);

test(
  'QA11 Mail clears previous-account content and ignores late reads while preserving same-account navigation',
  { timeout: 60000 },
  async () => {
    const app = await launch();
    const { application, page, nav, capture } = app;
    const account = async (value, provider = 'google') => {
      await application.evaluate(
        ({ BrowserWindow }, { value, provider }) => {
          if (value) globalThis.stateQA.mail = value;
          BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
            type: 'auth',
            data: {
              provider,
              kind: value?.connected === false ? 'disconnected' : 'connected',
            },
          });
        },
        { value, provider },
      );
    };
    try {
      await account({ connected: true, name: 'Previous' });
      await nav('Mail');
      await page.getByRole('button', { name: /Previous subject/ }).click();
      await page.locator('.mail-body').getByText('Previous private fixture body').waitFor();
      await nav('Notes');
      await nav('Mail');
      await page.locator('.mail-body').getByText('Previous private fixture body').waitFor();
      await account(null, 'spotify');
      await page.locator('.mail-body').getByText('Previous private fixture body').waitFor();
      await page.getByRole('searchbox', { name: 'Search mail' }).fill('old query');
      await application.evaluate(({ BrowserWindow }) => {
        globalThis.stateQA.mail.holdRead = true;
        globalThis.stateQA.mail.holdList = true;
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'changed',
          module: 'mail',
        });
      });
      await eventually(() => application.evaluate(() => !!globalThis.stateQA.releaseRead));
      await eventually(() => application.evaluate(() => !!globalThis.stateQA.releaseList));
      await account({ connected: false, name: 'Previous' });
      await page.getByRole('button', { name: 'Connect Google', exact: true }).waitFor();
      await account({ connected: true, name: 'Current', fail: true });
      await page.locator('.mail-list').getByRole('alert').waitFor();
      await application.evaluate(() => {
        globalThis.stateQA.releaseRead();
        globalThis.stateQA.releaseList();
      });
      await eventually(() =>
        application.evaluate(
          () => !!globalThis.stateQA.oldReadCompleted && !!globalThis.stateQA.oldListCompleted,
        ),
      );
      await page.evaluate(async () => {
        await window.clarity.call('bootstrap');
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      await capture('QA11-account-invalidation', {
        requests: await application.evaluate(() => globalThis.stateQA.mailRequests),
        reader: await page.locator('.mail-reader').innerText(),
      });
      assert.equal(
        await page
          .locator('.mail-view')
          .getByText(/Previous subject|Previous private fixture body/)
          .count(),
        0,
      );
      assert.equal(await page.getByRole('searchbox', { name: 'Search mail' }).inputValue(), '');
      assert.equal(await page.locator('.mail-reader').getByRole('heading').count(), 0);
      assert.equal(
        await page.locator('.mail-reader').getByText('Select a message.', { exact: true }).count(),
        1,
      );
      await account({ connected: true, name: 'Current' });
      await page.getByRole('button', { name: /Current subject/ }).click();
      await page.locator('.mail-body').getByText('Current private fixture body').waitFor();
      await nav('Notes');
      await nav('Mail');
      await page.locator('.mail-body').getByText('Current private fixture body').waitFor();
      await capture('QA11-current-navigation', {
        sameAccount: true,
        subject: await page.locator('.mail-reader h1').innerText(),
      });
      await application.evaluate(({ BrowserWindow }) => {
        globalThis.stateQA.mail.fail = true;
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'changed',
          module: 'mail',
        });
      });
      await page.locator('.mail-reader').getByRole('alert').waitFor();
      await page.locator('.mail-body').getByText('Current private fixture body').waitFor();
      await capture('QA11-same-account-read-failure', {
        subject: await page.locator('.mail-reader h1').innerText(),
        error: await page.locator('.mail-reader').getByRole('alert').innerText(),
      });
    } finally {
      await app.close();
    }
  },
);

test(
  'QA13 forty bookmark tags retain a visible clickable title without nested overflow in either theme',
  { timeout: 45000 },
  async () => {
    const app = await launch((modules) =>
      modules.invoke('bookmarks', 'add', {
        title: 'Bookmark with forty tags',
        url: 'https://example.com/forty',
        tags: Array.from({ length: 40 }, (_, index) => `supported-tag-${index}`),
      }),
    );
    const { application, page, fixtures, nav, call, capture, settle } = app;
    try {
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].setSize(850, 600),
      );
      await page.setViewportSize({ width: 850, height: 600 });
      await nav('Bookmarks');
      for (const theme of ['light', 'dark']) {
        await call('settings.save', { theme });
        await page.waitForFunction(
          (value) => document.documentElement.dataset.theme === value,
          theme,
        );
        await settle();
        const row = page.locator(`[data-item-id="${fixtures.id}"]`);
        const geometry = await row.evaluate((element) => {
          const title = element.querySelector('.bookmark-title');
          const tags = element.querySelector('.bookmark-tags');
          const host = element.closest('.module-host');
          return {
            titleWidth: title.getBoundingClientRect().width,
            rowWidth: element.clientWidth,
            rowScroll: element.scrollWidth,
            hostWidth: host.clientWidth,
            hostScroll: host.scrollWidth,
            tagsWidth: tags.getBoundingClientRect().width,
            tags: tags.children.length,
          };
        });
        await capture(`QA13-${theme}`, geometry);
        assert.ok(geometry.titleWidth >= geometry.rowWidth * 0.35, JSON.stringify(geometry));
        assert.ok(geometry.rowScroll <= geometry.rowWidth + 1, JSON.stringify(geometry));
        assert.ok(geometry.hostScroll <= geometry.hostWidth + 1, JSON.stringify(geometry));
        assert.equal(geometry.tags, 40);
        await row
          .getByRole('button', {
            name: 'Bookmark with forty tags',
            exact: true,
          })
          .click();
        assert.equal(
          await application.evaluate(() => globalThis.stateQA.external.at(-1)),
          fixtures.url,
        );
      }
    } finally {
      await app.close();
    }
  },
);

test(
  'QA14 invalid Board reply has one local error, successful correction clears it and saves once',
  { timeout: 45000 },
  async () => {
    const app = await launch(async (modules) => ({
      first: await modules.invoke('board', 'post', {
        topic: 'First thread',
        text: 'First root',
      }),
      second: await modules.invoke('board', 'post', {
        topic: 'Second thread',
        text: 'Second root',
      }),
    }));
    const { page, fixtures, nav, invoke, capture } = app;
    try {
      await nav('Agent board');
      await page.getByRole('button', { name: /First thread First root/ }).click();
      await page.getByRole('textbox', { name: 'Reply', exact: true }).fill('   ');
      await page.getByRole('button', { name: 'Post', exact: true }).click();
      await page.locator('.board-thread').getByRole('alert').waitFor();
      await capture('QA14-one-error', {
        alerts: await page
          .locator('.module-host[data-module="board"]')
          .getByRole('alert')
          .allTextContents(),
        replies: (await invoke('board', 'read', { id: fixtures.first.id })).replies.length,
      });
      assert.equal(
        await page.locator('.module-host[data-module="board"]').getByRole('alert').count(),
        1,
      );
      assert.equal((await invoke('board', 'read', { id: fixtures.first.id })).replies.length, 0);
      await page.getByRole('button', { name: 'All threads', exact: true }).click();
      await page.getByRole('button', { name: /Second thread Second root/ }).click();
      assert.equal(
        await page.locator('.module-host[data-module="board"]').getByRole('alert').count(),
        0,
      );
      await page.getByRole('button', { name: 'All threads', exact: true }).click();
      await page.getByRole('button', { name: /First thread First root/ }).click();
      await page.getByRole('textbox', { name: 'Reply', exact: true }).fill('Corrected saved reply');
      await page.getByRole('button', { name: 'Post', exact: true }).dblclick();
      await page
        .locator('.board-thread article')
        .getByText('Corrected saved reply', { exact: true })
        .waitFor();
      assert.equal(
        await page.locator('.module-host[data-module="board"]').getByRole('alert').count(),
        0,
      );
      const saved = await invoke('board', 'read', { id: fixtures.first.id });
      assert.equal(saved.replies.length, 1);
      assert.equal(saved.replies[0].text, 'Corrected saved reply');
      assert.equal(
        await page.getByRole('textbox', { name: 'Reply', exact: true }).inputValue(),
        '',
      );
      await capture('QA14-corrected', {
        replies: saved.replies.map((item) => item.text),
        alerts: 0,
      });
    } finally {
      await app.close();
    }
  },
);

test(
  'QA15 retained Settings navigation fits and opens at both supported sizes and themes',
  { timeout: 45000 },
  async () => {
    const app = await launch();
    const { application, page, nav, call, capture, settle } = app;
    try {
      for (const width of [850, 1200]) {
        await application.evaluate(
          ({ BrowserWindow }, width) =>
            BrowserWindow.getAllWindows()[0].setSize(width, width === 850 ? 600 : 800),
          width,
        );
        await page.setViewportSize({
          width,
          height: width === 850 ? 600 : 800,
        });
        for (const theme of ['light', 'dark']) {
          await call('settings.save', { theme });
          await page.waitForFunction(
            (value) => document.documentElement.dataset.theme === value,
            theme,
          );
          await nav('Settings');
          await settle();
          const sections = page.getByRole('navigation', {
            name: 'Settings sections',
          });
          const target = sections.getByRole('button', {
            name: 'Search and commands',
            exact: true,
          });
          const geometry = await sections.evaluate((element) => ({
            width: element.clientWidth,
            scroll: element.scrollWidth,
          }));
          assert.ok(geometry.scroll <= geometry.width + 1, JSON.stringify(geometry));
          const bounds = await target.evaluate((element) => {
            const button = element.getBoundingClientRect();
            const text =
              [...element.querySelectorAll('span')].at(-1)?.getBoundingClientRect() || button;
            return {
              button: {
                left: button.left,
                right: button.right,
                bottom: button.bottom,
              },
              text: { left: text.left, right: text.right, bottom: text.bottom },
            };
          });
          assert.ok(bounds.text.right <= bounds.button.right + 1);
          assert.ok(bounds.text.bottom <= bounds.button.bottom + 1);
          await target.click();
          await page.getByRole('heading', { name: 'Search and commands', exact: true }).waitFor();
          await capture(`QA15-${theme}-${width}`, { geometry, bounds });
        }
      }
    } finally {
      await app.close();
    }
  },
);
