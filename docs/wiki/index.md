---
title: Clarity
section: Overview
status: Current
updated: 2026-10-03
order: 0
summary: Current product specification, rebuild contracts, decisions, and validation.
---
# Clarity

Clarity is a local personal harness with chat and optional modules. This wiki is its maintained **rebuild specification**, not just a record of brainstorming. Markdown is authoritative; `index.html` is the generated offline reader. The app's user-owned Wiki module is a separate knowledge base.

## Agent onboarding

Before brainstorming or implementation:

1. Read this page and [Working principles](vision/principles.md) for workspace instructions, authorization, collaboration preferences, and completion requirements.
2. Read the **current follow-up** at the top of [Open questions](discussions/open-questions.md), then the current specifications for the task's topics using the reading map below. Follow their linked contracts and relevant decisions before changing behavior.
3. Read the latest dated entry in `docs/wiki/journal/`; when several share a date, use their front-matter `order` to identify the latest, and read other entries relevant to the task. The latest entry is [Search and list spacing](journal/2026-10-03-list-spacing.md), covering the Board/Notes corrections and all-module layout sweep. [Open X in the default browser](journal/2026-10-03-x-default-browser.md) covers OS browser dispatch and the separate importer login. [Live volume response](journal/2026-10-02-volume-response.md) covers immediate slider input and gain after the audio queue. [Music search categories](journal/2026-10-02-music-search.md) covers grouped results, type labels and preserved filter/navigation behavior. [Adversarial fixes](journal/2026-10-02-adversarial-fixes.md) covers all fourteen open audit findings and packaged delivery. [Global feedback research](journal/2026-10-02-global-feedback-research.md) remains a proposal awaiting the user’s choice; related entries cover [Recently played card repair](journal/2026-10-02-music-recent.md), [the Settings desktop design correction](journal/2026-10-02-settings-redesign.md), [the adversarial application audit](journal/2026-10-02-adversarial-qa.md), [large Spotify collections](journal/2026-10-02-music-pagination.md), [Navidrome connection diagnosis](journal/2026-10-02-navidrome-connection.md), [Music browse error layout](journal/2026-10-02-music-error-layout.md), [volume consistency and normalization](journal/2026-10-02-music-normalization.md), [the volume investigation](journal/2026-10-02-music-volume.md), [playlist details](journal/2026-10-02-playlist-details.md), [installed playback](journal/2026-10-02-installed-playback.md) and [Music result caching](journal/2026-10-02-music-cache.md).
4. Read the affected topic’s verification recipe and latest applicable run through [Verification setup](verification/setup.md). Record changed behavior against the actual build and preserve evidence.
5. For implementation, consult [Implementation and validation](references/implementation.md) and the repository's IMPLEMENTATION.md, then inspect the relevant source and existing workspace changes. Specifications describe the intended behavior; evidence and the follow-up list identify what is actually verified or missing.

For a full rebuild or broad architectural work, complete the reading order below. For a focused task, read the affected topics and their dependencies. Keep product details on those pages; AGENTS.md points here instead of duplicating them.

## Current direction

Electron/TypeScript with React, a local workerd/SQLite backend, Pi, and the user's existing Codex subscription. Reuse Cloudflare OS's scheduler and approval contracts selectively; do not assume its complete hosted app or runtime-generated modules are part of Clarity. Implementation is authorized under D102; safe, lean defaults are recorded under D103. A local build covers all modules, with [known gaps and validation limits](discussions/open-questions.md).

Open to the last chat. Enabled modules appear above recent chats in the main sidebar, with Settings below. Chat, Notes, Todos, and Wiki start enabled. Calendar, Expenses, Mail, News, Bookmarks, Music, Agent board, and Automations are optional. Every conversation uses the same enabled modules; user-initiated results stay in chat. Scheduled results stay in Automations.

One chosen data folder owns actual Markdown, structured state, attachments, credentials, and browser profiles. Notes are human-edited; Wiki is agent-maintained by topic. Window close keeps Clarity alive through the Dock/menu bar; explicit Quit stops it. macOS first, private use with friends. Terminal sessions, the second development root, direct local music files, device sync, a separate daemon, and launch-at-login remain outside scope.

Settings → Agent approvals controls which of the 37 agent mutation methods execute without asking, with a Select all checkbox and partial-selection state. Choices are saved per data folder, shared across chats and automations, and initially unchecked. See the [complete action map](foundations/chat.md#automatic-approval-checklist).

Fresh device time and IANA timezone accompany every model request. Request macOS location on first opening the data folder; Settings → Permissions manages device use and existing chat-specific website grants. Location remains unknown unless supplied, and stored readings are approximate and timestamped. See [time and permissions](foundations/chat.md#time-location-and-permissions).

## Rebuild reading order

1. [Product vision](vision/product.md) and [working principles](vision/principles.md): scope, lean defaults, and maintenance rules.
2. [Feature map](features/index.md): the current behavior and contract for every module.
3. [Chat](foundations/chat.md), [assistant execution](foundations/harnesses.md), and [connections](foundations/integrations.md): agent flow, review, browser access, attachments, and account boundaries.
4. [Data folder](foundations/folders.md) and [portability](foundations/portability.md): file ownership, local records, conflict recovery, and retention.
5. [Desktop stack](foundations/desktop-stack.md) and [implementation and validation](references/implementation.md): component boundaries, schemas, pinned dependencies, build/setup, acceptance checks, and evidence.
6. [Current follow-up](discussions/open-questions.md) and [decision register](decisions/index.md): missing accepted behavior, unresolved validation, and why the scope changed.

Read the **current specification** first on topic pages. Historical discussion and dated research below it explain earlier choices; they do not reopen settled decisions. Accepted requirements, delegated defaults, and verified behavior are different things. A documented implementation gap must not silently become the new design.

The [verification map](features/index.md#verification-map), [setup](verification/setup.md), and [dated runs](verification/index.md) connect expected behavior to build-specific evidence.

## Maintenance

Follow the [documentation and validation workflow](vision/principles.md#documentation-and-validation) for every meaningful change. [D105](decisions/index.md#d105-wiki-as-rebuild-specification-29-september-2026) establishes the rebuild specification; [D107](decisions/index.md#d107-wiki-led-agent-onboarding-29-september-2026) makes this wiki the detailed onboarding resource.

Earlier history remains in the journal, including the [initial idea](journal/2026-09-24-initial-idea.md), [implementation authorization](journal/2026-09-28-implementation.md), [first local build](journal/2026-09-29-local-build.md), [location update](journal/2026-09-29-location-permissions.md), and [music playback fix](journal/2026-09-29-music-playback.md). Research is indexed in the [reference register](references/index.md).
