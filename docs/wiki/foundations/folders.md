---
title: Data folder
section: Foundations
status: Exploring
updated: 2026-09-27
order: 10
summary: One chosen Clarity root contains all app state; the second development folder is dropped.
---
# Data folder

## Current direction

**One user-chosen Clarity folder holds all durable app state ([D64](../decisions/index.md#d64-one-clarity-data-folder-27-september-2026)).** The separate development folder is dropped. Notes/wiki remain actual Markdown files; their in-app behavior is unchanged. Board state, automations, chats, and other modules belong under the same root.

Internal subfolder layout and the representation of non-note/wiki data are still open. Reusing platform-managed local storage is the lean proposal. One root does not itself establish sync, a safe live-database backup procedure, or a promise that every datum is human-editable text.

## Trash and retention · 27 September 2026

**Accepted (D90):** deleted notes/wiki Markdown files move into Trash under the single data root and can initially be restored through Finder. Automatic cleanup after a retention period is required; 30 days is the user's tentative suggestion and working default.

**Assistant proposal:** track the time each file enters Trash, not its original modification time. Expired entries are permanently removed while Clarity is running; check again at startup when necessary. No separate service or wake-from-sleep guarantee. Only designated Trash entries are eligible; active content and shared media are not implicitly included. Names and original locations must remain recoverable without overwriting another file.

D88 also adds local note-image copies with relative Markdown links. Broad chat attachments are desired under D87, but their processing, size, and retention behavior remain open. All retained app content remains under this root.

The remaining material records the initial two-root idea and is historical. It must not reintroduce a second active store.

## Earlier requirement

The user chooses a personal root, for example `~/Desktop/Clarity`, and another development root, for example `~/Desktop/Clarity Projects`. These are examples, not mandatory paths. Clarity keeps the corresponding state there.

| Personal root | Development root |
| --- | --- |
| Todo tasks | Project folders and worktrees |
| Markdown notes | Agent message board state |
| Calendar events | Automations |
| Expenses | Terminal session and conversation traces |
| Bookmarks | Skills and other AI workflow material |

## Proposed organization

Logical areas for notes, tasks, calendar, expenses, and bookmarks could live under the personal root; projects, board records, traces, automations, and Skills could live under the development root. **No concrete on-disk layout, database, file format, or naming scheme is accepted yet.**

## Boundaries to decide

- Does the in-app wiki share the notes folder, or have a separate area?
- Where do news subscriptions, read state, music playlists, and cached mail belong?
- Which preferences travel with a folder, and which belong to the machine?
- Can a personal folder pair with multiple development folders?
- Are existing repositories adopted in place, moved, or referenced?
- Can the development root be unavailable while personal tools still work?
- Do personal automations also live in the development root, as initially requested?

## Earlier portability goal — deferred

The original example was to point another Clarity instance at a synced personal folder and recover the same tasks, notes, events, expenses, and bookmarks. Device sync is now out of scope under [D24](../decisions/index.md#d24-local-state-with-sync-deferred-25-september-2026). The personal/development separation remains; the user is exploring local-first storage and has not committed to an ordinary-file representation for every datum. See [storage exploration](local-first.md).

See [portability](portability.md), [terminal sessions](../features/terminals.md), and [open questions](../discussions/open-questions.md).

## Chat attachment copies and retention · 28 September 2026

D94 stores independent original-file copies under the single Clarity root for files strictly below 30 MB; larger files and files at the threshold are skipped with notice. D96 applies 90-day cleanup to those stored attachments. External originals are never cleanup targets, and this is separate from deleted notes/wiki Trash retention.

Attachment date is the proposed age origin, with cleanup during normal app operation/startup. Chat text should remain with an expired-file state (assistant proposal). Do not treat note/wiki images as expiring chat attachments; deliberate reuse across those areas needs a simple ownership rule before cleanup is implemented.

## Persistent embedded assets · 28 September 2026

D100 resolves attachment ownership across modules. Deliberately embedding a chat attachment in Notes/Wiki creates a separate module-owned copy under the single root and a relative link. This persistent asset is excluded from the chat copy's 90-day expiry. Mentioning or summarizing the file does not preserve its original automatically. No shared-reference database, extra asset-manager UI, or automatic orphan cleanup is required by this decision.
