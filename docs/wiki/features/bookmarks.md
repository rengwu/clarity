---
title: Bookmarks
section: Features
status: Current
updated: 2026-10-03
order: 70
summary: Searchable local bookmarks with five fields and optional X and linkding integrations.
---
# Bookmarks

Stable ID: **FEAT-bookmarks**.

## Current specification · 1 October 2026

Clarity owns a searchable local bookmark list: title, URL, description, tags, and created date. Users add, edit, delete, and open links. Optional Linkding and X sources import into that same list; source playlists or social actions are not part of this module.

Records live in `bookmarks` with the five user-facing fields and common ID/timestamps/revision. Imported rows may also have `source` and `sourceCreatedAt`. Local `createdAt` means first saved/imported into Clarity; X post creation time is not the time the user bookmarked it. Methods are `list {query?}`, `add`, `update`, `remove`, `refreshLinkding`, and `refreshX`. Existing-record changes use revisions. Add, update, remove, Linkding import, and X import each have a separate option in the [approval checklist](../foundations/chat.md#automatic-approval-checklist); unchecked agent mutations require review.

### Linkding

Follow Lucia's one-way refresh behavior (D41). Connect the instance's HTTP(S) address and API token; preserve local bookmarks when disconnected. Read pages of 100, up to 100 pages per refresh, rejecting next-page links on another origin and HTTP redirects. Surface truncation rather than imply complete upstream history. No write-back or removal based on absent upstream records is performed.

New imports are identified by source origin plus remote ID; skip a URL already owned by another local bookmark. Retain legacy `linkding-<id>` rows for their original connection. Store `sourceOrigin` and a `sourceValues` snapshot of title, URL, description and tags. On later refresh, compare each local field to its previous source value: update fields that are unchanged locally, preserve fields edited locally, and save the new source snapshot. Check record revisions and retry a concurrent edit before committing. For legacy rows without a source snapshot, revision 1 is treated as unedited; conservatively preserve differing fields on already-edited rows. A local value explicitly made equal to the latest source value can follow subsequent source changes again.

Refresh is single-flight, including overlapping human/agent/scheduled requests. Results count imported, updated, locally preserved, and unchanged records; a row may count as both updated and locally preserved if different fields have different owners. Persist last attempt/result/error in `connection-state/linkding`; partially imported successful rows remain if a later page fails. Credentials survive ordinary request failures.

Settings offers Manual (default), Every hour, or Every day (`linkdingRefreshMinutes` = 0/60/1440). Poll once a minute while Clarity is running and the module/connection are enabled. Start the next interval on launch, enablement or interval change; do not replay closed-app intervals. At most one due refresh runs after an open-app suspension, with the next interval advanced from that check. Disconnect/disable stops future scheduling; Quit stops the timer and awaits active work before closing storage. There is no separate background service. Controlled HTTP fixtures verify reconciliation, scheduling, overlap and shutdown; a real Linkding instance remains unvalidated.

### X

Read-only bookmark import, without like/unlike or bookmark mutation. Settings → X bookmarks → **Open X** opens `https://x.com/i/bookmarks` in the OS default browser, using the existing `external.open` → Electron `shell.openExternal` path. Do not pick a browser executable or create an automation profile for this action. The default browser can use its own existing X login. Opening the page does not connect the importer.

**Sign in for import** is the separate retained action for the existing importer: sign in using its visible persistent Chrome/Chromium profile, close it, then Refresh X in Bookmarks runs headlessly. The Settings guidance explicitly says that the default browser's login is not shared with Clarity. Both actions use the existing submission guard, disable while pending, and report launch failures inside the X section with retry available. This distinction is a delegated implementation choice under [D128](../decisions/index.md#d128-open-x-in-the-default-browser-3-october-2026), preserving import access while honoring the requested default-browser launch.

The collector observes X's own bookmark responses while navigating/scrolling its UI; it does not hardcode one permanent private query endpoint. Up to 50 scroll steps, stopping after four unchanged steps, bounds a run. Retain captured results even when full history is not confirmed; only an explicit exhausted result establishes completion.

This is an unofficial, account-dependent route. The preferred invisible refresh is implemented, but live X compatibility and complete-history behavior remain unverified. There is no closed-app service or implicit periodic X schedule. Use [connection settings](../foundations/integrations.md) and keep failure/partial-import state honest.

#### Default-browser import boundary · 3 October 2026

The user's clarified request is to launch whichever installed browser is the OS default. That opening action is implemented; importing through that browser's existing session is still unsupported. The current collector needs the separate `.clarity/browser` profile in the data folder. Changing its sign-in URL launcher alone would leave it without authentication or access to page responses.

Research distinguishes three possible future approaches, none selected: an extension that reads an X tab and passes records to Clarity; Chrome's permission-based live-session connection; or official X API authorization through the default browser. [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) establish extension primitives, not a tested importer. [Chrome 144+ live-session access](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session) requires debugging setup and a connection prompt; it is not generic default-browser support. [Playwright's existing launcher](https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context) does not support the regular Chrome profile. [X's official bookmark API](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup) would require developer-app setup and [paid usage](https://docs.x.com/x-api/getting-started/pricing). No extension, debugging setting, account access, cookie transfer or paid service was added.

### Usability fixes · 1 October 2026

Save has a synchronous submission guard and disabled/progress state; double-clicking it creates one bookmark. Permanent deletion requires confirmation. Search distinguishes loading, no matches, and an empty library. The renderer loads every local page and item links reveal/focus the relevant bookmark after clearing search. Linkding feedback includes imported, updated, and locally preserved counts, the last attempt, errors, next scheduled run, and any upstream page limit.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Bookmark rows use compact text, 2px neighbor gaps and straight between-row separators that disappear beside hover/selection. The last row has no trailing separator. Existing edits, imports and deletion confirmation remain. Launcher Add bookmark explicitly saves through the same module validation.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The compact list uses two lines: title/tags, then domain/description/import origin. Typical rows are 56px or less, with a small bookmark glyph and an Edit icon revealed on hover or keyboard focus. Long text truncates within the available width. Straight separators are independent of the rounded hover surface, with 2px gaps and no separator after the final item. Existing edit, import and browser-opening behavior remains.

### Adversarial fixes · 2 October 2026

Save and delete completion belong to the editor generation that submitted them (QA04). Cancelling a pending save and opening another form preserves the new fields when the old request succeeds or fails; a failed active save keeps its fields for retry. Cancelling the editor while deletion is pending does not cancel the submitted deletion; its late completion must preserve a later editor draft. Accepted long tag lists are clipped within a bounded share of the row, retain full tags in a tooltip, and leave the title/open control usable without horizontal overflow (QA13). Updates/removals require a positive safe-integer revision (QA07). The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Default-browser opening:** after building, copy the [retained driver](../evidence/2026-10-02T160132Z-x-default-browser/verify-x.txt) to an external `.mjs` file and run from the repository root. Use Settings → X bookmarks → Open X through real renderer/IPC calls, intercepting only `shell.openExternal` to observe OS dispatch without opening a real account. Require the exact bookmarks URL, no managed-profile creation, local failure/retry and pending submission protection. Check the separate import action still dispatches `browser.login` (stubbed), plus reload and dark/light desktop/minimum layouts. Set `CLARITY_X_PACKAGE=1` to repeat on the cached package. Use a fresh evidence path for subsequent runs. Live OS/browser handling and X authentication remain separate from this fixture.

**Adversarial recipe:** Run `tests/adversarial-state.mjs`: hold successful and failed saves, Cancel/reopen, release the original response and inspect the newer draft; retry an active failure and double-submit without duplicates. Exercise real Delete confirmation and later reopening. At 850×600 in both themes, measure a 40-tag row and activate its title. `tests/adversarial-services.mjs` covers revision guards. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Bookmarks → Add bookmark → double-click Save; Search; Settings → Linkding. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='Linkding reconciles|UI audit regressions' tests/usability.mjs`. Verify one record, no-result state, and local connection errors. The separate Linkding test uses controlled HTTP, source edits/local annotations, overlapping calls, due time and shutdown; real accounts remain outside this recipe. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [3 October 2026: X default-browser opening](../verification/runs/2026-10-02T160132Z-x-default-browser.md) — OS dispatch, failure/retry, preserved import action and layout checks; live browser sessions excluded.

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Cloudflare OS reassessment · 27 September 2026

The owned bookmark list, read-only Linkding import, and read-only X access remain. Electron may host the browser session needed for X refresh, but hidden collection is still unvalidated and is not supplied merely by adopting Cloudflare OS. Hosting and local collector lifetime must be resolved before promising background refresh.

These are adaptation notes, not acceptance of new features or removal of the retained behavior below.

### Stated intent

Save bookmarks locally. Also allow bookmarks to be sourced from X and a linkding instance, using Lucia as a reference.

### Accepted scope

**Accepted from the user ([D40](../decisions/index.md#d40-local-bookmark-list-and-fields-25-september-2026)):** keep Clarity's own bookmarks in a searchable list. Users can add links and open them in the browser. Each bookmark has:

- Title
- URL
- Description
- Tags
- Created date

Chat can retrieve bookmarks, as already accepted under D17. These fields do not imply additional separate notes, previews, or archived page content.

### Integrations

Local bookmarks work independently of optional Linkding and X connections.

**Accepted ([D41](../decisions/index.md#d41-linkding-one-way-import-and-refresh-25-september-2026)):** follow Lucia for Linkding: instance URL and API token, one-way import with manual/scheduled refresh, no writes back, and retain imported records after disconnect. Exact interval and local editing of imported fields remain open.

**Accepted ([D42](../decisions/index.md#d42-read-only-x-integration-25-september-2026)):** X access is read-only, including no like/unlike actions. The current investigation is bookmark reading; this does not add likes ingestion, notifications, or DMs. No X access method has been selected.

### Lucia reference findings

The user clarified that Lucia is `~/Desktop/Projects/john-harness`. Source inspection on 25 September 2026 found:

- **Linkding:** connect using an instance URL and API token. Import both regular and archived bookmarks, including title, URL, description, notes, tags, and source added date. Description and notes are combined into the imported body.
- **Direction:** the connector permits only GET requests to the allowed source endpoints. It does not write changes back to Linkding.
- **Refresh:** the Settings UI offers manual sync and a configurable interval. Imports update existing records by source and external ID; changed source fields replace the previously imported values. Disconnect removes the credential and stops sync, retaining imported records.
- **X:** the source capability is unavailable and no X sync handler is present. The README explicitly marks the connector deferred. Clarity's requested X integration remains unresolved; Lucia does not provide a working implementation to reuse.

Evidence: `internal/harness/connectors.go` (`SourceTransport.RoundTrip`, `Syncer.linkding`), `sources.go` (capabilities and disconnect), `items.go` (`upsertItems`), `api.go` (sync scheduling), `web/src/views/Settings.tsx`, and `README.md`. This was source inspection only; no live connection was tested. These observations do not adopt Lucia's additional UI features or storage stack.

**Complexity to resolve:** repeated imports plus local edits to the same fields need an ownership rule. X access needs separate feasibility work. Neither is resolved merely by referencing Lucia.

### X feasibility research · 25 September 2026

#### Official API

**Researched:** X documents private bookmark retrieval for the authenticated user via `GET /2/users/{id}/bookmarks`. Its [lookup quickstart](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup) requires a developer app and user authorization with `bookmark.read`, `tweet.read`, and `users.read`. No write scope is needed for that flow.

[OAuth PKCE documentation](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code) supports native public clients, without embedding an app secret. `offline.access` enables refresh tokens for staying connected. **Assessment:** this fits a desktop integration without requiring a hosted Clarity service for the data reads; the native callback and account setup still need validation.

The [endpoint reference](https://docs.x.com/x-api/users/get-bookmarks) supports pagination and up to 100 results per page. It returns Post data, not Clarity's five-field bookmark shape. The inspected schema exposes the post's creation date but no documented bookmark-save timestamp. Do not label a post date as the date the user saved it. Complete historical coverage has not been tested. The quickstart and generated reference also differ in some field parameter names; verify the live contract before implementation.

**Cost/setup concern:** [X pricing](https://docs.x.com/x-api/getting-started/pricing) is prepaid pay-per-use. Own bookmarks qualify for $0.001 per returned resource when the authenticated user also owns the developer app: approximately $1 for 1,000 eligible resources. This discount cannot be assumed for a shared Clarity app serving other users. Standard Post reads are listed at $0.005 each; extra resources and later refreshes can add charges. Confirm actual endpoint pricing in the developer console before enabling imports.

#### Lucia's unofficial route

**Local evidence:** `john-harness/investigations/REPORT.md` describes Twikit bookmark pagination tests with mocked responses and stubbed signing. Live validation was deferred after the user encountered a temporary login limit. No authenticated bookmark reads succeeded in that investigation; its passing tests are not evidence of working live access.

[Twikit](https://github.com/d60/twikit) uses X's unofficial web interfaces and account sessions without an official API key. **Assessment:** session expiry, signing/query changes, and login restrictions make it a higher-maintenance choice than the documented API. Read-only behavior would need an explicit operation restriction because a browser session is not a read-scoped token. No session capture or login retry was performed here.

#### Earlier official-API recommendation

The assistant initially recommended the official API if developer setup and charges were acceptable. The user instead requested further investigation of a lean, robust unofficial route ([D43](../decisions/index.md#d43-investigate-a-lean-unofficial-x-reader-25-september-2026)). No access method was selected. The official route remains researched background.

### Unofficial X investigation · 25 September 2026

**Conclusion from source review:** a user-started browser-assisted import is the most promising lean candidate. No inspected project establishes a maintenance-free, reliably unattended connector. No authenticated Clarity test was performed.

| Approach | Evidence inspected | Assessment for Clarity |
| --- | --- | --- |
| Direct private API client: Twikit / Bird variants | Lucia's Twikit probe; [bird-rs query-ID discovery](https://github.com/kevinmichaelchen/bird-rs/blob/f85d9ca16f24839f75e037bb6cccd53654ab3bff/docs/query-id-rotation.md) and xbird source | Background reads are possible in principle, but require session handling and changing request details. Automatic query-ID discovery still depends on X's bundle structure. More maintenance than the small command-line interface suggests. |
| Extension replays captured requests: xarchive | [Request capture](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/background.js), [request builder](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/lib/api.js), and [validation report](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/FINDINGS.md) | Avoids hand-entered credentials, but still replays private requests, stores captured headers, and manages IDs/features. Its regression tests do not establish live X compatibility. Useful reference, not a verified drop-in connector. |
| Read the page / observe responses the page loads | Bookmark X [DOM extractor](https://github.com/LucasDitchun/export-bookmarks-x-twitter/blob/933565f5d63ac26a05e677dd39cdbd2e72ee9613/src/content/extract-bookmarks.ts), navigation/wait code; [small response-capture exporter](https://gist.github.com/oneryalcin/fdc1111be1424f9676742005f3f4ff14) | Lets X's own page handle authentication and request construction. Requires an open browser page; DOM-only extraction can miss truncated text, while response capture can retain richer returned text. Best candidate for a narrow user-started importer. |

The original `steipete/bird` URL returned 404 during research. Inspected `openai1998/xbird` at `463510899261c7d708310b62fbbe0ef6d9b87935` and `kevinmichaelchen/bird-rs` at `f85d9ca16f24839f75e037bb6cccd53654ab3bff` as separate projects, not a verified maintained upstream. Twikit's current public head matched Lucia's already reviewed `c3b7220866f8582009fe2d1155b6fe92192a2711`; this adds no new live-validation evidence.

#### What the small exporter proves and does not prove

Its author reports exporting 1,665 bookmarks in September 2026; this is an author report, not our test. Inspection confirms it wraps page `fetch`/XHR, reads returned data, scrolls, and exports locally without reconstructing request signatures.

It is not suitable to copy unchanged: its broad Bookmark/History filter can collect unrelated history such as likes; entering an already-loaded page misses cached initial results; roughly 12 seconds without new IDs is treated as finishing even if the page stalled. It also skips unavailable records. These are concrete reasons to narrow and validate a collector, rather than treating a short script as proven robust.

#### Refresh interaction and limits

**Accepted ([D44](../decisions/index.md#d44-x-refresh-visibility-preference-25-september-2026)):** the browser-assisted refresh flow is acceptable: select **Refresh X**, open an X connection page, sign in normally if needed, and collect bookmarks as the page loads/scrolls. Save the observed bookmarks locally and close the window when finished. The user prefers invisible background refresh if possible; visible refresh remains an acceptable fallback.

**Implementation proposal:** observe the page's bookmark responses so X handles its own request construction. Keep the same collector for visible and hidden operation if the chosen shell supports both simply. Show the connection page when user sign-in or intervention is necessary. Do not extract account cookies into a separate CLI credential store merely to make the reader work. These mechanics remain subject to validation.

The preference for invisible refresh does not define an automatic schedule, operation while Clarity is closed, or a separate background service. Those behaviors have not been selected.

An embedded connection window versus an existing-browser extension remains an implementation choice. Response observation and persistent login must be verified in the eventual desktop shell; this research does not select Electron, WebKit, a browser engine, or an extension requirement. Installing a whole separate browser-automation service solely for bookmarks would require another complexity discussion.

Proposed minimum reliability behavior for a candidate prototype:

- Attach collection before the initial bookmark response, and accept only verified bookmark operations/entries; exclude likes, other history, and quoted posts as separate bookmarks.
- Deduplicate by post ID within the connected account and preserve saved records when a refresh is partial. Absence in a scan is not proof of deletion.
- Save received pages as progress. Stop on login challenges, rate limits, unsupported response shapes, or stalled loading; distinguish partial results from verified end-of-list.
- Only navigate/read/scroll. The collector invokes no like, unlike, save/remove bookmark, or other account-changing controls. An ordinary X page may still make its own telemetry requests; this is not a blanket GET-only browser session.

**Material tradeoff:** hidden operation remains unverified. A future bounded live probe should compare visible and hidden operation for initial-page capture, pagination, session continuity, and interruption handling. If hidden loading or collection cannot be reliable without substantial extra machinery, use the accepted visible fallback and raise the tradeoff with the user. This does not establish unattended scheduled X sync, complete historical coverage, or immunity to X changes. No login attempt, session capture, dependency install, or application implementation occurred during this research.

Mapping into Clarity's five fields also remains a proposal: text excerpt as title, post URL, returned text as description, local tags, and first-import date explicitly defined as such. Do not invent the original bookmark-save date.

### Open questions

- What Linkding refresh interval is appropriate, and may imported fields be edited locally?
- How should duplicate URLs and deleted source items behave?
- Can invisible refresh use the same lean collector reliably, with visible refresh as the accepted fallback?
- Can the selected desktop shell support page response capture and login without disproportionate integration code?
- For imported items, does created date retain the source date or record when added to Clarity?

### Reference notes

[X](https://x.com/) and [linkding](https://github.com/sissbruecker/linkding) are requested sources. Lucia was found under `john-harness` after the user's path correction. Linkding reference code and X documentation/prior probes have been inspected. Neither integration has been live-tested for Clarity. See the [reference register](../references/index.md).

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
