---
title: 29 September 2026 — Wiki rebuild specification
section: Journal
status: Recorded
updated: 2026-09-29
order: 2026092903
summary: Treat the wiki as a maintained rebuild specification and reconcile it with the local app.
---
# 29 September 2026 — Wiki rebuild specification

The user asked that Clarity's wiki always stay current because the app may later be rebuilt entirely from it. [D105](../decisions/index.md#d105-wiki-as-rebuild-specification-29-september-2026) records that requirement. Workspace instructions now make topic, decision, journal, implementation-report, and generated-reader maintenance part of completing meaningful work.

An audit compared current source, tests, and delivery documentation against the topic pages. Several still described packaging, file layout, subscription routing, storage, music engines, and basic module behavior as undecided. Current specifications now appear first, with older research/discussion explicitly historical. The home page provides a rebuild reading order. The implementation report includes runtime boundaries, schemas, operation/approval contracts, dependencies/build steps, and acceptance criteria that can be read without the conversation or source code.

The audit also made gaps explicit: scheduled Linkding refresh is accepted but absent; existing imported URLs do not receive upstream updates; chat action results open modules rather than exact items; wiki citations lack general cross-module navigation. Full GFM remains the target despite incomplete conformance coverage. Trash retains basenames but no original-folder restore manifest. These findings do not reduce accepted scope and were not fixed by this documentation change.

Preserved limitations include real-device location, fresh OAuth/expiry, live external accounts and Spotify playback, unmeasured browser performance parity, and unverified separate-machine/Linux use. Existing local/live-Codex evidence remains distinct from fixtures and earlier throwaway spikes.

Only documentation and the generated planning reader changed in this work. Existing app changes were preserved. The wiki build/check validates metadata, links, anchors, and freshness; it does not verify app behavior or make the specification a byte-for-byte source backup. Continue updating current topics and gaps alongside future work; historical journal entries remain intact.

Validation: rebuilt and checked all 97 pages and their internal links/anchors; cross-checked the dependency versions against the current build inventory; checked the documentation diff and repository dependency-file restrictions. App tests were not rerun for this documentation-only change; their existing evidence retains its recorded date and limits.
