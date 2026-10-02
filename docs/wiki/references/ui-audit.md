---
title: UI and usability audit
section: References
status: Resolved
updated: 2026-10-01
order: 110
summary: Nineteen prioritized baseline findings with implemented fixes and build-specific verification evidence.
---
# UI and usability audit

## Resolution and evidence

The user subsequently instructed “fix them all” and requested jstack verification/wiki practices. All nineteen findings now have implemented remedies and regression coverage. [The dated report](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) records build fingerprints, observed outcomes, logs, screenshots and limits; [D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026) records delegated implementation choices. The original audit below is retained as historical baseline evidence.

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | UI01 drafts | Chat/Expense drafts persist in the chosen folder's profile through navigation/reload; packaged restart checks chat recovery. |
| P1 | UI02 destructive actions | Named confirmation with Cancel and local errors before permanent record/source deletion. |
| P1 | UI03 duplicates | Immediate submission locks and disabled/progress controls; real double-click regressions. |
| P1 | UI04 hidden records/totals | Bounded backend pagination with complete local screen loading; 2,001-item event/expense fixtures. |
| P1 | UI05 Wiki contrast | Explicit reader theme, foreground and background synchronized with the app. |
| P1 | UI06 wrong creation period | Calendar toolbar and Week switch follow the visible Month date. |
| P1 | UI07 accidental note move | Rename uses the file parent, rejects separators and retains the tab. |
| P1 | UI08 hidden outcomes | All action statuses/errors appear inside their owning automation. |
| P2 | UI09 distant errors | Modal and connection failures render beside the relevant controls. |
| P2 | UI10 hover contrast | Primary-specific foreground/background pairs verified in both themes. |
| P2 | UI11 raw approvals | Human labels/fields, optional prior snapshots, rendered before/after and collapsed technical arguments. |
| P2 | UI12 target/context loss | Shared record/file targets, canonical item URLs, missing/disabled feedback and removable Wiki page context. |
| P2 | UI13 buried Settings | Sticky section selector and direct connection landing. |
| P2 | UI14 hidden reply search | Parent threads and matching reply excerpts returned to the list. |
| P2 | UI15 lost browsing place | Temporary Mail search/page/message state and previous-page history; Music collection stack. |
| P2 | UI16 stale Linkding | Field reconciliation preserving local edits; manual/hourly/daily refresh and explicit outcomes. |
| P2 | UI17 opaque attachments | Clickable inspection, image/text preview, expiry feedback and Show in Finder. |
| P2 | UI18 bare states | Shared loading/empty/no-match presentation with contextual guidance. |
| P2 | UI19 unnamed dialogs | Visible heading supplies each native dialog's accessible name. |

Run `node tooling/clarity.mjs test` for the controlled regression suite, including `tests/usability.mjs`; `node --test tests/package.mjs` checks the rebuilt package. [Setup](../verification/setup.md) owns isolation, identity, fixture and cleanup instructions. The metadata checker/wiki build validate the evidence record, not the application behavior. Live providers and VoiceOver remain distinct validation limits.

## Original scope and evidence

The user requested an audit and a priority-sorted findings list. This is an evidence register, not approval of a redesign or a claim that any issue has been fixed. Existing product contracts remain on their topic pages. Suggested remedies below are assistant recommendations.

Built the current working tree with `node tooling/clarity.mjs build`, then inspected a separate Electron instance with disposable data at 1280 × 850 and the supported minimum 850 × 600. Checked light and explicit dark themes, all module screens, normal form actions, error cases, navigation, and record limits. Mail and Music connected screens used controlled IPC responses; the player received simulated events. No real account was connected, model request sent, or audio played. Existing user data and the installed application were not changed. This audit did not repeat packaging, real-provider compatibility, or the complete test suite.

The external cache folder `~/Library/Caches/Clarity/build/ui-audit-2026-10-01/` contains the disposable harness, screenshots, and `evidence.json`. Source paths below are relative to the repository. UI reproduction and source-only observations are distinguished. Accessibility inspection used DOM and Chromium's accessibility tree; no VoiceOver walkthrough was performed.

