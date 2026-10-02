---
title: Data folder
section: Foundations
status: Current
updated: 2026-10-02
order: 10
summary: One chosen Clarity root contains all app state; the second development folder is dropped.
---
# Data folder

## Current specification · 29 September 2026

**Accepted:** one user-chosen folder owns app data (D64); Notes/Wiki are actual Markdown (D57). **Selected layout under D103:**

```text
Clarity/
  Notes/                 Markdown files, subfolders, and persistent assets/
  Wiki/                  Topic Markdown, assets/, generated index.html
  Attachments/           Independent chat attachment copies
  Trash/                 Deleted Markdown awaiting cleanup
  .clarity/
    state/               Miniflare-managed SQLite state
    credentials.bin      OS-encrypted connection credentials
    ui/                  Electron session profile
    browser/             Persistent Chrome/Chromium session profile
```

A machine-local `root.txt` pointer in Electron userData locates the folder; it is not a second development root. Runtime scratch files, including playback state, stay under the chosen root. Build caches and packaged software are separate development artifacts. There is no device sync. Quit Clarity before copying the entire data folder; moving credentials or browser profiles between machines can require reconnection. See [portability](portability.md).

The action approval checklist is saved in this folder’s `settings/default` record as `autoApproveActions`, an initially empty array of exact method IDs. It is shared by chats and automations and survives restart; new folders begin with no extra approvals. Automatic mutations retain action records with their results or failures. See [approval behavior](chat.md#automatic-approval-checklist).

Structured records carry an ID, epoch-millisecond creation/update times, and an increasing revision. Public existing-record update/remove methods require a positive safe-integer revision; missing, malformed and stale values cannot bypass conflict checks, including reviewed or automatic agent calls. Internal Store writes retain their optional guard for service-owned operations. The SQLite collections and fields are specified in [implementation contracts](../references/implementation.md). Do not replace Markdown with database-only documents or treat generated HTML as the content source.

### Draft and navigation storage

Chat text/attachment metadata/Wiki context and unfinished expense fields live in the existing `.clarity/ui/` profile, using localStorage keys prefixed `clarity:draft:`. Chat keys include the conversation ID (or `new` before creation); expense keys identify the active record and fields. Writes happen as input changes, so reload/restart is not a discard operation. These are unsent local values, separate from authoritative saved records. Successful Chat send clears only submitted text/context generations and submitted attachment IDs; later edits remain, including edits during new-conversation creation. Successful expense save and explicit Cancel clear that form’s active draft. They travel with a copied, fully closed data folder; no second root or external draft directory is introduced.

Mail paging/search/selection and Music collection navigation are in-memory view state for one renderer session; reload resets that place. Google auth changes also clear Mail state and invalidate old requests. The redesign also keeps the Back/Forward destination stack, reading offsets, preview width, open Note tabs and per-thread Board reply drafts in renderer memory. They reset on reload and do not create a saved mailbox or alter Music's visit-specific layout defaults. Existing Chat/expense draft persistence remains distinct. Linkding's last refresh outcome is a structured record; its active timer is reconstructed from the saved interval at launch.

Music also retains bounded, disposable browse results in renderer memory, scoped to the data root and cleared on music-account changes or reload. These are separate from the persistent `music-recent` references and do not create a local playlist database or offline library. [Music's cache contract](../features/music.md#browse-result-caching-2-october-2026) owns refresh, retention, request sharing and invalidation rules.

### File writes and recovery

Editable documents are UTF-8 Markdown with a 5,000,000-byte working limit. Read returns the relative path, text, and a SHA-256 content version. Writes require that version, serialize writes per path, check again before replacing the file, and reject escapes/symlinks. A stale human draft is preserved in a separate conflict Markdown file while the external version remains; a stale agent write fails and must re-read. A late race leaves the draft in the editor with an error. This is not a transaction with arbitrary external editors.

Creation, folder creation and rename reject dot-prefixed destination components and case-insensitive `assets` components before mutation, preserving discoverability in the document tree. Existing hidden files are not migrated. The [adversarial remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) covers these paths and asynchronous draft preservation.

Deleting a note/wiki file moves it to `Trash/<time>-<uuid>-<basename>`. Recovery is manual through Finder before cleanup; the current format preserves the basename but has no original-folder restore manifest. Do not promise automatic restoration to its former folder.

### Attachment ownership and retention

Chat originals are copied to `Attachments/<uuid>/<safe-name>` with `.metadata.json` containing ID, original name, size, MIME, attachment time, and supported-analysis flag. Accept only files strictly below **30,000,000 bytes**; skip larger files with a notice. External originals are never changed. Supported analysis is text/code, supported images, and PDF text; storing a file does not promise it can be analyzed.

Chat copies expire after 90 days from attachment time. Trash expires after 30 days, the adopted working default. Cleanup runs at launch and every six hours while Clarity runs; it does not run while quit or delete chat text. Deliberately embedding a chat attachment copies it to the page's local `assets/` folder and inserts a relative link. This module-owned copy survives chat expiry. Pasted/dropped note images use the same persistent ownership. Merely summarizing or mentioning a file does not preserve it. No orphan-asset collection system is included.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Current direction

**One user-chosen Clarity folder holds all durable app state ([D64](../decisions/index.md#d64-one-clarity-data-folder-27-september-2026)).** The separate development folder is dropped. Notes/wiki remain actual Markdown files; their in-app behavior is unchanged. Board state, automations, chats, and other modules belong under the same root.

Internal subfolder layout and the representation of non-note/wiki data are still open. Reusing platform-managed local storage is the lean proposal. One root does not itself establish sync, a safe live-database backup procedure, or a promise that every datum is human-editable text.

### Trash and retention · 27 September 2026

**Accepted (D90):** deleted notes/wiki Markdown files move into Trash under the single data root and can initially be restored through Finder. Automatic cleanup after a retention period is required; 30 days is the user's tentative suggestion and working default.

**Assistant proposal:** track the time each file enters Trash, not its original modification time. Expired entries are permanently removed while Clarity is running; check again at startup when necessary. No separate service or wake-from-sleep guarantee. Only designated Trash entries are eligible; active content and shared media are not implicitly included. Names and original locations must remain recoverable without overwriting another file.

D88 also adds local note-image copies with relative Markdown links. Broad chat attachments are desired under D87, but their processing, size, and retention behavior remain open. All retained app content remains under this root.

The remaining material records the initial two-root idea and is historical. It must not reintroduce a second active store.

### Earlier requirement

The user chooses a personal root, for example `~/Desktop/Clarity`, and another development root, for example `~/Desktop/Clarity Projects`. These are examples, not mandatory paths. Clarity keeps the corresponding state there.

| Personal root | Development root |
| --- | --- |
| Todo tasks | Project folders and worktrees |
| Markdown notes | Agent message board state |
| Calendar events | Automations |
| Expenses | Terminal session and conversation traces |
| Bookmarks | Skills and other AI workflow material |

### Proposed organization

Logical areas for notes, tasks, calendar, expenses, and bookmarks could live under the personal root; projects, board records, traces, automations, and Skills could live under the development root. **No concrete on-disk layout, database, file format, or naming scheme is accepted yet.**

### Boundaries to decide

- Does the in-app wiki share the notes folder, or have a separate area?
- Where do news subscriptions, read state, music playlists, and cached mail belong?
- Which preferences travel with a folder, and which belong to the machine?
- Can a personal folder pair with multiple development folders?
- Are existing repositories adopted in place, moved, or referenced?
- Can the development root be unavailable while personal tools still work?
- Do personal automations also live in the development root, as initially requested?

### Earlier portability goal — deferred

The original example was to point another Clarity instance at a synced personal folder and recover the same tasks, notes, events, expenses, and bookmarks. Device sync is now out of scope under [D24](../decisions/index.md#d24-local-state-with-sync-deferred-25-september-2026). The personal/development separation remains; the user is exploring local-first storage and has not committed to an ordinary-file representation for every datum. See [storage exploration](local-first.md).

See [portability](portability.md), [terminal sessions](../features/terminals.md), and [open questions](../discussions/open-questions.md).

### Chat attachment copies and retention · 28 September 2026

D94 stores independent original-file copies under the single Clarity root for files strictly below 30 MB; larger files and files at the threshold are skipped with notice. D96 applies 90-day cleanup to those stored attachments. External originals are never cleanup targets, and this is separate from deleted notes/wiki Trash retention.

Attachment date is the proposed age origin, with cleanup during normal app operation/startup. Chat text should remain with an expired-file state (assistant proposal). Do not treat note/wiki images as expiring chat attachments; deliberate reuse across those areas needs a simple ownership rule before cleanup is implemented.

### Persistent embedded assets · 28 September 2026

D100 resolves attachment ownership across modules. Deliberately embedding a chat attachment in Notes/Wiki creates a separate module-owned copy under the single root and a relative link. This persistent asset is excluded from the chat copy's 90-day expiry. Mentioning or summarizing the file does not preserve its original automatically. No shared-reference database, extra asset-manager UI, or automatic orphan cleanup is required by this decision.
