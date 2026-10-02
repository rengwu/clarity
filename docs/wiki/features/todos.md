---
title: Todo list
section: Features
status: Current
updated: 2026-10-02
order: 40
summary: A local place to capture and complete tasks.
---
# Todo list

Stable ID: **FEAT-todos**.

## Current specification · 1 October 2026

One task list, shared across chats. Add a task, edit its title or optional date, mark it done, uncheck to restore it, or delete it. Show unfinished tasks first; completed tasks remain below them, struck through. The user requested optional task dates and their display in Calendar on 1 October ([D115](../decisions/index.md#d115-optional-task-dates-in-calendar-1-october-2026)). This supersedes the earlier exclusion of dates; projects, priorities, reminders, recurrence, and task-management hierarchy remain outside scope.

Persist each task in the `todos` collection with `title`, `done`, nullable `date`, and the common ID/timestamps/revision. Titles are required and capped at 1,000 characters. Module operations are `list`, `add {title,date?}`, `update {id,title?,done?,date?,revision}`, and `remove {id,revision}`. Dates are actual Gregorian calendar dates in `YYYY-MM-DD`, years 0001–9999, with no time or timezone conversion. Invalid days such as 2026-02-29 fail visibly. Omit `date` on update to preserve it; use `null` or an empty string to clear it. Old records without the field are undated, requiring no migration. Revision mismatches fail visibly rather than overwrite newer changes. Direct UI actions apply immediately. Agent changes follow the [approval checklist](../foundations/chat.md#automatic-approval-checklist), with separate add, update (including date/completion), and remove choices; unchecked methods enter review. Dates do not introduce a new approval method.

### Optional date and Calendar

**Delegated lean defaults:** Add has a labelled Date (optional) picker that starts empty and resets after successful capture. Clicking an existing task opens title and date editing, with Save, Cancel, Escape and Clear date; cancelling leaves the saved task unchanged. The row shows its saved date below the title. Saving uses the revision captured when editing began.

When both Todos and Calendar are enabled, dated tasks appear in Calendar's Week task strip above the timed grid and in Month's corresponding day cell. Clicking a task opens and focuses that same Todo. Undated tasks have no Calendar entry. Date changes move the displayed task; clearing or deleting removes it there. Completed dated tasks remain visible with a checked indicator and struck-through title, matching the main list's retention rule. Calendar reads the existing `todos` records and responds to their change notifications; it does not copy them into `calendar` events. Disabling Todos hides this projection without deleting data, and dating a task does not enable Calendar automatically. See [Calendar](calendar.md#dated-tasks).

Acceptance: add through the UI and through chat approval, restart, complete/uncomplete, edit, and delete. Repeated approval must not duplicate a task. These local workflows are covered by the implementation checks.

### Usability fixes · 1 October 2026

Permanent deletion requires a named confirmation dialog with Cancel initially focused and clear destructive styling; errors stay inside that dialog. Creation and edits reject overlapping submissions. Loading and an empty task list have explicit states. Item links scroll to and focus the specific task, or show that it is unavailable. The list loads all pages rather than stopping at 2,000 records. Existing completed-task ordering remains.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Task rows use the shared compact spacing and aligned 15px native checkboxes. Pointer hover uses a background without a ring; keyboard focus on a task title marks its entire row. Editing still exposes title and optional date inline. The launcher adds tasks only after submitting an editable form through the same validated module method.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The compact view uses All, Open and Completed filters with counts. **New task** opens a labelled dialog for title and optional date, with explicit Add and Cancel; successful capture clears both fields. Rows are 36px with 2px gaps and a compact delete action visible on hover or keyboard focus. Checking a task updates immediately and animates its move to the completed group over 220ms; a failed save reloads persisted state and reports the error. Item links reset the filter so the requested task can be found. Reduced motion makes reordering immediate.

### Adversarial fixes · 2 October 2026

Existing-record updates and removals reject missing/malformed revisions before changing storage; stale revisions retain the existing conflict failure (QA07). Direct UI, reviewed and automatic agent actions share that boundary. Global navigation shortcuts keep New task visible and modal until it is closed, preserving its draft (QA02); [shared keyboard behavior](../foundations/desktop-stack.md#adversarial-fixes-2-october-2026) owns the shell rule. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-services.mjs` for direct/queued/automatic missing, malformed and stale revisions, followed by a current-revision success. Inspect persisted records after rejection. Run `tests/adversarial-renderer.mjs` for real New task, ⌘L/history shortcuts, Cancel and restored navigation. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Todos → enter a task; Delete → Cancel/confirm. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Check deletion leaves the record present until confirmed, exact-item focus, empty state, and the unchanged completed-task behavior. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

**Task-date recipe:** build, then run `node --test tests/task-dates.mjs`. Through real Todo controls, add with and without a date, double-click Add/Save, cancel a date edit, change date, complete/uncomplete, clear and delete. Follow the task from both Calendar views back to its row and restart the isolated app before checking its saved date/completion. Verify the chosen day in an America/Los_Angeles renderer, the minimum window in light/dark themes, live task notifications, and the disabled-Todos boundary. Check the underlying record and unchanged event collection. Module checks also cover leap days, malformed/impossible dates, legacy records, omitted/null/empty values, stale revisions, pending and automatic approvals, duplicate approval rejection and backend restart. `CLARITY_TASK_DATE_EVIDENCE` optionally selects an external evidence directory; the default is the external build cache's `task-dates-evidence/`.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: optional task dates](../verification/runs/2026-10-01T035738Z-task-dates.md) — date lifecycle, Calendar projection and persistence against a recorded build.
- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Stated intent

One simple task list with the ability to mark items done. Tasks live in the personal folder. See [D34](../decisions/index.md#d34-simple-task-list-25-september-2026).

### Scope

Keep capture and completion as the core interaction. The previously accepted chat capability to add and edit tasks remains in place. Multiple named lists, priorities, due dates, reminders, recurring tasks, and project organization are outside the current minimal scope.

### Details for later

**Accepted (D82):** show completed tasks below unfinished tasks, struck through. Uncheck to restore. No separate archive.

- The storage representation remains undecided and should follow the simple behavior above.

### Reference notes

No specific task app was named.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