Priority is ordered by impact on preserving work, accuracy, and completing normal tasks. **P1** means fix before relying on the affected workflow; **P2** means significant usability or consistency work. The ordering is an audit judgment, not a newly accepted product requirement.

## UI01 — P1 — Drafts disappear without warning

**Reproduced:** enter an expense, switch to Todos, then return to Expenses. The editor and all unsaved input disappear. A typed chat draft also becomes empty after View → Reload. Expense form state is local to its unmounted view; chat drafts survive module navigation only in a renderer-memory map. Notes has stronger preservation behavior, creating an inconsistent expectation across the app.

Recommend preserving unfinished forms during navigation or explicitly handling discard; persist chat drafts if reload/restart recovery is adopted. Sources: `src/renderer/views/expenses.tsx`, `src/renderer/views/chat.tsx`, `src/renderer/main.tsx`. Topics: [Expenses](../features/expenses.md), [Chat](../foundations/chat.md).

## UI02 — P1 — Destructive actions have no recovery step

**Reproduced:** clicking the small × beside a task immediately removes it; there is no confirmation or application-level Undo. Source review finds the same immediate permanent deletion path for calendar events, expenses, bookmarks, and automations. In contrast, Notes asks before moving content to recoverable Trash.

Recommend a small Undo mechanism or an appropriate confirmation for irreversible deletion, with clear destructive styling. This is a usability recommendation, not a requirement to introduce a general backup system. Sources: `src/renderer/views/todos.tsx`, `calendar.tsx`, `expenses.tsx`, `bookmarks.tsx`, `agents.tsx`; permanent record removal is in `src/main/modules.ts`.

## UI03 — P1 — Double-clicking Save creates duplicates

**Reproduced with ordinary UI double-clicks:** one filled bookmark form creates two bookmark records; one calendar form creates two events. Neither form disables Save or guards against a second submission while the first request is pending. Todos and Expenses already have busy guards, so behavior differs by module.

Recommend an immediate submission guard and a disabled/progress state until completion. Sources: `src/renderer/views/bookmarks.tsx` and `src/renderer/views/calendar.tsx`. Similar unguarded forms elsewhere should be inspected during a fix; they were not all proven to duplicate records in this audit.

## UI04 — P1 — Record caps conceal appointments and understate daily totals

**Reproduced:** with 2,003 calendar records, the list returns the newest 2,000 by creation time. A previously created future appointment drops out of the displayed week, with no truncation warning. With 2,001 same-day expenses of 1.00, the daily total is displayed as **2,000.00**, not 2,001.00. Expenses has a general truncation message at the bottom, but the displayed daily total is not labelled partial and Show earlier days cannot retrieve omitted records.

Recommend date-aware queries/pagination and complete aggregation, or explicit partial-result presentation until complete data is available. Sources: `src/main/modules.ts` list handling, `src/renderer/views/calendar.tsx`, `src/renderer/views/expenses.tsx`. Topics: [Calendar](../features/calendar.md), [Expenses](../features/expenses.md).

## UI05 — P1 — Wiki becomes unreadable in explicit dark mode

**Visually reproduced:** selecting Dark while the system uses a light scheme leaves the embedded Wiki text black over Clarity's dark background. The reader has a transparent background and its own `color-scheme:light dark`; it does not receive the app's selected theme. The inspected text color is `rgb(0, 0, 0)` against the app's `rgb(28, 30, 28)` background.

Recommend synchronizing the chosen theme and defining both foreground and background for the reader, preserving its independent offline behavior. Source: `src/main/wiki.ts` generated reader styles and `src/renderer/main.tsx` iframe. Evidence: `08-wiki-dark.png`. Topic: [Wiki](../features/wiki.md).

## UI06 — P1 — Calendar creation uses a date outside the visible month

**Reproduced:** scroll the continuous Month view to December 2026, then click + Event. The form still starts on 1 October 2026. Scrolling updates `visibleMonth`, while the action uses the separate stale `date` state. A user can save an event into an unintended period.

Recommend making toolbar creation follow an explicit selected/visible date and preserving that context when changing views. Source: `src/renderer/views/calendar.tsx`, especially `add(date)` and the month scroll handler. Evidence: `04-calendar-wrong-date.png`. Topic: [Calendar](../features/calendar.md).

