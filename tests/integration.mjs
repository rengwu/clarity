import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const { _electron: electron } = require('playwright-core');
const output = join(cache, 'output');
async function eventually(check, milliseconds = 8000) {
  const end = Date.now() + milliseconds;
  let error;
  while (Date.now() < end) {
    try {
      await check();
      return;
    } catch (failure) {
      error = failure;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw error;
}

test(
  'local app: notes, tasks, calendar, expenses, wiki, persistence and window lifecycle',
  { timeout: 120000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-app-test-'));
    await mkdir(join(root, 'Notes'));
    await mkdir(join(root, 'Wiki'));
    await writeFile(
      join(root, 'Wiki', 'Research.md'),
      '# Research\n\nA local wiki.\n\n[Details](#details) · [Other topic](Other.md#section)\n\n## Details\n\n| Topic | State |\n| --- | --- |\n| Storage | Local |\n',
    );
    await writeFile(join(root, 'Wiki', 'Other.md'), '# Other\n\n## Section\n\nLinked topic.\n');
    let application;
    const errors = [];
    try {
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(output, 'main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
        timeout: 30000,
      });
      application.process().stderr.on('data', (data) => {
        const message = data.toString();
        if (/uncaught|ERR_|Error:|exception/i.test(message)) process.stderr.write(message);
      });
      const page = await application.firstWindow();
      page.on('pageerror', (error) => errors.push(error.stack || error.message));
      await page.getByRole('button', { name: 'Notes', exact: true }).first().waitFor();
      await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
      await page.getByRole('button', { name: 'New note', exact: true }).click();
      await page.locator('.ProseMirror').waitFor();
      await page.locator('.ProseMirror').fill('A saved note');
      await eventually(async () =>
        assert.match(await readFile(join(root, 'Notes', 'Untitled.md'), 'utf8'), /A saved note/),
      );
      await page.getByRole('button', { name: 'Markdown', exact: true }).click();
      await page
        .getByRole('textbox', { name: 'Markdown source' })
        .fill(
          '# Notes\n\n- [ ] Task\n- [x] Done\n\n3. Third\n4. Fourth\n\n- Bullet\n  - Nested\n\n| One | Two |\n| --- | --- |\n| A | B |\n\n~~Deleted~~ and **bold**.\n\n[Link](https://example.com) and `code`.\n',
        );
      await eventually(async () =>
        assert.match(await readFile(join(root, 'Notes', 'Untitled.md'), 'utf8'), /\| A \| B \|/),
      );
      await page.getByRole('button', { name: 'Editor', exact: true }).click();
      await page.locator('.ProseMirror table.children').waitFor();
      for (const text of ['Task', 'Done', 'Third', 'Fourth', 'Bullet', 'Nested'])
        await page.locator('.ProseMirror').getByText(text, { exact: true }).waitFor();
      assert.equal(await page.locator('.ProseMirror ol').getAttribute('start'), '3');
      await page.locator('.ProseMirror .label.unchecked').click();
      await page.getByRole('button', { name: 'Markdown', exact: true }).click();
      const roundtrip = await page.getByRole('textbox', { name: 'Markdown source' }).inputValue();
      for (const pattern of [
        /\[x\] Task/,
        /\[x\] Done/,
        /3\. Third/,
        /4\. Fourth/,
        /Bullet/,
        /Nested/,
        /\| A\s*\| B\s*\|/,
        /~~Deleted~~/,
        /\*\*bold\*\*/,
        /\[Link\]\(https:\/\/example.com\)/,
        /`code`/,
      ])
        assert.match(roundtrip, pattern);
      await page.getByRole('button', { name: 'Editor', exact: true }).click();
      await page.locator('.ProseMirror table.children').waitFor();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await page.getByRole('textbox', { name: 'New task' }).fill('Verify local persistence');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Complete Verify local persistence' }).check();
      await page.waitForFunction(() => document.querySelector('.tasks .done'));
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      for (const name of [
        'Calendar',
        'Expenses',
        'Bookmarks',
        'News',
        'Music',
        'Agent board',
        'Automations',
      ])
        await page.getByRole('checkbox', { name, exact: true }).check();
      await page.getByRole('button', { name: 'Calendar', exact: true }).first().click();
      await page.getByRole('button', { name: '+ Event', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('Design review');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByRole('button', { name: /Design review/ }).waitFor();
      await page.getByRole('button', { name: 'Month', exact: true }).click();
      assert.ok((await page.locator('.month-day[data-month]').count()) >= 19);
      const dates = await page
        .locator('.month-day')
        .evaluateAll((cells) => cells.map((cell) => cell.dataset.date));
      assert.equal(
        new Set(dates).size,
        dates.length,
        'Continuous month scrolling must not repeat dates',
      );
      await page.getByRole('button', { name: 'Expenses', exact: true }).click();
      await page.getByRole('button', { name: '+ New expense' }).click();
      await page.getByRole('textbox', { name: 'Amount', exact: true }).pressSequentially('12370');
      assert.equal(
        await page.getByRole('textbox', { name: 'Amount', exact: true }).inputValue(),
        '123.70',
      );
      await page.getByLabel('Category', { exact: true }).fill('Groceries');
      await page.getByLabel('Description', { exact: true }).fill('Weekly groceries');
      await page.getByRole('button', { name: 'Create', exact: true }).click();
      await page.getByRole('button', { name: /Weekly groceries/ }).waitFor();
      await page.getByRole('button', { name: 'Bookmarks', exact: true }).click();
      await page.getByRole('button', { name: 'Add bookmark', exact: true }).click();
      await page.getByLabel('Title', { exact: true }).fill('Example bookmark');
      await page.getByLabel('URL', { exact: true }).fill('https://example.com/');
      await page.getByLabel('Description', { exact: true }).fill('A saved reference');
      await page.getByLabel('Tags (comma separated)', { exact: true }).fill('research, reference');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByText('Example bookmark', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'News', exact: true }).click();
      await page.getByRole('button', { name: 'Sources', exact: true }).click();
      await page.getByLabel('Name', { exact: true }).fill('Example feed');
      await page.getByLabel('Feed URL', { exact: true }).fill('https://example.com/feed.xml');
      await page.getByRole('button', { name: 'Add source', exact: true }).click();
      await page.getByRole('dialog').getByText('Example feed', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Agent board', exact: true }).click();
      await page.getByRole('button', { name: 'New thread', exact: true }).click();
      await page.getByLabel('Topic', { exact: true }).fill('Verification');
      await page.getByLabel('Post', { exact: true }).fill('A concise work trace.');
      await page.getByRole('button', { name: 'Post', exact: true }).click();
      await page.getByRole('heading', { name: 'Verification', exact: true }).waitFor();
      await page.getByLabel('Reply', { exact: true }).fill('Checked.');
      await page.getByRole('button', { name: 'Post', exact: true }).click();
      await page.getByText('Checked.', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Automations', exact: true }).click();
      await page.getByRole('button', { name: 'New automation', exact: true }).click();
      await page.getByLabel('Name', { exact: true }).fill('Maintain research');
      await page.getByLabel('Wiki topic', { exact: true }).fill('Research.md');
      await page
        .getByLabel('Instructions', { exact: true })
        .fill('Keep relevant new tasks summarized.');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await page.getByRole('button', { name: 'Run now', exact: true }).click();
      await page
        .getByText('No new app information.', { exact: true })
        .waitFor({ state: 'attached' });
      await page.getByRole('button', { name: 'Wiki', exact: true }).click();
      await page
        .frameLocator('iframe')
        .getByRole('link', { name: 'Research', exact: true })
        .click();
      await page
        .frameLocator('iframe')
        .getByRole('heading', { name: 'Research', exact: true })
        .waitFor();
      assert.match(await readFile(join(root, 'Wiki', 'index.html'), 'utf8'), /A local wiki/);
      const reader = page.frameLocator('iframe');
      await reader.getByRole('link', { name: 'Details', exact: true }).click();
      await reader.getByRole('heading', { name: 'Details', exact: true }).waitFor();
      await reader.getByRole('link', { name: 'Other topic', exact: true }).click();
      await reader.getByRole('heading', { name: 'Section', exact: true }).waitFor();
      await reader.getByRole('link', { name: 'Research', exact: true }).click();
      await page.screenshot({ path: join(cache, 'wiki-test.png') });
      await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
      assert.equal(
        await application.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0].isVisible(),
        ),
        false,
      );
      await application.evaluate(({ app }) => app.emit('activate'));
      assert.equal(
        await application.evaluate(({ BrowserWindow }) =>
          BrowserWindow.getAllWindows()[0].isVisible(),
        ),
        true,
      );
      await application.close();
      application = undefined;
      const savedNote = await readFile(join(root, 'Notes', 'Untitled.md'), 'utf8');
      assert.match(savedNote, /\[x\] Task/);
      assert.match(savedNote, /Nested/);
      application = await electron.launch({
        executablePath: require('electron'),
        args: [join(output, 'main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
        timeout: 30000,
      });
      const reopened = await application.firstWindow();
      await reopened.getByRole('button', { name: 'Todos', exact: true }).click();
      assert.equal(
        await reopened
          .getByRole('checkbox', { name: 'Complete Verify local persistence' })
          .isChecked(),
        true,
      );
      assert.deepEqual(errors, []);
      console.log(`Test data: ${root}`);
    } finally {
      await application?.close();
    }
  },
);
