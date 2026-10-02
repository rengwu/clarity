---
title: 2 October 2026 — Large Spotify collections
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100208
summary: First-page display, scrolling past 5000, retry without discarding songs, shared page caching and signed-package delivery.
---
# 2 October 2026 — Large Spotify collections

## Scope

Correct the **FEAT-music** report that Spotify Liked Songs takes about 30 seconds to appear and stops at 4,999 displayed songs. Source inspection found a sequential full-collection read capped at 100 pages of 50 provider entries. Existing unavailable/non-song exclusions can reduce the displayed count, but this run did not inspect the user's omitted entry.

[Music's large-collection contract](../../features/music.md#large-spotify-collections-2-october-2026) defines first-page display, scroll continuation, fallback controls, failure recovery and shared cached pages. Selected checks exercise real native controls against controlled HTTP responses and observe request counts, visible rows and playback queue selection. This is the implementation author's verification, not independent review.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5. Final output and package use the separate external cache `~/Library/Caches/Clarity/music-pagination-20261001T182000Z`, sharing installed dependencies with the normal external cache. No dependency directory or package-manager files were created in the workspace. Each driver owns a disposable data root and closes its app. The pagination driver uses Chromium's mock keychain for fake credentials; production encryption and real Keychain authorization are not changed or certified.

Application SHA-256: `bf51ac58d7d03c36a0a5851216557b3b7a3f0746c91cb91d2c5ec9c7c273b40e`. Verification SHA-256: `af161ec2c72b8dbf64698f1727559cdcdc81847aeba05acfdcd39df8db2c7078`. Package runtime SHA-256: `cefd0b1e97e76bcf181d1a6a716a305bd40540f91a6dcfce946b22e6388f44b5`.

The [test-start](../../evidence/2026-10-01T182000Z-music-pagination/build-test-start.json) and [final](../../evidence/2026-10-01T182000Z-music-pagination/build-final.json) manifests agree on all three hashes. The [package manifest](../../evidence/2026-10-01T182000Z-music-pagination/build-package.json) has the same application and seven runtime files; its verification hash precedes adding mock-keychain isolation to the pagination driver. Concurrent Navidrome connection guidance, package usage text and guards against stale HTML-audio events changing Spotify state are included and preserved. This is an existing dirty checkout; HEAD alone does not identify the tested build.

Separate edits to `src/renderer/views/settings-controls.tsx` and `src/renderer/views/settings.tsx` appeared after validation and installation. The [handoff source snapshot](../../evidence/2026-10-01T182000Z-music-pagination/build-handoff.json) records those later changes; they are not part of this tested package. Music source and verification files are unchanged. A final signature and seven-file hash comparison confirms the installed app still matches the package identified above.

Executed with the isolated cache: app build and native helper setup; application/Worker typechecks; `node --test --test-concurrency=1 tests/connectors.mjs tests/music-cache.mjs tests/music-volume.mjs tests/music-pagination.mjs`; five selected Music/Spotify core tests; package build; the pagination tests with `CLARITY_PAGINATION_EXECUTABLE` pointing at the signed bundle; `node --test tests/package.mjs`; wiki reader/report tests and report/build/snapshot checks. Logs: [13 regressions](../../evidence/2026-10-01T182000Z-music-pagination/regressions-complete.log), [five core tests](../../evidence/2026-10-01T182000Z-music-pagination/core-music.log), [types](../../evidence/2026-10-01T182000Z-music-pagination/typecheck-package.log), [packaging](../../evidence/2026-10-01T182000Z-music-pagination/package-build.log), [three packaged pagination tests](../../evidence/2026-10-01T182000Z-music-pagination/packaged-ui.log), [relocation](../../evidence/2026-10-01T182000Z-music-pagination/package-checks.log), [wiki tests](../../evidence/2026-10-01T182000Z-music-pagination/wiki-tests.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| First page | Show the known title immediately and songs without fetching the whole collection | Held page zero shows Liked Songs; releasing it displays 50 rows with exactly one provider request | Passed |
| Pending continuation/navigation | Preserve rows and share the pending request | Held page 50 keeps the first 50 songs visible and disables Load more; leaving/returning shares the read | Passed |
| Failed page | Keep the prefix and retry only the missing page | Page 100 fails once; 100 earlier songs remain. Try again requests offset 100 again without requesting offset zero | Passed |
| Beyond the old cutoff | Follow every continuation through the final song | Actual native scrolling reaches 5,055 unique rows in development and package. Final row is song 5054, count is 5,055 and Load more disappears; 102 pages plus one deliberate retry | Passed |
| Provider exclusions and playback | Preserve order after filtering and reuse cached pages for the complete queue | Service fixture excludes one unavailable entry from 5,055; final queue has 5,054 songs. Playing its last index selects song 5054 with no extra provider reads | Passed |
| Reopen and refresh | Reuse loaded results; explicit refresh replaces them | Back/reopen restores all 5,055 UI rows without reads. Refresh requests page zero again and resets continuation | Passed |
| Account/cursor boundaries | Reject malformed cursors and prevent old-account rows from returning | Non-advancing cursor fails visibly at the service boundary. Clearing during a full read rejects the mixed result; UI reauthorization discards a held old-account page | Passed |
| Existing Music behavior | Preserve metadata, cache, player state and normalization | All 13 selected regression tests and five targeted core tests pass, including current/legacy playlist fields and the concurrent stale-audio-event guard | Passed |
| Package and delivery | Run independently and install the verified bytes | Signed package repeats pagination; relocation with a system-only PATH, bundled helper, internal symlinks, usage declarations and persisted local data passes. Installed signature and all seven runtime hashes match | Passed |

[Development observations](../../evidence/2026-10-01T182000Z-music-pagination/development/observations.json) and [packaged observations](../../evidence/2026-10-01T182000Z-music-pagination/packaged/observations.json) preserve safe requests and row counts. Inspected package screenshots show [the first page](../../evidence/2026-10-01T182000Z-music-pagination/packaged/first-page.png) and [the final rows beyond 5,000](../../evidence/2026-10-01T182000Z-music-pagination/packaged/past-5000.png). Automated scrolling times include driving/rendering all 102 pages with fixtures; they are not live Spotify latency measurements.

### Earlier attempts and setup corrections

The initial pagination-only run passed all three tests, but appending rows repeatedly rerendered the existing table. Retaining unchanged row components reduced unnecessary work; the final development and package scenarios were rerun after that change.

The [first regression attempt](../../evidence/2026-10-01T182000Z-music-pagination/regressions-attempt-1.log) passed five of six checks. It ran output predating a concurrently added player guard while the connector test already expected that guard; the Pause assertion failed. The subsequent isolated build includes the current source. Its [first combined run](../../evidence/2026-10-01T182000Z-music-pagination/regressions-final.log) passed 12 of 13 tests; OAuth setup failed because the new external output folder lacked `clarity-player`. Running the existing [player setup](../../evidence/2026-10-01T182000Z-music-pagination/player-setup.log) fixed the fixture prerequisite; the [OAuth recheck](../../evidence/2026-10-01T182000Z-music-pagination/oauth-recheck.log) and final 13-test run pass. Product assertions were retained. These earlier logs are not labelled successful final builds.

## Limits and follow-up

[Installation evidence](../../evidence/2026-10-01T182000Z-music-pagination/installation.json) records `~/Applications/Clarity.app` and the prior bundle at `~/Library/Caches/Clarity/music-pagination-20261001T182000Z/Clarity-before-music-pagination-20261001T182000Z.app`. This run did not stop or restart the real user's app; normal Quit/reopen loads the update. It did not change user data or credentials.

No live Spotify library timing, actual-account full count or speaker output is claimed. Browsing is incremental; playback still waits for any unfetched pages needed to construct the existing complete-context queue. Loaded rows remain in the DOM, so extreme library sizes beyond this fixture are not performance-certified. The cache is in memory, not an offline library. Real Navidrome permissions/server audio and normalization tag/loudness coverage retain their separate follow-up. Earlier reports remain build-specific evidence.
