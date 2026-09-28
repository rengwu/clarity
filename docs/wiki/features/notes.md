---
title: Notes
section: Features
status: Exploring
updated: 2026-09-27
order: 30
summary: A human-maintained Markdown writing space where agents can also assist with edits.
---
# Notes

## Cloudflare OS reassessment · 27 September 2026

**Actual Markdown files are confirmed ([D57](../decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026)).** Notes are viewable and editable in Clarity. Preserve the folder tree, tabs, rich-text Markdown editor, and New note action. The file is authoritative; do not substitute database-only content plus export.

The local platform needs a limited interface to those files. Exact folders and the implementation remain open. D81 settles external-edit behavior: refresh clean notes and preserve unsaved work on conflict. Keep this intentionally small.

## Stated intent

A lean Markdown editor similar to Obsidian. Notes live in the personal folder as Markdown.

Notes are maintained by the user and intended for the human's own writing. Agents can read and edit notes, but ongoing agent maintenance is not their intended use. This is a distinction in purpose, not an agent-editing restriction. See [D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026).

The [wiki](wiki.md) serves a different role: organized knowledge created at the user's request and ideally maintained thereafter by agents.

## Screen and new-note behavior

**Accepted from the user ([D32](../decisions/index.md#d32-notes-screen-and-new-note-action-25-september-2026)):** follow the supplied notes screenshot: a file/folder tree on the left, open-note tabs above the editor on the right, and a rich-text Markdown editing area. Add a **New note** button at the top of the file list; it creates a new note file in the active folder.

The screenshot shows expanded folders, a selected Markdown file, and two open tabs with folder context and a close control. Its sample folder/file names and the label “Sheets” are reference content, not required Clarity labels. A separate source/preview split is not requested.

**Accepted new-note behavior (D80):** immediately create Untitled.md in the active folder, or the notes root if none is selected, and open it for editing. Number duplicates and allow filename rename. “Like Obsidian” applies to this interaction.

## Markdown compatibility

**Accepted correction (D79):** support the full Markdown specification, not the assistant's previously proposed basic-formatting subset. D83 clarifies the target as full GitHub Flavored Markdown, without additional syntax extensions.

**Research observation:** [CommonMark](https://spec.commonmark.org/) specifies core Markdown. [GitHub Flavored Markdown](https://github.github.com/gfm/) builds on CommonMark with extensions including tables, task lists, strikethrough, and extended autolinks. These specifications do not define every editor's additional syntax or interaction model.

**Accepted (D83):** full GitHub Flavored Markdown, kept simple. No math, footnotes, double-bracket note links, or additional Markdown extensions. This defines the compatibility target without requiring all features of GitHub or Obsidian. An editor implementation remains to be selected and validated.

## Keep the editor lean

**Assistant assessment:** a familiar editor layout is straightforward; exact rich-text Markdown round-tripping can become complex if we promise every extension or arbitrary formatting. Define the necessary Markdown behaviors before selecting an editor, and raise unsupported or lossy cases rather than silently changing content. Obsidian plugin compatibility is not part of the requirement.

## Saving and source links

**Accepted (D84):** notes autosave while typing. Retain D81's protection against external-edit conflicts; autosave must not silently overwrite another version. Exact save timing is an implementation detail, not a new user setting.

**Accepted (D85):** wiki factual additions can cite a note using an ordinary clickable source link. This does not add double-bracket note syntax or a backlink system.

## Implementation questions

- Which existing editor preserves the agreed GFM syntax through rich-text edits?
- How will saving and external-change detection preserve both versions when a conflict occurs?

No extra note-management features are implied. Raise a concrete limitation if full GFM cannot be kept simple.

## Reference notes

Obsidian is the stated editing and vault reference. The user supplied the folder-tree/tabbed-editor screenshot on 25 September 2026; its text explicitly calls for a rich-text Markdown editor. No live editor was tested or selected.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

## Concurrent editing concern · 27 September 2026

Actual files can change through the editor, an agent, or another application. **Accepted (D81):** refresh from disk when the editor has no unsaved changes; if a file changed since it was read and the editor has unsaved work, preserve that work and show the conflict rather than silently overwrite either version. Agent writes should also detect stale content before committing. This is a bounded correctness requirement to validate, not a proposal for collaborative editing or a new synchronization system.

## Images, search, and deletion · 27 September 2026

**D88:** pasting or dropping images saves local copies under the Clarity root and inserts relative Markdown links.

**D89:** provide simple title-and-content text search within Notes.

**D90:** move deleted Markdown files to Trash within the data root, with manual recovery through Finder and automatic expiry. Thirty days is the user-suggested working retention period. See [Trash and retention](../foundations/folders.md#trash-and-retention-27-september-2026). Shared image cleanup is not implied by Markdown-file deletion.

## Attachments embedded from chat · 28 September 2026

D100: deliberately embedding a chat attachment here creates a separate persistent module-owned asset under the data root, linked relatively. Chat-attachment cleanup after 90 days removes only the chat copy. Merely mentioning or summarizing a file does not preserve its original. No new media-management screen is implied.
