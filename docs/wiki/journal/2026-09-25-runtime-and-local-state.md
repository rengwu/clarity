---
title: 25 September 2026 — Harnesses and local state
section: Journal
status: Captured
updated: 2026-09-25
order: 160
summary: Resolve action modes, context access, harness setup, platform priority, and current sync scope.
---
# 25 September 2026 — Harnesses and local state

## User decisions

- Two modes: confirm all actions inside chat with Proceed / Cancel, or execute without confirmation in auto mode.
- All conversations can access enabled modules; keep context access simple.
- Follow Synara's installed-harness detection and connection approach, with Codex, Claude, Kimi, and Pi as examples. Include a model/effort picker like the supplied screenshot. No local models for now.
- macOS first; keep a Linux route open.
- No device sync for now. Keep application state local. Explore CRDTs and local-first technologies instead of committing to the earlier all-files and external-folder-sync approach.

Recorded as [D20–D24](../decisions/index.md#d20-two-action-modes-25-september-2026). D24 supersedes D04's current synced-folder requirement; the local ownership and two-root requirements remain.

## Research and changes

Reviewed the supplied picker screenshot and Synara's local provider documentation and model descriptors. Created [harness connections](../foundations/harnesses.md) with accepted requirements, observed controls, and unverified integration details.

Read LoFi, Ink & Switch, and official Automerge, Jazz, Electric, and WatermelonDB sources. Created [local-first storage exploration](../foundations/local-first.md), distinguishing source findings from assistant assessments. Updated current product, folder, portability, chat, integration, automation, and question pages to avoid retaining superseded sync promises. Earlier journals remain unchanged.

## Still open

Whether ordinary editable files remain essential, which local store to use, how to back up/restore it, the default and scope of action modes, harness protocols and switching, and first-release module depth. Research has not selected a framework or authorized implementation.
