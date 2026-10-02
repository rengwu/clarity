import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = process.env.CLARITY_QA_EVIDENCE || join(cache, 'adversarial-renderer');
await mkdir(evidence, { recursive: true });
const bundle = join(cache, 'adversarial-renderer-core.mjs');
await require('esbuild').build({
  stdin: {
    contents: "export {Store} from './src/main/store'; export {Files} from './src/main/files';",
    resolveDir: resolve('.'),
  },
  outfile: bundle, bundle: true, packages: 'external', platform: 'node', format: 'esm',
});
const { Store, Files } = await import(pathToFileURL(bundle));

async function eventually(check) {
  let failure;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { return await check(); } catch (error) { failure = error; }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw failure;
}

async function fixture(name, emptyChat = false) {
  const root = await mkdtemp(join(tmpdir(), 'clarity-adversarial-renderer-'));
  const files = new Files(root);
  await files.initialize();
  await writeFile(join(root, 'Notes', 'Welcome.md'), '# Welcome\n\nKeep this original note.\n');
  await writeFile(join(root, 'Notes', 'Malformed.md'), '# Malformed\n\n[Broken link](broken%ZZ.md)\n\n[Truncated](bad%2.md)\n\n[Valid](Welcome.md)\n\n<script>throw new Error("unsafe")</script>\n');
  await writeFile(join(root, 'Wiki', 'Overview.md'), '# Overview\n\n[Jump to details](Deep.md#details)\n');
  await writeFile(join(root, 'Wiki', 'Deep.md'), '# Deep page\n\n' + Array.from({ length: 80 }, (_, i) => `Filler paragraph ${i + 1}.\n\n`).join('') + '## Details\n\nAnchor destination.\n\n[Local heading](#details)\n');
  const store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    await store.put('settings', 'default', {
      enabled: ['chat', 'notes', 'todos', 'wiki'], theme: 'light',
      useDeviceLocation: false, locationRequested: true, lastChat: emptyChat ? undefined : 'chat-a',
    });
    for (const id of emptyChat ? [] : ['chat-a', 'chat-b'])
      await store.put('chats', id, {
        title: id === 'chat-a' ? 'First conversation' : 'Second conversation',
        messages: [], grants: [], attachments: [], status: 'idle',
      });
  } finally { await store.close(); }
  let application;
  const errors = [];
  const observations = {};
  async function launch() {
    application = await require('playwright-core')._electron.launch({
      executablePath: process.env.CLARITY_TEST_EXECUTABLE || require('electron'),
      args: [process.env.CLARITY_TEST_MAIN || join(cache, 'output/main.mjs')],
      env: { ...process.env, CLARITY_TEST_ROOT: root },
    });
    const page = await application.firstWindow();
    page.setDefaultTimeout(8000);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.locator('.sidebar').waitFor();
    await application.evaluate(({ ipcMain }) => {
      const original = ipcMain._invokeHandlers.get('clarity:call');
      globalThis.rendererQA = { sent: [], completed: 0, attachments: [] };
      ipcMain.removeHandler('clarity:call');
      ipcMain.handle('clarity:call', async (event, method, args) => {
        const qa = globalThis.rendererQA;
        if (method === 'bootstrap') {
          const result = await original(event, method, args);
          if (qa.chat) result.value.auth.codex = true;
          return result;
        }
        if (method === 'chats.create' && qa.holdCreate)
          await new Promise((done) => { qa.releaseCreate = done; });
        if (method === 'attachments.pick' && qa.chat)
          return { ok: true, value: { attachments: qa.attachments, errors: [] } };
        if (method === 'chats.send' && qa.chat) {
          qa.sent.push(args);
          await new Promise((done) => { qa.release = done; });
          qa.completed++;
          return qa.fail ? { ok: false, error: 'Fixture send preparation failed' } : { ok: true, value: {} };
        }
        return original(event, method, args);
      });
    });
    return page;
  }
  const page = await launch();
  const settle = () => page.evaluate(() => Promise.all(document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => {}))));
  const nav = async (title) => {
    await page.locator('.sidebar').getByRole('button', { name: title, exact: true }).click();
    await settle();
  };
  const screenshot = async (suffix) => {
    await settle();
    await page.screenshot({ path: join(evidence, `${name}-${suffix}.png`) });
  };
  return {
    page, nav, settle, screenshot, observations,
    get application() { return application; },
    async enableChat() {
      await application.evaluate(() => { globalThis.rendererQA.chat = true; });
      await page.reload();
      await page.locator('.sidebar').waitFor();
    },
    async acknowledge(fail = false) {
      const count = await application.evaluate((_electron, fail) => {
        const qa = globalThis.rendererQA;
        qa.fail = fail;
        const count = qa.completed;
        qa.release();
        return count;
      }, fail);
      await eventually(async () => assert.equal(await application.evaluate(() => globalThis.rendererQA.completed), count + 1));
      await eventually(async () => assert.equal(await page.getByRole('button', { name: 'Stop', exact: true }).count(), 0));
    },
    async drafts(id = 'chat-a') {
      return page.evaluate((id) => Object.fromEntries(['text', 'attachments', 'context'].map((field) => [field, JSON.parse(localStorage.getItem(`clarity:draft:chat:${id}:${field}`) || 'null')])), id);
    },
    async close() {
      observations.rendererErrors = errors;
      observations.finalText = await page.locator('body').innerText().catch(() => 'Renderer unavailable');
      await page.screenshot({ path: join(evidence, `${name}-final.png`) }).catch(() => {});
      await writeFile(join(evidence, `${name}.json`), JSON.stringify(observations, null, 2));
      await application?.close();
    },
  };
}