## UI07 — P1 — Renaming a note can silently move it

**Reproduced:** open `Welcome.md` at the Notes root, select the Projects folder in the tree, then Rename the still-open note to Renamed. The result is `Projects/Renamed.md`. The rename destination uses the currently selected folder rather than the open file's parent. The dialog says Rename and does not disclose a move; the tab also closes afterward.

Recommend anchoring Rename to the file's parent and treating an intentional move as an explicit operation. Source: `src/renderer/views/notes.tsx` submit handler and tree selection. Topic: [Notes](../features/notes.md).

## UI08 — P1 — Automation action outcomes are hidden

**Reproduced with a persisted fixture action:** a failed automatically approved action exists under `automation:<id>`, including its error, but Automations renders no card or error for that action. The review list filters to pending only, also hiding applied/rejected outcomes. The automation's own result/error is a separate field and does not provide an action history. Pending cards are outside individual job cards and omit the owning job name.

Recommend showing action status/result/error with its owning automation, including after a review. Source: `src/renderer/views/agents.tsx` Automations action filter. Topic: [Automations](../features/automations.md). This is a presentation gap, not evidence that action records were lost.

## UI09 — P2 — Errors appear away from the failed action

**Reproduced:** an invalid Linkding address displays its error at the top of Settings, over 3,200 pixels above the current viewport. An invalid feed address displays a global toast behind the open News sources modal, outside the modal's active focus area. The error is dimmed and its Dismiss button cannot be used while the dialog remains open.

Recommend local error placement inside the relevant connection section or dialog. Sources: `src/renderer/views/settings.tsx`, `src/renderer/views/reading.tsx`, and the global toast in `src/renderer/main.tsx`. Evidence: `05-modal-error.png`, `12-modal-error-dark.png`, `13-settings-error-offscreen.png`.

## UI10 — P2 — Primary buttons lose contrast on hover

**Reproduced:** an enabled Add button changes from dark green to pale green on hover while retaining almost-white text. It appears disabled at the moment it is being targeted. The shared `button:hover` background overrides `.primary`; `.primary:hover` changes brightness only, so the problem affects primary actions throughout the app.

Recommend defining a primary-specific hover foreground/background pair. Source: `src/renderer/style.css`. Measured light-theme colors change from background `rgb(66, 105, 85)` to `rgb(224, 232, 222)`, with text remaining `rgb(250, 249, 246)` before the brightness filter. Evidence: `17-hover-light.png`.

## UI11 — P2 — Approval cards require reading implementation details

**Observed in UI and source:** a request is titled `todos: add`, then presents raw JSON under Changes. Other methods expose IDs, revisions, paths, and serialized Markdown instead of a concise description of the affected item and proposed change. Completed cards use raw status words such as `applied`. Larger note/wiki edits have no before/after preview.

Recommend human-readable action summaries and relevant fields, with raw arguments available as secondary detail. This need not add a second approval system. Sources: `src/renderer/views/chat.tsx`, `src/main/modules.ts`, and `src/renderer/views/agents.tsx`. Evidence: `01-chat.png`. Topic: [Chat](../foundations/chat.md).

## UI12 — P2 — Item links and contextual handoffs lose their target

**Existing gap confirmed in source:** applied chat cards navigate only to the module, even though the action identifies a specific item. Board links pass IDs, but most destination screens ignore them. Wiki source links into other modules still lack a general resolver. Wiki's Ask in chat button only switches screens; it does not pass the current page into the conversation.

Recommend resolving the existing item/path targets at the destination and explicitly carrying context for contextual actions. Sources: `src/renderer/views/chat.tsx`, `src/renderer/views/agents.tsx`, `src/renderer/main.tsx`, `src/main/wiki.ts`. Exact-item chat links and cross-module wiki citations remain accepted gaps under D18/D85; the Ask in chat improvement is an audit recommendation.

## UI13 — P2 — Connection setup is buried in Settings

