import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cache =
  process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const evidence = process.env.CLARITY_TASK_DATE_EVIDENCE || join(cache, 'task-dates-evidence');
await mkdir(evidence, { recursive: true });
const bundle = join(cache, 'task-date-tests.mjs');
await require('esbuild').build({
  stdin: {
    contents:
      "export { Store } from './src/main/store'; export { Files } from './src/main/files'; export { Modules, catalog } from './src/main/modules';",
    resolveDir: resolve('.'),
  },
  outfile: bundle,
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
});
const { Store, Files, Modules, catalog } = await import(pathToFileURL(bundle));
const enabled = ['chat', 'notes', 'todos', 'calendar'];
async function eventually(check) {
  let failure;
  for (let attempt = 0; attempt < 100; attempt++) {
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

test('task dates validate, preserve revisions and persist through approved actions and restart', async () => {
  const root = await mkdtemp(join(tmpdir(), 'clarity-task-date-core-'));
  let store = new Store(root, join(cache, 'output/worker.mjs'));
  await store.start();
  try {
    const modules = new Modules(store, new Files(root), {}, {}, () => {});
    await modules.saveSettings({ enabled });
    assert.match(catalog.todos, /date\?:YYYY-MM-DD\|null/);
    const legacy = await store.put('todos', 'legacy', { title: 'Legacy task', done: false });
    const upgraded = await modules.invoke('todos', 'update', {
      id: legacy.id,
      revision: legacy.revision,
      done: true,
    });
    assert.equal(upgraded.date, null);
    const task = await modules.invoke('todos', 'add', {
      title: 'Leap day',
      date: '2028-02-29',
    });
    const renamed = await modules.invoke('todos', 'update', {
      id: task.id,
      revision: task.revision,
      title: 'Keep date',
    });
    assert.equal(renamed.date, '2028-02-29');
    await assert.rejects(
      modules.invoke('todos', 'update', {
        id: task.id,
        revision: task.revision,
        date: '2028-03-01',
      }),
      /changed|revision|conflict/i,
    );
    for (const date of [
      '2026-02-29',
      '2026-04-31',
      '2026-13-01',
      '2026-00-01',
      '0000-01-01',
      '2026-1-01',
      '2026-10-01T12:00:00Z',
      true,
      123,
      ['2026-10-01'],
    ]) {
      await assert.rejects(
        modules.invoke('todos', 'update', { id: task.id, revision: renamed.revision, date }),
        /valid task date/,
      );
    }
    assert.equal((await store.get('todos', task.id)).date, '2028-02-29');
    const cleared = await modules.invoke('todos', 'update', {
      id: task.id,
      revision: renamed.revision,
      date: null,
    });
    assert.equal(cleared.date, null);
    const empty = await modules.invoke('todos', 'add', { title: 'Empty date', date: '' });
    assert.equal(empty.date, null);
    const pending = await modules.agent('fixture-chat', 'todos', 'add', {
      title: 'Approved date',
      date: '2026-12-31',
    });
    assert.equal(pending.status, 'pending-approval');
    assert.equal((await store.list('todos')).length, 3);
    await modules.approve(pending.actionId, true);
    await assert.rejects(modules.approve(pending.actionId, true), /no longer pending/);
    const approved = (await store.list('todos')).find(
      (task) => task.title === 'Approved date',
    );
    assert.equal(approved.date, '2026-12-31');
    await modules.saveSettings({ autoApproveActions: ['todos.update'] });
    const moved = await modules.agent('fixture-chat', 'todos', 'update', {
      id: approved.id,
      revision: approved.revision,
      date: '2027-01-01',
    });
    assert.equal(moved.date, '2027-01-01');
    assert.equal((await store.list('calendar')).length, 0);
    await store.close();
    store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    assert.equal((await store.get('todos', approved.id)).date, '2027-01-01');
    assert.equal((await store.get('todos', task.id)).date, null);
  } finally {
    await store.close();
  }
});

test(
  'dated tasks use real Todo controls and stay in sync across Calendar views and restart',
  { timeout: 120000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-task-date-ui-'));
    const files = new Files(root);
    await files.initialize();
    const store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    try {
      await store.put('settings', 'default', {
        enabled,
        theme: 'light',
        useDeviceLocation: false,
        locationRequested: true,
      });
      await store.put('todos', 'legacy', { title: 'Legacy undated task', done: false });
    } finally {
      await store.close();
    }
    let application, page;
    const errors = [];
    const launch = async () => {
      application = await require('playwright-core')._electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      page = await application.firstWindow();
      page.setDefaultTimeout(10000);
      page.on('pageerror', (error) => errors.push(error.message));
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' });
      await page.reload();
      await page.locator('.sidebar').waitFor();
    };
    const nav = (name) =>
      page.locator('.sidebar').getByRole('button', { name, exact: true }).click();
    const call = (method, args) =>
      page.evaluate(({ method, args }) => window.clarity.call(method, args), { method, args });
    const invoke = (module, method, args = {}) => call('module', { module, method, args });
    const record = async (id) =>
      (await invoke('todos', 'list')).items.find((task) => task.id === id);
    const calendarTask = (id) => page.locator(`[data-todo-id="${id}"]`);
    const taskRow = (id) => page.locator(`.tasks [data-item-id="${id}"]`);
    try {
      await launch();
      const dates = await page.evaluate(() => {
        const today = new Date();
        const format = (day) =>
          `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        const other = new Date(today);
        other.setDate(today.getDate() + (today.getDay() === 6 ? -1 : 1));
        return {
          today: format(today),
          other: format(other),
          zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      });
      assert.equal(dates.zone, 'America/Los_Angeles');
      const event = await invoke('calendar', 'add', {
        title: 'Appointment stays separate',
        start: `${dates.today}T09:00:00-07:00`,
        end: `${dates.today}T10:00:00-07:00`,
      });
      await nav('Todos');
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      await page.getByRole('textbox', { name: 'New task', exact: true }).fill('Plan the week');
      await page.getByLabel('New task date (optional)', { exact: true }).fill(dates.today);
      await page.getByRole('button', { name: 'Add', exact: true }).dblclick();
      let task;
      await eventually(async () => {
        const tasks = (await invoke('todos', 'list')).items;
        assert.equal(tasks.length, 2);
        task = tasks.find((item) => item.title === 'Plan the week');
        assert.equal(task.date, dates.today);
      });
      await page.getByRole('button', { name: 'New task', exact: true }).click();
      assert.equal(
        await page.getByLabel('New task date (optional)', { exact: true }).inputValue(),
        '',
      );
      assert.equal(
        await taskRow(task.id).locator('time').getAttribute('datetime'),
        dates.today,
      );
      await page
        .getByRole('textbox', { name: 'New task', exact: true })
        .fill('Another undated task');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Complete Another undated task' }).waitFor();
      await nav('Calendar');
      await calendarTask(task.id).waitFor();
      assert.equal(
        await calendarTask(task.id).locator('..').getAttribute('data-date'),
        dates.today,
      );
      assert.equal(await page.locator('.calendar-task').count(), 1);
      assert.equal((await invoke('calendar', 'list')).items.length, 1);
      await page.screenshot({ path: join(evidence, 'week.png') });
      await page.getByRole('button', { name: 'Month', exact: true }).click();
      await calendarTask(task.id).scrollIntoViewIfNeeded();
      assert.equal(
        await calendarTask(task.id).locator('..').getAttribute('data-date'),
        dates.today,
      );
      await page.screenshot({ path: join(evidence, 'month.png') });
      await calendarTask(task.id).click();
      await eventually(async () =>
        assert.equal(await taskRow(task.id).getAttribute('data-focused'), 'true'),
      );
      await taskRow(task.id).locator('.task-title').click();
      await page.getByLabel('Task date (optional)', { exact: true }).fill(dates.other);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.equal((await record(task.id)).date, dates.today);
      await taskRow(task.id).locator('.task-title').click();
      await page.getByLabel('Task date (optional)', { exact: true }).fill(dates.other);
      await page.getByRole('button', { name: 'Save', exact: true }).dblclick();
      await eventually(async () => assert.equal((await record(task.id)).date, dates.other));
      await taskRow(task.id).getByRole('checkbox').check();
      await eventually(async () => assert.equal((await record(task.id)).done, true));
      await nav('Calendar');
      await calendarTask(task.id).waitFor();
      assert.equal(
        await calendarTask(task.id).locator('..').getAttribute('data-date'),
        dates.other,
      );
      assert.equal(
        await calendarTask(task.id).getAttribute('aria-label'),
        'Completed task: Plan the week',
      );
      await application.close();
      application = undefined;
      await launch();
      await nav('Calendar');
      await calendarTask(task.id).waitFor();
      assert.equal(
        await calendarTask(task.id).locator('..').getAttribute('data-date'),
        dates.other,
      );
      assert.equal((await record(task.id)).done, true);
      await calendarTask(task.id).click();
      await taskRow(task.id).getByRole('checkbox').uncheck();
      await eventually(async () => assert.equal((await record(task.id)).done, false));
      await taskRow(task.id).locator('.task-title').click();
      await application.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0].setSize(850, 600),
      );
      await page.screenshot({ path: join(evidence, 'edit-minimum.png') });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
      );
      await page.getByRole('button', { name: 'Clear date', exact: true }).click();
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await eventually(async () => assert.equal((await record(task.id)).date, null));
      await nav('Calendar');
      await page.getByText('Loading tasks…', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await calendarTask(task.id).count(), 0);
      await page.getByRole('button', { name: 'Month', exact: true }).click();
      assert.equal(await calendarTask(task.id).count(), 0);

      // External task changes stand in for another chat/automation while Calendar remains open.
      const current = await record(task.id);
      await invoke('todos', 'update', {
        id: task.id,
        revision: current.revision,
        date: dates.today,
      });
      await calendarTask(task.id).waitFor();
      await calendarTask(task.id).scrollIntoViewIfNeeded();
      await call('settings.save', { theme: 'dark' });
      await eventually(async () =>
        assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark'),
      );
      await page.screenshot({ path: join(evidence, 'month-dark-minimum.png') });
      await call('settings.save', { enabled: enabled.filter((module) => module !== 'todos') });
      await calendarTask(task.id).waitFor({ state: 'detached' });
      await call('settings.save', { enabled });
      await calendarTask(task.id).waitFor();
      await calendarTask(task.id).click();
      await taskRow(task.id)
        .getByRole('button', { name: 'Delete Plan the week', exact: true })
        .click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete', exact: true })
        .click();
      await eventually(async () => assert.equal(await record(task.id), undefined));
      await nav('Calendar');
      await page.getByText('Loading tasks…', { exact: true }).waitFor({ state: 'hidden' });
      assert.equal(await calendarTask(task.id).count(), 0);
      const remainingEvents = (await invoke('calendar', 'list')).items;
      assert.deepEqual(remainingEvents, [event]);
      assert.deepEqual(errors, []);
      await writeFile(
        join(evidence, 'observations.json'),
        JSON.stringify(
          {
            dates,
            taskId: task.id,
            createdOnce: true,
            undatedHidden: true,
            dateMove: true,
            cancelPreserved: true,
            completionVisible: true,
            restartPreserved: true,
            clearRemoved: true,
            liveChanges: true,
            disabledModuleHidden: true,
            deletionRemoved: true,
            calendarEventsUnchanged: true,
            minimumViewport: [850, 600],
            rendererErrors: errors,
          },
          null,
          2,
        ),
      );
    } finally {
      await application?.close();
    }
  },
);