test('QA01 malformed Markdown source links stay local and valid links remain navigable', async () => {
  const app = await fixture('QA01');
  const { page } = app;
  try {
    await page.getByRole('textbox', { name: 'Message', exact: true }).fill('Preserved preview draft');
    await page.getByRole('button', { name: 'Search and commands', exact: true }).click();
    await page.getByRole('combobox', { name: 'Search Clarity', exact: true }).fill('Malformed');
    await page.getByRole('option', { name: /Malformed Notes · Malformed.md/ }).click();
    const preview = page.getByRole('complementary', { name: 'Source preview' });
    await preview.getByRole('heading', { name: 'Malformed', exact: true }).waitFor();
    assert.equal(await preview.locator('a').filter({ hasText: 'Broken link' }).getAttribute('href'), null);
    assert.equal(await preview.locator('a').filter({ hasText: 'Truncated' }).getAttribute('href'), null);
    assert.equal(await preview.locator('script').count(), 0);
    await preview.getByRole('link', { name: 'Valid', exact: true }).click();
    await preview.getByRole('heading', { name: 'Welcome', exact: true }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: 'Message', exact: true }).inputValue(), 'Preserved preview draft');
    assert.equal((await app.drafts()).text, 'Preserved preview draft');
    app.observations.previewSafe = true;
    await app.screenshot('safe-preview');
  } finally { await app.close(); }
});

test('QA02 native modals retain their draft and focus when global shortcuts are pressed', async () => {
  const app = await fixture('QA02');
  const { page } = app;
  try {
    await app.nav('Todos');
    await page.getByRole('button', { name: 'New task', exact: true }).click();
    const draft = page.getByRole('textbox', { name: 'New task', exact: true });
    await draft.fill('Pending task draft');
    for (const key of ['Meta+l', 'Meta+Shift+l', 'Meta+k', 'Meta+[', 'Meta+]', 'Meta+b']) {
      await page.keyboard.press(key);
      await app.settle();
      assert.equal(await page.getByRole('dialog', { name: 'New task', exact: true }).isVisible(), true);
      assert.equal(await page.locator('.module-host:not([hidden])').getAttribute('data-module'), 'todos');
      assert.equal(await draft.inputValue(), 'Pending task draft');
      await draft.click();
    }
    await app.screenshot('visible-modal');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await page.getByRole('dialog', { name: 'New task', exact: true }).waitFor({ state: 'hidden' });
    const rows = await page.evaluate(() => window.clarity.call('module', { module: 'todos', method: 'list', args: {} }));
    assert.equal(rows.items.filter((task) => task.title === 'Pending task draft').length, 1);
    await page.keyboard.press('Meta+l');
    await app.settle();
    await page.getByRole('textbox', { name: 'Message', exact: true }).click();
    assert.equal(await page.locator('dialog:modal').count(), 0);
    Object.assign(app.observations, { shortcutDraftRetained: true, savedTasks: rows.items.length, composerClickable: true });
  } finally { await app.close(); }
});

test('QA03 rich-editor Bold remains local and sidebar shortcut works outside editors', async () => {
  const app = await fixture('QA03');
  const { page } = app;
  try {
    await app.nav('Notes');
    await page.getByRole('navigation', { name: 'Note files' }).getByRole('button', { name: 'Welcome', exact: true }).click();
    const editor = page.locator('.note-document:not([hidden]) .ProseMirror');
    await editor.click();
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Meta+b');
    await app.settle();
    assert.ok(await editor.locator('strong').count() > 0);
    assert.equal(await page.locator('.shell').evaluate((shell) => shell.classList.contains('sidebar-collapsed')), false);
    await app.screenshot('editor-bold');
    await app.nav('Todos');
    await page.getByRole('button', { name: 'New task', exact: true }).focus();
    await page.keyboard.press('Meta+b');
    await app.settle();
    assert.equal(await page.locator('.shell').evaluate((shell) => shell.classList.contains('sidebar-collapsed')), true);
    await page.getByRole('button', { name: 'Show sidebar', exact: true }).click();
    app.observations.editorBoldOnly = true;
    app.observations.sidebarShortcutOutsideEditor = true;
  } finally { await app.close(); }
});

