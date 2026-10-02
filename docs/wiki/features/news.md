---
title: News
section: Features
status: Current
updated: 2026-10-02
order: 60
summary: Headlines from chosen sources, with articles opening in the browser.
---
# News

Stable ID: **FEAT-news**.

## Current specification · 1 October 2026

Show headlines from selectable, user-customized sources; open articles in the user's browser. RSS and Atom feeds are the selected lean source format under D103. Sources have a name and HTTP(S) URL. Users add/remove sources, refresh, filter by source, and open a headline. Chat can list/summarize collected news.

Persist sources in `news-sources` and collected headlines in `news`. Refresh fetches up to 100 items per feed and retains up to 2,000 newest items by published date. Keep article URL, title, source identity, and published time; article bodies/descriptions are not stored. Surface individual source failures while allowing others to refresh. Refresh is explicit; no automatic external crawling or recommendation system is implemented.

Module operations are `list {query?}`, `sources`, `addSource {title,url}`, `removeSource {id,revision}`, and `refresh`. Source changes and refresh each have a separate option in the [approval checklist](../foundations/chat.md#automatic-approval-checklist); unchecked actions through the agent enter review. News can supply newly collected local state to wiki automations, which does not mean those jobs discover arbitrary new web articles automatically.

Validate RSS/Atom parsing with controlled feeds, duplicates/retention, source errors, and browser-opening behavior. Full article storage, a separate reader, paywall handling, and provider-specific news integrations are outside the selected scope.

### Usability fixes · 1 October 2026

Source creation guards overlapping submissions. Validation and request errors render inside the News sources dialog, and source removal requires confirmation there. Loading, an empty source/article list, and source-filter results are explicit. Item links clear the source filter and reveal the matching headline. The collection's existing 2,000-headline retention policy remains distinct from renderer pagination; loading all retained rows does not create an archive.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Headlines use compact single-line rows with source/time metadata, truncation plus a full-title tooltip, and about 36px row height. Search headlines filters the already-loaded local headlines alongside the source selector. Refresh and browser article opening retain their existing service boundaries. Long excerpts are omitted from the list to show more headlines.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

Headlines use 36px whole-row buttons with 2px gaps: source icon, one-line title, source name, compact published date and external-link icon. Titles truncate rather than allocate a paragraph per headline; the full title remains accessible. Search and source filters share a compact toolbar. Sources and Refresh use the shared SVG controls. Hover and keyboard focus suppress both neighbouring separators without curved bottom borders.

### Adversarial fixes · 2 October 2026

RSS/Atom headlines decode ordinary XML and numeric entities into sanitized plain text (QA10). Markup/scripts are removed and feeds declaring DOCTYPE/ENTITY remain rejected. Refresh repairs a changed existing title using its revision while preserving ID, original creation/published dates and import counts. Mixed source failures remain visible without losing successful headlines. Source removal requires `{id,revision}` and rejects missing/malformed/stale revisions (QA07). Historical encoded article URLs are not separately migrated. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-services.mjs`: add local HTTP fixtures through native Sources, Refresh and inspect visible/stored titles. Include RSS/Atom ampersands, numeric Unicode, CDATA, encoded markup, rejected declarations, duplicate refresh, existing-title repair and a failing HTTP 503 source. Verify source removal with its revision and reopen/reload the native view. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** News → Sources → enter invalid feed URL → Add source. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. The live dialog exposes a named alert inside the active modal, with no inaccessible toast; the existing integration/core tests also exercise source creation and controlled feed refresh. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Stated intent

Allow users to select and customize news sources.

### Accepted scope

**Accepted from the user ([D38](../decisions/index.md#d38-news-headlines-and-browser-reading-25-september-2026)):** a headline list from user-chosen sources is sufficient. Opening an article takes the user to the browser. Chat can summarize news headlines, as already accepted under D17.

Source formats and configuration remain undecided. RSS/Atom subscriptions are an assistant proposal, not an accepted limitation on sources. An in-app article reader, article archiving, and offline article reading are outside the agreed initial scope.

### Open questions

- Which sources and source types should users be able to add, and how?
- How should headline refresh work?

### Reference notes

No news implementation was named.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
