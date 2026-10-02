import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const { _electron: electron } = require('playwright-core');

test(
  'agent approvals checklist: individual choices, mixed Select all and persistence',
  { timeout: 60000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-agent-approvals-'));
    const launch = () =>
      electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
    let application;
    try {
      application = await launch();
      let page = await application.firstWindow();
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Agent approvals', exact: true })
        .click();
      const section = () => page.getByRole('region', { name: 'Agent approvals', exact: true });
      const all = () => section().getByRole('checkbox', { name: 'Select all', exact: true });
      const play = () => section().getByRole('checkbox', { name: 'Music: play', exact: true });
      const saved = async (count) => {
        await page.waitForFunction(
          async (count) =>
            (await window.clarity.call('bootstrap')).settings.autoApproveActions.length === count,
          count,
        );
        await page.waitForFunction(() => !document.querySelector('.agent-approvals').disabled);
      };
      assert.equal(await all().isChecked(), false);
      assert.equal(await all().evaluate((element) => element.indeterminate), false);
      const count = (await section().getByRole('checkbox').count()) - 1;
      assert.ok(
        count >= 30,
        'All current approval actions, including disabled modules, are listed',
      );
      await play().check();
      await saved(1);
      assert.equal(await all().isChecked(), false);
      assert.equal(await all().evaluate((element) => element.indeterminate), true);
      const settings = await page.evaluate(
        async () => (await window.clarity.call('bootstrap')).settings,
      );
      assert.deepEqual(settings.autoApproveActions, ['music.play']);
      assert.equal(
        settings.enabled.includes('music'),
        false,
        'Selecting an action does not enable its module',
      );
      await all().click();
      await saved(count);
      assert.equal(await all().isChecked(), true);
      assert.equal(await all().evaluate((element) => element.indeterminate), false);
      assert.equal(await section().locator('input:checked').count(), count + 1);
      await play().uncheck();
      await saved(count - 1);
      assert.equal(await all().evaluate((element) => element.indeterminate), true);
      await all().focus();
      await page.keyboard.press('Space');
      await saved(count);
      assert.equal(await all().isChecked(), true);
      await all().uncheck();
      await saved(0);
      assert.equal(await section().locator('input:checked').count(), 0);
      assert.equal(await all().evaluate((element) => element.indeterminate), false);
      await play().check();
      await saved(1);
      await application.close();
      application = await launch();
      page = await application.firstWindow();
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Agent approvals', exact: true })
        .click();
      assert.equal(await play().isChecked(), true);
      assert.equal(await all().evaluate((element) => element.indeterminate), true);
      const invalid = await page.evaluate(async () => {
        try {
          await window.clarity.call('settings.save', { autoApproveActions: ['*'] });
        } catch (error) {
          return error.message;
        }
      });
      assert.match(invalid, /checklist/);
      await saved(1);
      await section().screenshot({ path: join(cache, 'agent-approvals-test.png') });
    } finally {
      await application?.close();
    }
  },
);

