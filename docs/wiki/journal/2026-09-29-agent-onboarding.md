---
title: 29 September 2026 — Wiki-led agent onboarding
section: Journal
status: Recorded
updated: 2026-09-29
order: 2026092906
summary: Shorten AGENTS.md and make the wiki the detailed onboarding and working resource.
---
# 29 September 2026 — Wiki-led agent onboarding

The user found AGENTS.md too long and asked that its bulk move to the wiki, without maintaining the same information in both places. They explicitly want freshly onboarded agents to reach for the wiki. [D107](../decisions/index.md#d107-wiki-led-agent-onboarding-29-september-2026) records this documentation decision; product scope and implementation authorization stay unchanged.

Most product rules already had current specifications. The migration checked those pages for coverage of architecture, lifecycle, data ownership, chat, location, approvals, browsing, attachments, Notes, Todos, Wiki, Automations, and the agent board. Existing pages remain their owners. Small clarifications preserve the explicit 20× subscription, maintained-module boundary, browser performance target and comparison limits, and instruction to document approval mismatches before proposing another framework.

[Working principles](../vision/principles.md) now consolidates detailed authorization, lean scope, readable code, learning, question-round, wiki-maintenance, and tooling rules that were scattered through AGENTS.md. The [wiki home](../index.md#agent-onboarding) requires reading those rules, current follow-up, relevant topic specifications, and the latest journal before acting. It distinguishes a focused task's reading from the complete rebuild path. AGENTS.md retains the entry point and immediate tooling/completion guardrails, with links for the details. README.md and IMPLEMENTATION.md point to the same workflow.

Earlier discussion and journal entries remain historical evidence. This is a documentation migration, not new app behavior or fresh evidence for existing validation claims. Existing workspace and application changes are preserved.

Validation: AGENTS.md shrank from 1,901 to 193 words. The wiki build/check passed for all 100 pages and their internal links, with the generated reader current. The documentation diff passed whitespace checks, and no prohibited dependency files were found. App tests were not rerun because this work changes only documentation.
