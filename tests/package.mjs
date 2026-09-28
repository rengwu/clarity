import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, realpath, readFile } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, sep } from 'node:path';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const require = createRequire(join(cache, 'loader.cjs'));
const { _electron: electron } = require('playwright-core');

test(
  'relocated macOS bundle runs with its own dependencies and a system-only PATH',
  { timeout: 120000 },
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'clarity-package-test-'));
    const bundle = join(directory, 'Clarity.app');
    await cp(join(cache, 'Clarity.app'), bundle, { recursive: true, verbatimSymlinks: true });
    const root = await realpath(bundle);
    async function inspect(folder) {
      for (const entry of await readdir(folder, { withFileTypes: true })) {
        const path = join(folder, entry.name);
        if (entry.isSymbolicLink())
          assert.ok(
            (await realpath(path)).startsWith(root + sep),
            `Bundle symlink escapes: ${path}`,
          );
        else if (entry.isDirectory()) await inspect(path);
      }
    }
    await inspect(bundle);
    await promisify(execFile)('/usr/bin/codesign', ['--verify', '--deep', '--strict', bundle]);
    const environment = {
      ...process.env,
      PATH: '/usr/bin:/bin:/usr/sbin:/sbin',
      CLARITY_TEST_ROOT: join(directory, 'Data'),
    };
    delete environment.NODE_PATH;
    delete environment.CLARITY_SOURCE;
    const helper = await promisify(execFile)(
      join(bundle, 'Contents/Resources/app/clarity-player'),
      ['--info'],
      { env: environment },
    );
    assert.equal(JSON.parse(helper.stdout).version, '0.8.0');
    const launch = () =>
      electron.launch({
        executablePath: join(bundle, 'Contents/MacOS/Electron'),
        args: [],
        env: environment,
        cwd: directory,
        timeout: 30000,
      });
    let application;
    try {
      application = await launch();
      let page = await application.firstWindow();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      await page.getByRole('textbox', { name: 'New task' }).fill('Packaged persistence');
      await page.getByRole('button', { name: 'Add', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Complete Packaged persistence' }).check();
      await page.getByRole('button', { name: 'Notes', exact: true }).first().click();
      await page.getByRole('button', { name: 'New note', exact: true }).click();
      await page.locator('.ProseMirror').fill('A note from the packaged app.');
      await application.close();
      application = undefined;
      assert.match(
        await readFile(join(environment.CLARITY_TEST_ROOT, 'Notes', 'Untitled.md'), 'utf8'),
        /packaged app/,
      );
      application = await launch();
      page = await application.firstWindow();
      await page.getByRole('button', { name: 'Todos', exact: true }).click();
      assert.equal(
        await page.getByRole('checkbox', { name: 'Complete Packaged persistence' }).isChecked(),
        true,
      );
      console.log(`Relocated bundle verified: ${bundle}`);
    } finally {
      await application?.close();
    }
  },
);
