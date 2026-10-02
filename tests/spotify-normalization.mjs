import { mkdtemp, cp, readFile, writeFile, appendFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

// Exercise the pinned engine's private Spotify-header reader and gain calculation
// in an external copy. The shipped dependency and package are never patched here.
const cache = process.env.CLARITY_BUILD_CACHE || join(homedir(), 'Library/Caches/Clarity/build');
const player = join(cache, 'spotify-player');
const metadata = JSON.parse(
  (
    await promisify(execFile)(
      'cargo',
      [
        'metadata',
        '--offline',
        '--locked',
        '--format-version',
        '1',
        '--manifest-path',
        join(player, 'Cargo.toml'),
      ],
      { maxBuffer: 20_000_000 },
    )
  ).stdout,
);
const source = metadata.packages.find(
  (item) => item.name === 'librespot-playback' && item.version === '0.8.0',
);
if (!source) throw new Error('Build the pinned Spotify helper before this check.');
const root = await mkdtemp(join(cache, 'normalization-engine-check-'));
const copy = join(root, 'playback');
await cp(dirname(source.manifest_path), copy, { recursive: true });
await appendFile(join(copy, 'Cargo.toml'), '\n[dev-dependencies.vergen]\nversion = "=9.0.6"\n');
await writeFile(
  join(root, 'Cargo.toml'),
  `[workspace]\nmembers = ["playback"]\nresolver = "2"\n[patch.crates-io]\nlibrespot-core = { path = ${JSON.stringify(join(player, 'librespot-core'))} }\n`,
);
const helper = await readFile('src/player/main.rs', 'utf8');
const start = helper.indexOf('fn player_config(');
const end = helper.indexOf('\nfn volume_value', start);
if (start < 0 || end < 0) throw new Error('Cannot find the helper configuration builder.');
await appendFile(
  join(copy, 'src/player.rs'),
  `
#[cfg(test)]
mod clarity_normalization {
    use super::*;
    use std::io::Cursor;
    ${helper.slice(start, end)}
    fn gain(track: f32, album: f32, peak: f32, enabled: bool, album_mode: bool) -> f64 {
        let mut header = vec![0_u8; 144];
        for value in [track, peak, album, peak] { header.extend_from_slice(&value.to_le_bytes()); }
        let data = NormalisationData::parse_from_ogg(Cursor::new(header)).unwrap();
        let mut config = player_config(enabled);
        assert_eq!(config.normalisation_method, NormalisationMethod::Basic);
        assert_eq!(config.normalisation_type, NormalisationType::Auto);
        config.normalisation_type = if album_mode { NormalisationType::Album } else { NormalisationType::Track };
        NormalisationData::get_factor(&config, data)
    }
    #[test]
    fn spotify_header_and_helper_config_give_fixed_peak_safe_gains() {
        let track = gain(-6.0, -12.0, 0.5, true, false);
        let album = gain(-6.0, -12.0, 0.5, true, true);
        assert!((track - 0.501187234).abs() < 1e-8);
        assert!((album - 0.251188643).abs() < 1e-8);
        assert_eq!(gain(-6.0, -12.0, 0.5, false, false), 1.0);
        assert_eq!(gain(6.0, 6.0, 0.1, true, false), 1.0);
        assert_eq!(gain(0.0, 0.0, 2.0, true, false), 0.5);
        assert_eq!(NormalisationData::get_factor(&player_config(true), NormalisationData::default()), 1.0);
        println!("Spotify header gains checked: track={track:.9}, album={album:.9}; off/missing/quiet=1; peak=0.5");
    }
}
`,
);
const child = spawn(
  'cargo',
  [
    'test',
    '--manifest-path',
    join(root, 'Cargo.toml'),
    '--lib',
    '--no-default-features',
    '--features',
    'native-tls',
    'clarity_normalization',
    '--',
    '--nocapture',
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, CARGO_TARGET_DIR: join(player, 'target') },
  },
);
const code = await new Promise((resolve, reject) => {
  child.on('error', reject);
  child.on('exit', resolve);
});
if (code !== 0) process.exitCode = code || 1;
