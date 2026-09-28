---
title: Portability and sync
section: Foundations
status: Exploring
updated: 2026-09-27
order: 20
summary: Local backend and actual notes/wiki files; directories, other state, and backups remain open.
---
# Portability and sync

## Current direction

The backend runs locally under [D56](../decisions/index.md#d56-local-backend-27-september-2026). Notes/wiki are actual Markdown files under [D57](../decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026), viewable in Clarity, with notes editable in-app. These are authoritative content, not export-only copies.

All durable app state belongs under one chosen Clarity root (D64), including board and automation state. The second development root is dropped. Internal layout and non-Markdown representation remain open; no device sync is requested.

Blueprint export shares module code and connection requirements, not user data/chat history/credentials. Backup and restoration of the local app state are separate concerns. See [upstream documentation](https://github.com/cloudflare/cloudflare-os/blob/main/docs/blueprints.md).

## Questions relevant now

- Must every datum be directly editable as an ordinary file, or is a locally owned database with export acceptable?
- How should backup, restore, and manual relocation of local state work?
- Where do credentials, caches, chat histories, and machine-specific runtime state belong?
- How should Electron and the local runtime be packaged for a later Linux version?

## Future questions — deferred

If device sync returns to scope, revisit concurrent edits, incomplete transfers, version migrations, account reconnection, external repository paths, and duplicate automation execution. A future test might move or synchronize data between machines and inspect restored state, but that is not an acceptance criterion for the current phase.

A restored trace is distinct from a running terminal process. CRDT convergence is distinct from correct business behavior. Both are design considerations for later work, not reasons to add sync now.

See [two folders](folders.md) and the [discussion queue](../discussions/open-questions.md).

## Folder simplification proposal · 27 September 2026

**Single-root direction accepted under [D64](../decisions/index.md#d64-one-clarity-data-folder-27-september-2026).** All Clarity app state belongs in one chosen folder, with actual notes/wiki Markdown. The second development root is removed. Exact internal layout, non-Markdown storage, credential handling, and consistent backup mechanics still need implementation review. Do not silently add another authoritative data root.

Platform-managed state for non-Markdown records remains the lean implementation proposal. Ordinary editable files for every record have not been required.
