---
title: Clarity
section: Overview
status: Implemented
updated: 2026-09-29
order: 0
summary: A personal harness based on Cloudflare OS, with Electron and TypeScript.
---
# Clarity

Clarity brings personal tools and agent-assisted work together, with optional modules and account connections. **The current direction is Cloudflare OS with Electron and TypeScript. Terminal sessions are out of scope.** On 28 September the user authorized building the complete agreed app and choosing safe, lean defaults for unfinished decisions (D102). The first complete local build is implemented. See [implementation and validation](references/implementation.md) for the delivered modules, verified behavior, and account-dependent limits.

## The idea

Open to the last chat, with New chat available and recent conversations in the sidebar (D78). Chat works across enabled modules and keeps results in the conversation. Full web access and broad attachments are desired (D86/D87). Browsing targets Codex-level speed while remaining lean (D91), using Playwright with batched actions and agent-browser as the alternative to compare (D92). Attachments support text/image/PDF-text analysis with clear unsupported-file handling, independent copies below 30 MB, and 90-day cleanup (D93–D96). Routine browsing proceeds after site authorization, with confirmation for consequential actions (D97); enforcement and performance still need validation. Prior chats are retrieved on request/reference, model/effort changes preserve the thread, and deliberately embedded attachments receive persistent module copies (D98–D100). Follow Cloudflare OS navigation first, with enabled modules above recent chats and Settings below (D73).

The remaining eleven modules are calendar, expenses, notes, todos, mail, news, bookmarks, wiki, music, agent message board, and automations. Chat, notes, todo, and wiki remain the first validation priority (D71); D102 now authorizes implementing the entire agreed set. Existing lean module behavior remains the starting point.

Notes are the human's writing space; the single topic-organized wiki holds agent-maintained knowledge. Both use actual Markdown files and are viewable in the app; notes are editable there with full GFM and autosave (D83/D84). Extra Markdown extensions are out of scope; wiki factual additions include clickable sources (D85). Notes save pasted/dropped images locally, both Notes and Wiki have title/content search, and deleted Markdown goes to recoverable Trash with automatic cleanup (D88–D90; 30 days is the working retention default). Use upstream approvals with the browser-specific refinement in D97 instead of the earlier custom confirmation system. Every chat accesses the same enabled module instances.

The agent board uses topic threads with concise posts/replies and links back to chats/items. Agents access it through existing Cloudflare OS module methods. It is available to all agents; each project opts in through AGENTS.md or equivalent instructions that determine when to read and post. No universal board-usage routine is imposed.

## Current reassessment

The backend runs locally for now ([D56](decisions/index.md#d56-local-backend-27-september-2026)). Electron provides the desktop app; local runtime packaging still needs validation. Closing the window keeps Clarity alive in the Dock/menu bar; explicit Quit exits. Missed automation runs are skipped; recurring work resumes at the next scheduled time (D69). No hosted deployment or device sync is planned initially.

Notes/wiki are actual files ([D57](decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026)); all app state belongs under one chosen Clarity folder; the second development root is dropped. The implementation uses Notes, Wiki, Attachments, Trash, and .clarity folders, with local Worker/SQLite state. Keep the existing notes editor and read-only wiki reader behavior.

Retain the upstream Pi agent ([D58](decisions/index.md#d58-retain-the-pi-agent-27-september-2026)), one stable maintained instance per enabled module ([D59](decisions/index.md#d59-stable-maintained-modules-27-september-2026)), and Cloudflare OS approval behavior ([D60](decisions/index.md#d60-adopt-upstream-approvals-27-september-2026)), with the browser-specific refinement in D97. The LangChain implementation plan is superseded. Use the existing 20× Codex subscription (D77); local sign-in integration still needs validation. Learning and readable-code requirements remain.

Terminals remain removed. Agent board and automations remain in scope. macOS is the first target, with Linux possible later. Spotify audio plays inside Clarity. Navidrome accepts a supplied HTTP/HTTPS address and attempts connection with account sign-in; no network-type question. Implementation validation remains, including hidden X refresh.

## Technical evidence · 28 September 2026

[Disposable spikes](references/technical-spikes.md) passed live Codex/Pi tool use and saved-history restoration, local storage restart, real-file access with a stale-write check, Electron lifecycle, and minimal app bundling. Browser batching reduced fixture overhead, but a naive read-only filter failed. D101 originally limited work to experiments; D102 supersedes that implementation restriction. New application evidence is recorded separately in [implementation progress](references/implementation.md).

## Start here

- [Web browsing and attachment research](references/web-and-attachments.md) — integration options, approval tradeoff, and format limits; decisions pending.

- [Architecture and remaining tensions](foundations/desktop-stack.md#current-direction-27-september-2026).
- [Feature map](features/index.md) — retained behavior and likely platform fit.
- [Open questions](discussions/open-questions.md) — decisions still needed.
- [Decision register](decisions/index.md) — accepted direction and reopened decisions.
- [Product vision](vision/product.md) and [working principles](vision/principles.md).

The current audience is private use shared with friends. Spotify public-product policy discussion remains deferred. Keep everything lean, resist additional features, and raise material complexity before adopting it.

## About this notebook

This planning wiki is separate from the in-app knowledge base. Markdown is authoritative; index.html is a generated offline reader. Earlier discussions remain in the journal, including the [initial idea](journal/2026-09-24-initial-idea.md), [implementation authorization](journal/2026-09-28-implementation.md), and [delivery record](journal/2026-09-29-local-build.md).
