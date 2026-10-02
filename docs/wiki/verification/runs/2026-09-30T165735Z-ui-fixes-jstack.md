---
title: 1 October 2026 — UI fixes and jstack verification
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-01
order: 2026100101
summary: Nineteen UI fixes, controlled navigation and connector checks, packaging, and project-local verification tooling.
---
# 1 October 2026 — UI fixes and jstack verification

## Scope

The user requested fixing all nineteen [audit findings](../../references/ui-audit.md), then applying jstack's verification and wiki maintenance practices. Selected scenarios cover FEAT-chat, FEAT-notes, FEAT-todos, FEAT-calendar, FEAT-expenses, FEAT-bookmarks, FEAT-news, FEAT-mail, FEAT-music, FEAT-agent-board, FEAT-automations, FEAT-wiki, FEAT-settings, FEAT-shared-ui and FEAT-verification-workflow in the [stable feature map](../../features/index.md#verification-map). The original audit supplies baseline reproduction; it is preserved without retroactively pretending it used the new report framework.

## Build and environment

The working tree is dirty, including existing work preceding this task. [Build fingerprint](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/build.json) records Git HEAD, exact per-file hashes, application/verification digests and packaged runtime digests. Application SHA-256 is `bab58a1425884bea090b24f0707e8fd1085810295137922e2d9704ef877e8234`. Product source and package runtime hashes remained stable across the final app, type and package checks; verification-only reader/driver corrections were then exercised separately and included in the final manifest. This is macOS arm64 with Node 22.19.0, Electron 44.4.5, external cached dependencies and unique temporary data roots. [Setup](../setup.md) gives actual commands, build/readiness checks, fixture ownership and cleanup.

Real Electron UI was driven through Playwright named controls, including ordinary double-clicks, Cancel, reload, navigation and reopen. Large local record sets and action statuses were seeded outside the behavior under test. Mail/Music navigation used controlled IPC responses; Linkding used controlled HTTP with real reconciliation. Production account credentials, models and private data were not used. No other verifier or sub-agent reviewed this run.

## Results

