import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
const hash = data => createHash('sha256').update(data).digest('hex');
async function collect(relative) {
  for (const entry of (await readdir(join(root, relative), { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
    const path = `${relative}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Source manifest does not follow symlinks: ${path}`);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) {
      const content = await readFile(join(root, path));
      files.push({ path, bytes: content.length, sha256: hash(content) });
    }
  }
}
for (const directory of ['src','tests','tooling']) await collect(directory);
const builder = await readFile(join(root,'docs/wiki/_build.mjs'));
files.push({path:'docs/wiki/_build.mjs',bytes:builder.length,sha256:hash(builder)});
files.sort((a,b)=>a.path.localeCompare(b.path));
const digest = items => hash(items.map(item=>`${item.path}\0${item.sha256}\n`).join(''));
const cache = resolve(process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build'));
const packageFiles = [];
for (const file of ['main.mjs','preload.cjs','worker.mjs','app.js','app.css','index.html','clarity-player']) {
  try {
    const content = await readFile(join(cache,'Clarity.app/Contents/Resources/app',file));
    packageFiles.push({path:file,bytes:content.length,sha256:hash(content)});
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
console.log(JSON.stringify({
  recordedAt: new Date().toISOString(),
  gitRevision: execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  dirty: !!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),
  platform:process.platform, architecture:process.arch, node:process.version,
  applicationSha256:digest(files.filter(item=>item.path.startsWith('src/'))),
  verificationSha256:digest(files.filter(item=>!item.path.startsWith('src/'))),
  packageRuntimeSha256:digest(packageFiles), files, packageFiles,
},null,2));
