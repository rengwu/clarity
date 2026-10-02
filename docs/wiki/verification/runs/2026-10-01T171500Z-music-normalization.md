---
title: 2 October 2026 — Music volume and normalization
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100205
summary: Match both volume curves, apply fixed metadata gain and automatic album/track mode, and verify settings plus the installed package.
---
# 2 October 2026 — Music volume and normalization

## Scope

Implement the three steps accepted in **D124** under **FEAT-music**: one volume curve across Spotify/Navidrome, optional fixed normalization, and album gain for albums versus track gain for playlists/shuffle. The current [Music](../../features/music.md#source-volume-and-normalization-3-october-2026) contract owns behavior, setting defaults/timing, metadata assumptions and failure boundaries. Settings navigation also follows **FEAT-settings** on [connections](../../foundations/integrations.md#redesign-settings-navigation).

Selected checks cover the actual native volume mixer/decoded samples, the pinned Spotify metadata reader/gain calculation, main-to-helper commands, Navidrome HTTP/native UI playback, checkbox persistence, existing Music/connection/cache behavior and package delivery. These are the implementation author's checks, not independent review or listener confirmation.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5, librespot 0.8.0 with the existing Rodio output adapter. Application SHA-256: `9149e19fa4abf9d3d57d04a321ab6c23242254fe4e40d9ad3e7b01f7a0dbc0fc`. Final verification SHA-256: `55bb7de2bd7866b385aff15d7ac5db5ed3f25517085c9fb3b9283bfccd198d92`. Package runtime SHA-256: `6baa106192fe5530346d63a3ca21d762f7379bcceeb79ec0cd2c92d9f27c99ec`.

The [pre-check](../../evidence/2026-10-01T171500Z-music-normalization/build-before.json), [package](../../evidence/2026-10-01T171500Z-music-normalization/build-package.json) and [final](../../evidence/2026-10-01T171500Z-music-normalization/build-final.json) manifests agree on application source. The final harness additionally waits for the saved checkbox before Quit; its verification hash differs from the earlier manifest. This was an existing dirty checkout, so HEAD alone does not identify the build. The pre-check manifest's cached package was the preceding release; package/final manifests identify this delivery.

Dependencies, generated Rust manifests, test audio and copied library source remain in the external build cache or isolated temporary roots. macOS `afconvert` generates the native PCM fixture; no new app dependency is introduced. No real account credentials, provider libraries or audio files were modified. Native PCM is captured in memory; the renderer HTTP fixture contains silent WAV audio. No real playback was started.

Executed: app build and type checks; nine selected checks across `tests/music-volume.mjs`, `tests/connectors.mjs` and `tests/music-cache.mjs`; five Music/Spotify core checks; the helper's two Rust tests; `tests/spotify-normalization.mjs`; package build; the native volume UI scenario against `Contents/MacOS/Electron`; package relocation; report/wiki checks. Logs: [build](../../evidence/2026-10-01T171500Z-music-normalization/build.log), [types](../../evidence/2026-10-01T171500Z-music-normalization/typecheck-final.log), [nine regressions](../../evidence/2026-10-01T171500Z-music-normalization/regressions-final.log), [five core checks](../../evidence/2026-10-01T171500Z-music-normalization/core-music.log), [helper build](../../evidence/2026-10-01T171500Z-music-normalization/player-build.log), [native PCM/token tests](../../evidence/2026-10-01T171500Z-music-normalization/native-pcm-final.log), [Spotify header/gain](../../evidence/2026-10-01T171500Z-music-normalization/spotify-header-final.log), [package build](../../evidence/2026-10-01T171500Z-music-normalization/package-build.log), [packaged UI](../../evidence/2026-10-01T171500Z-music-normalization/packaged-verified.log), [relocation](../../evidence/2026-10-01T171500Z-music-normalization/package-checks.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Shared volume curve | Same attenuation at mute/intermediate/max settings | Native mixer/decoder capture checks every one of 176,400 samples at 0/25/50/70/100; renderer HTML volume agrees. At 70%, both gains are 0.125885906 | Passed |
| Native untagged audio | Normalization must not introduce gain or dynamics changes without metadata | Native PCM matches unnormalized audio with normalization on/off, including album mode and mute | Passed |
| Spotify metadata normalization | Use fixed track/album factors, cap quiet boosts and peaks | Actual pinned custom Ogg-header reader plus gain calculator, using the helper's configuration builder, returns 0.501187234 for −6 dB track gain, 0.251188643 for −12 dB album gain, unity for off/missing/quiet and 0.5 for peak 2 | Passed |
| Playback context and startup volume | Albums/artists use album gain; playlists/shuffle use track; no initial-volume burst | Main/helper checks confirm mode flags, volume included on load, mute retained, ID-only Navidrome metadata lookup and clamped finite controls | Passed |
| Native engine lifecycle | Change mode without restart; changed normalization applies on next load | Controlled child process receives the actual init flag and load fields, retains its PID through mode/pause/resume, and restarts only for a normalization change; no false error event | Passed |
| Navidrome metadata/UI | Apply gain during actual HTTP media playback | Two album tracks retain 0.251188643 gain; shuffled album/playlist track uses 0.501187234; slider combines gains; quiet/untagged tracks remain unity; peak-limited track is 0.5 | Passed |
| Preference and next-track timing | Default on, current track stable, saved off survives restart | Settings checkbox starts checked, changing it retains the current gain, the next Play uses the change, invalid setting types fail, and Quit/reopen retains off in development and package | Passed |
| Prior Music behavior | Preserve cache, playlist details, seek, source switching and connections | Nine selected regression tests and five Music/Spotify core tests pass | Passed |
| Type/package validation | Valid build, relocated bundle and independent runtime | App/Worker type checks, packaged volume scenario, signature/helper/dependency/persistence relocation test pass | Passed |
| Installation | Install exactly the tested bundle and retain the previous one | Signature verification and all seven runtime hashes match; previous bundle is backed up | Passed |

[Development observations](../../evidence/2026-10-01T171500Z-music-normalization/development/observations.json) and [packaged observations](../../evidence/2026-10-01T171500Z-music-normalization/packaged/observations.json) retain the selected gain values, playing states, safe fixture request paths and preference persistence. [Development](../../evidence/2026-10-01T171500Z-music-normalization/development/music-normalization.png) and [package](../../evidence/2026-10-01T171500Z-music-normalization/packaged/music-normalization.png) screenshots show the Settings control; they do not measure audio.

### Harness corrections and earlier attempts

The first [native PCM attempt](../../evidence/2026-10-01T171500Z-music-normalization/native-pcm.log) used local FLAC ReplayGain strings to try to exercise Spotify normalization. [Diagnosis](../../evidence/2026-10-01T171500Z-music-normalization/native-pcm-diagnosis.log) found the pinned Symphonia fallback ignores those string tags, so that fixture was not the Spotify custom-header path. Native decoded-volume expectations were retained; a separate test now exercises the actual private Spotify reader/calculator in an external copy of the pinned crate. It includes the helper's exact current configuration builder and never changes the shipped dependency. Initial external builds needed the same [vergen pin](../../evidence/2026-10-01T171500Z-music-normalization/spotify-gain.log) and [TLS feature](../../evidence/2026-10-01T171500Z-music-normalization/spotify-gain-final.log) as the app; the corrected check passes.

An [early regression attempt](../../evidence/2026-10-01T171500Z-music-normalization/regressions.log) closed the mock native process before its output was observed. Waiting for its load acknowledgment fixes the harness race without changing the player. The first [packaged launch](../../evidence/2026-10-01T171500Z-music-normalization/packaged-volume.log) used an incorrect executable name; the bundle uses `Electron`. Two later isolated packaged reopens stalled in a native modal and their owned test processes were stopped; their cause was not established. A [diagnostic run](../../evidence/2026-10-01T171500Z-music-normalization/packaged-debug.log) passed without changing the application. The final harness explicitly waits for the persisted setting before Quit, and the final uninstrumented packaged run passes in six seconds. These attempts do not establish general startup reliability; previous startup/account limits remain separate.

## Limits and follow-up

[Installation evidence](../../evidence/2026-10-01T171500Z-music-normalization/installation.json) records `~/Applications/Clarity.app` and backup `~/Library/Caches/Clarity/build/Clarity-before-music-normalization-20261001T171500Z.app`. Normal Quit/reopen loads the update. The installed runtime bytes match the tested package; this run did not reopen the real user's root or test real accounts.

Controlled inputs establish software gain behavior. No captured live Spotify song, actual Navidrome metadata inventory, true-peak measurement, integrated loudness comparison, speaker recording or listening judgment is claimed. Conventional ReplayGain 2 metadata and Spotify's nominal reference can be aligned arithmetically, but other tag targets, masters, server processing, missing metadata and conservative no-boost/peak limits can leave audible differences. FLAC local-file fixtures are verification machinery, not an added Clarity local-file feature. Existing sign-in, device, account and unrelated-module limits remain in their original reports.
