---
title: 1 October 2026 — Omni-input and source navigation
section: Journal
status: Exploring
updated: 2026-10-01
order: 2026100108
summary: One general mode, Clarity-only quick-entry forms and explicit source navigation accepted; parser and history proposals remain under review.
---
# 1 October 2026 — Omni-input and source navigation

In the second adoption-interview round, the user made the no-Ask/Agent requirement explicit: one general mode for everything, with agent/model and effort selectors. [D118](../decisions/index.md#d118-agent-and-effort-selection-in-the-redesign-1-october-2026) now records this as an ongoing rule rather than a first-release omission.

Q6A limits omni-input to Clarity's harness, excluding other Mac applications/files. Q7A selects compact prefilled forms with explicit submission for typed quick actions. The user asked how intents should be detected, including regex rules and smarter alternatives. [D119](../decisions/index.md#d119-omni-input-and-search-direction-1-october-2026) and the [shared UI topic](../foundations/desktop-stack.md#redesign-omni-input-and-search) distinguish these accepted boundaries from a proposed command catalog, aliases/fuzzy matching, field parsing and optional agent-assisted interpretation. No parser dependency was installed or implementation selected in this discussion.

The user likes the context panel but identified implicit departure from Chat as bad UX. [D121](../decisions/index.md#d121-source-inspection-preserves-chat-1-october-2026) requires inspection to stay in Chat, with explicit “Open in <module>” actions for module navigation from those surfaces. Back/Forward controls were suggested tentatively. Q8C still requests a concrete example before choosing the panel interaction, so general positive feedback is not treated as approval of all proposed details.

An external, dependency-free [source-preview example](../references/technical-spikes.md#source-preview-and-navigation-example-1-october-2026) now runs separately at `http://127.0.0.1:4319`. It demonstrates citation previews, explicit Notes/Todos opening, and proposed Back/Forward history. Browser checks retained Chat during inspection and restored its draft and exact scroll offset after navigation. The [dated run](../verification/runs/2026-10-01T121000Z-source-preview.md) owns source hashes, observations, proof and limits. The original all-module spike and production code are unchanged.

The [open interview branches](../discussions/open-questions.md#cursor-redesign-adoption-interview) retain automation inputs, exact panel behavior, history scope and interpretation/search policy. Prior questions are not answered by silence or by a working demonstration.
