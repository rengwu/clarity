---
title: Expenses
section: Features
status: Exploring
updated: 2026-09-25
order: 20
summary: Expensif-style daily expenses and quick entry, with a deliberately small scope.
---
# Expenses

## Accepted scope

A LEAN version of Expensif, limited to its daily view and new-expense page. Preserve the input method and UX for Amount, Category, and Description. Currency and Paid By are not important and are omitted from the initial form. Expenses remain personal state. See [D33](../decisions/index.md#d33-lean-expensif-daily-view-and-entry-25-september-2026).

The calendar tab in the reference screenshot is not part of the expense module's requested scope. Clarity's separate calendar module is unaffected. Reports, budgeting, recurring expenses, payer management, and multi-currency workflows are not part of these two screens.

## Daily view

Follow the supplied screenshot: dates down the left, each day's expense descriptions and categories in the middle with amounts aligned right, and a daily total in a separate right column. Show the current day and empty days. Include a top-level **New Expense** action and a per-day **+** entry action.

The source's per-day add action opens the new-expense form with that date selected. Preserve this simple flow. Do not import the source's separate expense-calendar screen or its additional navigation. Exact history range and loading behavior remain open.

## New expense

Keep Amount, Category, Description, and Date, with the reference's Cancel, Create, and Create & add another actions. Date supports recording expenses for a selected day. Currency and Paid By selectors are left out; a display unit or fixed currency default has not been selected.

| Input | Expensif behavior to preserve |
| --- | --- |
| Amount | Focus on entry; numeric input formatted as a running digit buffer. For two decimal places, typing 1, 2, 3, 7, 0 produces 0.01, 0.12, 1.23, 12.37, 123.70. No manual decimal typing is needed. |
| Category | Free-text input plus clickable suggestions from previously used categories. Typing filters suggestions case-insensitively; choosing one fills the input. New category text is allowed. |
| Description | Free-text input plus clickable previous descriptions for the selected category. Suggestions update when the category changes and are filtered by description text. Selecting one fills the field; new text is allowed. |

Amount, Category, and Description are required in the inspected reference form. Its suggestion rows are horizontally scrollable when needed and display an empty state when there are no suggestions. Preserve the entry behavior, without depending on Expensif's server or copying its UI implementation stack.

## Reference evidence

User supplied daily-view and new-expense screenshots on 25 September 2026 and named `~/Projects/expensif`. That path was absent; the existing reference was found at `~/Desktop/Projects/expensif`.

Inspected `templates/form.html`, `templates/add.html`, `templates/daily.html`, `templates/partials/day-rows.html`, `templates/partials/day-entry.html`, `ui/src/components/CategoryPills.tsx`, `DescriptionPills.tsx`, `PillSelect.tsx`, and `ui/src/lib/useDebouncedInputValue.ts`.

These files establish the digit-buffer amount input, category filtering, category-dependent description suggestions, and day-specific entry links. The current source also contains extra behaviors such as editing links and future/calendar navigation; those are reference observations, not automatic additions to Clarity. The app was not run, installed, or modified.

## Remaining details

- How should users correct or delete an expense while retaining a two-screen design?
- What default amount precision and display unit should replace per-expense currency selection?
- How much daily history is shown initially?

**Assistant assessment:** these two screens and history-based suggestions can stay small. Keep advanced budgeting, conversion, and payer features out of the initial design. No framework or storage engine is selected.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
