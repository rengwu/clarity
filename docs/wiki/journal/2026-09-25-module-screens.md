---
title: 25 September 2026 — Wiki, notes, and expense screens
section: Journal
status: Captured
updated: 2026-09-25
order: 210
summary: Define three module screens while preserving lean scope and coherent topic pages.
---
# 25 September 2026 — Wiki, notes, and expense screens

## User direction

- One knowledge base organized by topic. Keep a topic, idea, feature, function, or event together; split only when necessary and warranted by meaningful differences.
- Wiki is one webview targeting local `index.html`, browsed like the planning reader. Ask AI for changes; no direct editing for now.
- Notes follow the supplied folder-tree and tabbed rich-text Markdown editor screenshot. New note sits above the file list and creates a file in the active folder.
- Expenses follow the supplied Expensif daily and new-expense screenshots. Preserve Amount, Category, and Description input methods and UX. Currency and Paid By are not important.

## Changes and reference review

Recorded [D31–D33](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026) and updated the existing module pages rather than creating separate pages for their subfeatures. Resolved basic screen choices in Q23 and Expensif reference choice Q14. Clarified that earlier topic-wiki grants and scheduled targets refer to content in one knowledge base.

The latest named path `~/Projects/expensif` was absent. Inspected the existing copy at `~/Desktop/Projects/expensif`: form/add/daily templates, day partials, category and description suggestion components, and input-filter behavior. Confirmed the digit-buffer amount input, category suggestions, descriptions filtered by category, and date-specific add links. Used the screenshots as visual references. No reference app was run or modified.

## Concerns and remaining details

Rich-text Markdown fidelity can become complex if arbitrary formatting or extensions are promised; define a small necessary feature set before choosing an editor. Notes naming, expense correction/deletion, default amount display, and reader refresh behavior remain to refine. Expense editing links and other extra features in Expensif's current source were not silently imported into Clarity's scope.

No application code was built. The next suggested modules are todos and calendar; this is a discussion proposal, not a release-order decision.
