---
title: 1 October 2026 — Settings layout polish
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-01
order: 2026100102
summary: Settings layout verified in development and packaged Electron across two themes and two window sizes.
---
# 1 October 2026 — Settings layout polish

## Scope

Verify **FEAT-settings** against the user's four screenshots/issues: intrusive scrollbar, overlapping sticky navigation, paddingless section highlight, and unequal input/select widths. [Settings](../../foundations/integrations.md#usability-fixes-1-october-2026) owns expected behavior. Related checks preserve connection navigation/error placement, approval checklist interaction/persistence, and packaged startup/persistence.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5, external cached dependencies, isolated temporary data roots, and no live account connections. The [package-time fingerprint](../../evidence/2026-10-01T035337Z-settings-layout/build.json) records the dirty checkout and exact source/runtime file hashes. Its application digest is `38eaa593ac7bb363333693dc55b6d0c1a8ddc9387a5b7f378677837495e12fdb`; packaged-runtime digest is `7d9c64b0f1089b700dbd5bc593f902403caed103446f52f9500362f85e8a6e13`.

Unrelated task/calendar source, driver, and launcher work changed concurrently. [The final source snapshot](../../evidence/2026-10-01T035337Z-settings-layout/build-after.json) preserves those differences and the package-selector repair without claiming a stable whole checkout. The Settings component/styles and tested package runtime remained unchanged during final verification; [scope comparison](../../evidence/2026-10-01T035337Z-settings-layout/scope-comparison.json) records this distinction. The install checks package file hashes before replacing the local bundle.

Reproduce with [shared setup](../setup.md): `node tooling/clarity.mjs build`, then the retained [disposable driver](../../evidence/2026-10-01T035337Z-settings-layout/layout-driver.txt), saved as `.mjs` under the external build cache. Its cache path is explicit. Run it normally for development or with `--packaged` after packaging. It launches/owns one Electron process, seeds only settings through IPC, drives actual navigation/controls/wheel/keyboard events, and closes its process in `finally`. The driver saves geometry/screenshots outside the workspace. No fixture credentials or private user data are retained.

Additional commands: `node tooling/clarity.mjs check`; `node --test --test-concurrency=1 --test-name-pattern='UI audit regressions|agent approvals checklist|relocated macOS bundle' tests/usability.mjs tests/permissions.mjs tests/package.mjs`; after the selector repair, `node --test tests/package.mjs`.

## Results

| Scenario | Expected | Observed | Outcome | Evidence |
| --- | --- | --- | --- | --- |
| Header and scrollbar | Header stays clear and stationary; body alone scrolls with a thin scrollbar at the workspace edge | Real wheel events changed only body scroll; header bounds stayed fixed; every target heading remained below it; no horizontal overflow | Passed | [Development log](../../evidence/2026-10-01T035337Z-settings-layout/layout.txt), [geometry](../../evidence/2026-10-01T035337Z-settings-layout/observations.json), [small Permissions view](../../evidence/2026-10-01T035337Z-settings-layout/permissions-850.png) |
| Section focus and keyboard | Themed highlight surrounds padded content; Tab reaches the first control | At least 16px horizontal and 20px vertical padding; Google section → Tab focused client ID with a visible control outline | Passed | [Google view](../../evidence/2026-10-01T035337Z-settings-layout/google-1440.png), [geometry](../../evidence/2026-10-01T035337Z-settings-layout/observations.json) |
| Uniform form widths | Every labelled input/select has equal responsive width, including Linkding's refresh selector | All field widths matched within one CSS pixel at 1440 × 1000 and 850 × 600 in Light and Dark | Passed | [Linkding view](../../evidence/2026-10-01T035337Z-settings-layout/linkding-1440.png), [small Linkding view](../../evidence/2026-10-01T035337Z-settings-layout/linkding-850.png), [geometry](../../evidence/2026-10-01T035337Z-settings-layout/observations.json) |
| Navigation and persistence | Mail lands at Google; Go to reaches visible sections; refresh choice survives reload | Four sections × two themes × two sizes in each app; hourly refresh persisted and reappeared after reload | Passed | [Development log](../../evidence/2026-10-01T035337Z-settings-layout/layout.txt), [packaged log](../../evidence/2026-10-01T035337Z-settings-layout/packaged-layout.txt), [packaged geometry](../../evidence/2026-10-01T035337Z-settings-layout/packaged-observations.json) |
| Existing UI and approvals | Local connection errors, section entry points, checklist states and persistence remain functional | Selected UI audit and approval checklist tests passed | Passed | [Regression log](../../evidence/2026-10-01T035337Z-settings-layout/regressions.txt) |
| Application/Worker types | Both checks complete without errors | Check command exited zero | Passed | [Type log](../../evidence/2026-10-01T035337Z-settings-layout/typecheck.txt) |
| Packaged app | Signed bundle works after relocation with its own dependencies and persists edits/drafts | Package and repaired relocation/persistence driver passed; installed runtime hashes match tested package | Passed | [Package build](../../evidence/2026-10-01T035337Z-settings-layout/package.txt), [package rerun](../../evidence/2026-10-01T035337Z-settings-layout/package-test.txt), [installation](../../evidence/2026-10-01T035337Z-settings-layout/install.json) |

## Limits and follow-up

All selected final scenarios passed. Real providers, native positioning, VoiceOver, Linux, and a clean separate machine were outside this layout task. The two themes were measured in the actual renderer; retained screenshots illustrate the reported Dark appearance. The wiki checks validate documentation integrity, not app behavior. This is self-verification, with no independent-review claim.

Two harness corrections are preserved. The [initial layout attempt](../../evidence/2026-10-01T035337Z-settings-layout/layout-attempt-1.txt) incorrectly required Linkding to reach the top even when already at the end of the document; the corrected check allows the natural scroll limit while still requiring the heading below the header. The initial package scenario in the [regression log](../../evidence/2026-10-01T035337Z-settings-layout/regressions.txt) stopped because `New task` matched both title and date fields. Adding `exact: true` preserves the intended title entry, and the [package rerun](../../evidence/2026-10-01T035337Z-settings-layout/package-test.txt) passed. Neither failure justified changing product behavior.

The user's existing app session was left running. Normal Quit/reopen loads the installed update; the preceding bundle is retained at the backup path in installation evidence.
