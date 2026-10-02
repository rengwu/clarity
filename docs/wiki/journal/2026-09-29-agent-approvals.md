---
title: 29 September 2026 — Agent action approvals
section: Journal
status: Current
updated: 2026-09-29
order: 2026092908
summary: Per-action automatic approvals in Settings with an indeterminate Select all.
---
# 29 September 2026 — Agent action approvals

The user requested a Settings checklist for skipping approval on selected agent actions, with music playback as the example, a complete action map, and a Select all checkbox that represents partial selection. [D109](../decisions/index.md#d109-agent-action-approval-checklist-29-september-2026) records the requirement; [Chat](../foundations/chat.md#automatic-approval-checklist) owns the full 37-action map and behavior.

The implementation reuses the existing approval executor and action records. Selected methods start in applying and return their actual result; unselected methods remain pending until review. Success and failure remain visible. Settings stores exact IDs, initially none, shared across chats and automations. All supported actions are listed even when their module is disabled. New methods start unchecked, and changing selection never executes older pending work. File/version, enabled-module, connection, and browser-origin checks remain in force.

Optional questions raised the scope across chats/automations and whether browser approvals belong in Select all. In the absence of a different preference, the implementation follows the stated shared-list default and includes both browser actions, initially unchecked. Website authorization and consequential batches are separate choices; allowing a batch never grants an origin by itself. Revocation remains available, but automatic website authorization can grant that site again on a later agent request. Settings explains that interaction. Scheduled wiki-topic preauthorization and opt-in board use remain unchanged.

The agent sees fresh action settings with every model request and is instructed to use the tool without an extra confirmation for selected actions. Reads were already ungated, so they do not get misleading checkboxes. Move/rename and folder operations already implemented for Notes/Wiki are now included in the advertised agent catalog and checklist. No dependencies or separate policy engine are added.

Validation covers exact catalog coverage, immediate execution, unrelated pending work, invalid settings, saved choices, revocation, disabled modules, stale files, success/failure records, browser permission separation, and configured automation writes. Electron checks exercise individual selection, empty/mixed/all selection, keyboard toggling, persistence across restart, and the existing location/website controls. A live Codex conversation executes a selected todo action, then queues a later one after deselection in the same thread. Application/Worker type checks and a packaged-app checklist smoke check pass. Music dispatch uses a controlled player in these checks; no new live audio claim is made.