test('QA06 Wiki cross-page heading survives parent synchronization and history return', async () => {
  const app = await fixture('QA06');
  const { page } = app;
  try {
    await app.nav('Wiki');
    const frame = page.frameLocator('iframe');
    await frame.getByRole('link', { name: 'Overview', exact: true }).click();
    await frame.getByRole('link', { name: 'Jump to details', exact: true }).click();
    await eventually(async () => {
      const geometry = await frame.locator('body').evaluate(() => ({ hash: location.hash, scroll: scrollY, headingY: document.getElementById('details')?.getBoundingClientRect().top, viewport: innerHeight }));
      assert.equal(geometry.hash, '#Deep.md#details');
      assert.ok(geometry.scroll > 0);
      assert.ok(geometry.headingY >= 0 && geometry.headingY < geometry.viewport);
      app.observations.destination = geometry;
    });
    await app.screenshot('heading');
    await frame.getByRole('link', { name: 'Local heading', exact: true }).click();
    await app.nav('First conversation');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await eventually(async () => {
      const geometry = await frame.locator('body').evaluate(() => ({ headingY: document.getElementById('details')?.getBoundingClientRect().top, viewport: innerHeight }));
      assert.ok(geometry.headingY >= 0 && geometry.headingY < geometry.viewport);
    });
    await frame.getByRole('link', { name: 'Overview', exact: true }).click();
    await frame.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
    await frame.getByRole('link', { name: 'Jump to details', exact: true }).click();
    await eventually(async () => {
      const geometry = await frame.locator('body').evaluate(() => ({ hash: location.hash, headingY: document.getElementById('details')?.getBoundingClientRect().top, viewport: innerHeight }));
      assert.equal(geometry.hash, '#Deep.md#details');
      assert.ok(geometry.headingY >= 0 && geometry.headingY < geometry.viewport);
    });
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await frame.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Forward', exact: true }).click();
    await eventually(async () => {
      const geometry = await frame.locator('body').evaluate(() => ({ hash: location.hash, headingY: document.getElementById('details')?.getBoundingClientRect().top, viewport: innerHeight }));
      assert.equal(geometry.hash, '#Deep.md#details');
      assert.ok(geometry.headingY >= 0 && geometry.headingY < geometry.viewport);
    });
    app.observations.historyRestored = true;
    app.observations.furtherHeadingAndForwardRestored = true;
  } finally { await app.close(); }
});

