---
title: Local-first storage exploration
section: Foundations
status: Exploring
updated: 2026-09-27
order: 25
summary: Compare local storage approaches while keeping device sync out of current scope.
---
# Local-first storage exploration

**27 September status:** this is background research from the earlier local-first exploration. The Cloudflare OS/Electron direction reopens D24; we are not currently choosing a greenfield CRDT/database stack. First resolve backend location and notes/wiki file ownership in the [architecture reassessment](desktop-stack.md#current-direction-27-september-2026).

**Current status:** local backend and actual notes/wiki files are confirmed. This page preserves earlier local-first research; no new CRDT stack or device-sync system is selected. Adapt Cloudflare OS locally and resolve remaining state/backup details without reopening the settled file requirement.

Clarity is a fully local app with application state saved locally. No device sync is required for now. The user wants to explore local-first technologies, including CRDTs, ElectricSQL, WatermelonDB, Jazz, and Automerge. No technology has been selected. See [D24](../decisions/index.md#d24-local-state-with-sync-deferred-25-september-2026).

The original Obsidian-like idea was to represent all state as local files and let Google Drive or Dropbox move them between devices. That is historical motivation, not a required sync mechanism for the current scope. Whether ordinary editable files remain essential is still open.

**Planning order ([D25](../decisions/index.md#d25-define-modules-before-choosing-technology-25-september-2026)):** define what the modules look like and do before choosing technology. The tools named here are examples, not an exhaustive list or a closed shortlist. Research other approaches when the module requirements provide useful evaluation criteria.

## Research observations · 25 September 2026

[LoFi](https://lofi.so/) is a community and resource directory for local-first software, useful for discovery rather than a storage engine. [Ink & Switch's essay](https://www.inkandswitch.com/essay/local-first/) emphasizes local ownership, working without a network, longevity, and eventual collaboration. Those goals do not require every record to be a plain-text file.

| Candidate | What the official source describes | Implication for Clarity — assistant assessment |
| --- | --- | --- |
| [Automerge](https://automerge.org/docs/hello/) | CRDT data structures; local edits and persistence, merging concurrent changes, history, and network-independent operation. | A candidate for mergeable documents and future sync without choosing a hosted backend now. We would still design indexing, files, and module rules. |
| [Jazz](https://jazz.tools/docs) | Current docs describe a local-first relational database with local replicas, permissions, offline use, and background server sync. Separate [classic docs](https://classic.jazz.tools/docs/react) describe CoValues, sync, history, and encryption. | Evaluate a specific generation/version and its no-sync configuration before judging fit; do not combine current and classic capabilities into one promise. |
| [Electric](https://electric.ax/docs/sync/) | A Postgres read-path sync engine that sends selected data to local clients; writes use separate application paths. | Primarily relevant if a Postgres-backed sync service becomes desirable. Its sync engine is not a standalone local storage choice for the current app. |
| [WatermelonDB](https://watermelondb.dev/docs/Sync/Intro) | A local database with optional sync primitives and an adapter; adding sync requires a backend supplied by the application. Its [overview](https://watermelondb.dev/docs) emphasizes reactive data and React/React Native use. | A local database candidate whose desktop fit depends on the eventual app stack; sync can remain outside scope. |

CRDTs are a family of data structures and merge rules, not a synonym for all local-first databases. Automerge's docs explicitly identify it as a CRDT. Convergent data still needs product rules: merging edits does not determine which calendar time the user intended or whether an automation should execute twice. This is a design implication, not a tested Clarity implementation.

## The storage choice to resolve

**Assistant framing, not an accepted architecture:** compare three approaches:

1. Ordinary files are authoritative, with indexes rebuilt from them.
2. A local database or document store is authoritative, with readable export.
3. Notes, wiki pages, and assets remain ordinary files; structured state uses a local store.

For the third approach, define one authority for each datum and explicit import/export behavior. Do not assume a plain Markdown file and its database representation can both be edited independently without reconciliation.

Evaluate each option against external editing, local ownership, backup/restore, query needs, action history, macOS support with a Linux route, and the cost of adding sync later. A merge engine alone is not evidence that Dropbox can safely synchronize an active database; that compatibility would need separate design and validation.

## Revisit after module definition

Use the module requirements to revisit external editing, ownership, and representation. The three approaches above remain proposals; the user has not accepted a hybrid file/database architecture. The next discussion is about [module behavior](../features/index.md#module-definition), not choosing a storage engine.
