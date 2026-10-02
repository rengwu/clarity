---
title: 3 October 2026 — X default-browser opening
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-03
order: 2026100301
summary: Native default-browser dispatch, launch failure/retry, separate import access and packaged delivery.
---
# 3 October 2026 — X default-browser opening

## Scope

Verify **FEAT-bookmarks** and **FEAT-settings** under [D128](../../decisions/index.md#d128-open-x-in-the-default-browser-3-october-2026). [Bookmarks](../../features/bookmarks.md#x) owns the contract: Open X delegates to the OS default browser; Sign in for import retains the separate profile. This is implementation-author verification. The local date is 3 October; the evidence directory uses UTC.

## Build and environment

macOS arm64, Node 22.19.0. Application SHA-256: `63dae59387d2034b0431216cec0c7073c0c63c3f9a2eda7c9735294b7c392da0`. Verification SHA-256: `e5c84d06453ceebb7b38b8752fdb14a63e026a0bbe407a24bc0eadc742e30d8c`. Package runtime SHA-256: `6a825e66c86066c306745c56bbd11969f50aed8a492401d9df660eb655ad3805`.

[Before](../../evidence/2026-10-02T160132Z-x-default-browser/build-before.json) and [tested](../../evidence/2026-10-02T160132Z-x-default-browser/build-tested.json) fingerprints identify the existing dirty checkout. Application hashes match; the first package fingerprint refers to the prior cached build. The [retained driver](../../evidence/2026-10-02T160132Z-x-default-browser/verify-x.txt) ran externally against both development and signed package builds, with isolated temporary data and mock keychain. Dependencies remain outside the workspace.

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Open X | Use the OS external handler without managed-browser setup | Real renderer/IPC path reaches `shell.openExternal` once with the bookmarks URL; no login dispatch or browser profile created | Passed |
| Launch error and retry | Local error, retry available, no duplicate request | Injected shell rejection appears inside X; retry clears it; held launch disables both actions and suppresses repeated activation | Passed |
| Import access | Keep the existing import login separately available | Sign in for import dispatches `browser.login` with the original URL; its actual browser launch is stubbed | Passed |
| Reload and layout | Preserve entry points and fit the existing responsive design | Both actions remain after reload; dark 1200×800 and light 850×600 have no section overflow; screenshots visually inspected | Passed |
| Build and package | Types, signed standalone launch and persistence | Both TypeScript checks pass; the native checks repeat on the package; relocation/signature/system-PATH/restart recipe passes | Passed |

[Development observations](../../evidence/2026-10-02T160132Z-x-default-browser/development/observations.json), [package observations](../../evidence/2026-10-02T160132Z-x-default-browser/package/observations.json), [development log](../../evidence/2026-10-02T160132Z-x-default-browser/development.log), [package log](../../evidence/2026-10-02T160132Z-x-default-browser/packaged.log), [build](../../evidence/2026-10-02T160132Z-x-default-browser/build.log), [typecheck](../../evidence/2026-10-02T160132Z-x-default-browser/typecheck.log), [packaging](../../evidence/2026-10-02T160132Z-x-default-browser/package-build.log), [relocation](../../evidence/2026-10-02T160132Z-x-default-browser/package-checks.log). Visual evidence: [dark desktop](../../evidence/2026-10-02T160132Z-x-default-browser/development/dark-1200.png), [light minimum size](../../evidence/2026-10-02T160132Z-x-default-browser/package/light-850.png).

## Limits and follow-up

The shell boundary is intercepted, so these checks prove OS dispatch rather than a real browser's launch/login behavior. Import sign-in is intercepted separately; no live X page, authentication, account data or bookmark completeness is certified. Reusing a default-browser session for import remains unsupported and is stated in the UI and current follow-up. No browser extension, debugging permission or paid API was introduced.

[Installation evidence](../../evidence/2026-10-02T160132Z-x-default-browser/installation.json) records the destination, retained predecessor and seven matching runtime hashes. Normal Quit/reopen loads the update; the running app was not restarted. The required report and wiki build checks validate documentation structure, not live X behavior.
