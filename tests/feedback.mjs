import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = process.env.CLARITY_FEEDBACK_EVIDENCE || join(cache, 'feedback-verification');
await mkdir(evidence, { recursive: true });
const bundle = join(cache, 'feedback-fixtures.mjs');
await require('esbuild').build({
  stdin: {
    contents: "export {Store} from './src/main/store'; export {Files} from './src/main/files';",
    resolveDir: resolve('.'),
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files } = await import(pathToFileURL(bundle));

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

async function launch() {
  const root = await mkdtemp(join(tmpdir(), 'clarity-feedback-'));
  await new Files(root).initialize();
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    await store.put('settings', 'default', {
      enabled: ['chat', 'notes', 'todos', 'wiki', 'news', 'bookmarks', 'board'],
      theme: 'light',
      useDeviceLocation: false,
      locationRequested: true,
    });
    for (const title of ['One', 'Two', 'Three', 'Four'])
      await store.put('bookmarks', title, {
        title,
        url: `https://example.invalid/${title}`,
        tags: [],
      });
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
  await application.evaluate(({ ipcMain, BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0].focus();
    const original = ipcMain._invokeHandlers.get('clarity:call');
    globalThis.feedbackFixture = {
      failTask: true,
      failRefresh: false,
      failBootstrap: false,
      partial: false,
      hold: false,
      external: 0,
    };
    ipcMain.removeHandler('clarity:call');
    ipcMain.handle('clarity:call', async (event, method, args) => {
      const fixture = globalThis.feedbackFixture;
      if (method === 'bootstrap' && fixture.failBootstrap)
        return { ok: false, error: 'The fixture workspace is temporarily unavailable.' };
      if (method === 'external.open') {
        fixture.external++;
        return {
          ok: false,
          error: fixture.long
            ? 'Browser unavailable. '.repeat(60)
            : 'The browser is unavailable. Try opening this link again.',
        };
      }
      if (
        method === 'module' &&
        args.module === 'todos' &&
        args.method === 'add' &&
        fixture.failTask
      )
        return { ok: false, error: 'The task could not be saved. Your draft is still here.' };
      if (method === 'module' && args.module === 'bookmarks' && args.method === 'refreshX') {
        if (fixture.hold)
          await new Promise((resolve) => {
            fixture.release = resolve;
          });
        if (fixture.failRefresh) return { ok: false, error: 'The bookmark source is unavailable.' };
        return { ok: true, value: { imported: 7, complete: !fixture.partial } };
      }
      if (method === 'module' && args.module === 'news' && args.method === 'refresh')
        return { ok: true, value: { errors: [] } };
      return original(event, method, args);
    });
  });
  const nav = (name) =>
    page
      .getByRole('navigation', { name: 'Modules', exact: true })
      .getByRole('button', { name, exact: true })
      .click();
  const toastCount = (count) =>
    eventually(async () => assert.equal(await page.locator('.toast').count(), count));
  const focusWindow = async () => {
    await application.evaluate(({ app, BrowserWindow }) => {
      app.focus({ steal: true });
      BrowserWindow.getAllWindows()[0].focus();
    });
    await eventually(async () =>
      assert.equal(
        await application.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0].isFocused(),
        ),
        true,
      ),
    );
  };
  return { application, page, errors, nav, toastCount, focusWindow };
}

