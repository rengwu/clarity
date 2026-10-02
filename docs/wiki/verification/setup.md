---
title: Verification setup
section: Verification
status: Current
updated: 2026-10-02
order: 10
summary: Reproducible isolated app checks, build identity, evidence capture and wiki maintenance.
---
# Verification setup

This is Clarity's project-local implementation of jstack's verification conventions. The user requested adoption on 1 October 2026. Existing topic pages remain the product specification; [feature IDs and recipes](../features/index.md#verification-map) connect them to dated [runs](index.md). A passed run applies only to its recorded build and selected scenarios.

## Scope and authorization

Choose scenarios from the actual change, user requirement and relevant error/cancel/persistence paths. Use the existing [scope authorization](../vision/principles.md#scope-and-authorization) for fixes; verification is not separate authority to publish, commit, send messages or broaden product scope. Interviews and planning are used when requested or needed for unresolved decisions; routine fixes do not trigger a new question round. Preserve expected behavior when diagnosing a regression.

Distinguish documentation drift, harness gaps, product regressions and unclear intent. Repair stale selectors or drivers, execute the repaired recipe, and record why the earlier attempt failed. Do not change an expected outcome merely to make a check pass. Preserve earlier reports; use a new run or a dated attempt note. No independent-review claim is made unless another verifier actually performs it.

## Build and identity

Run from the Clarity repository, with Node.js 22+. App dependencies and outputs remain in the external cache. These commands are executed recipes:

```sh
node tooling/clarity.mjs check
node tooling/clarity.mjs build
node tooling/fingerprint.mjs
node tooling/clarity.mjs test
node tooling/clarity.mjs package
node --test tests/package.mjs
```

`fingerprint.mjs` emits Git revision, dirty flag, Node/platform/architecture, per-file SHA-256 values, separate application/verification hashes, and the cached package's runtime-file hashes when present. Redirect it to a run's `build.json` before testing and compare application/verification hashes afterward. A dirty checkout must not be described by HEAD alone. Package hashes refer to the cached bundle at capture time; create it from the intended source before claiming package verification. Include pinned versions from `tooling/dependencies.mjs` through the file manifest. The helper does not read user data or credentials.

The default app suite includes core, connectors, Music cache/pagination/recent-history/volume, integration, permissions, usability, task-date, redesign and the three adversarial regression drivers. It skips the separately gated live-Codex tests unless explicitly enabled. The [UI audit regression recipe](../references/ui-audit.md#resolution-and-evidence) targets the nineteen fixes. For a narrow change use `node --test --test-name-pattern='actual test name' tests/<file>.mjs`; do not infer a pass for skipped scenarios.

## Adversarial regression suite

After building with an external cache, run `node --test --test-concurrency=1 tests/adversarial-services.mjs tests/adversarial-renderer.mjs tests/adversarial-state.mjs`. These drivers are also included in `node tooling/clarity.mjs test`. Set `CLARITY_QA_EVIDENCE` to a fresh run directory; each driver uses its own temporary data root and closes its own Electron/server instances. Services cover file discoverability, required revisions, real dates, Board parents and feed entities. Renderer covers malformed previews, modal/editor keyboard context, Wiki fragments/history and delayed Chat drafts. State covers Bookmark completion/layout, Mail account invalidation, Board errors and the retained Settings-label guard.

For the native packaged rerun, set `CLARITY_TEST_EXECUTABLE` to `<cache>/Clarity.app/Contents/MacOS/Electron` and `CLARITY_TEST_MAIN` to `<cache>/Clarity.app/Contents/Resources/app/main.mjs`; retain `CLARITY_BUILD_CACHE` for fixture dependencies/Worker. Direct-service checks still compile the recorded source, while native checks execute packaged bytes. Use `tests/package.mjs` separately for relocation/signature/restart independence.

Negative controls run the same assertions against an isolated pre-fix build. `CLARITY_QA_SOURCE` selects the service source; `CLARITY_TEST_SOURCE` selects state fixture setup. Renderer fixture setup uses its working directory, so run from the recorded frozen source. A direct assertion failure on the old behavior is useful evidence; a timeout or a harness/setup failure is not by itself proof of the defect. The [remediation run](runs/2026-10-02T101600Z-adversarial-fixes.md) records all outcomes, source manifests and fixture limits.

## Instance ownership and interaction

Electron drivers use `playwright-core` from the external build cache and launch its Electron executable with `output/main.mjs` and a unique `CLARITY_TEST_ROOT` under the OS temporary directory. Wait for `.sidebar` or an expected named control, not a fixed startup delay. Production Clarity and credentials are not touched. Each driver owns its process, page and root; no simultaneous driver controls the same mutable instance. `tests/package.mjs` copies the bundle to another temporary folder, removes development environment assumptions, uses a system-only PATH, and verifies signatures, symlinks, helper startup, persistence and immediate-Quit saving.

Drive user workflows through named roles/labels and real clicks, including double-click, Cancel, reload and reopen. Use the sandbox's `window.clarity.call` only for fixture setup or observing underlying results outside the behavior under test. Seed records before launch for large-list, action-status and search fixtures. Controlled Mail/Music IPC responses prove screen navigation only; they do not prove authentication or provider compatibility. Linkding fixtures use a local HTTP server and real import/reconciliation logic. Existing connector tests cover OAuth/streaming with controlled responses. Do not log real tokens or connect live accounts for convenience.

Capture both visible and underlying effects: record counts, saved file paths/content, request counts, persisted revisions, and state after reload/restart. Screenshots document appearance and cannot establish an invisible effect alone. Electron processes, fixture servers and timers must close in `finally`; diagnostic temporary folders may remain until OS cleanup. Evidence must survive closure. Delete only artifacts created by that run.

## Records and evidence

Create `verification/runs/<UTC-run-id>.md` and `evidence/<UTC-run-id>/`. Reports contain Scope, Build and environment, Results, and Limits and follow-up. Link scenarios to stable feature IDs and record expected outcome, actual observation, Passed/Failed/Untested, and relative evidence links. Results aggregate conservatively: any failed selected scenario means Failed; otherwise any untested selected scenario means Untested; only all selected scenarios passing means Passed. Unselected live-account checks belong in the limits, not an implied certification.

Preserve logs as TXT/LOG, fingerprints/observations as JSON, and selected safe fixture screenshots as PNG. Usability screenshots are generated under the external cache's `ui-fixes-2026-10-01/`; copy selected evidence into the run folder before cleanup. Use encoded relative links from the report. Do not put user accounts, credentials, model prompts containing private data, or the entire data root in the wiki. No test fixture data belongs in jstack.

## Wiki and report checks

```sh
node --test tests/wiki-reader.mjs tests/wiki-reports.mjs
node tooling/check-reports.mjs docs/wiki
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```

These are Node-built-in checks; do not install wiki packages. `check-reports.mjs` validates outcome frontmatter under `verification/runs/`; it does not judge the truth of a report. The reader validates metadata, Markdown links/anchors, attachment paths and SHA-256 contents, and a current generated snapshot. A successful wiki build is document integrity, not product verification. After changing the reader, also open its HTML offline and exercise navigation, search, source view, appearance and evidence links; [reader verification](../features/verification-workflow.md) has the executed recipe.

## Maintenance and provenance

Onboarding reads relevant feature recipes and the latest applicable run. Changes update the existing topic, its expected outcomes/recipe, and a new run link in Verification history; shared indexes and HTML are rebuilt after writers finish. Planned or source-observed behavior is not marked verified. Audit stale recipes periodically when requested, and whenever a changed entry point or driver demonstrates drift.

Adopted from clean local jstack revision `cdda753adc7ed81d3eb3abf0283b29e7c226670c`, at `~/Desktop/Projects/jstack`: `references/stack-contract.md` and the plan, wiki, feature-map, verify-change and maintain-verification skills. Grill-me remains an optional requested interview workflow, with dependency-aware rounds rather than a mandatory implementation gate. No global skill/plugin installation is required for these project-local commands.

The reusable reader is jstack v1.2.0, copied from `skills/wiki/assets/_build.mjs` with trailing-whitespace cleanup after comparing Clarity's uncustomized v1.0.0. It adds generic metadata, hashed attachments and automatic/light/dark appearance while retaining offline navigation/source/search and bundled licenses. The report checker is copied from `skills/verify-change/scripts/check-reports.mjs`; its tests and reader tests are adapted only to project-local target paths. Future upgrades must compare and preserve any Clarity customizations rather than overwrite blindly. jstack itself was not modified.
