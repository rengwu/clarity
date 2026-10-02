---
title: Wiki / knowledge base
section: Features
status: Current
updated: 2026-10-02
order: 80
summary: Organized knowledge created at the user's request and maintained by agents.
---
# Wiki / knowledge base

Stable ID: **FEAT-wiki**.

## Current specification · 1 October 2026

**Accepted behavior:** one knowledge base, separated by topic, maintained by agents at the user's request. Keep a single topic/idea/feature/event together on one page; split only when the contents are sufficiently different to justify it. Notes remains the human's writing area.

Store authoritative Markdown under `Wiki/` in the data root. The Wiki screen is a webview of generated `Wiki/index.html`, with topic navigation and title/content search. Users can open the same HTML directly in a browser. There is no direct in-app wiki editor: request changes through Chat or configured Automations. External file edits are reflected while Clarity runs.

### Reader and editing contract

Generate a self-contained reader from the Markdown at startup, after wiki module mutations, and on Markdown watcher changes. HTML is derived output, never the only content copy. The implementation uses GFM parsing and HTML sanitization, embeds eligible local wiki images as data URLs, supports relative `.md` and heading links, and strips scripts/event handlers. External images are not automatically loaded. The planning reader under `docs/wiki/` is a separate tool, not this user's knowledge base.