test(
  'global feedback: persistent errors, deduplication, queue, keyboard, themes and long text',
  { timeout: 120000 },
  async () => {
    const { application, page, errors, nav, toastCount } = await launch();
    const observations = [];
    try {
      await nav('Bookmarks');
      for (const name of ['One', 'One', 'Two', 'Three', 'Four'])
        await page.getByRole('button', { name, exact: true }).click();
      await toastCount(3);
      assert.equal(await application.evaluate(() => globalThis.feedbackFixture.external), 5);
      assert.match(await page.locator('.toast').first().innerText(), /Couldn’t open One/);
      await page.keyboard.press('Escape');
      await toastCount(3);
      await page.clock.install();
      await page.clock.runFor(15000);
      await toastCount(3);
      await page.keyboard.press('F8');
      assert.ok(
        await page
          .locator('.toast-viewport')
          .evaluate((node) => node.contains(document.activeElement)),
      );
      await page.keyboard.press('Tab');
      await page.keyboard.press('Escape');
      await toastCount(3);
      assert.match(await page.locator('.toast').last().innerText(), /Couldn’t open Four/);
      observations.push({
        scenario:
          'Five failed opens, four unique errors; three visible; oldest dismissal reveals fourth',
        visible: await page.locator('.toast').allTextContents(),
      });
      while (await page.locator('.toast').count())
        await page
          .getByRole('button', { name: 'Dismiss notification', exact: true })
          .first()
          .click();
      await toastCount(0);
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Four');

      await application.evaluate(() => {
        globalThis.feedbackFixture.long = true;
      });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => window.clarity.call('settings.save', { theme }), theme);
        for (const [width, height] of [
          [1200, 800],
          [850, 600],
        ]) {
          await page.setViewportSize({ width, height });
          await page.getByRole('button', { name: 'One', exact: true }).click();
          await toastCount(1);
          await page.clock.runFor(200);
          await page.evaluate(() =>
            Promise.all(
              document.getAnimations().map((animation) => animation.finished.catch(() => {})),
            ),
          );
          const layout = await page.locator('.toast-viewport').evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const toast = node.querySelector('.toast');
            return {
              x: bounds.x,
              top: bounds.top,
              right: bounds.right,
              bottom: bounds.bottom,
              viewportWidth: innerWidth,
              viewportHeight: innerHeight,
              overflow: toast.scrollWidth > toast.clientWidth,
              theme: document.documentElement.dataset.theme,
            };
          });
          assert.ok(layout.top >= 44 && layout.right <= width && layout.bottom <= height);
          assert.equal(layout.overflow, false);
          observations.push(layout);
          await page.screenshot({ path: join(evidence, `toast-${theme}-${width}.png`) });
          await page.getByRole('button', { name: 'Dismiss notification' }).click();
        }
      }
      await page.evaluate(() => window.clarity.call('settings.save', { reducedMotion: true }));
      await page.getByRole('button', { name: 'One', exact: true }).click();
      await toastCount(1);
      assert.equal(
        await page.locator('.toast').evaluate((node) => getComputedStyle(node).animationName),
        'none',
      );
      assert.deepEqual(errors, []);
      await writeFile(join(evidence, 'queue-layout.json'), JSON.stringify(observations, null, 2));
    } finally {
      await application.close();
    }
  },
);

