---
title: 2 October 2026 — Live volume response
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100215
summary: Volume during held pointer/key input, output-stage gain on queued audio, preserved normalization and signed delivery.
---
# 2 October 2026 — Live volume response

## Scope

**FEAT-music**, [D127](../../decisions/index.md#d127-adjust-volume-while-dragging-2-october-2026): remove the release-only Spotify volume update and the delay from applying gain before the decoded queue. [Music](../../features/music.md#live-volume-response-2-october-2026) owns immediate input, pending-feedback handling, final-output gain and device-latency limits. Retain D124's curve and fixed normalization.

Selected checks exercise held drag/key entry points, delayed feedback, mute/max/errors, native PCM gain after buffering, main/helper commands, existing normalization/settings/source-switch/cache/connector behavior, packaging and installation. These are author-run checks, not independent review or listening confirmation.

## Build and environment

macOS arm64; Node 22.19.0; Electron 44.4.5; librespot 0.8.0; Rodio 0.22.2. Dirty application SHA-256: `0b87b19fab7d66ae4754492652a7fdf36f3f6efbe355066854cd059e2fcb98a8`. Final verification SHA-256: `e5c84d06453ceebb7b38b8752fdb14a63e026a0bbe407a24bc0eadc742e30d8c`. Tested package runtime SHA-256: `d519a04bc0ee95d48568d6a59a74184a85d1ee348e72f262cefa011be601ee33`.

[Before](../../evidence/2026-10-02T142157Z-volume-response/build-before.json), [package](../../evidence/2026-10-02T142157Z-volume-response/build-package.json) and [final](../../evidence/2026-10-02T142157Z-volume-response/build-final.json) fingerprints agree on application source. The final verification change adds the mock-keychain launch flag to the volume driver; its development and packaged reruns pass. This shared checkout includes the concurrent Music search-category work. Package/output copies were frozen at `~/Library/Caches/Clarity/volume-response-20261002T142157Z` for final native checks, avoiding subsequent shared-cache replacement. HEAD alone does not identify these bytes.

Executed: app [build](../../evidence/2026-10-02T142157Z-volume-response/build.log), [typechecks](../../evidence/2026-10-02T142157Z-volume-response/typecheck.log), helper [build](../../evidence/2026-10-02T142157Z-volume-response/player-build.log), [eleven Music/connector/cache checks](../../evidence/2026-10-02T142157Z-volume-response/regressions.log), [five core Music/Spotify checks](../../evidence/2026-10-02T142157Z-volume-response/core.log), [three native Rust checks](../../evidence/2026-10-02T142157Z-volume-response/native-pcm.log), [package build](../../evidence/2026-10-02T142157Z-volume-response/package-build.log), [five final development checks](../../evidence/2026-10-02T142157Z-volume-response/development-volume-final.log), [five packaged volume checks](../../evidence/2026-10-02T142157Z-volume-response/packaged-volume.log), and [relocation/signature/helper/persistence checks](../../evidence/2026-10-02T142157Z-volume-response/package-checks.log). Dependencies, generated manifests and temporary fixtures remain outside the repository. The isolated fake-account launches now use Chromium's mock keychain.

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Pointer drag and held key | Deliver intermediate volume before release | Development and packaged UI send 16 distinct drag inputs before mouse-up; ArrowLeft reaches main before key-up | Passed |
| Delayed feedback and external control | Retain newest local value while pending; accept later external changes | Injected old level 5 cannot replace local 30; settled external 33 updates the slider | Passed |
| Mute, maximum and failure | Endpoints work; command errors remain visible | Home/End send 0/100; injected failure appears in the player | Passed |
| Native queued gain | New volume changes already queued audio without waiting for the queue to drain | Six changes, including mute/unmute, apply within 166–441 stereo samples (at most 5 ms of rendered audio); 27–30 original packets remain queued | Passed |
| Shared curve and normalization | Apply slider gain once; preserve untagged audio and setting behavior | 176,400 decoded samples per scenario pass at 0/25/50/70/100 with normalization on/off and album mode through actual Rodio output; HTTP UI fixtures retain metadata factors and next-track timing | Passed |
| Main/helper transport | Ordered live commands and current level on load | Rapid 80/60/40/20/0/70 sequence reaches the helper fixture; startup mute, mode/restart and ID-only metadata checks pass | Passed |
| Adjacent behavior | Preserve sources, seek, auth, caches and settings | Eleven regression checks and five focused core checks pass; final volume checks pass in development and package, including Quit/reopen preference persistence | Passed |
| Package delivery | Valid independent bundle, correct installed bytes | Relocation, signatures, helper startup and persistence checks pass; all seven installed runtime hashes match the frozen tested bundle | Passed |

Safe observations: [development input](../../evidence/2026-10-02T142157Z-volume-response/development/volume-response.json), [packaged input](../../evidence/2026-10-02T142157Z-volume-response/packaged/volume-response.json), [development gain/settings](../../evidence/2026-10-02T142157Z-volume-response/development/observations.json), [packaged gain/settings](../../evidence/2026-10-02T142157Z-volume-response/packaged/observations.json). The input scenario seeds a Spotify player display without connecting a live account; it observes real renderer-to-main calls. Native output timing is independently measured through the actual Rodio PCM path. Neither fixture alone claims end-to-end live Spotify playback.

### Earlier attempts and harness correction

An initial [baseline setup](../../evidence/2026-10-02T142157Z-volume-response/negative-control-setup.log) already contained the fixed renderer, so its pass was not a valid negative control. The corrected [negative control](../../evidence/2026-10-02T142157Z-volume-response/negative-control.log) deliberately removes continuous volume dispatch in an isolated renderer copy and fails directly on “main must receive intermediate changes before pointer release.” It is a controlled mutation, not the previous installed bundle.

The [first packaged attempt](../../evidence/2026-10-02T142157Z-volume-response/packaged-volume-attempt-1.log) passed held-input checks but timed out in the existing fake-account normalization scenario. Its owned Electron process did not close after SIGTERM and was stopped with SIGKILL. The volume driver lacked the mock-keychain flag already used by neighboring native fixtures; adding that flag made the same selected development and packaged checks pass. No real Keychain or account permission was changed. The first stall's exact OS-modal state was not captured, so this is a harness correction rather than a claim to have diagnosed general startup reliability.

## Limits and follow-up

[Installation](../../evidence/2026-10-02T142157Z-volume-response/installation.json) records the installed path, signature verification and matching hashes. The installed bundle already matched this frozen package at the final delivery check, after the concurrent Music update; no further replacement or backup was needed in this run. The user's running session was left open; normal Quit/reopen activates this build. Application source remained stable through verification. Report/wiki checks establish document integrity only.

The 5 ms bound is measured in rendered samples from Rodio, not from wall-clock drag input to a speaker. OS/device buffers, scheduling and Bluetooth can add latency. No listener confirmation, speaker recording, real Spotify playback, live Navidrome tag inventory or provider sign-in was performed. No volume preference persistence, new normalization algorithm, schema or dependency was added. Existing provider/OS-permission and unrelated-module limits remain in their earlier reports.
