---
title: 25 September 2026 — Lean defaults and thread permission
section: Journal
status: Captured
updated: 2026-09-25
order: 200
summary: Persist wiki permission for the whole chat and require intentionally simple implementations.
---
# 25 September 2026 — Lean defaults and thread permission

## User direction

Wiki maintenance permission lasts for the entirety of the particular saved chat, including reopening it tomorrow; a context window is not the permission boundary.

Keep everything LEAN by default, with intentionally simple implementations for all features. Raise any feature that cannot be kept simple, plus hard questions, concerns, and potentially complex implementations, with the user.

## Changes

Recorded [D29](../decisions/index.md#d29-wiki-permission-lasts-for-the-chat-thread-25-september-2026) and [D30](../decisions/index.md#d30-lean-by-default-25-september-2026). Added the lean rule to project `AGENTS.md` and working principles. Clarified the permission lifetime on current wiki/chat pages and resolved the lifetime part of Q24. Preserved earlier journals and D27's initial scope.

## Concerns to keep visible

Different harness approval/tool interfaces, closed-app scheduling, and overlapping wiki edits could require complexity. Evaluate simple behavior and surface tradeoffs before adopting additional machinery. Earlier proposals for history, undo, catch-up, and retry handling are considerations, not blanket approval to build complex supporting systems.

## Still open

Revocation UI, recurring automation authorization and execution behavior, and the notes/wiki screens. No implementation stack or reduced feature scope was selected; application implementation has not begun.