test(
  'global feedback: visible reading time, modal errors, deferred updates, retry and account invalidation',
  { timeout: 120000 },
  async () => {
    const { application, page, errors, nav, toastCount, focusWindow } = await launch();
    const observations = [];
    try {
      await nav('News');
      await focusWindow();
      await page.clock.install();
      await page.getByRole('button', { name: 'Refresh', exact: true }).click();
      await toastCount(1);
      await page.clock.runFor(100);
      const polite = await page.locator('[aria-live="polite"]').allTextContents();
      assert.ok(polite.some((text) => text.includes('News feeds refreshed')));
      await page.clock.runFor(900);
      await page.locator('.toast').hover();
      await page.locator('.toast[data-paused="true"]').waitFor();
      await page.clock.runFor(10000);
      await toastCount(1);
      await page.mouse.move(100, 300);
      await page.keyboard.press('F8');
      await page.locator('.toast[data-paused="true"]').waitFor();
      await page.clock.runFor(10000);
      await toastCount(1);
      await page.getByRole('button', { name: 'Refresh', exact: true }).focus();
      await focusWindow();
      await page.locator('.toast[data-paused="false"]').waitFor();
      await page.clock.runFor(5100);
      await toastCount(0);
      observations.push(
        'Info toast announces politely and retains six seconds of unpaused reading time.',
      );

      await nav('Bookmarks');
      await application.evaluate(() => {
        globalThis.feedbackFixture.hold = true;
      });
      await page.getByRole('button', { name: 'Refresh X', exact: true }).click();
      await eventually(async () =>
        assert.equal(
          await application.evaluate(() => typeof globalThis.feedbackFixture.release),
          'function',
        ),
      );
      await nav('Todos');
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'New task', exact: true });
      await dialog.getByRole('textbox', { name: 'New task', exact: true }).fill('Keep my draft');
      await application.evaluate(() => {
        globalThis.feedbackFixture.release();
        globalThis.feedbackFixture.hold = false;
      });
      await page.clock.runFor(10000);
      await toastCount(0);
      await dialog.getByRole('button', { name: 'Add', exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      assert.match(await dialog.getByRole('alert').innerText(), /draft is still here/);
      assert.equal(
        await dialog.getByRole('textbox', { name: 'New task', exact: true }).inputValue(),
        'Keep my draft',
      );
      await page.screenshot({ path: join(evidence, 'dialog-local-error.png') });

      await application.evaluate(({ BrowserWindow }) => {
        globalThis.feedbackFixture.failBootstrap = true;
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'changed',
          module: 'settings',
        });
      });
      await dialog.locator('.feedback-banners').waitFor();
      assert.equal(await page.locator('.workspace > .feedback-banners').count(), 0);
      await application.evaluate(() => {
        globalThis.feedbackFixture.failBootstrap = false;
      });
      await dialog.getByRole('button', { name: 'Try again', exact: true }).click();
      await eventually(async () =>
        assert.equal(await dialog.locator('.feedback-banners').count(), 0),
      );
      await application.evaluate(() => {
        globalThis.feedbackFixture.failTask = false;
      });
      await dialog.getByRole('button', { name: 'Add', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      await toastCount(1);
      assert.match(await page.locator('.toast').innerText(), /7 imported/);
      const saved = await page.evaluate(() =>
        window.clarity.call('module', { module: 'todos', method: 'list' }),
      );
      assert.equal(saved.items.filter((item) => item.title === 'Keep my draft').length, 1);
      await page.mouse.move(100, 300);
      await page.clock.runFor(1000);
      await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
      const hiddenWindows = await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows().map((win) => ({
          visible: win.isVisible(),
          destroyed: win.isDestroyed(),
          webContentsDestroyed: win.webContents.isDestroyed(),
        })),
      );
      assert.deepEqual(hiddenWindows, [
        { visible: false, destroyed: false, webContentsDestroyed: false },
      ]);
      assert.equal(page.isClosed(), false);
      observations.push({ hiddenWindows });
      await toastCount(0);
      await page.clock.runFor(20000);
      await application.evaluate(({ BrowserWindow }) => {
        const win = BrowserWindow.getAllWindows()[0];
        win.show();
        win.focus();
      });
      await toastCount(1);
      await focusWindow();
      await page.clock.runFor(6100);
      await toastCount(0);
      observations.push(
        'Modal success deferred; task draft retained through failure; banner retry reachable in modal; hidden window preserves unread toast time.',
      );

      await nav('Bookmarks');
      await application.evaluate(() => {
        globalThis.feedbackFixture.failRefresh = true;
      });
      await page.getByRole('button', { name: 'Refresh X', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Couldn’t refresh X' }).waitFor();
      await toastCount(0);
      await application.evaluate(() => {
        globalThis.feedbackFixture.failRefresh = false;
        globalThis.feedbackFixture.partial = true;
      });
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await page
        .getByRole('status')
        .filter({ hasText: 'Some bookmarks weren’t refreshed' })
        .waitFor();
      assert.equal(await page.getByRole('alert').count(), 0);
      await application.evaluate(() => {
        globalThis.feedbackFixture.partial = false;
        globalThis.feedbackFixture.hold = true;
      });
      await page.getByRole('button', { name: 'Refresh X', exact: true }).click();
      await application.evaluate(({ BrowserWindow }) => {
        BrowserWindow.getAllWindows()[0].webContents.send('clarity:event', {
          type: 'auth',
          data: { kind: 'disconnected', provider: 'x' },
        });
      });
      await page.clock.runFor(50);
      await application.evaluate(() => globalThis.feedbackFixture.release());
      await page.clock.runFor(100);
      await toastCount(0);
      assert.equal(await page.getByText('7 imported.', { exact: true }).count(), 0);
      observations.push(
        'Refresh errors stay local, retry clears them, partial outcomes remain warning notices, late old-account completion is discarded.',
      );
      assert.deepEqual(errors, []);
      await writeFile(join(evidence, 'timing-modal.json'), JSON.stringify(observations, null, 2));
    } finally {
      await application.close();
    }
  },
);
