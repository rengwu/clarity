import { mkdir, writeFile, readFile, cp, access, readdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';

export async function buildPlayer(repository, cache, output) {
  const directory = join(cache, 'spotify-player');
  await mkdir(join(directory, 'src'), { recursive: true });
  const source = await readFile(join(repository, 'src/player/main.rs'), 'utf8');
  const audioOutput = await readFile(join(repository, 'src/player/audio_output.rs'), 'utf8');
  const volumeTests = await readFile(join(repository, 'src/player/volume_tests.rs'), 'utf8');
  const oauthBridge = await readFile(join(repository, 'src/player/login5_oauth.rs'), 'utf8');
  const manifest = `[package]
name = "clarity-player"
version = "0.1.0"
edition = "2024"

[dependencies]
librespot-core = { version = "=0.8.0", default-features = false, features = ["native-tls"] }
librespot-playback = { version = "=0.8.0", default-features = false }
rodio = { version = "=0.22.2", default-features = false, features = ["playback"] }
tokio = { version = "1", features = ["rt-multi-thread", "macros", "io-util", "io-std", "signal"] }
serde_json = "1"

# librespot 0.8's build metadata uses the vergen 9.0 trait API.
[build-dependencies]
vergen = "=9.0.6"

[profile.release]
strip = true
opt-level = "s"
`;
  const patchedManifest = `${manifest}\n[patch.crates-io]\nlibrespot-core = { path = "librespot-core" }\n`;
  const signature = createHash('sha256')
    .update(source + audioOutput + volumeTests + oauthBridge + patchedManifest)
    .update(await readFile(import.meta.filename))
    .digest('hex');
  const binary = join(directory, 'target/release/clarity-player');
  let previous;
  try {
    previous = await readFile(join(directory, 'signature'), 'utf8');
    await access(binary);
  } catch {
    previous = undefined;
  }
  if (previous !== signature) {
    await writeFile(join(directory, 'Cargo.toml'), manifest);
    await prepareOAuthBridge(directory, oauthBridge);
    await writeFile(join(directory, 'Cargo.toml'), patchedManifest);
    await writeFile(join(directory, 'src/main.rs'), source);
    await writeFile(join(directory, 'src/audio_output.rs'), audioOutput);
    await writeFile(join(directory, 'src/volume_tests.rs'), volumeTests);
    console.log('Building Spotify audio helper in the external cache…');
    const process = spawn(
      'cargo',
      ['build', '--release', '--manifest-path', join(directory, 'Cargo.toml')],
      { stdio: 'inherit' },
    );
    const status = await new Promise((resolve, reject) => {
      process.once('error', reject);
      process.once('exit', resolve);
    });
    if (status !== 0)
      throw new Error('The Spotify audio helper did not build. See the compiler error above.');
    await writeFile(join(directory, 'signature'), signature);
  }
  await mkdir(output, { recursive: true });
  await cp(binary, join(output, 'clarity-player'));
}

async function prepareOAuthBridge(directory, bridge) {
  const { stdout } = await promisify(execFile)(
    'cargo',
    ['metadata', '--format-version', '1', '--manifest-path', join(directory, 'Cargo.toml')],
    { maxBuffer: 20_000_000 },
  );
  const core = JSON.parse(stdout).packages.find(
    (item) => item.name === 'librespot-core' && item.version === '0.8.0',
  );
  if (!core?.source?.startsWith('registry+'))
    throw new Error('Expected the published librespot-core 0.8.0 source.');
  const destination = join(directory, 'librespot-core');
  await rm(destination, { recursive: true, force: true });
  await cp(dirname(core.manifest_path), destination, { recursive: true });
  const file = join(destination, 'src/login5.rs');
  let source = await readFile(file, 'utf8');
  const edits = [
    ['auth_token: Option<Token> = None,', 'auth_token: Option<Token> = None,\n        external_token: bool = false,'],
    ['        let method = Login_method::StoredCredential(StoredCredential {',
      '        if self.lock(|inner| inner.external_token) {\n            return Err(Error::unauthenticated("Spotify playback token expired"));\n        }\n\n        let method = Login_method::StoredCredential(StoredCredential {'],
  ];
  for (const [before, after] of edits) {
    if (source.split(before).length !== 2)
      throw new Error('The librespot OAuth bridge no longer matches the pinned source.');
    source = source.replace(before, after);
  }
  await writeFile(file, `${source}\ninclude!("clarity_oauth.rs");\n`);
  await writeFile(join(destination, 'src/clarity_oauth.rs'), bridge);
}

export async function collectPlayerNotices(repository, cache, destination) {
  const manifest = join(cache, 'spotify-player', 'Cargo.toml');
  const target = process.arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  const { stdout } = await promisify(execFile)(
    'cargo',
    [
      'metadata',
      '--offline',
      '--locked',
      '--filter-platform',
      target,
      '--format-version',
      '1',
      '--manifest-path',
      manifest,
    ],
    { maxBuffer: 20_000_000 },
  );
  const metadata = JSON.parse(stdout);
  const used = new Set(metadata.resolve.nodes.map((node) => node.id));
  for (const item of metadata.packages.filter(
    (item) => used.has(item.id) && item.name !== 'clarity-player',
  )) {
    const folder = join(destination, `${item.name}-${item.version}`);
    await mkdir(folder, { recursive: true });
    await writeFile(
      join(folder, 'attribution.txt'),
      `${item.name} ${item.version}\nLicense: ${item.license}\nAuthors: ${item.authors.join(', ')}\nSource: ${item.repository || 'https://crates.io/crates/' + item.name}\n`,
    );
    const source = dirname(item.manifest_path);
    for (const entry of await readdir(source, { withFileTypes: true }))
      if (entry.isFile() && /^(LICENSE|LICENCE|COPYING|NOTICE)/i.test(entry.name))
        await cp(join(source, entry.name), join(folder, entry.name));
    if (item.name.startsWith('librespot-'))
      await cp(join(repository, 'src/vendor/librespot/LICENSE'), join(folder, 'LICENSE'));
    if (item.name === 'librespot-core')
      await writeFile(join(folder, 'CLARITY-MODIFICATIONS.txt'),
        'Clarity adds a host-supplied OAuth token cache to login5.rs. The host renews the streaming grant; an expired host token never falls back to login5. Source: src/player/login5_oauth.rs and tooling/player.mjs in the Clarity repository.\n');
  }
}