| Scenario | Expected outcome | Observed outcome | Result | Evidence |
| --- | --- | --- | --- | --- |
| UI01 drafts | Chat and expense input survives navigation/reload; chat also survives app exit | Preserved draft fields in Electron; packaged unsent chat reappears after full restart | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt), [package check](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/package-test.txt) |
| UI02 deletion | Record remains until confirmation; Cancel preserves it | Task count stays one before/after Cancel, becomes zero after confirm; shared confirmation used by destructive record/source controls | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI03 duplicate submissions | Double-click Save creates exactly one record | One bookmark and one calendar event after real double-clicks; shared guard reused by other forms | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI04 complete lists | 2,001 expenses total 2,001.00; old-created current event remains | Exact total in UI and old event visible beyond the prior cap; paged IDs are unique | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI05 Wiki theme | Explicit Dark overrides a light system | Reader uses dark scheme with light text and explicit dark background | Passed | [Theme observation](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/ui-regressions.json), [Wiki screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/wiki-dark.png) |
| UI06 Calendar context | Creation and Week follow scrolled Month | Form month and new event remain in the viewed future period | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI07 Rename | Rename stays in the open file's parent and keeps its tab | Root Renamed.md exists, Projects/Renamed.md does not, renamed tab remains | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI08 action history | Job displays pending/completed/dismissed/failed actions | All four statuses and failure text appear within the owning automation | Passed | [History screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/automation-history.png), [app tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI09 local errors | Modal and connection failures are visible near their controls | News alert inside dialog with no toast; Linkding failure inside its visible section | Passed | [Settings screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/settings-error.png), [app tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI10 hover | Primary colors retain contrast in both themes | Expected foreground/background pairs at 850 × 600 | Passed | [Hover screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/todos-hover-minimum.png), [app tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI11 readable review | Labelled change and prior/next content; raw data secondary | Before/After visible, human task action label, Technical details closed | Passed | [Approval screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/approval.png), [app tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI12 targeted links/context | Canonical links reveal item or explicit missing state; Wiki context retained | Wiki link reports deleted item, OS URL reveals a specific task, Ask in chat adds current page chip; unsafe path rejected | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI13 Settings | Connection entry lands at its form; sections navigable | Connect Google lands near viewport top; Go to selects Linkding | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI14 reply search | Reply-only term reveals parent and excerpt | Matching root opens the thread containing the reply | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI15 retained place | Mail returns one page; Music Back returns immediate parent | Mail retains selection/page across modules; artist/album stack and search retained; Songs layout still resets | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI16 Linkding | Update untouched fields, preserve annotations, schedule without overlap | Title/URL/tags refreshed; local description retained; one request for overlaps; due/disabled/stopped scheduling checked | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI17 inspection | Retained original can be inspected/revealed | Text preview visible and Show in Finder points to retained fixture path | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI18 state feedback | Loading and no matches are distinct | Search shows Loading then no-match text; bookmark no-match text present | Passed | [Empty-state screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/music-empty-minimum.png), [app tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| UI19 accessible dialogs | Dialog exposes its visible name and usable Cancel | Native dialogs found by exact accessible name; Cancel and confirm exercised | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| Main/Worker types | Both application and Worker compile without type errors | Both checks exit zero | Passed | [Type checks](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/typecheck.txt) |
| Existing application regression | No failures in the default controlled suite | 25 passed; two separately gated live-model checks skipped outside selected scope | Passed | [App tests](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/app-tests.txt) |
| Package | Signed relocated app, local persistence, draft recovery, URL registration | Own dependencies/system-only PATH, signature/symlink/helper checks and restart persistence passed | Passed | [Package check](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/package-test.txt) |
| Reader/report structural tooling | Escaped metadata, outcome checks, safe hashed evidence and stale detection | All 13 Node-only reader/report checks pass | Passed | [Wiki tools](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/wiki-tools.txt) |
| Offline reader UI | Search/navigation/source/evidence/appearance operate in the actual wiki | Actual local reader search, report metadata, JSON evidence, source/read switching and saved appearance pass offline, including 850 × 600 | Passed | [Browser check](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/wiki-ui.txt), [reader screenshot](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/wiki-verification-reader.png) |

The signed bundle is installed at `~/Applications/Clarity.app`; [installation evidence](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/install.json) records the retained prior-bundle backup. The existing running process was left open. A normal Quit/reopen loads the new main process and renderer together.

## Limits and follow-up

All selected final scenarios pass. Live Gmail, X, Linkding/Navidrome accounts, fresh OAuth, native location prompts, listener-confirmed audio, exhaustive GFM, VoiceOver, and Linux/clean-machine execution were not selected for this run. Fixture navigation does not establish provider compatibility. Shared deletion/submission/dialog components were exercised on representative screens, with source coverage of their other uses; every permutation was not clicked independently. Lists load all local pages in memory and are not a performance benchmark for very large libraries.

**Attempts on 1 October 2026:** two initial app-driver attempts stopped on inaccurate assertions: a renamed tab includes `.md`, and the Wiki context chip includes its remove control. File effects had already succeeded; these were harness gaps, not confirmed product regressions. The selectors were corrected and the full new driver rerun successfully. The first offline reader attempt used textbox for a search input and timed out; [its failed harness log](../../evidence/2026-09-30T165735Z-ui-fixes-jstack/wiki-ui-attempt-1.txt) is preserved. Correcting it to the searchbox role produced the successful subsequent browser run. The reader screenshot was captured before the provisional report result was finalized; the browser checked that displayed metadata matched its then-current Markdown. Original product failures remain in the baseline audit; no earlier failing product evidence was overwritten.

No claim of independent review is made. The report checker validates outcome metadata and the reader validates document/attachment integrity; their success is separate from application acceptance.