test(
  'permissions: location outcomes, clearing, website revocation and restart',
  { timeout: 90000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), 'clarity-permissions-'));
    const fixture = join(cache, 'permissions-fixture.mjs');
    await require('esbuild').build({
      stdin: { contents: "export {Store} from './src/main/store';", resolveDir: resolve('.') },
      bundle: true,
      packages: 'external',
      platform: 'node',
      format: 'esm',
      outfile: fixture,
    });
    const { Store } = await import(pathToFileURL(fixture));
    const store = new Store(root, join(cache, 'output/worker.mjs'));
    await store.start();
    try {
      for (const id of ['first', 'second'])
        await store.put('chats', id, {
          title: `${id} chat`,
          status: 'idle',
          messages: [],
          attachments: [],
          grants: ['https://example.com'],
        });
    } finally {
      await store.close();
    }
    const launch = () =>
      electron.launch({
        executablePath: require('electron'),
        args: [join(cache, 'output/main.mjs')],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
        timeout: 30000,
      });
    let application;
    try {
      application = await launch();
      let page = await application.firstWindow();
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Permissions', exact: true })
        .click();
      const getSettings = () =>
        page.evaluate(async () => (await window.clarity.call('bootstrap')).settings);
      await page.getByRole('heading', { name: 'Permissions', exact: true }).waitFor();
      assert.equal(
        (await getSettings()).locationRequested,
        false,
        'Test launches must not request real device location',
      );
      assert.equal(
        await page.evaluate(
          async () => (await navigator.permissions.query({ name: 'geolocation' })).state,
        ),
        'denied',
      );
      await page
        .getByRole('button', { name: 'Revoke https://example.com in first chat', exact: true })
        .click();
      await page
        .getByRole('button', { name: 'Revoke https://example.com in first chat', exact: true })
        .waitFor({ state: 'detached' });
      assert.equal(
        await page
          .getByRole('button', { name: 'Revoke https://example.com in second chat', exact: true })
          .count(),
        1,
      );

      if (process.platform === 'darwin') {
        await page.evaluate(() => {
          navigator.geolocation.getCurrentPosition = async (success) => {
            window.fixturePermission = (
              await navigator.permissions.query({ name: 'geolocation' })
            ).state;
            success({
              coords: { latitude: 3.139876, longitude: 101.686789, accuracy: 25 },
              timestamp: Date.now(),
            });
          };
        });
        await page.getByRole('button', { name: 'Refresh location', exact: true }).click();
        await page.getByText('Last request: allowed', { exact: true }).waitFor();
        assert.equal(
          await page.evaluate(() => window.fixturePermission),
          'granted',
          'Trusted main frame can request location during a lookup',
        );
        assert.equal((await getSettings()).deviceLocation.latitude, 3.14);
        assert.equal((await getSettings()).deviceLocation.longitude, 101.69);
        assert.equal(
          await page.evaluate(
            async () => (await navigator.permissions.query({ name: 'geolocation' })).state,
          ),
          'denied',
          'Permission gate closes after lookup',
        );
        await page.getByRole('checkbox', { name: 'Use device location' }).uncheck();
        await page.getByRole('button', { name: 'Enable device location', exact: true }).waitFor();
        assert.equal((await getSettings()).deviceLocation, undefined);
        await page.evaluate(() => {
          navigator.geolocation.getCurrentPosition = (_success, failure) => failure({ code: 1 });
        });
        await page.getByRole('button', { name: 'Enable device location', exact: true }).click();
        await page.getByText('Last request: denied', { exact: true }).waitFor();
        assert.match((await getSettings()).locationError, /Location access denied/);
        await page.waitForFunction(
          () =>
            document.querySelector(
              'section[aria-labelledby="permissions-heading"] input[type="checkbox"]',
            ).checked,
        );
        assert.equal((await getSettings()).deviceLocation, undefined);
        await page.evaluate(() => {
          navigator.geolocation.getCurrentPosition = (_success, failure) => failure({ code: 2 });
        });
        await page.getByRole('button', { name: 'Refresh location', exact: true }).click();
        await page
          .getByRole('alert')
          .filter({ hasText: 'Device location is unavailable.' })
          .waitFor();
      }
      await page
        .getByLabel('Manual location (optional)', { exact: true })
        .fill('Test city, Test country');
      await page.getByRole('button', { name: 'Save location', exact: true }).click();
      await page.waitForFunction(
        async () =>
          (await window.clarity.call('bootstrap')).settings.location === 'Test city, Test country',
      );
      assert.equal((await getSettings()).useDeviceLocation, false);
      assert.equal((await getSettings()).locationError, undefined);
      await page.screenshot({ path: join(cache, 'permissions-test.png'), fullPage: true });
      await application.close();
      application = undefined;
      application = await launch();
      page = await application.firstWindow();
      await page.getByRole('button', { name: 'Settings', exact: true }).click();
      await page
        .getByRole('navigation', { name: 'Settings sections' })
        .getByRole('button', { name: 'Permissions', exact: true })
        .click();
      assert.equal(
        await page.getByLabel('Manual location (optional)', { exact: true }).inputValue(),
        'Test city, Test country',
      );
      assert.equal((await getSettings()).useDeviceLocation, false);
      const sites = await page.evaluate(() => window.clarity.call('permissions.sites'));
      assert.deepEqual(
        sites.map(({ id }) => id),
        ['second'],
      );
      await page.getByLabel('Manual location (optional)', { exact: true }).fill('');
      await page.getByRole('button', { name: 'Save location', exact: true }).click();
      await page.waitForFunction(
        async () => (await window.clarity.call('bootstrap')).settings.location === '',
      );
      console.log(`Permission fixtures verified: ${root}`);
    } finally {
      await application?.close();
    }
  },
);
