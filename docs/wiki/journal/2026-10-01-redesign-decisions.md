---
title: 1 October 2026 — Redesign adoption decisions settled
section: Journal
status: Current
updated: 2026-10-01
order: 2026100111
summary: Preserve current automation inputs and require explicit provider searches, closing the requested design interview.
---
# 1 October 2026 — Redesign adoption decisions settled

The user answered “11. agree” and “12. A” to the last two consequential choices in the requested jstack interview.

Q11 accepts keeping the current automatic automation inputs for the first production port: Notes, chats, Todos, Calendar, Expenses, News and Bookmarks, under existing enablement and incremental relevance rules. The port omits the spike's per-automation source checklist. This resolves the earlier Q2 “no opinion yet” without extending automatic collection or changing scheduled Wiki write approvals. [D122](../decisions/index.md#d122-preserve-automation-inputs-for-the-first-redesign-port-1-october-2026) and the [Automations contract](../features/automations.md#redesign-adoption-scope-accepted) record the decision.

Q12A accepts local omni-search results first, with explicit Search Mail/Search Music actions for connected-provider queries. Typing does not automatically query those providers. The optional automatic command-interpretation setting remains a separate choice and only proposes editable fields. [D119](../decisions/index.md#d119-omni-input-and-search-direction-1-october-2026) and the [omni-input contract](../foundations/desktop-stack.md#redesign-omni-input-and-search) own this behavior and its planned request/error/cancellation checks.

The scoped product interview is complete. The accepted first port includes the compact shared design, one general chat mode with model/effort controls, editable command forms, section-based Settings, resizable source preview with explicit module opening, and navigation history that restores the user's place. Existing data, rich Notes, module services, action approvals and native lifecycle remain required. Reference-only embellishments and broader automation scope are not required additions.

This update records decisions and verification expectations; it does not implement the production redesign or claim new runtime coverage. The next work is the production port and build-specific regression verification. Earlier browser evidence remains tied to its external spike builds. The [current follow-up](../discussions/open-questions.md#cursor-redesign-adoption-interview) now separates delivery work from the completed preference interview.
