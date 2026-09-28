import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const { _electron: electron } = require('playwright-core');

async function settled(page, id) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const chat = await page.evaluate((id) => window.clarity.call('chats.get', { id }), id);
    if (chat.status !== 'running') return chat;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Chat did not finish within two minutes');
}

test(
  'live Codex: tool approval, same-thread model change and restart',
  {
    skip: process.env.CLARITY_LIVE_CODEX !== '1',
    timeout: 240000,
  },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-live-chat-'));
    let application;
    const launch = () =>
      electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
        timeout: 30000,
      });
    try {
      application = await launch();
      let page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      await page.evaluate(() => window.clarity.call('auth.existingCodex'));
      const chat = await page.evaluate(() => window.clarity.call('chats.create'));
      await page.evaluate(
        (id) =>
          window.clarity.call('chats.send', {
            id,
            model: 'gpt-5.5',
            effort: 'low',
            text: 'Use the todos module to add exactly one task titled "Live Codex verification". Queue the action for approval. Do not do anything else. Remember the word marigold for my next message.',
          }),
        chat.id,
      );
      await settled(page, chat.id);
      let saved = await page.evaluate((id) => window.clarity.call('chats.get', { id }), chat.id);
      assert.equal(saved.status, 'idle', saved.error);
      const actions = await page.evaluate(
        (owner) => window.clarity.call('actions.list', { owner }),
        chat.id,
      );
      assert.equal(actions.length, 1);
      assert.equal(actions[0].status, 'pending');
      assert.equal(
        (
          await page.evaluate(() =>
            window.clarity.call('module', { module: 'todos', method: 'list' }),
          )
        ).total,
        0,
      );
      await page.evaluate(
        (id) => window.clarity.call('actions.review', { id, apply: true }),
        actions[0].id,
      );
      assert.equal(
        (
          await page.evaluate(() =>
            window.clarity.call('module', { module: 'todos', method: 'list' }),
          )
        ).items[0].title,
        'Live Codex verification',
      );
      await application.close();
      application = undefined;
      application = await launch();
      page = await application.firstWindow();
      await page.waitForFunction(() => !!window.clarity);
      const bootstrap = await page.evaluate(() => window.clarity.call('bootstrap'));
      const alternate =
        bootstrap.models.find((model) => model.id === 'gpt-5.6-luna')?.id || 'gpt-5.5';
      await page.evaluate(
        ({ id, model }) =>
          window.clarity.call('chats.send', {
            id,
            model,
            effort: 'medium',
            text: 'What was the word I asked you to remember? Answer with that word only. Do not call any tools.',
          }),
        { id: chat.id, model: alternate },
      );
      await settled(page, chat.id);
      saved = await page.evaluate((id) => window.clarity.call('chats.get', { id }), chat.id);
      assert.equal(saved.status, 'idle', saved.error);
      assert.match(JSON.stringify(saved.messages.at(-1).content), /marigold/i);
      assert.equal(saved.messages.filter((message) => message.role === 'user').length, 2);
      console.log(`Live chat passed: gpt-5.5 → ${alternate}; data ${root}`);
    } finally {
      await application?.close();
    }
  },
);