**Reproduced with all modules enabled:** Settings is about 4,364 pixels tall at an 850-pixel viewport. The 37-row approval checklist precedes account setup; Codex begins around y=2,566 and Google around y=2,720. Mail's Connect Google button opens the very top of Settings, leaving the relevant form several screens away. There are no section jump links.

Recommend targeting the requested connection directly and providing concise section navigation or disclosure for long settings groups. Sources: `src/renderer/views/settings.tsx`, `src/renderer/views/agent-approvals.tsx`, `src/renderer/views/reading.tsx`. These measurements depend on enabled modules and viewport size. Topic: [Connections](../foundations/integrations.md).

## UI14 — P2 — Board search hides matches inside replies

**Reproduced:** a unique term in a reply returns one matching backend record but zero visible threads. The screen filters replies out without including their parent thread. It also shows no empty-result explanation because the unfiltered record list is nonempty.

Recommend including the parent thread and a matching reply excerpt. Source: `src/renderer/views/agents.tsx` Board list filter. Evidence: `11-board-search.png`. Topic: [Agent board](../features/agent-board.md).

## UI15 — P2 — Navigation discards the user's place

**Reproduced with controlled connected-screen fixtures:** leaving Mail and returning resets both the selected message and inbox page. Mail pagination provides Older messages and First page, with no one-page return. In Music, Search → Artist → Album → Back returns to search results instead of the artist. The Music selection is one value rather than a navigation history.

Recommend retaining the existing view state during module switching and making Back return to the immediate previous view. Preserve the separately accepted Songs-layout reset on a new Music visit; this finding does not reopen D108. Sources: `src/renderer/views/reading.tsx`, `src/renderer/views/music.tsx`, `src/renderer/main.tsx`. Topics: [Mail](../features/mail.md), [Music](../features/music.md).

## UI16 — P2 — Linkding Refresh can misleadingly leave stale entries

**Previously documented gap, source-reviewed:** Refresh imports unseen URLs but ignores changes to previously imported URLs. The UI reports a count of imported bookmarks without explaining that existing entries were not refreshed. The accepted scheduled refresh is also absent. This can leave users treating an add-only import as a completed synchronization.

Recommend making the current result/limitations explicit while implementing the already accepted refresh behavior with local-edit preservation. Sources: `src/renderer/views/bookmarks.tsx`, `src/main/integrations.ts`. Topic: [Bookmarks](../features/bookmarks.md). No live Linkding account was tested.

## UI17 — P2 — Attachments cannot be inspected through their chips

**Source-only observation:** composer attachment chips offer a filename and Remove; sent-message chips are plain spans. There is no thumbnail, open, preview, or reveal action, even for stored-only files. Users cannot verify an attached image or reopen the retained original from that UI. Storage itself is not alleged to be missing.

Recommend a small inspect/open action and image preview where supported. Source: `src/renderer/views/chat.tsx` attachment rendering. Topic: [Chat](../foundations/chat.md). A synthetic drag event in this audit did not establish a successful attachment walkthrough; this finding is based on the rendering paths, not that attempted fixture.

## UI18 — P2 — Empty and loading states are inconsistent

**Reproduced:** a completed Music search with zero results leaves only controls and empty space; there is no No results state. Source review shows similarly bare empty lists in Bookmarks and Todos, and several views ignore the loading state provided by `useResource`. Board's reply-search problem above is a separate case where valid results disappear.

Recommend distinct loading, empty-library, no-match, and disconnected states with only the guidance needed for the next action. Sources: `src/renderer/views/music.tsx`, `bookmarks.tsx`, `todos.tsx`, `src/renderer/api.tsx`. This is a consistency recommendation, not authorization for decorative empty-state content.

## UI19 — P2 — Dialogs have no accessible title

**Confirmed in the accessibility tree and shared component:** News sources is exposed as an unnamed `dialog`, despite displaying a heading. The shared Dialog component has neither `aria-label` nor `aria-labelledby`, affecting all forms that use it. Its visible heading does not automatically provide the dialog's accessible name.

Recommend linking each dialog to its heading with `aria-labelledby`; check announcement and focus using VoiceOver during a fix. Source: `src/renderer/api.tsx`. No full assistive-technology conformance claim is made by this audit.
