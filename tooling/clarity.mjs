import { mkdir, readFile, writeFile, cp, rm, access, readdir, symlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { dependencies } from './dependencies.mjs';
import { buildPlayer, collectPlayerNotices } from './player.mjs';

export const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const cache = resolve(
  process.env.CLARITY_BUILD_CACHE ||
    join(homedir(), process.platform === 'darwin' ? 'Library/Caches' : '.cache', 'Clarity/build'),
);
if (cache === repository || cache.startsWith(repository + '/'))
  throw new Error('CLARITY_BUILD_CACHE must be outside this repository.');
export const output = join(cache, 'output');
const modules = join(cache, 'node_modules');
const command = process.argv[2] || 'dev';
const require = createRequire(join(cache, 'loader.cjs'));
async function run(executable, args, options = {}) {
  const child = spawn(executable, args, { stdio: 'inherit', ...options });
  const stop = () => child.kill('SIGTERM');
  process.once('SIGINT', stop);
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  process.removeListener('SIGINT', stop);
  if (code !== 0) throw new Error(`${executable} exited with ${code}`);
}
async function install() {
  await mkdir(cache, { recursive: true });
  const signature = JSON.stringify(dependencies);
  let previous;
  try {
    previous = await readFile(join(cache, 'dependencies.txt'), 'utf8');
  } catch {}
  if (previous === signature) return;
  await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
    'install',
    '--prefix',
    cache,
    '--no-audit',
    '--no-fund',
    ...Object.entries(dependencies).map(([name, version]) => `${name}@${version}`),
  ]);
  await writeFile(join(cache, 'dependencies.txt'), signature);
}
async function build() {
  await install();
  await mkdir(output, { recursive: true });
  for (const obsolete of ['main.cjs', 'main.cjs.map', 'wiki-builder.mjs'])
    await rm(join(output, obsolete), { force: true });
  const { build } = require('esbuild');
  const common = { bundle: true, nodePaths: [modules], logLevel: 'warning', sourcemap: true };
  await Promise.all([
    build({
      ...common,
      entryPoints: [join(repository, 'src/main/main.ts')],
      outfile: join(output, 'main.mjs'),
      platform: 'node',
      format: 'esm',
      target: 'node22',
      packages: 'external',
    }),
    build({
      ...common,
      entryPoints: [join(repository, 'src/main/preload.ts')],
      outfile: join(output, 'preload.cjs'),
      platform: 'node',
      format: 'cjs',
      external: ['electron'],
    }),
    build({
      ...common,
      entryPoints: [join(repository, 'src/worker/state.ts')],
      outfile: join(output, 'worker.mjs'),
      platform: 'neutral',
      format: 'esm',
      external: ['cloudflare:workers'],
    }),
    build({
      ...common,
      entryPoints: [join(repository, 'src/renderer/main.tsx')],
      outfile: join(output, 'app.js'),
      platform: 'browser',
      format: 'esm',
      minify: command === 'package',
      target: 'chrome136',
      loader: { '.svg': 'dataurl' },
      plugins: [
        {
          name: 'omit-unused-math-styles',
          setup(build) {
            build.onLoad({ filter: /(?:katex\.min|latex)\.css$/ }, () => ({
              contents: '',
              loader: 'css',
            }));
          },
        },
      ],
    }),
  ]);
  await cp(join(repository, 'src/renderer/index.html'), join(output, 'index.html'));
  console.log(`Built Clarity: ${output}`);
}
async function typecheck() {
  await install();
  const source = join(cache, 'check-source');
  await rm(source, { recursive: true, force: true });
  await cp(join(repository, 'src'), source, { recursive: true });
  const config = {
    compilerOptions: {
      target: 'ES2023',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      lib: ['ES2023', 'DOM', 'DOM.Iterable'],
      types: ['node'],
      ignoreDeprecations: '6.0',
    },
    include: [join(source, '**/*.ts'), join(source, '**/*.tsx')],
    exclude: [join(source, 'vendor/**'), join(source, 'worker/**')],
  };
  await writeFile(join(cache, 'tsconfig.json'), JSON.stringify(config));
  await run(process.execPath, [
    join(modules, 'typescript/bin/tsc'),
    '--project',
    join(cache, 'tsconfig.json'),
  ]);
  await writeFile(
    join(cache, 'worker-tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        ...config.compilerOptions,
        types: ['@cloudflare/workers-types'],
        lib: ['ES2023'],
      },
      include: [join(source, 'worker/**/*.ts')],
    }),
  );
  await run(process.execPath, [
    join(modules, 'typescript/bin/tsc'),
    '--project',
    join(cache, 'worker-tsconfig.json'),
  ]);
}
async function format() {
  await install();
  const prettier = require('prettier');
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'vendor') continue;
      const file = join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.(ts|tsx|mjs|css|html)$/.test(file)) {
        const before = await readFile(file, 'utf8');
        const after = await prettier.format(before, {
          filepath: file,
          singleQuote: true,
          printWidth: 100,
        });
        if (after !== before) await writeFile(file, after);
      }
    }
  }
  for (const directory of ['src', 'tests', 'tooling']) await walk(join(repository, directory));
}
async function copyRuntime(destination) {
  const visited = new Set();
  async function copyPackage(name, parent = cache, optional = false, includeCode = true) {
    let cursor = parent,
      source;
    while (true) {
      const candidate = join(cursor, 'node_modules', name);
      try {
        await access(join(candidate, 'package.json'));
        source = candidate;
        break;
      } catch {}
      if (cursor === dirname(cursor)) break;
      cursor = dirname(cursor);
    }
    if (!source) {
      if (optional) return;
      throw new Error(`Missing runtime dependency: ${name}`);
    }
    if (visited.has(source)) return;
    visited.add(source);
    const metadata = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
    if (includeCode)
      await cp(source, join(destination, 'node_modules', relative(modules, source)), {
        recursive: true,
        filter: (path) => path !== join(source, 'node_modules'),
      });
    else {
      const notices = join(
        destination,
        'licenses',
        'frontend',
        `${name.replaceAll('/', '_')}-${metadata.version}`,
      );
      await mkdir(notices, { recursive: true });
      await writeFile(
        join(notices, 'attribution.txt'),
        `${name} ${metadata.version}\nLicense: ${JSON.stringify(metadata.license)}\nRepository: ${JSON.stringify(metadata.repository)}\n`,
      );
      for (const entry of await readdir(source, { withFileTypes: true }))
        if (entry.isFile() && /^(LICENSE|LICENCE|COPYING|NOTICE)/i.test(entry.name))
          await cp(join(source, entry.name), join(notices, entry.name));
    }
    for (const name of Object.keys(metadata.dependencies || {}))
      await copyPackage(name, source, !!metadata.optionalDependencies?.[name], includeCode);
    for (const name of Object.keys(metadata.optionalDependencies || {}))
      await copyPackage(name, source, true, includeCode);
    for (const name of Object.keys(metadata.peerDependencies || {}))
      await copyPackage(
        name,
        source,
        !!metadata.peerDependenciesMeta?.[name]?.optional,
        includeCode,
      );
  }
  for (const name of [
    'miniflare',
    '@earendil-works/pi-ai',
    '@earendil-works/pi-agent-core',
    'temporal-polyfill',
    'marked',
    'sanitize-html',
    'fast-xml-parser',
    'playwright-core',
    'pdfjs-dist',
  ])
    await copyPackage(name);
  console.log(`Packaged ${visited.size} runtime dependencies`);
  for (const name of ['react', 'react-dom', '@milkdown/crepe'])
    await copyPackage(name, cache, false, false);
}
async function packageApp() {
  await build();
  if (process.platform !== 'darwin')
    throw new Error('The first package target is macOS. Development mode supports Linux.');
  const destination = join(cache, 'Clarity.app');
  await rm(destination, { recursive: true, force: true });
  await cp(join(modules, 'electron/dist/Electron.app'), destination, {
    recursive: true,
    verbatimSymlinks: true,
  });
  const app = join(destination, 'Contents/Resources/app');
  await mkdir(app, { recursive: true });
  await cp(output, app, { recursive: true });
  await writeFile(
    join(app, 'package.json'),
    JSON.stringify({ name: 'clarity', version: '0.1.0', main: 'main.mjs' }),
  );
  await copyRuntime(app);
  const workerBinary = join(
    app,
    'node_modules',
    `@cloudflare/workerd-darwin-${process.arch}`,
    'bin/workerd',
  );
  await access(workerBinary);
  const workerLauncher = join(app, 'node_modules/workerd/bin/workerd');
  await rm(workerLauncher);
  await symlink(relative(dirname(workerLauncher), workerBinary), workerLauncher);
  await cp(join(repository, 'src/vendor/cloudflare-os/LICENSE'), join(app, 'CLOUDFLARE-LICENSE'));
  await collectPlayerNotices(repository, cache, join(app, 'licenses', 'player'));
  await cp(join(repository, 'THIRD_PARTY.md'), join(app, 'THIRD_PARTY.md'));
  await cp(join(repository, 'src/vendor/librespot'), join(app, 'licenses/librespot'), {
    recursive: true,
  });
  await run('/usr/libexec/PlistBuddy', [
    '-c',
    'Set :CFBundleDisplayName Clarity',
    join(destination, 'Contents/Info.plist'),
  ]);
  await run('/usr/libexec/PlistBuddy', [
    '-c',
    'Set :CFBundleName Clarity',
    join(destination, 'Contents/Info.plist'),
  ]);
  await run('/usr/libexec/PlistBuddy', [
    '-c',
    'Set :CFBundleIdentifier local.clarity.desktop',
    join(destination, 'Contents/Info.plist'),
  ]);
  await run('/usr/bin/codesign', ['--force', '--deep', '--sign', '-', destination]);
  await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', destination]);
  console.log(destination);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    if (command === 'install') await install();
    else if (command === 'player') await buildPlayer(repository, cache, output);
    else if (command === 'build') await build();
    else if (command === 'check') await typecheck();
    else if (command === 'format') await format();
    else if (command === 'package') {
      await buildPlayer(repository, cache, output);
      await packageApp();
    } else if (command === 'dev') {
      await build();
      await run(require('electron'), [join(output, 'main.mjs')], {
        env: { ...process.env, NODE_PATH: modules, CLARITY_SOURCE: repository },
      });
    } else if (command === 'test') {
      await build();
      await run(
        process.execPath,
        [
          '--test',
          '--test-concurrency=1',
          ...['core', 'integration', 'connectors', 'live-chat'].map((name) =>
            join(repository, `tests/${name}.mjs`),
          ),
        ],
        { env: { ...process.env, CLARITY_BUILD_CACHE: cache } },
      );
    } else throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