Operations are `list(query?)`, `read(path)`, `create(folder?,title?)` for an empty page, `write(path,text,version)`, `embed(path,attachmentId,version)`, `move(path,to)`, `folder(path)`, and `remove(path)`. `version:null` is permitted only to create a new page; existing pages require a fresh content version. Agent mutations follow the [approval checklist](../foundations/chat.md#automatic-approval-checklist); `wiki.write` covers creating or editing page content. Unchecked methods enter review. Scheduled maintenance can write its configured topic without a separate per-write prompt. The earlier custom per-thread wiki grant is superseded by D60. Deletions use Trash; embedding chat files creates independent persistent relative-linked copies.

### Evidence and maintenance

Use ordinary clickable source references in factual additions. Preserve conflicting evidence and give newer evidence greater weight; do not treat newer as automatically true. Scheduled work follows plain-language source instructions and processes new app state from enablement, with older input only when requested. Results stay in Automations. See [automation behavior](automations.md).

Local source links resolve through the canonical item URLs described below, closing the previously recorded D85 navigation gap. Unsupported URLs are not silently converted into mutations.

Acceptance checks cover new/existing topic writes, stale-version rejection, reader rebuilds, page/heading navigation, sanitized content, text search, and persistent embedded assets. A rebuild must retain the content as files even if the renderer technology changes.

### Usability fixes · 1 October 2026

The embedded reader receives the selected System/Light/Dark theme and sets its own foreground and background; explicit Dark stays readable on a light system and conversely. The independent HTML reader follows the system when no theme query is supplied. Search shows no matches; a missing page is reported instead of silently opening another topic.

Canonical local source links use `clarity://item/<module>?id=<encoded-id>`, or `?path=<encoded-relative-path>` for Notes/Wiki. Music also carries `source` and `type`. The iframe sends navigation to its host, which validates the module/path and opens the specific item without performing a mutation. Disabled modules and missing records have explicit feedback. In a standalone browser, these links use the packaged app's registered `clarity` URL scheme. Relative wiki pages/headings and external web links retain their existing behavior.

Ask in chat carries the current wiki page into a removable composer chip and the eventual user message (`About Wiki/<path>:`). It does not send a request immediately. Preserve pending chat text and attachments. Check theme mismatch, wiki cross-links/headings, item navigation, and current-page handoff.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

The in-app generated reader now uses the shared neutral light/dark surfaces, compact navigation and system typography. Its page selections feed shared navigation history; a small parent/iframe message bridge preserves page reading offsets. Existing Markdown ownership, sanitized rendering, cross-module links and standalone HTML export remain.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The in-app reader uses a 35px toolbar with Pages, the current filename, compact Ask in chat and Open in browser controls. The derived HTML has a 220px topic pane, 26px links, 28px search and a continuous pane divider. Selected pages use the shared neutral highlight; content uses 14px reading type, 26px page titles and bounded padding. It follows Clarity theme and reduced-motion preferences, including a 160ms page change when motion is enabled. `wiki-style.ts` owns the generated reader styles; standalone browser opening remains supported without app services. Markdown, history, anchors, sanitization and read-only task marks remain intact.

### Adversarial fixes · 2 October 2026

Cross-page heading links retain their fragment through frame/parent synchronization (QA06). The destination heading is visible after navigation settles. Back/Forward and leaving/returning to Wiki preserve the reading position; hidden-frame scroll events must not replace the visible page’s saved offset. Later heading clicks must not inherit a stale restoration offset. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-renderer.mjs`: click a real relative `Deep.md#details` link below the first viewport; assert the fragment and heading position after synchronization, Back/Forward and leaving/returning to Wiki. Revisit and click another heading to check stale-offset isolation. Keep the existing Wiki asset, search and item-link checks. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Settings → explicit Dark on light system → Wiki → page/source link → Ask in chat. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Verify real iframe foreground/background, cross-module links and missing-item feedback, then a removable current-page chip in Chat. Existing integration checks retain relative wiki pages/headings. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Cloudflare OS reassessment · 27 September 2026

**Actual Markdown files, viewable in Clarity, are confirmed ([D57](../decisions/index.md#d57-notes-and-wiki-are-real-files-27-september-2026)).** Keep one topic-organized knowledge base and the local HTML reader. Notes receive direct in-app editing; wiki remains edited through AI as previously agreed.

Keep knowledge content separate from maintained application code. Approvals now follow upstream behavior under [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026); do not add a separate system merely to reproduce the earlier saved-thread grant.

### Stated intent

Include a simple knowledge base. Keep it simple for now.

Wiki is organized knowledge that agents maintain at the user's request. For example, a user researching a particular topic can ask an agent to create a wiki for it. Once created, the wiki is ideally fully maintained and updated by the agent. See [D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026).

This differs from [notes](notes.md), which are the human's writing space even though agents may edit them. Wiki changes are requested through AI; there is no direct user editing in the wiki UI for now.

### Organization and reader

**Accepted from the user ([D31](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026)):** one knowledge base, separated by topic. Keep a single topic, idea, feature, function, or event together on one page. Split only when necessary and warranted because the material is sufficiently different. Do not create separate pages merely for individual subheadings or each new update.

The module is a single webview targeting local `index.html`. Users browse the HTML as they would in a browser, following the planning-wiki reader approach. They request changes by asking AI to edit the knowledge base. No separate native wiki editor or collection of independent wiki readers is needed.

Earlier references to creating or selecting a wiki for a topic now mean that topic's content within the shared knowledge base. Topic maintenance should target the relevant content; actual access and approval behavior follows the platform.

**Assistant implementation proposal:** after an agent changes source content, refresh the generated reader and reload the webview while retaining the current page. This is a reader-update approach to validate later, not a storage decision for other modules.

### Maintenance behavior

#### During research in chat

Maintain the relevant topic as research happens in chat, using Cloudflare OS approval behavior under [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026). The earlier Yes/No prompt and saved-thread grant mechanics from D27/D29 are set aside for current implementation. The topic-maintenance intent remains; adopting upstream does not automatically approve every file write.

Validate that file operations respect the platform's approval outcome. If this prevents the intended lean maintenance experience, raise the concrete mismatch before adding custom permission machinery.

#### Scheduled maintenance

In [Automations](automations.md), users can schedule updates to a selected topic in the knowledge base. Each run explores only new app state and updates the topic when it finds new relevant information. This is the user's chosen meaning of updating from the latest available information in this workflow; it does not establish a separate web-crawling task. See [D28](../decisions/index.md#d28-scheduled-wiki-updates-from-new-app-state-25-september-2026), clarified by D31's single-knowledge-base organization.

The ongoing agent must be able to compare new information against the target wiki. **Assistant proposal:** treat the existing wiki as the comparison baseline, while restricting discovery to app-state changes since the last successful run. Define whether edits, deletions, and newly imported material all count as new state.

#### Feasibility and quality — assistant assessment

The maintenance and scheduling flows remain feasible in principle. Reliable unattended maintenance takes more work than the controls themselves. Important design tasks are:

- Distinguish relevant evidence from tentative chat ideas, outdated statements, or unsupported conclusions; retain source references and uncertainty.
- Track which source changes each wiki has processed so runs need not reread all app content. Advance progress only after a successful update or completed no-change evaluation.
- Avoid processing the updater's own edits and summaries as new research, or duplicating information after retries.
- Coordinate chat updates and scheduled updates to the same topic so a stale draft does not overwrite newer work.
- Offer a concise change record and a way to undo an unwanted revision.

These are implementation considerations and proposals, not a selected database, scheduler, or automatic research policy. If no relevant new app information exists, an unchanged wiki is the correct outcome.

Under [D30](../decisions/index.md#d30-lean-by-default-25-september-2026), choose intentionally simple behavior for these cases and surface any complexity before adopting it. The considerations above are not a mandate to build a general workflow engine or a comprehensive revision system.

### Open questions

- How should scheduled maintenance behave when upstream review is pending?
- How should edits/deletions and successful input progress be tracked? Source instructions and the enablement baseline are settled by D74.
- How should changes and the state of the research be shown? Source references are ordinary clickable links (D85).
- How should navigation group topics within the single HTML reader?
- Should this planning notebook eventually open in the in-app wiki?

### Reference notes

This proposed app module is distinct from the planning wiki being created now.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

### Accepted input and evidence rules · 27 September 2026

D74 settles the initial input scope: specify sources in plain-language automation instructions, starting with relevant chats, notes, and bookmarks as available. No extra selector UI. Only changes from enablement are initially eligible; the existing topic provides context. Older material is processed only on request. Normal chat access and board opt-in remain unchanged.

D75 settles contradictions: keep references to both sides and note disagreements unless the new source clearly corrects the earlier one. Give newer evidence greater weight without treating recency alone as proof. Use ordinary topic prose, not a separate conflict interface.

**Accepted (D85):** factual additions include ordinary clickable references to relevant source chats, notes, bookmarks, or webpages. Keep the links in the wiki content without introducing a separate evidence-tracking system. This does not expand source-discovery scope or authorize independent web research.

Scheduled output belongs in Automations (D76). Precise progress tracking, treatment of deleted sources, and implementation of internal source links remain open.

### Search and deletion · 27 September 2026

**D89:** provide simple text search across wiki titles and content in the reader.

**D90:** AI-requested deletion moves the Markdown file to the data root's Trash for manual recovery through Finder. Automatic expiry is requested, with 30 days suggested. Keep upstream approvals. This does not add a direct wiki editor or establish cascading deletion of source evidence or media. See [retention](../foundations/folders.md#trash-and-retention-27-september-2026).

### Attachments embedded from chat · 28 September 2026

D100: deliberately embedding a chat attachment here creates a separate persistent module-owned asset under the data root, linked relatively. Chat-attachment cleanup after 90 days removes only the chat copy. Merely mentioning or summarizing a file does not preserve its original. No new media-management screen is implied.
