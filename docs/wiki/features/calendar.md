---
title: Calendar
section: Features
status: Current
updated: 2026-10-02
order: 10
summary: macOS-style week and month views, with seamless month scrolling.
---
# Calendar

Stable ID: **FEAT-calendar**.

## Current specification · 1 October 2026

Two views only: **Week** and **Month**, following macOS Calendar with Notion Calendar as an additional reference. Week shows seven day columns and timed events. Month scrolls continuously through weeks without repeating dates at month boundaries. Provide Today and previous/next navigation and an Event action. This does not authorize importing the reference app's other features.

An event needs only a title, start date/time, and end date/time (D36). Double-click a time/day or use Event to create one; click an event to edit it. The small form also deletes an existing event. No recurrence, attendees, alerts, travel time, calendar-provider connection, or reminder module is included.

Persist records in `calendar` with `title`, `start`, `end`, ID/timestamps/revision. Start/end must be valid date-time values and end must follow start. Module methods are `list`, `add`, `update`, and `remove`; edits/deletion require the record revision. Chat calls these actions through the same module, running checked add/update/remove methods immediately and queuing the others under the [approval checklist](../foundations/chat.md#automatic-approval-checklist). Display uses the device's local time; time context supplied to the agent includes its IANA timezone.

Acceptance: create/edit/delete an event, switch views, navigate to Today, and scroll through month boundaries without duplicate days. Verify time conversion around timezone/date boundaries. Do not claim full international calendar, recurring-event, or invitation support from the lean implementation.

### Dated tasks

The user's [optional task-date requirement](../decisions/index.md#d115-optional-task-dates-in-calendar-1-october-2026) adds a display of dated Todos to the existing two views. With Todos enabled, Week has a Tasks strip above the timed grid, with seven matching day columns; the strip scrolls when crowded. Month includes dated tasks in their day cells alongside events. Tasks have a checkbox indicator and completed tasks retain a struck-through title. Unfinished tasks precede completed ones within each date, ordered by creation time. Long titles truncate with their full title available on hover and in the accessible button name.

Clicking a task navigates to and focuses its row in Todos, where the title, date and completion can be changed. The task's date is a calendar-day string, never converted from UTC; it keeps the selected day across device timezones. Date edits, completion, clearing and deletion read back from the shared Todo record, including notifications from another chat/automation. Undated tasks are absent. Disabling Todos hides the task display and skips its read; Calendar remains independently optional.

These are delegated presentation defaults, not extra event fields. `calendar.list` and event add/update/remove continue to operate on events only. The renderer separately loads all Todos pages, groups dated records by day, and shows loading or a task-specific read error. No duplicated event record, new collection, reminder, time picker, drag scheduling, or new approval action is introduced. [Todos](todos.md#optional-date-and-calendar) owns task storage and editing.

### Usability fixes · 1 October 2026

The toolbar Event action uses the visible date in Month and the current date in Week; changing Month → Week follows the visible month instead of an older selection. A calendar item link selects its week and scrolls to the event. Load all local record pages so an old-created future event remains visible beyond 2,000 newer records. Show loading/failure state while fetching.

Save has an immediate single-submission guard and progress/disabled state. Permanent event deletion requires confirmation. Acceptance: scroll two months forward, create from the toolbar, verify the form's period, double-click Save, and find exactly one new event in that period. Seed an old-created visible event plus 2,000 newer old-date events and verify the visible appointment remains.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Week view uses 44px per hour across the full scrollable 24-hour grid. Double-click coordinates use the same scale and 30-minute rounding. The existing event editor, seamless month view, task dates and calendar service remain. Launcher events use editable local start/end fields and require Add event.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The compact Week header separates weekday labels from 24px date markers; today has a filled circular marker. Previous/next and Event controls use the shared SVG geometry. The timed grid retains 44px per hour and its existing date/time mapping; compact styling does not change event or dated-task data.

### Adversarial fixes · 2 October 2026

Calendar validates the original Gregorian date and clock components before parsing (QA08): years 0001–9999, real month/day including century leap rules, hour 00–23, minute/second 00–59. Inputs use ISO date-time syntax with `T`, hour/minute, optional seconds/fraction and optional `Z` or colon-separated numeric offset. Valid local and offset values remain supported; date-only values, February 30 and 24:00 rollover are rejected. End must still follow start. Updates/removals require a positive safe-integer revision (QA07). Existing invalid records are not migrated. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-services.mjs`: reject impossible dates, invalid clock components and stale/missing revisions without changing records; accept leap-day, local, UTC, offset and day-crossing controls. Keep `tests/task-dates.mjs` and existing native Week/Month create/edit/navigation checks. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Calendar → Month → scroll → + Event → Save → Week. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Seed an old-created visible appointment plus 2,000 newer old-date records; check complete display, visible-period creation and single-record double-click Save. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

**Task projection recipe:** `node --test tests/task-dates.mjs` follows the [Todo date lifecycle](todos.md#verification-recipe-and-coverage) in real Electron controls. Assert Week and Month contain the same dated record under the chosen date, undated records stay absent, clicking opens its Todo, and changing/clearing/deleting updates the display. Retain the event collection unchanged, check completion and restart, live change notifications and disabling/re-enabling Todos. Inspect light/dark evidence at normal and 850 × 600 sizes; use America/Los_Angeles to catch accidental UTC date conversion.

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

Local calendar events in the personal folder. Keep the module lean, using macOS Calendar as the main visual/interaction reference and Notion Calendar as an additional reference.

### Views

**Accepted from the user ([D35](../decisions/index.md#d35-week-and-month-calendar-25-september-2026)):** switch between exactly two views:

- **Week:** like macOS Calendar, with day columns and a vertical time grid containing event blocks.
- **Month:** like macOS Calendar, with a month grid and seamless scrolling across month boundaries. Continuous month scrolling is required; discrete previous/next month navigation alone does not satisfy it.

The earlier agenda proposal is replaced by these selected views. Event creation through chat remains accepted under D17.

### Event fields

**Accepted from the user ([D36](../decisions/index.md#d36-minimal-calendar-event-fields-25-september-2026)):** title, start date and time, and end date and time are sufficient for initial event creation.

The supplied screenshots show an event popover anchored to the selected event. The exact form presentation and direct grid interactions remain open; the screenshots' extra controls are not automatically requirements.

### Lean scope rule

Resist adding features; ask whether each is necessary. Consult the user when in doubt. Match the requested two views and scrolling experience without importing the reference apps' entire feature sets. No extra views or advanced event-management features are selected by resemblance alone. If seamless scrolling or event interactions require unexpected complexity, raise the tradeoff before adopting an implementation.

### Open questions

- How should users create, edit, and remove events directly in the grid?

### Reference notes

The user supplied macOS Calendar week and month screenshots on 25 September 2026. They show the week time grid, a month date grid, event blocks/bars, today highlighting, and event popovers. Seamless month scrolling is an explicit user requirement; a static screenshot alone does not verify scroll behavior.

The images also contain extra views and event controls, including reminders, repeat, travel time, invitees, and provider selection. These are reference observations, not accepted Clarity scope. Notion Calendar remains an additional named reference; its implementation has not been inspected. No calendar library or app framework has been selected.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
