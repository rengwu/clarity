---
title: Wiki / knowledge base
section: Features
status: Exploring
updated: 2026-09-27
order: 80
summary: Organized knowledge created at the user's request and maintained by agents.
---
# Wiki / knowledge base

## Cloudflare OS reassessment · 27 September 2026

**Actual Markdown files, viewable in Clarity, are confirmed ([D57](../decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026)).** Keep one topic-organized knowledge base and the local HTML reader. Notes receive direct in-app editing; wiki remains edited through AI as previously agreed.

Keep knowledge content separate from maintained application code. Approvals now follow upstream behavior under [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026); do not add a separate system merely to reproduce the earlier saved-thread grant.

## Stated intent

Include a simple knowledge base. Keep it simple for now.

Wiki is organized knowledge that agents maintain at the user's request. For example, a user researching a particular topic can ask an agent to create a wiki for it. Once created, the wiki is ideally fully maintained and updated by the agent. See [D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026).

This differs from [notes](notes.md), which are the human's writing space even though agents may edit them. Wiki changes are requested through AI; there is no direct user editing in the wiki UI for now.

## Organization and reader

**Accepted from the user ([D31](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026)):** one knowledge base, separated by topic. Keep a single topic, idea, feature, function, or event together on one page. Split only when necessary and warranted because the material is sufficiently different. Do not create separate pages merely for individual subheadings or each new update.

The module is a single webview targeting local `index.html`. Users browse the HTML as they would in a browser, following the planning-wiki reader approach. They request changes by asking AI to edit the knowledge base. No separate native wiki editor or collection of independent wiki readers is needed.

Earlier references to creating or selecting a wiki for a topic now mean that topic's content within the shared knowledge base. Topic maintenance should target the relevant content; actual access and approval behavior follows the platform.

**Assistant implementation proposal:** after an agent changes source content, refresh the generated reader and reload the webview while retaining the current page. This is a reader-update approach to validate later, not a storage decision for other modules.

## Maintenance behavior

### During research in chat

Maintain the relevant topic as research happens in chat, using Cloudflare OS approval behavior under [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026). The earlier Yes/No prompt and saved-thread grant mechanics from D27/D29 are set aside for current implementation. The topic-maintenance intent remains; adopting upstream does not automatically approve every file write.

Validate that file operations respect the platform's approval outcome. If this prevents the intended lean maintenance experience, raise the concrete mismatch before adding custom permission machinery.

### Scheduled maintenance

In [Automations](automations.md), users can schedule updates to a selected topic in the knowledge base. Each run explores only new app state and updates the topic when it finds new relevant information. This is the user's chosen meaning of updating from the latest available information in this workflow; it does not establish a separate web-crawling task. See [D28](../decisions/index.md#d28-scheduled-wiki-updates-from-new-app-state-25-september-2026), clarified by D31's single-knowledge-base organization.

The ongoing agent must be able to compare new information against the target wiki. **Assistant proposal:** treat the existing wiki as the comparison baseline, while restricting discovery to app-state changes since the last successful run. Define whether edits, deletions, and newly imported material all count as new state.

### Feasibility and quality — assistant assessment

The maintenance and scheduling flows remain feasible in principle. Reliable unattended maintenance takes more work than the controls themselves. Important design tasks are:

- Distinguish relevant evidence from tentative chat ideas, outdated statements, or unsupported conclusions; retain source references and uncertainty.
- Track which source changes each wiki has processed so runs need not reread all app content. Advance progress only after a successful update or completed no-change evaluation.
- Avoid processing the updater's own edits and summaries as new research, or duplicating information after retries.
- Coordinate chat updates and scheduled updates to the same topic so a stale draft does not overwrite newer work.
- Offer a concise change record and a way to undo an unwanted revision.

These are implementation considerations and proposals, not a selected database, scheduler, or automatic research policy. If no relevant new app information exists, an unchanged wiki is the correct outcome.

Under [D30](../decisions/index.md#d30-lean-by-default-25-september-2026), choose intentionally simple behavior for these cases and surface any complexity before adopting it. The considerations above are not a mandate to build a general workflow engine or a comprehensive revision system.

## Open questions

- How should scheduled maintenance behave when upstream review is pending?
- How should edits/deletions and successful input progress be tracked? Source instructions and the enablement baseline are settled by D74.
- How should changes and the state of the research be shown? Source references are ordinary clickable links (D85).
- How should navigation group topics within the single HTML reader?
- Should this planning notebook eventually open in the in-app wiki?

## Reference notes

This proposed app module is distinct from the planning wiki being created now.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

## Accepted input and evidence rules · 27 September 2026

D74 settles the initial input scope: specify sources in plain-language automation instructions, starting with relevant chats, notes, and bookmarks as available. No extra selector UI. Only changes from enablement are initially eligible; the existing topic provides context. Older material is processed only on request. Normal chat access and board opt-in remain unchanged.

D75 settles contradictions: keep references to both sides and note disagreements unless the new source clearly corrects the earlier one. Give newer evidence greater weight without treating recency alone as proof. Use ordinary topic prose, not a separate conflict interface.

**Accepted (D85):** factual additions include ordinary clickable references to relevant source chats, notes, bookmarks, or webpages. Keep the links in the wiki content without introducing a separate evidence-tracking system. This does not expand source-discovery scope or authorize independent web research.

Scheduled output belongs in Automations (D76). Precise progress tracking, treatment of deleted sources, and implementation of internal source links remain open.

## Search and deletion · 27 September 2026

**D89:** provide simple text search across wiki titles and content in the reader.

**D90:** AI-requested deletion moves the Markdown file to the data root's Trash for manual recovery through Finder. Automatic expiry is requested, with 30 days suggested. Keep upstream approvals. This does not add a direct wiki editor or establish cascading deletion of source evidence or media. See [retention](../foundations/folders.md#trash-and-retention-27-september-2026).

## Attachments embedded from chat · 28 September 2026

D100: deliberately embedding a chat attachment here creates a separate persistent module-owned asset under the data root, linked relatively. Chat-attachment cleanup after 90 days removes only the chat copy. Merely mentioning or summarizing a file does not preserve its original. No new media-management screen is implied.
