---
title: 1 October 2026 — Resizable source pane and compact action
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-01
order: 2026100109
summary: Browser-verified divider dragging, keyboard sizing, compact action and retained Chat state in the external example.
---
# 1 October 2026 — Resizable source pane and compact action

## Scope

Selected **FEAT-shared-ui / FEAT-chat** changes in the external [source-preview example](../../references/technical-spikes.md#source-preview-and-navigation-example-1-october-2026): draggable pane width, keyboard resizing and compact module-open control. The user accepted the example/history behavior in Q8/Q10; that acceptance is distinct from verification. This run does not cover the production redesign or intent parser.

## Build and environment

Node 22.19.0, macOS arm64, shared Synara browser at 1100×760 and 390×760 CSS pixels, `http://127.0.0.1:4319`. The [source manifest](../../evidence/2026-10-01T122900Z-preview-controls/build.json) identifies four executable files with aggregate SHA-256 `59f1306573d4daa198cb221d89c6565b5a15f76493e432dc4b2bc7663dbca496`. The [workspace fingerprint](../../evidence/2026-10-01T122900Z-preview-controls/workspace-build.json) records the separate dirty production checkout; no production build/test pass is claimed.

Verification used real typing, clicks, locator dragging, Tab/arrow/Home/End keys and viewport resizing. DOM reads observed the actual geometry and state. Evidence: [browser observations and console](../../evidence/2026-10-01T122900Z-preview-controls/observations.json), [source/server checks](../../evidence/2026-10-01T122900Z-preview-controls/source-checks.json), and [inspected final screenshot](../../evidence/2026-10-01T122900Z-preview-controls/source-preview.png). Assets matched disk hashes with no-store headers; the temporary login-session server remained live.

The [final audit](../../evidence/2026-10-01T122900Z-preview-controls/final-audit.json) confirms the external files still match their tested manifest and the application/verification/package-runtime hashes match the [final workspace fingerprint](../../evidence/2026-10-01T122900Z-preview-controls/workspace-final.json). Report checks, wiki rebuild and snapshot/link checks passed.

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Compact action | Shared height and content width, no full-width footer button | Open in Notes measured 120.56×28px inside a 344px initial pane | Passed |
| Pointer resize | Divider changes width, clamps and ends dragging cleanly | Drag changed 344→450px; later drags reached 640px/280px limits and then 410px; resizing class cleared | Passed |
| Keyboard resize | Reachable labelled separator, visible focus and bounded values | Tab reached separator with focus-visible; arrows changed 16px, Shift changed 40px; Home/End reached 280/640px without exceeding either | Passed |
| Close/reopen | Stay in Chat, return trigger focus and keep width | Pane became inert, handle hidden, trigger focused; reopened at 410px with draft and no history push | Passed |
| Explicit navigation/history | Preserve draft, width and Chat reading position | Notes opened only through the named control; Back restored 410px width, identical draft and 219px scroll; Forward returned to Notes | Passed |
| Narrow viewport | Usable bounded overlay and no page overflow | At 390px, maximum was 358px; drag produced 310px with compact action; root overflow false. Desktop restored to 410px | Passed |
| Visual/source integrity | Continuous divider, compact action, served valid current files | Inspected final desktop screenshot; both JS modules passed syntax checks; three browser assets matched the manifest | Passed |

## Limits and follow-up

The browser log includes repeated deprecated modelContext warnings and blocked-inline-style CSP messages attributed to `invalid:[redacted]` line 2152, matching the earlier run. Browser-helper attribution is an inference from their timing/location and repetition on tool calls. The app's CSS property updates demonstrably resized the pane; external CSS loaded and geometry matched. The restrictive server policy was not weakened. This is not a clean-console claim.

Width, history and draft in this narrow example last only for the page session. Native touch dragging, VoiceOver, reduced-motion emulation, all real module destinations, cross-launch persistence and provider/model calls were not selected for this run. Existing reduced-motion CSS remains in source. The full 4318 prototype and production renderer were not modified by this change. No independent or exhaustive accessibility review is claimed. Wiki validation checks document integrity, not runtime acceptance.
