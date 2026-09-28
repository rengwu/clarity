---
title: 25 September 2026 — Wiki maintenance triggers
section: Journal
status: Captured
updated: 2026-09-25
order: 190
summary: Authorize autonomous wiki edits per research session and schedule updates from new app state.
---
# 25 September 2026 — Wiki maintenance triggers

## User direction

Ideally, update a topic's wiki automatically during research in chat. Before entering allowed-to-edit mode, ask an in-chat Yes / No question about updating that wiki for the session. After Yes, maintain it autonomously for the entirety of the session.

The Automations page should also let users schedule updates to a selected wiki. Explore only new app state and update when new relevant information is found. The user asked about implementation difficulty and concerns.

## Decisions and changes

Recorded [D27](../decisions/index.md#d27-session-authorized-wiki-maintenance-25-september-2026) and [D28](../decisions/index.md#d28-scheduled-wiki-updates-from-new-app-state-25-september-2026). Marked D20 partially superseded for covered wiki edits after a session grant. Updated wiki, automation, chat, overview, and question pages; resolved Q22's trigger choice.

## Assistant assessment

The interaction and scheduling flows are feasible. Reliability needs per-wiki progress tracking, relevant-source evaluation, retry handling, exclusion of self-generated output, and coordination of overlapping edits. Proposed source references, visible revision history/undo, and coalesced catch-up of unprocessed changes. These are design proposals, not selected implementation details.

Read Apple's archived timed-job documentation, linked from [automations](../features/automations.md), to ground the sleep/shutdown caveat. No scheduler was chosen or installed. Fresh information means information newly available in app state; this does not establish independent web research on every run.

## Still open

Session boundaries and revocation, supporting actions covered by the grant, recurring authorization, what counts as new state, first-run baseline, and behavior while the app or harness is unavailable. No application code or live automation was created.
