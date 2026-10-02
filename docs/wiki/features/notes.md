---
title: Notes
section: Features
status: Current
updated: 2026-10-03
order: 30
summary: A human-maintained Markdown writing space where agents can also assist with edits.
---
# Notes

Stable ID: **FEAT-notes**.

## Current specification · 1 October 2026

**Accepted behavior:** Notes is the human-maintained writing space; agents may edit when requested. Keep a folder/file tree on the left and a tabbed Markdown editor on the right, following the supplied Obsidian-like reference. New note immediately creates an untitled `.md` file in the active folder and opens it. Provide folder creation, rename, deletion, and title/content search.

Full GitHub Flavored Markdown is the compatibility target, without math, footnotes, or wiki-link extensions. The selected editor is Milkdown/Crepe with rich editing and a Markdown-source toggle. Autosave while typing. Paste/drop supported images into the note, saving them under a local `assets/` folder and inserting relative Markdown links. These are ordinary user-owned files, not database documents.

### Persistence and conflicts

Store notes under `Notes/` in the chosen data root, preserving user subfolders. New names are `Untitled.md`, `Untitled 1.md`, and so on without overwriting an existing file. Reads return content and its version; writes require the version. Refresh external changes when there is no dirty draft. If both changed, preserve the external file and save the human draft as a separate conflict copy, notify the user, and let them reconcile. Stale agent writes fail rather than overwrite. If a later write race prevents saving, retain the draft and surface the failure. Flush before navigation/explicit Quit; do not silently discard a failing draft.

