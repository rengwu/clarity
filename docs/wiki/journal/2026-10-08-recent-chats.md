---
title: 8 October 2026 — Recent chats require a sent turn
section: Journal
status: Implemented
updated: 2026-10-08
order: 2026100801
summary: Empty chat records stay out of Recent chats while drafts and sent turns retain persistence.
---
# 8 October 2026 — Recent chats require a sent turn

The user reported a sidebar filled with New chat entries after repeatedly opening unused conversations. [D131](../decisions/index.md#d131-recent-chats-require-a-sent-turn-8-october-2026) establishes that a chat must have a sent turn before appearing in Recent chats. The [Chat specification](../foundations/chat.md#recent-chats-require-a-sent-turn-8-october-2026) owns the accepted behavior and delegated timing.

The main-process list now requires a persisted user message. This hides both existing and newly created empty records without deleting their drafts or changing the current draft storage lifecycle. First text and attachment-only sends become visible before the response finishes; preparation failures stay hidden, and response failures retain the sent conversation.

The [focused run](../verification/runs/2026-10-08T074400Z-recent-chats.md) records nine passing development Electron regressions, application/Worker typechecks and unchanged source fingerprints. Existing navigation fixtures now include an earlier user turn because an empty record no longer represents a recent conversation. Model prompts use controlled fixture behavior; live Codex and packaged execution were not retested. The development output is rebuilt; the installed application is unchanged.
