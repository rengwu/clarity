---
title: 12 October 2026 — Install the linear volume fix
section: Verification runs
status: Recorded
result: Untested
updated: 2026-10-12
order: 202610111825
summary: Old installed logarithmic build identified and replaced; fixture checks pass, normal startup awaits Keychain.
---
# 12 October 2026 — Install the linear volume fix

## Scope

**FEAT-music**, the existing [D129 linear gain contract](../../features/music.md#source-volume-and-normalization-3-october-2026). The user again reported that 50% felt much too quiet. Diagnose the actual running installation, verify the existing fix, install the verified package with a reversible backup and check normal startup. No volume mapping or normalization requirement changed.

## Build and environment

macOS arm64, Node v22.19.0, Electron 44.4.5. The running executable and Spotify helper were both under `~/Applications/Clarity.app`. Its [recorded renderer source and runtime hashes](../../evidence/2026-10-11T182500Z-installed-volume/installed-before.json) retain the 60 dB logarithmic function: 50% maps to `0.0316211100` amplitude gain. Its renderer, main and helper hashes match the old package captured before the earlier linear build. The [3 October report](2026-10-02T165716Z-linear-volume.md) explicitly recorded that its corrected package had not been installed.

Rebuilt from revision `7b7b760ca00b6257a6d390f916cda6f0b57c62ca` without application source changes. [Before testing](../../evidence/2026-10-11T182500Z-installed-volume/package-before.json), application SHA-256 is `a93daf97cbfb8e93876108ac6cf1644483213784df60688cc93c2b6925cb8840`, verification SHA-256 `8d980edf1e66cfcb4f3dd2f93963ddcb913b4ec01a54d8ad08f645f57ca9ef0d` and package runtime SHA-256 `b310923d23c519104da7d83355f487713f4584ecaf0cf2be1fb615c742a8a515`. [After testing](../../evidence/2026-10-11T182500Z-installed-volume/package-after.json), the [comparison](../../evidence/2026-10-11T182500Z-installed-volume/identity-check.json) confirms all three hashes are unchanged. The earlier [source fingerprint](../../evidence/2026-10-11T182500Z-installed-volume/source-before.json) precedes rebuilding and must not identify the tested package.

Executed `node tooling/clarity.mjs package`, `node tooling/clarity.mjs check`, the existing `tests/music-volume.mjs` with `CLARITY_VOLUME_EXECUTABLE` pointing at the rebuilt package and `CLARITY_VOLUME_EVIDENCE` selecting this run, native `cargo test --offline --manifest-path ~/Library/Caches/Clarity/build/spotify-player/Cargo.toml -- --nocapture`, and `node --test tests/package.mjs`. Native compiler warnings are from the pinned dependency; no dependency upgrades were made.

## Results

| Scenario | Expected | Observation | Outcome |
| --- | --- | --- | --- |
| Installed-build diagnosis | Identify the curve actually delivered | Running app/helper paths identify the installed bundle; its saved renderer source still implements the old curve, with matching pre-fix package hashes | Passed |
| Shared gain and normalization | Direct gain at 0/25/50/70/100; retain fixed metadata adjustment and helper lifecycle | Three service checks pass; packaged Navidrome UI verifies exact gains, album/shuffle modes and persisted preference. [Observations](../../evidence/2026-10-11T182500Z-installed-volume/music/observations.json) | Passed |
| Native output | Apply slider gain once at output, including queued audio | Three [native tests](../../evidence/2026-10-11T182500Z-installed-volume/native-volume.log) pass; 176,400 decoded samples per gain/normalization scenario match expected scaling, including 0.50 at the midpoint | Passed |
| Held controls and feedback | Dispatch before release, ignore stale echoes, retain mute/max/error handling | The isolated unmodified [drag test](../../evidence/2026-10-11T182500Z-installed-volume/volume-drag.log) passes with 16 intermediate values. [Input observations](../../evidence/2026-10-11T182500Z-installed-volume/music/volume-response.json) | Passed |
| Package and types | Self-contained signed app starts after relocation and preserves data | [Package build](../../evidence/2026-10-11T182500Z-installed-volume/package-build.log), [typechecks](../../evidence/2026-10-11T182500Z-installed-volume/typecheck.log), and [relocation/restart check](../../evidence/2026-10-11T182500Z-installed-volume/package-relocation.log) pass | Passed |
| Installation | Preserve old bundle and install the tested bytes | Clarity quit normally; the old app moved to `~/Library/Caches/Clarity/build/Clarity-before-volume-20261011T182500Z.app`. All seven [installed runtime hashes](../../evidence/2026-10-11T182500Z-installed-volume/installed-after.json) match the tested package; installed signature verification passes | Passed |
| Normal startup | Open the updated installed app with saved connections | New installed process starts but waits inside a Keychain read; Computer Use cannot access SecurityAgent. User asked to complete the OS dialog. [Startup evidence](../../evidence/2026-10-11T182500Z-installed-volume/keychain-startup.txt) | Untested |

Two combined Music test attempts had four passes and one 30-second timeout in the held-input case; [first attempt](../../evidence/2026-10-11T182500Z-installed-volume/music-volume-first-attempt.log) and [second attempt](../../evidence/2026-10-11T182500Z-installed-volume/music-volume-second-attempt.log) are retained. An external disposable copy with stage logging [passed](../../evidence/2026-10-11T182500Z-installed-volume/drag-diagnostic.log); the unchanged repository test then passed alone. The exact cause of those combined-run timeouts is unestablished. Do not report a clean combined-suite pass or infer a runtime volume defect from the timeout alone.

## Limits and follow-up

Aggregate result remains Untested until normal installed startup completes after the user's Keychain step. Neither the installed app's live playback nor perceived loudness on speakers/Bluetooth is certified by the controlled PCM/UI checks. No recording, account data or credential values are retained in this report. The software update preserves the existing data folder and connection records; it does not change OS permissions or bypass Keychain. The package also includes already committed Recent chats and feedback changes.