Module operations are `list(query?)`, `read(path)`, `create(folder?,title?)`, `write(path,text,version)`, `embed(path,attachmentId,version)`, `move(path,to)`, `folder(path)`, and `remove(path)`. Move/rename and folder creation are available to both the UI and agent. Agent mutations follow the [approval checklist](../foundations/chat.md#automatic-approval-checklist): selected methods run immediately; other methods use review. Delete moves Markdown to recoverable Trash, with the 30-day working retention; recovery is currently manual. Embedded chat files become independent permanent assets. See [data ownership](../foundations/folders.md).

### Acceptance and limits

Create in a nested active folder, type and immediately Quit, reopen, and verify saved content. Round-trip GFM lists/tasks/tables/formatting through both editor modes. Make an external edit while typing and verify neither version disappears. Test relative images and title/content search. Existing checks cover these representative cases; exhaustive full-GFM conformance is not established. Milkdown's list-attribute compatibility and editor-destruction serialization fixes are necessary current implementation details, not optional polish.

### Usability fixes · 1 October 2026

Rename uses the open file's parent folder, regardless of the folder selected in the tree, rejects folder separators in the new name, and keeps the renamed document open. Flush the current draft before renaming. A selected tree folder continues to control new-note creation only. Note/folder creation and dialog submissions have an immediate single-submission guard. The file list distinguishes loading, no search matches, and an empty folder tree. Existing conflict recovery and Trash behavior remain.

Acceptance: open a root note, select another folder, rename, and verify the file remains at the root with an active renamed tab. Double-clicking New note or Save must perform one operation.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Notes keeps Milkdown rich GFM editing, source mode, autosave and conflict recovery. The file tree uses SVG icons and 26px rows; flat 35px tabs connect to the editor with compact close targets. Reading typography is 14px with bounded headings. File/tab selection enters session history, and switching modules retains open editors and unsaved content. Rename still preserves the original parent folder.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The file pane starts with a compact Files header and separate New note/New folder icon buttons. Its divider continues from the 35px document tab strip to the bottom of the workspace. Tabs are flat, with straight separators hidden beside the selected, hovered or keyboard-focused tab. The document toolbar contains the current folder/filename, Markdown/Editor toggle and labelled Rename/Trash buttons; file actions do not masquerade as tabs. Rich document scrolling remains inside the editor below the toolbar, including with the animated global sidebar.

### Adversarial fixes · 2 October 2026

Malformed local Markdown URLs lose only the invalid link/image destination; preview content and the application remain usable (QA01). In the rich editor, ⌘B formats the selection without toggling the sidebar (QA03). Creating or renaming a document, or creating a folder, rejects dot-prefixed path components and reserved `assets` components (case-insensitive) before mutation (QA05). A rejected rename retains the original tab, discoverable path and content. Existing hidden files are not migrated. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### List feedback spacing · 3 October 2026

Loading, empty and no-match messages leave 12px below the Notes root-folder control. Existing search-to-folder spacing and populated file-row density remain. Follow the [shared spacing contract and recipe](../foundations/desktop-stack.md#search-and-list-spacing-3-october-2026); the [native sweep](../verification/runs/2026-10-02T163455Z-list-spacing.md) records theme/window checks and their limits.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-renderer.mjs` for malformed Chat source previews, valid-link controls and real rich-editor ⌘B, and `tests/adversarial-services.mjs` for native Rename/reload and shared create/move/folder rejection. Check the rendered editor and saved content/path together. Retain the existing note-save failure/recovery checks. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Notes → open Welcome → select Projects → Rename. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. The original-folder rename and active tab are checked through UI and filesystem reads; the existing integration driver additionally covers Markdown editing/conflicts and Quit persistence. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [3 October 2026: search and list spacing](../verification/runs/2026-10-02T163455Z-list-spacing.md) — empty/no-match spacing and app-wide layout checks.

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Cloudflare OS reassessment · 27 September 2026

**Actual Markdown files are confirmed ([D57](../decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026)).** Notes are viewable and editable in Clarity. Preserve the folder tree, tabs, rich-text Markdown editor, and New note action. The file is authoritative; do not substitute database-only content plus export.

The local platform needs a limited interface to those files. Exact folders and the implementation remain open. D81 settles external-edit behavior: refresh clean notes and preserve unsaved work on conflict. Keep this intentionally small.

### Stated intent

A lean Markdown editor similar to Obsidian. Notes live in the personal folder as Markdown.

Notes are maintained by the user and intended for the human's own writing. Agents can read and edit notes, but ongoing agent maintenance is not their intended use. This is a distinction in purpose, not an agent-editing restriction. See [D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026).

The [wiki](wiki.md) serves a different role: organized knowledge created at the user's request and ideally maintained thereafter by agents.

### Screen and new-note behavior

**Accepted from the user ([D32](../decisions/index.md#d32-notes-screen-and-new-note-action-25-september-2026)):** follow the supplied notes screenshot: a file/folder tree on the left, open-note tabs above the editor on the right, and a rich-text Markdown editing area. Add a **New note** button at the top of the file list; it creates a new note file in the active folder.

The screenshot shows expanded folders, a selected Markdown file, and two open tabs with folder context and a close control. Its sample folder/file names and the label “Sheets” are reference content, not required Clarity labels. A separate source/preview split is not requested.

**Accepted new-note behavior (D80):** immediately create Untitled.md in the active folder, or the notes root if none is selected, and open it for editing. Number duplicates and allow filename rename. “Like Obsidian” applies to this interaction.

### Markdown compatibility

**Accepted correction (D79):** support the full Markdown specification, not the assistant's previously proposed basic-formatting subset. D83 clarifies the target as full GitHub Flavored Markdown, without additional syntax extensions.

**Research observation:** [CommonMark](https://spec.commonmark.org/) specifies core Markdown. [GitHub Flavored Markdown](https://github.github.com/gfm/) builds on CommonMark with extensions including tables, task lists, strikethrough, and extended autolinks. These specifications do not define every editor's additional syntax or interaction model.

**Accepted (D83):** full GitHub Flavored Markdown, kept simple. No math, footnotes, double-bracket note links, or additional Markdown extensions. This defines the compatibility target without requiring all features of GitHub or Obsidian. An editor implementation remains to be selected and validated.

### Keep the editor lean

**Assistant assessment:** a familiar editor layout is straightforward; exact rich-text Markdown round-tripping can become complex if we promise every extension or arbitrary formatting. Define the necessary Markdown behaviors before selecting an editor, and raise unsupported or lossy cases rather than silently changing content. Obsidian plugin compatibility is not part of the requirement.

### Saving and source links

**Accepted (D84):** notes autosave while typing. Retain D81's protection against external-edit conflicts; autosave must not silently overwrite another version. Exact save timing is an implementation detail, not a new user setting.

**Accepted (D85):** wiki factual additions can cite a note using an ordinary clickable source link. This does not add double-bracket note syntax or a backlink system.

### Implementation questions

- Which existing editor preserves the agreed GFM syntax through rich-text edits?
- How will saving and external-change detection preserve both versions when a conflict occurs?

No extra note-management features are implied. Raise a concrete limitation if full GFM cannot be kept simple.

### Reference notes

Obsidian is the stated editing and vault reference. The user supplied the folder-tree/tabbed-editor screenshot on 25 September 2026; its text explicitly calls for a rich-text Markdown editor. No live editor was tested or selected.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

### Concurrent editing concern · 27 September 2026

Actual files can change through the editor, an agent, or another application. **Accepted (D81):** refresh from disk when the editor has no unsaved changes; if a file changed since it was read and the editor has unsaved work, preserve that work and show the conflict rather than silently overwrite either version. Agent writes should also detect stale content before committing. This is a bounded correctness requirement to validate, not a proposal for collaborative editing or a new synchronization system.

### Images, search, and deletion · 27 September 2026

**D88:** pasting or dropping images saves local copies under the Clarity root and inserts relative Markdown links.

**D89:** provide simple title-and-content text search within Notes.

**D90:** move deleted Markdown files to Trash within the data root, with manual recovery through Finder and automatic expiry. Thirty days is the user-suggested working retention period. See [Trash and retention](../foundations/folders.md#trash-and-retention-27-september-2026). Shared image cleanup is not implied by Markdown-file deletion.

### Attachments embedded from chat · 28 September 2026

D100: deliberately embedding a chat attachment here creates a separate persistent module-owned asset under the data root, linked relatively. Chat-attachment cleanup after 90 days removes only the chat copy. Merely mentioning or summarizing a file does not preserve its original. No new media-management screen is implied.
