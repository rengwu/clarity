---
title: Product vision
section: Overview
status: Captured
updated: 2026-09-27
order: 10
summary: One optional, modular harness for personal tools and development workflows.
---
# Product vision

## Stated intent

Clarity is an omni-harness, similar in spirit to Lucia. It brings together personal utilities, integrations, and developer workflows. Users choose which features to enable and which accounts to connect.

The experience should be lean: a simple calendar, fast expense entry, a lightweight Markdown editor, and a simple knowledge base, alongside the other requested tools. The breadth is intentional; the depth of each feature is still to be explored.

## Opening screen

**User-stated requirement:** the first screen is simply a chat screen, with recent chats in the sidebar. Recorded in [D16](../decisions/index.md#d16-chat-opening-screen-25-september-2026).

**Accepted navigation (D73):** follow Cloudflare OS design first, with enabled modules above recent chats and Settings below. The earlier tentative direction is preserved in the [navigation journal](../journal/2026-09-25-main-sidebar.md).

Reopening resumes the last chat, with New chat available; a first launch without conversation history shows a new chat (D78).

The chat UI should closely follow Synara or Codex as references ([D19](../decisions/index.md#d19-chat-ui-references-25-september-2026)); exact visual and interaction details remain to be reviewed.

## Chat across modules

**User-stated requirement:** chat can act across all modules. Confirmed examples include summarizing news headlines, adding and editing tasks, adding calendar events, reading notes, reading and summarizing mail, retrieving bookmarks, searching and playing music, and altering the in-app wiki.

After an action, stay in chat and show a compact result with a link to the relevant item ([D18](../decisions/index.md#d18-results-stay-in-chat-25-september-2026)). The user can choose to open the item in its module.

Every conversation accesses the same stable enabled modules. Keep Cloudflare OS's Pi agent and approval behavior; the LangChain plan and custom confirmation system are superseded. Retain the model/effort picker direction where supported. Local models remain out of scope.

Wiki topic maintenance during research and scheduled updates from new relevant app state remain intended. Custom saved-thread grant mechanics are set aside while adopting upstream approvals.

See [chat and module actions](../foundations/chat.md) and [assistant execution](../foundations/harnesses.md). Specific actions for the remaining modules, the default and scope of the action-mode setting, and detailed result styling remain open.

## Platform

Cloudflare OS with Electron and TypeScript; backend execution is local for now. macOS first, with Linux possible later. Terminals are removed. Closing the window keeps Clarity alive in the Dock/menu bar until explicit Quit. Runtime packaging and clean lifecycle implementation still need validation; see [architecture](../foundations/desktop-stack.md#current-direction-27-september-2026).

## Ownership

Notes/wiki are actual Markdown files, viewable in the app; notes are editable in-app. Wiki retains its AI-editing/read-only-reader model. All app state belongs under one chosen folder; the second development root is removed. Internal layout, other state representation, and backup mechanics remain open. Device sync is out of scope.

## Desired journeys

These interpretations remain proposals to refine:

1. Open Clarity, enable useful modules, and chat across their shared data.
2. Capture a task, note, event, expense, or bookmark without a separate service account for each module.
3. Connect Google for mail and Spotify/Navidrome for music.
4. Browse the agent's work and maintain knowledge through chat and scheduled updates.

Terminal workflows have been removed; local directories and runtime lifetime are still open.

## Still undefined

Local packaging and sleep/restart validation, internal folder layout and other state, Codex subscription integration, module upgrades, embedded Spotify implementation, and Navidrome connection/streaming validation remain open. First-version priorities are chat, notes, todo, and wiki; missed runs are skipped. Retain Pi and upstream approvals. Keep implementation understandable and explain new concepts as we build. See [open questions](../discussions/open-questions.md).

## First useful version

Chat, notes, todo, and wiki are the accepted first-version priorities (D71). Codex is the initial AI-account target (D72); the Pi agent remains. Other modules stay in the broader plan.
