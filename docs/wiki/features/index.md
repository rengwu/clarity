---
title: Feature map
section: Features
status: Current
updated: 2026-10-01
order: 0
summary: Current module behavior, shared agent access, and scope boundaries.
---
# Feature map

All modules below have a local implementation under D102/D103. Chat, Notes, Todos, and Wiki start enabled and remain the first validation priority; optional modules are enabled in Settings. Implementation does not mean every accepted behavior or live integration has been verified. Each topic puts its current contract and gaps before historical discussion.

| Module | Current scope |
| --- | --- |
| [Chat](../foundations/chat.md) | Last-thread reopening, recent chats, Codex model/effort selection, shared module tools, action review, hosted search, page reading, interactive browsing, and attachments. |
| [Notes](notes.md) | Actual Markdown, folder tree, tabs, rich GFM/source editing, immediate New note, autosave, preserved conflicts, local images, search, and Trash. |
| [Todo list](todos.md) | One list; add/edit/delete tasks with optional dates and check/uncheck completion. Completed tasks remain below unfinished ones. Dated tasks appear in Calendar. |
| [Wiki](wiki.md) | One topic-organized file-based knowledge base; AI edits, generated HTML webview/offline reader, text search, ordinary source references. Canonical item URLs resolve local source references. |
| [Calendar](calendar.md) | Week and seamless Month views, Today/previous/next, title/start/end event creation, editing, and deletion; dated Todos appear on their chosen day. |
| [Expenses](expenses.md) | Daily list and one entry/edit form; Expensif digit-buffer amount input and category/description suggestions. |
| [Mail](mail.md) | Google-connected inbox/search and plain-text message reader; chat summaries. No compose/reply or Gmail deep link. |
| [News](news.md) | User-selected RSS/Atom feeds, explicit refresh, compact searchable/source-filtered headlines, external article opening. |
| [Bookmarks](bookmarks.md) | Owned local title/URL/description/tags/date, search and edits, optional Linkding/X read-only imports. Linkding refresh reconciles upstream changes and supports optional hourly/daily intervals. |
| [Music](music.md) | In-app Spotify/Navidrome playback, source-labelled library/search, simple collections, recent collection references, one active source. No hybrid playlists or direct local files. |
| [Agent board](agent-board.md) | Opt-in topic threads, concise posts/replies, item links, shared module methods, human browsing. External-agent adapters remain unspecified. |
| [Automations](automations.md) | Daily/weekly wiki-topic maintenance from new local input; skipped missed runs; results and review stay on Automations. |

## Module definition

All chats access the same enabled module instances, rather than creating a task list or wiki per conversation. Direct human actions apply through the module; agent reads return immediately and mutations enter review, with the documented browser and scheduled-topic exceptions. Disabled modules retain data. Connections are optional and separate from enablement.

Every module uses the [single data root](../foundations/folders.md). Actual Notes/Wiki Markdown is required; structured records use local SQLite. The [implementation report](../references/implementation.md) documents schemas and shared interfaces; the [follow-up list](../discussions/open-questions.md) identifies missing work and unverified real accounts.

Do not restore [terminal sessions](terminals.md), two-root storage, device sync, local music, extra task-management features, or a background service from historical references. Define a concrete behavior and explain its complexity before adding scope.


## Verification map

Stable IDs live on the existing topic pages, with entry points, expected outcomes, executable recipes, coverage limits and dated histories. Shared [setup](../verification/setup.md) and [run reports](../verification/index.md) follow jstack conventions; each result is tied to its recorded build. Module specifications are not copied into a second map.

| Stable ID | Authoritative feature record |
| --- | --- |
| FEAT-notes | [Notes](notes.md) |
| FEAT-todos | [Todos](todos.md) |
| FEAT-calendar | [Calendar](calendar.md) |
| FEAT-expenses | [Expenses](expenses.md) |
| FEAT-bookmarks | [Bookmarks](bookmarks.md) |
| FEAT-news | [News](news.md) |
| FEAT-mail | [Mail](mail.md) |
| FEAT-music | [Music](music.md) |
| FEAT-agent-board | [Agent Board](agent-board.md) |
| FEAT-automations | [Automations](automations.md) |
| FEAT-wiki | [Wiki](wiki.md) |
| FEAT-chat | [Chat](../foundations/chat.md) |
| FEAT-settings | [Settings](../foundations/integrations.md) |
| FEAT-shared-ui | [Shared Ui](../foundations/desktop-stack.md) |
| FEAT-verification-workflow | [Verification and wiki maintenance](verification-workflow.md) |
