---
title: 2 October 2026 — Settings desktop design correction
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100210
summary: Grouped Settings, controls, responsive forms and QA15 correction pass development/package checks; verified bundle installed.
---
# 2 October 2026 — Settings desktop design correction

## Scope

Correct the user-rejected production Settings presentation using the running Cursor Desktop and the previous external prototype. Selected coverage: **FEAT-settings**, **FEAT-shared-ui**, **FEAT-chat** approval/permission controls, **FEAT-music** settings/connection UI and **FEAT-mail** connection navigation. [The Settings visual contract](../../foundations/integrations.md#settings-visual-system-2-october-2026) and D125 define the intended behavior; approval, module enablement and independent Spotify grants retain their existing contracts.

[Reference observations](../../evidence/2026-10-01T184717Z-settings-redesign/reference-study.json) identify Cursor 3.23.12 General/Appearance, the rendered external prototype and source hashes. Native reference screenshots remain outside the repository. Codex Desktop was allowed as a reference but was not inspected.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5. Isolated temporary roots and owned Electron processes; no real credentials or user files. App dependencies and output stay in the external cache. Existing dirty workspace preserved.

Application SHA-256: `75ce6962fa7669b9ee5f0e487b56e1e0b873738b3cb6540cd41972b02ca9fc55`. Verification SHA-256: `af161ec2c72b8dbf64698f1727559cdcdc81847aeba05acfdcd39df8db2c7078`. [Test-entry](../../evidence/2026-10-01T184717Z-settings-redesign/build-tested.json) and [packaged](../../evidence/2026-10-01T184717Z-settings-redesign/build-packaged.json) manifests match all source/test/tooling hashes. Package runtime SHA-256: `cd6c57b623e08c40f234fbe506af99704bc6928a8bf4563ca6937fd2aa1f72d9`. The initial manifest’s package hashes describe the prior cached bundle; only the packaged manifest identifies this update. The Settings driver itself is retained as evidence and is outside the fingerprint helper’s source directories.

Executed: application/Worker checks; development build; the [Settings driver](../../evidence/2026-10-01T184717Z-settings-redesign/verify-settings.txt); both permissions tests; six selected native-redesign, interpretation, motion, Music-settings, Navidrome-error and UI-audit regressions; the original QA15 driver; signed packaging and package relocation. Logs: [types](../../evidence/2026-10-01T184717Z-settings-redesign/typecheck.log), [permissions](../../evidence/2026-10-01T184717Z-settings-redesign/permissions.log), [regressions](../../evidence/2026-10-01T184717Z-settings-redesign/regressions.log), [package build](../../evidence/2026-10-01T184717Z-settings-redesign/package-build.log), [package checks](../../evidence/2026-10-01T184717Z-settings-redesign/package-checks.log).

Reproduce after building, from the repository root: copy the retained driver to an external `.mjs` file, set `CLARITY_SETTINGS_EVIDENCE` to a fresh external directory and run that file with Node. After packaging, repeat with `CLARITY_SETTINGS_PACKAGE=1`. Run `node --test tests/permissions.mjs`; then `node --test --test-concurrency=1 --test-name-pattern='UI audit regressions|native redesign preserves|omni interpretation|spike parity|Navidrome connection errors|native Music UI' tests/usability.mjs tests/redesign.mjs tests/connectors.mjs tests/music-volume.mjs`. Package relocation uses `node --test tests/package.mjs`.

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Development layouts | Every enabled section fits dark/light and normal/minimum windows | All 14 sections × 2 themes × 2 window sizes pass single-section, field-width, switch alignment/knob and overflow checks; screenshots inspected | Passed |
| Settings workflows | Save preferences, preserve data/forms, recover from failed saves | Module off/on hides/restores access without deleting a Markdown note; failed module/preference saves roll back; preferences persist after reload; connection form survives section switches but password is absent after reload | Passed |
| Keyboard/navigation | Named controls and direct connection destinations work | Theme ArrowLeft/End and section-to-input Tab work; Mail → Connect Google selects Google; actual wheel scrolling leaves the header stationary | Passed |
| Approvals and permissions | Preserve all actions, mixed Select all, device/site controls and persistence | Both existing permission tests pass, including all 37 actions and mouse/Space partial/all/none states, location outcomes, revocation and restart | Passed |
| Retained behavior and types | Preserve existing native workflows and compile both processes | Six selected regressions and application/Worker typechecks pass | Passed |
| QA15 navigation clipping | Standard labels fit the supported minimum width | Original driver passes all four theme/size cases; minimum rail client/scroll width both 167px, desktop both 195px; Search and commands opens | Passed |
| Packaged layouts/workflows | Packaged entry point has the same behavior | The same 56 layouts and five workflow groups pass against the signed package; representative screenshots inspected | Passed |
| Package relocation | Signed bundle runs independently and persists data/drafts | Existing relocated bundle test passes signatures, dependency independence, persistence and immediate-Quit saving | Passed |
| Installation | Deliver the tested bytes and preserve the previous app | All seven installed runtime hashes match the tested package; strict deep signature verification passes; predecessor retained | Passed |

Development evidence: [workflow/layout observations](../../evidence/2026-10-01T184717Z-settings-redesign/development-observations.json), [log](../../evidence/2026-10-01T184717Z-settings-redesign/development-layout.log), [Modules](../../evidence/2026-10-01T184717Z-settings-redesign/development-dark-1440-settings-modules.png), [Appearance](../../evidence/2026-10-01T184717Z-settings-redesign/development-dark-1440-settings-appearance.png), [approvals](../../evidence/2026-10-01T184717Z-settings-redesign/development-dark-1440-settings-agent-approvals.png), [minimum light form](../../evidence/2026-10-01T184717Z-settings-redesign/development-light-850-settings-navidrome.png), [minimum dark Permissions](../../evidence/2026-10-01T184717Z-settings-redesign/development-dark-850-settings-permissions.png), [connection error](../../evidence/2026-10-01T184717Z-settings-redesign/development-connection-error.png), [separate connected Spotify grants](../../evidence/2026-10-01T184717Z-settings-redesign/development-connected-spotify-minimum.png).

Package evidence: [workflow/layout observations](../../evidence/2026-10-01T184717Z-settings-redesign/package-observations.json), [log](../../evidence/2026-10-01T184717Z-settings-redesign/package-layout.log), [dark Appearance](../../evidence/2026-10-01T184717Z-settings-redesign/package-dark-1440-settings-appearance.png), [dark Modules](../../evidence/2026-10-01T184717Z-settings-redesign/package-dark-1440-settings-modules.png), [minimum light form](../../evidence/2026-10-01T184717Z-settings-redesign/package-light-850-settings-navidrome.png). Across development and package, 112 section/theme/window combinations pass.

QA15 evidence: [original driver](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-navigation-driver.txt), [new observations](../../evidence/2026-10-01T184717Z-settings-redesign/qa15/settings-navigation.json), [new log](../../evidence/2026-10-01T184717Z-settings-redesign/qa15-layout.log). The adversarial audit separately verifies the same application hash in its [isolated follow-up](2026-10-01T181800Z-adversarial-qa.md#qa15).

### Harness corrections

The first rollback test used Playwright `uncheck()`, which requires the final state to be unchecked even when the scenario deliberately fails the save. The [attempt log](../../evidence/2026-10-01T184717Z-settings-redesign/development-harness-attempt-1.log) is retained; replacing that action with `click()` and explicitly asserting the restored state passed.

The first package driver guessed `Contents/MacOS/Clarity`; the bundle declares `Electron`, as used by the existing package test. [That launch failure](../../evidence/2026-10-01T184717Z-settings-redesign/package-harness-attempt-1.log) occurred before any app scenario. The next attempt checked visibility immediately after Mail navigation, before the section-selection effect completed. [Its log](../../evidence/2026-10-01T184717Z-settings-redesign/package-harness-attempt-2.log) and [observations](../../evidence/2026-10-01T184717Z-settings-redesign/package-harness-attempt-2.json) are retained. The final driver waits for the target section, preserving the expected destination. No product code changed for these harness repairs.

## Limits and follow-up

This is the implementation author’s focused verification, with the audit’s separate QA15 follow-up attributed above. It does not certify live account authentication, OS location/local-network permission, VoiceOver, all possible text/localization, Linux or the entire application. Fourteen other adversarial findings remain tracked in [current follow-up](../../discussions/open-questions.md). The connection-error and connected-status scenarios use controlled IPC; the selected Navidrome connector regression separately exercises actual local HTTP configuration, retry and saved-account preservation with fake credentials.

### Delivery and documentation

Installed at `~/Applications/Clarity.app`; the previous bundle is retained at `~/Library/Caches/Clarity/build/Clarity-before-settings-redesign-20261001T184717Z.app`. [Installation evidence](../../evidence/2026-10-01T184717Z-settings-redesign/installation.json) records the signature and seven matching runtime hashes. The user’s running app was not quit or reloaded; normal Quit/reopen loads the update. Real credentials and the user data root were not changed.

The [final fingerprint](../../evidence/2026-10-01T184717Z-settings-redesign/build-final.json) retains the tested application, verification and package runtime hashes. Report checking, wiki generation and generated-snapshot verification pass; their logs are retained in [documentation checks](../../evidence/2026-10-01T184717Z-settings-redesign/documentation.log). Those checks establish document integrity, not additional product behavior.
