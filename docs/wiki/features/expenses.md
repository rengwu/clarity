---
title: Expenses
section: Features
status: Current
updated: 2026-10-02
order: 20
summary: Expensif-style daily expenses and quick entry, with a deliberately small scope.
---
# Expenses

Stable ID: **FEAT-expenses**.

## Current specification · 1 October 2026

Preserve Expensif's daily list and Amount/Category/Description entry experience in a smaller module. The screenshots and inspected `expensif` source establish the input behavior, not permission to add its whole feature set.

### Screens

The daily view groups recent days, including empty days, with individual amounts and a daily total. New expense opens the entry form; a day's add control preselects that date. The current default shows 30 days, with Show earlier extending by 30. Click an entry to edit or delete it using the same form.

Entry order is Amount, Category, Description, Date. Amount autofocuses and uses the digit-buffer minor-unit input: typing `12370` produces `123.70`. Category is free text with suggestions from previous entries, filtered as the user types (up to eight). Description is free text with suggestions associated with the chosen category (up to six). Date defaults to today unless chosen from a daily row. Provide Cancel, Create, and Create & add another; the latter clears entry fields for another expense. No Paid By or per-expense Currency field is required.

### Data and checks

Store `amountCents` as positive integer minor units with two displayed decimals, plus `category`, `description`, and `date` as `YYYY-MM-DD` in `expenses`. Current upper bound is 99,999,999,999 minor units. Settings may supply one optional display currency symbol; it is not conversion or multi-currency accounting. These precision, paging, and edit/delete details are defaults under D102/D103.

Expose `list`, `add`, `update`, and `remove`, with revisions for existing records. Agents use the same fields, with separate add/update/remove options in the [approval checklist](../foundations/chat.md#automatic-approval-checklist); unchecked methods require review. Validate digit entry, category/description suggestions, selected-day creation, totals, corrections, and persistence. Do not add budgets, reports, receipt processing, or banking integrations.

### Usability fixes · 1 October 2026

Unfinished expense fields and the edited record's revision persist in the selected data folder's Electron profile. Return to the form after module navigation, reload, or restart; Cancel explicitly discards it. Saving uses the captured revision, so stale edits fail visibly. A link to another expense reveals its daily row and offers Resume expense draft without overwriting pending input; other entry/edit controls remain disabled until that draft is resumed and saved or cancelled.

Fetch every local list page before presenting daily totals. All stored dates with entries are included; Show earlier days adds empty daily rows in 30-day increments. Loading and failures remain visible. Creation is guarded against repeated submissions; deletion requires confirmation. Regression: 2,001 same-day expenses of 1.00 must total 2,001.00.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Day headings and tabular amounts share a right edge with row amounts; entries have a 44px minimum height and compact gaps. The existing daily history, digit-buffer entry form and draft persistence remain. The omni-input expense form is a separate explicit quick-entry form using decimal major units, converted to integer minor units by the same validated service.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

Use 44px expense entries with a small icon, description/category stack and tabular amount aligned to the same right edge as the daily total. A compact plus control in each date header opens the date-prefilled form; it no longer consumes its own list row. Empty days remain visible as compact date headers, preserving the 30-day range. Hover/focus uses the shared background and separator rules.

### Adversarial fixes · 2 October 2026

Expense additions and updates require a genuine Gregorian day in `YYYY-MM-DD`, years 0001–9999, including correct century leap rules (QA08). Impossible or malformed values fail before persistence. Existing-record updates and removals require a positive safe-integer revision, retaining stale-edit conflicts (QA07). Older invalid records are not rewritten automatically. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-services.mjs` with February 30, month 13/day 40, zero values and invalid leap days; verify rejected additions/edits leave records unchanged and valid leap dates persist across Store restart. Include missing/malformed/stale revision controls. Keep the native daily grouping, totals and retained-form checks in `tests/usability.mjs`. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Expenses → New expense → edit fields → leave/return/reload. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Seed 2,001 entries of 1.00 and verify 2,001.00 from UI and records; preserve unfinished input and explicitly Cancel. Test item links without discarding an active draft when extending coverage. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Accepted scope

A LEAN version of Expensif, limited to its daily view and new-expense page. Preserve the input method and UX for Amount, Category, and Description. Currency and Paid By are not important and are omitted from the initial form. Expenses remain personal state. See [D33](../decisions/index.md#d33-lean-expensif-daily-view-and-entry-25-september-2026).

The calendar tab in the reference screenshot is not part of the expense module's requested scope. Clarity's separate calendar module is unaffected. Reports, budgeting, recurring expenses, payer management, and multi-currency workflows are not part of these two screens.

### Daily view

Follow the supplied screenshot: dates down the left, each day's expense descriptions and categories in the middle with amounts aligned right, and a daily total in a separate right column. Show the current day and empty days. Include a top-level **New Expense** action and a per-day **+** entry action.

The source's per-day add action opens the new-expense form with that date selected. Preserve this simple flow. Do not import the source's separate expense-calendar screen or its additional navigation. Exact history range and loading behavior remain open.

### New expense

Keep Amount, Category, Description, and Date, with the reference's Cancel, Create, and Create & add another actions. Date supports recording expenses for a selected day. Currency and Paid By selectors are left out; a display unit or fixed currency default has not been selected.

| Input | Expensif behavior to preserve |
| --- | --- |
| Amount | Focus on entry; numeric input formatted as a running digit buffer. For two decimal places, typing 1, 2, 3, 7, 0 produces 0.01, 0.12, 1.23, 12.37, 123.70. No manual decimal typing is needed. |
| Category | Free-text input plus clickable suggestions from previously used categories. Typing filters suggestions case-insensitively; choosing one fills the input. New category text is allowed. |
| Description | Free-text input plus clickable previous descriptions for the selected category. Suggestions update when the category changes and are filtered by description text. Selecting one fills the field; new text is allowed. |

Amount, Category, and Description are required in the inspected reference form. Its suggestion rows are horizontally scrollable when needed and display an empty state when there are no suggestions. Preserve the entry behavior, without depending on Expensif's server or copying its UI implementation stack.

### Reference evidence

User supplied daily-view and new-expense screenshots on 25 September 2026 and named `~/Projects/expensif`. That path was absent; the existing reference was found at `~/Desktop/Projects/expensif`.

Inspected `templates/form.html`, `templates/add.html`, `templates/daily.html`, `templates/partials/day-rows.html`, `templates/partials/day-entry.html`, `ui/src/components/CategoryPills.tsx`, `DescriptionPills.tsx`, `PillSelect.tsx`, and `ui/src/lib/useDebouncedInputValue.ts`.

These files establish the digit-buffer amount input, category filtering, category-dependent description suggestions, and day-specific entry links. The current source also contains extra behaviors such as editing links and future/calendar navigation; those are reference observations, not automatic additions to Clarity. The app was not run, installed, or modified.

### Remaining details

- How should users correct or delete an expense while retaining a two-screen design?
- What default amount precision and display unit should replace per-expense currency selection?
- How much daily history is shown initially?

**Assistant assessment:** these two screens and history-based suggestions can stay small. Keep advanced budgeting, conversion, and payer features out of the initial design. No framework or storage engine is selected.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