test('QA12 send acknowledgement preserves newer text attachments context and other conversation drafts', async () => {
  const app = await fixture('QA12');
  const { page } = app;
  const message = page.getByRole('textbox', { name: 'Message', exact: true });
  const attachment = (id) => ({ id, name: `${id}.txt`, size: 20, mime: 'text/plain', createdAt: Date.now(), supported: true });
  async function pick(id) {
    await app.application.evaluate((_electron, item) => { globalThis.rendererQA.attachments = [item]; }, attachment(id));
    await page.getByRole('button', { name: 'Attach files', exact: true }).click();
    await page.getByRole('button', { name: `${id}.txt`, exact: true }).waitFor();
  }
  try {
    await app.enableChat();
    await message.fill('Original outgoing text');
    await pick('submitted');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await message.fill('NEW UNSENT DRAFT');
    await pick('new-attachment');
    await app.nav('Wiki');
    await page.frameLocator('iframe').getByRole('link', { name: 'Overview', exact: true }).click();
    await page.getByRole('button', { name: 'Ask in chat', exact: true }).click();
    await page.getByRole('button', { name: 'Remove wiki context', exact: true }).waitFor();
    await app.acknowledge();
    await eventually(async () => assert.equal(await message.inputValue(), 'NEW UNSENT DRAFT'));
    const saved = await app.drafts();
    assert.equal(saved.text, 'NEW UNSENT DRAFT');
    assert.deepEqual(saved.attachments.map((item) => item.id), ['new-attachment']);
    assert.equal(saved.context, 'Overview.md');
    assert.equal(await page.getByRole('button', { name: 'submitted.txt', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'new-attachment.txt', exact: true }).waitFor();
    await app.screenshot('new-draft-preserved');
    await page.reload();
    await page.locator('.sidebar').waitFor();
    assert.equal(await message.inputValue(), 'NEW UNSENT DRAFT');
    await page.getByRole('button', { name: 'Remove wiki context', exact: true }).click();
    await page.getByRole('button', { name: 'Remove new-attachment.txt', exact: true }).click();
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await message.fill('First conversation later draft');
    await app.nav('Second conversation');
    await message.fill('Second conversation independent draft');
    await app.acknowledge();
    assert.equal(await message.inputValue(), 'Second conversation independent draft');
    assert.equal((await app.drafts('chat-a')).text, 'First conversation later draft');
    assert.equal((await app.drafts('chat-b')).text, 'Second conversation independent draft');
    await app.nav('First conversation');
    assert.equal(await message.inputValue(), 'First conversation later draft');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await app.acknowledge(true);
    await page.getByText('Fixture send preparation failed', { exact: true }).waitFor();
    assert.equal(await message.inputValue(), 'First conversation later draft');
    assert.equal((await app.drafts()).text, 'First conversation later draft');
    app.observations.sent = await app.application.evaluate(() => globalThis.rendererQA.sent);
    assert.equal(app.observations.sent[0].text, 'Original outgoing text');
    assert.deepEqual(app.observations.sent[0].attachments.map((item) => item.id), ['submitted']);
    app.observations.newDraft = saved;
    app.observations.crossConversationDraftsPreserved = true;
    app.observations.failurePreserved = true;
  } finally { await app.close(); }
});


test('QA12 newer identical text stays unsent and unchanged submissions clear after success', async () => {
  const app = await fixture('QA12-identical');
  const { page } = app;
  const message = page.getByRole('textbox', { name: 'Message', exact: true });
  try {
    await app.enableChat();
    await message.fill('Repeated draft text');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await message.fill('Different new text');
    await message.fill('Repeated draft text');
    await app.acknowledge();
    assert.equal(await message.inputValue(), 'Repeated draft text');
    assert.equal((await app.drafts()).text, 'Repeated draft text');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('button', { name: 'Stop', exact: true }).waitFor();
    await app.acknowledge();
    await eventually(async () => assert.equal(await message.inputValue(), ''));
    assert.equal((await app.drafts()).text, '');
    app.observations.identicalNewTextPreserved = true;
    app.observations.unchangedSubmissionCleared = true;
  } finally { await app.close(); }
});

test('QA12 edits made while creating a conversation follow the created chat without changing outgoing text', async () => {
  const app = await fixture('QA12-create', true);
  const { page } = app;
  const message = page.getByRole('textbox', { name: 'Message', exact: true });
  try {
    await app.enableChat();
    await app.application.evaluate(() => { globalThis.rendererQA.holdCreate = true; });
    await message.fill('Original new-chat request');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await eventually(async () => assert.equal(await app.application.evaluate(() => typeof globalThis.rendererQA.releaseCreate), 'function'));
    await message.fill('New draft while chat is being created');
    await app.application.evaluate(() => { globalThis.rendererQA.releaseCreate(); });
    await eventually(async () => assert.equal(await app.application.evaluate(() => globalThis.rendererQA.sent.length), 1));
    await app.settle();
    await eventually(async () => assert.equal(await message.inputValue(), 'New draft while chat is being created'));
    const sent = await app.application.evaluate(() => globalThis.rendererQA.sent[0]);
    assert.equal(sent.text, 'Original new-chat request');
    await app.acknowledge();
    assert.equal(await message.inputValue(), 'New draft while chat is being created');
    assert.equal((await app.drafts(sent.id)).text, 'New draft while chat is being created');
    await page.reload();
    await page.locator('.sidebar').waitFor();
    assert.equal(await message.inputValue(), 'New draft while chat is being created');
    app.observations.sentText = sent.text;
    app.observations.newChatId = sent.id;
    app.observations.createdChatDraft = await app.drafts(sent.id);
    app.observations.reloadPreserved = true;
    await app.screenshot('created-chat-draft');
  } finally { await app.close(); }
});


test('QA12 new-conversation send failure remains visible and preserves its latest draft', async () => {
  const app = await fixture('QA12-new-failure', true);
  const { page } = app;
  const message = page.getByRole('textbox', { name: 'Message', exact: true });
  try {
    await app.enableChat();
    await message.fill('New conversation failed request');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await eventually(async () => assert.equal(await app.application.evaluate(() => globalThis.rendererQA.sent.length), 1));
    const sent = await app.application.evaluate(() => globalThis.rendererQA.sent[0]);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await app.settle();
    await message.fill('Latest draft after creation');
    await app.acknowledge(true);
    await page.getByText('Fixture send preparation failed', { exact: true }).waitFor();
    assert.equal(await message.inputValue(), 'Latest draft after creation');
    assert.equal((await app.drafts(sent.id)).text, 'Latest draft after creation');
    app.observations.failureVisible = true;
    app.observations.latestDraftPreserved = true;
    await app.screenshot('visible-failure');
  } finally { await app.close(); }
});
