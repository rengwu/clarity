---
title: Feature map
section: Features
status: Captured
updated: 2026-09-27
order: 0
summary: Chat, notes, todo, and wiki first; eleven modules remain in the broader direction.
---
# Feature map

**Current platform direction:** Cloudflare OS with Electron/TypeScript. Terminal sessions are removed; their [page](terminals.md) preserves earlier research. Backend execution is local; notes/wiki are actual Markdown files. Use stable module instances, Pi, and upstream approvals. Runtime packaging and exact directories remain open.

All eleven modules below are part of the idea. **First-version priorities are chat, notes, todo, and wiki (D71).** The table order is organizational; the other modules remain in the broader direction. Each page separates stated intent from candidate scope and unanswered questions.

| Module | Starting point |
| --- | --- |
| [Calendar](calendar.md) | macOS-style Week and Month views, with seamless month scrolling; Notion Calendar is an additional reference. |
| [Expenses](expenses.md) | Expensif daily view and new-expense form; preserve amount and suggestion inputs. |
| [Notes](notes.md) | Human-maintained Markdown in a folder tree and tabbed rich-text editor; New note creates a file in the active folder. |
| [Todo list](todos.md) | One simple task list; add items and mark them done. |
| [Mail](mail.md) | Google-connected inbox and message reader with chat summaries. No composing or replying. |
| [News](news.md) | Headlines from user-chosen sources; open articles in the browser. |
| [Bookmarks](bookmarks.md) | Searchable local list with title, URL, description, tags, and created date; optional X and linkding integrations. |
| [Wiki / knowledge base](wiki.md) | One topic-organized knowledge base in an HTML webview; request edits through AI. |
| [Music](music.md) | One Spotify/Navidrome client with source-labelled collections, flat source-owned playlists, search, Clarity-only recent items, and one active playback source. No direct local files. |
| [Agent message board](agent-board.md) | Topic threads and concise agent posts, browsable by humans; available through module methods, with reads/posts governed by project opt-in instructions. |
| [Automations](automations.md) | Local workflows, including scheduled wiki updates from new relevant app state; Lucia remains a reference. |

## Module definition

**Accepted direction:** define the modules before choosing technology ([D25](../decisions/index.md#d25-define-modules-before-choosing-technology-25-september-2026)). Storage research remains background; the named technologies are not a closed shortlist.

**Assistant proposal for the discussion:** for each module, describe its main screen, the information users keep there, direct UI and chat actions, and what can wait. Notes and wiki now have distinct maintenance roles under [D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026); continue with their behavior and screens, then work through the remaining modules. This order and template are suggestions, not accepted feature requirements.

## Chat access

Chat should be able to act across all eleven modules. The [chat and module actions](../foundations/chat.md) page records the user-specified operations and distinguishes them from actions still to define. Module enablement and required account connections remain applicable.

## Cross-cutting questions

Which modules create a useful first version together? How much shared navigation is useful? Where should cross-links connect tasks, notes, calendar events, bookmarks, and projects?

See [open questions](../discussions/open-questions.md).
