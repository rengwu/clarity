---
title: 2 October 2026 — Music browse error layout
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100206
summary: Group provider failures with retry, retain available playlists and verify both themes, minimum-window layout and installed delivery.
---
# 2 October 2026 — Music browse error layout

## Scope

Correct the reported **FEAT-music** screenshot: a generic fetch error and separate retry button directly above available playlist artwork. [Music's browse-failure contract](../../features/music.md#browse-failure-presentation-2-october-2026) defines the compact source-labelled notice, spacing, disabled pending actions and retention of current partial results. Existing cache/account boundaries remain in force.

Selected checks exercise real native Music controls against isolated Spotify/Navidrome HTTP fixtures, inspect screenshots and geometry, verify retry request counts and recovery, and rerun the existing connector/cache checks. This is the implementation author's verification, not independent review.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5. Dependencies, generated build files and application packages remain in the external Clarity cache. Each test owns its temporary data root and closes its app. Controlled credentials and silent test audio do not access real accounts or change the user's data.

Application SHA-256: `1d0b6918e37356a494399193414bd0526fbfb81c922e64b5108d8065d59ca205`. Verification SHA-256: `2d7ad4ead5648964414376ce3e5de91499fe1ffd82cc998ada82905df73c9636`. Package runtime SHA-256: `dfc138dd2baecf19f0b3bd0a8e37acec0741fb8977ab938863d98bd312a9f195`.

The [verified-source](../../evidence/2026-10-01T180000Z-music-error-layout/build-verified.json), [package](../../evidence/2026-10-01T180000Z-music-error-layout/build-package.json) and [final](../../evidence/2026-10-01T180000Z-music-error-layout/build-final.json) manifests agree on application/verification hashes. The final two also agree on all seven packaged runtime files. The earlier [first-attempt manifest](../../evidence/2026-10-01T180000Z-music-error-layout/build-before.json) preceded a harness wait correction and removal of an unused renderer import. Final regressions were rerun after that cleanup. This was an existing dirty checkout; HEAD alone does not identify the tested build.

Executed: app build; application/Worker type checks; `node --test --test-concurrency=1 tests/music-cache.mjs tests/connectors.mjs`; package build; the cache/layout driver against the signed bundle using `CLARITY_MUSIC_EXECUTABLE` and `CLARITY_MUSIC_MAIN`; `node --test tests/package.mjs`; wiki reader/report tests and report/build/snapshot checks. Logs: [build](../../evidence/2026-10-01T180000Z-music-error-layout/build.log), [types](../../evidence/2026-10-01T180000Z-music-error-layout/typecheck-final.log), [five regressions](../../evidence/2026-10-01T180000Z-music-error-layout/regressions-final.log), [packaging](../../evidence/2026-10-01T180000Z-music-error-layout/package-build.log), [packaged UI](../../evidence/2026-10-01T180000Z-music-error-layout/packaged-ui.log), [relocation](../../evidence/2026-10-01T180000Z-music-error-layout/package-checks.log), [13 reader/report tests](../../evidence/2026-10-01T180000Z-music-error-layout/wiki-tests.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Partial provider failure | Identify the failed source while retaining other results | Rejected Navidrome fetch shows “Couldn’t reach Navidrome” and Spotify playlists; Spotify HTTP failure retains its status/details and Navidrome results | Passed |
| Error/action layout | One compact notice, contained retry and clear space before artwork | Dark/light at 1200×800 and 850×600: 58.2px notice height, exactly 16px gap before artwork, no horizontal overflow, retry wholly inside the notice | Passed |
| Pending and failed retry | Retain cards and disable duplicate actions | Held retry leaves the card's full bounding box unchanged; Retry/Refresh are disabled and one new provider read occurs. Failed retry returns to Try again with available playlists visible | Passed |
| Successful retry and full errors | Clear the notice after recovery; preserve normal failure navigation | A later retry restores both sources and removes the alert; failed search and Liked Songs collection still recover through their existing controls | Passed |
| Cache/account regressions | Preserve request sharing, successful-result reuse and invalidation | Revisited tabs/search/collections, pending reads, refresh, late results, account replacement/disconnect, source identity and renderer reload pass | Passed |
| Existing connectors | Preserve playlist fields, sign-in handling and player behavior | All four connector checks pass alongside the cache/layout driver; specific errors retain provider status and reconnect guidance | Passed |
| Package and types | Same UI in signed package; standalone runtime remains usable | Packaged driver repeats all four layouts and retry/cache scenarios; app/Worker typechecks and relocation/signature/dependency/persistence check pass | Passed |
| Installation | Deliver the tested bytes and preserve the previous bundle | Installed signature and all seven runtime hashes match the tested package; previous bundle retained | Passed |

[Development observations](../../evidence/2026-10-01T180000Z-music-error-layout/development/observations.json) and [packaged observations](../../evidence/2026-10-01T180000Z-music-error-layout/packaged/observations.json) retain geometry and safe request records. Inspected packaged layouts: [dark minimum window](../../evidence/2026-10-01T180000Z-music-error-layout/packaged/partial-error-dark-850.png), [dark desktop](../../evidence/2026-10-01T180000Z-music-error-layout/packaged/partial-error-dark-1200.png), [light minimum window](../../evidence/2026-10-01T180000Z-music-error-layout/packaged/partial-error-light-850.png), [light desktop](../../evidence/2026-10-01T180000Z-music-error-layout/packaged/partial-error-light-1200.png). Screenshots establish appearance; logs and request observations establish retry/cache behavior.

### First attempt and harness correction

The [first layout attempt](../../evidence/2026-10-01T180000Z-music-error-layout/music-ui.log) failed its unchanged-card assertion because a window resize was still animating the responsive sidebar width. The card's top stayed fixed, but its horizontal position and width were measured at different animation frames. [Initial observations](../../evidence/2026-10-01T180000Z-music-error-layout/attempt-one-observations.json) are retained. The driver now waits for finite animations after resizing before measuring settled geometry, as required by the existing visual recipe. The full bounding-box equality assertion remains; no product expectation was weakened. Corrected development and package runs pass.

## Limits and follow-up

[Installation evidence](../../evidence/2026-10-01T180000Z-music-error-layout/installation.json) records `~/Applications/Clarity.app` and backup `~/Library/Caches/Clarity/build/Clarity-before-music-error-layout-20261001T180000Z.app`. The real user's app was not stopped or reopened; normal Quit/reopen loads the update. No user data or credentials changed.

This fixes presentation and retry stability. The reported live fetch failure's cause is unestablished; controlled failures do not prove real server reachability, authorization, or recovery. No new live playback, normalization/loudness comparison, VoiceOver walkthrough or unrelated-module certification is claimed. Earlier reports retain their build-specific scope.
