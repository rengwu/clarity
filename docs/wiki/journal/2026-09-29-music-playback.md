---
title: 29 September 2026 — Music playback and seeking
section: Journal
status: Verified
updated: 2026-09-29
order: 2026092905
summary: Fix the native audio crash, surface player failures, and add seeking for both sources.
---
# 29 September 2026 — Music playback and seeking

The user reported that selecting a Spotify song produced no sound and stayed at 0:00, and requested the missing seek bar. Search and library authorization were already working after the earlier API fix.

A disposable live diagnostic connected with the existing playback credential, then reproduced SIGSEGV immediately after helper readiness. The macOS crash report identified CoreAudio device configuration. Librespot 0.8.0's bundled Rodio 0.21 backend pulled CPAL 0.16, which has [known CoreAudio memory-handling faults](https://github.com/RustAudio/cpal/pull/1055). Clarity also swallowed unexpected helper exits after readiness by reporting only a paused state.

The fix retains librespot 0.8.0 and replaces its bundled output backend with a small Sink adapter using pinned Rodio 0.22.2, resolving CPAL 0.17.3. The adapter opens the default output before readiness, forwards decoded samples with bounded buffering, and reports device failures. The helper now reports unexpected event-channel loss. Electron surfaces unexpected process exit codes/signals; intentional shutdown stays quiet. Failed playback remains visible in the player, and Play reconnects/reloads the selected song. A packaged recovery check caught a duplicate error toast covering the controls after recovery; playback-event errors now use the persistent player message alone.

Both sources gain a seek bar with elapsed/total time. It previews dragging, commits on release, supports keyboard adjustment, and preserves pause/play state. Public module positions use seconds; Spotify commands use milliseconds. Navidrome's protocol bridge now forwards byte-range requests. Spotify receives seek-complete and position-correction events, and stale HTML audio events cannot reset its state. These contracts are consolidated on [Music](../features/music.md); [D106](../decisions/index.md#d106-music-seeking-29-september-2026) records the scope addition.

Validation used the existing account in a disposable data root, without changing its saved credentials. The reported song reached playing state and advanced, stayed paused after seeking to 2:00, resumed from that position, and accepted a pointer seek during playback. Layout was inspected at normal and minimum window widths. This establishes functioning native output initialization and advancing decoded playback, not a human listening check or fresh OAuth/expiry coverage.

Controlled tests cover seek bounds and seconds/milliseconds conversion, source switching, real helper-process exit/reconnection behavior with a fixture, Navidrome mouse/keyboard seeks while paused/playing, HTTP partial-response forwarding, and single-song stopping. All three connector tests, both targeted core music tests, and application/Worker typechecks pass. The final package passes signature, relocation, system-only PATH, persistence, and immediate-Quit note saving. Live packaged playback/seek checks pass, including killing only the disposable test app's audio helper and recovering with Play; the controls remain usable after recovery. The [implementation report](../references/implementation.md) records the validation boundary. The user's running instance is left open; explicit Quit and reopening is needed to load the update.

The signed bundle was installed at `~/Applications/Clarity.app`, retaining the previous bundle outside the repository. The wiki reader was rebuilt and checked. No package manifest or dependency directory was added to the workspace.
