---
title: 2 October 2026 — Navidrome connection diagnosis
section: Verification runs
status: Recorded
result: Untested
updated: 2026-10-02
order: 2026100207
summary: Valid live authentication, installed-app reachability failure, controlled retry/error checks and macOS permission packaging; live recovery awaits consent.
---
# 2 October 2026 — Navidrome connection diagnosis

## Scope

Diagnose the reported Navidrome Settings `fetch failed` and correct actionable failures in **FEAT-music** and **FEAT-settings**. The [Music contract](../../features/music.md#navidrome-connection-and-local-network-access-2-october-2026) requires salted authentication, saving only after successful ping, preservation of existing credentials on failure and main-process streams. New delegated behavior adds transport guidance and the macOS local-network usage description.

The user authorized the live connection by providing the server/account. Evidence contains response statuses, error codes and counts only; server address, account name, passwords and token-bearing URLs are excluded. This is the implementation author's verification, not independent review.

## Build and environment

macOS 27.0 (26A5368g), arm64; Node 22.19.0; Electron 44.4.5. Existing dirty workspace; HEAD alone does not identify this build. Dependencies, fixture data roots and packaged output remain outside the workspace.

The [verified manifest](../../evidence/2026-10-01T182630Z-navidrome-connection/build-verified.json) records application SHA-256 `bf51ac58d7d03c36a0a5851216557b3b7a3f0746c91cb91d2c5ec9c7c273b40e`, verification SHA-256 `f778e40f8a066239d6c52581b3de91293796f5ba75bcce671a620c393d06e6a5` and packaged runtime SHA-256 `cefd0b1e97e76bcf181d1a6a716a305bd40540f91a6dcfce946b22e6388f44b5`. Earlier manifests precede final formatting and the test-only Keychain correction; they are not the final verification identity.

The [handoff manifest](../../evidence/2026-10-01T182630Z-navidrome-connection/build-final.json) retains the same application and package hashes. Its whole-verification hash is `af161ec2c72b8dbf64698f1727559cdcdc81847aeba05acfdcd39df8db2c7078`: concurrently maintained `tests/music-pagination.mjs` changed after this run's verified snapshot; the selected connector/cache/package drivers are unchanged. The separate pagination work is not certified by this report.

Executed: application/package build; application/Worker type checks; serial connector and Music-cache regressions; the Navidrome Settings recipe against the signed package; package relocation/signature/usage-description/persistence checks. Retained logs: [package build](../../evidence/2026-10-01T182630Z-navidrome-connection/package-build.log), [type checks](../../evidence/2026-10-01T182630Z-navidrome-connection/typecheck-final.log), [regressions](../../evidence/2026-10-01T182630Z-navidrome-connection/regressions-final.log), [packaged connection](../../evidence/2026-10-01T182630Z-navidrome-connection/packaged-connection.log), [relocation](../../evidence/2026-10-01T182630Z-navidrome-connection/package-checks.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Direct live authentication | Determine whether supplied server and credentials work | HTTP 200 and Subsonic `ok` for ping, music folders and playlists; one music folder, Navidrome 0.55.2 | Passed |
| Installed-process diagnosis | Separate server failure from app-specific reachability | Isolated installed executable gets HTTP 200 using both network stacks; normal launch fails with `EHOSTUNREACH` / `ERR_ADDRESS_UNREACHABLE`, including after normal Quit/reopen | Passed |
| Settings transport failures | Actionable local errors without saving a failed first account | Real form submissions show distinct unreachable/local-network, refused-port, name-resolution, timeout and generic messages; no raw transport details or fixture secret in errors; account remains disconnected | Passed |
| Retry and replacement | Save only a valid connection; preserve prior account on failed replacement | Clearing the injected transport failure permits a real salted-auth fixture ping and Connected state. Authentication and HTTP 503 replacement failures retain the original saved account | Passed |
| Existing connection and Music behavior | Preserve source switching, stream ranges/seeking, cache and provider behavior | Six selected connector/cache tests pass; streaming uses the existing real HTTP/audio fixture | Passed |
| Packaged behavior and types | Same guidance and correct macOS metadata in an independent package | Signed package repeats the connection recipe; relocation, signature, helper, persistence, location descriptions and local-network usage description pass; app/Worker types pass | Passed |
| Installation | Deliver the tested signed bundle and preserve the previous app | Installed signature, local-network description and all seven runtime hashes match the tested package; previous app backed up | Passed |
| Normal installed-app recovery | Connect the real account after resolving OS access and read its library | Updated app opens with existing Spotify credentials and no credential warning; real Navidrome submission shows the new host-unreachable guidance. Recovery after a Local Network permission check remains pending | Untested |

[Sanitized live observations](../../evidence/2026-10-01T182630Z-navidrome-connection/live-diagnosis.json), [development observations](../../evidence/2026-10-01T182630Z-navidrome-connection/development/observations.json), [packaged observations](../../evidence/2026-10-01T182630Z-navidrome-connection/packaged/observations.json) and the [packaged Settings screenshot](../../evidence/2026-10-01T182630Z-navidrome-connection/packaged/connection-guidance.png) distinguish visible guidance from actual request/credential state.

Wiki maintenance passes the report checker, generated reader build/current-snapshot check and [13 reader/report tests](../../evidence/2026-10-01T182630Z-navidrome-connection/wiki-tests.log). Concurrent pagination documentation briefly referenced its not-yet-written report; that report is now present, and final wiki checks pass. Temporary debugging listeners were closed after the installed diagnosis.

### Harness correction

The [first packaged attempt](../../evidence/2026-10-01T182630Z-navidrome-connection/packaged-first-attempt.log) timed out while the newly signed fixture app requested real Keychain access to save a fake account. Its owned process closed. The Navidrome-only driver now supplies `--use-mock-keychain` with its unique temporary root; both development and packaged recipes pass. This is test isolation, not a production flag or proof of real OS encryption. Existing OAuth/credential regressions continue through their prior path. No product expectation was weakened.

## Limits and follow-up

[Installation evidence](../../evidence/2026-10-01T182630Z-navidrome-connection/installation.json) records the tested bytes at `~/Applications/Clarity.app` and the previous bundle backup. The updated normal launch opened a macOS Keychain prompt for existing encrypted connections; the user was asked to approve it on the device. The prompt subsequently cleared and the app opened with the existing Spotify connection and no credential warning. A real Navidrome form submission still fails before authentication and now displays the specific Local Network guidance. No Mac password was requested in chat.

The aggregate is **Untested** because the selected normal installed-account recovery remains unresolved. Direct authentication proves the supplied credentials work, while process-specific reachability points to local-network permission or another app-specific network restriction. An unreachable error alone does not prove the permission's current setting. The usage description enables correct platform explanation; it cannot grant consent or promise to repair a prior denial. The agent has not changed macOS Local Network settings.

A [later handoff comparison](../../evidence/2026-10-01T182630Z-navidrome-connection/handoff-concurrent.json) found additional concurrent Settings renderer/style edits in the shared checkout after this run. All seven installed runtime files still exactly match this report’s verified package. Those ongoing source edits are preserved and are outside this run’s validation; the earlier manifests describe their actual capture times, not the later working tree.

No real-server playback, codec/transcoding, audibility, loudness comparison, fresh Spotify authorization or unrelated-module certification is claimed. Terminal-launched fixture success must not be promoted to normal-launch compatibility. The actual app continues to use macOS-backed encrypted credentials; any OS Keychain prompt must be handled normally.
