---
title: Bookmarks
section: Features
status: Exploring
updated: 2026-09-27
order: 70
summary: Searchable local bookmarks with five fields and optional X and linkding integrations.
---
# Bookmarks

## Cloudflare OS reassessment · 27 September 2026

The owned bookmark list, read-only Linkding import, and read-only X access remain. Electron may host the browser session needed for X refresh, but hidden collection is still unvalidated and is not supplied merely by adopting Cloudflare OS. Hosting and local collector lifetime must be resolved before promising background refresh.

These are adaptation notes, not acceptance of new features or removal of the retained behavior below.

## Stated intent

Save bookmarks locally. Also allow bookmarks to be sourced from X and a linkding instance, using Lucia as a reference.

## Accepted scope

**Accepted from the user ([D40](../decisions/index.md#d40-local-bookmark-list-and-fields-25-september-2026)):** keep Clarity's own bookmarks in a searchable list. Users can add links and open them in the browser. Each bookmark has:

- Title
- URL
- Description
- Tags
- Created date

Chat can retrieve bookmarks, as already accepted under D17. These fields do not imply additional separate notes, previews, or archived page content.

## Integrations

Local bookmarks work independently of optional Linkding and X connections.

**Accepted ([D41](../decisions/index.md#d41-linkding-one-way-import-and-refresh-25-september-2026)):** follow Lucia for Linkding: instance URL and API token, one-way import with manual/scheduled refresh, no writes back, and retain imported records after disconnect. Exact interval and local editing of imported fields remain open.

**Accepted ([D42](../decisions/index.md#d42-read-only-x-integration-25-september-2026)):** X access is read-only, including no like/unlike actions. The current investigation is bookmark reading; this does not add likes ingestion, notifications, or DMs. No X access method has been selected.

## Lucia reference findings

The user clarified that Lucia is `~/Desktop/Projects/john-harness`. Source inspection on 25 September 2026 found:

- **Linkding:** connect using an instance URL and API token. Import both regular and archived bookmarks, including title, URL, description, notes, tags, and source added date. Description and notes are combined into the imported body.
- **Direction:** the connector permits only GET requests to the allowed source endpoints. It does not write changes back to Linkding.
- **Refresh:** the Settings UI offers manual sync and a configurable interval. Imports update existing records by source and external ID; changed source fields replace the previously imported values. Disconnect removes the credential and stops sync, retaining imported records.
- **X:** the source capability is unavailable and no X sync handler is present. The README explicitly marks the connector deferred. Clarity's requested X integration remains unresolved; Lucia does not provide a working implementation to reuse.

Evidence: `internal/harness/connectors.go` (`SourceTransport.RoundTrip`, `Syncer.linkding`), `sources.go` (capabilities and disconnect), `items.go` (`upsertItems`), `api.go` (sync scheduling), `web/src/views/Settings.tsx`, and `README.md`. This was source inspection only; no live connection was tested. These observations do not adopt Lucia's additional UI features or storage stack.

**Complexity to resolve:** repeated imports plus local edits to the same fields need an ownership rule. X access needs separate feasibility work. Neither is resolved merely by referencing Lucia.

## X feasibility research · 25 September 2026

### Official API

**Researched:** X documents private bookmark retrieval for the authenticated user via `GET /2/users/{id}/bookmarks`. Its [lookup quickstart](https://docs.x.com/x-api/posts/bookmarks/quickstart/bookmarks-lookup) requires a developer app and user authorization with `bookmark.read`, `tweet.read`, and `users.read`. No write scope is needed for that flow.

[OAuth PKCE documentation](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code) supports native public clients, without embedding an app secret. `offline.access` enables refresh tokens for staying connected. **Assessment:** this fits a desktop integration without requiring a hosted Clarity service for the data reads; the native callback and account setup still need validation.

The [endpoint reference](https://docs.x.com/x-api/users/get-bookmarks) supports pagination and up to 100 results per page. It returns Post data, not Clarity's five-field bookmark shape. The inspected schema exposes the post's creation date but no documented bookmark-save timestamp. Do not label a post date as the date the user saved it. Complete historical coverage has not been tested. The quickstart and generated reference also differ in some field parameter names; verify the live contract before implementation.

**Cost/setup concern:** [X pricing](https://docs.x.com/x-api/getting-started/pricing) is prepaid pay-per-use. Own bookmarks qualify for $0.001 per returned resource when the authenticated user also owns the developer app: approximately $1 for 1,000 eligible resources. This discount cannot be assumed for a shared Clarity app serving other users. Standard Post reads are listed at $0.005 each; extra resources and later refreshes can add charges. Confirm actual endpoint pricing in the developer console before enabling imports.

### Lucia's unofficial route

**Local evidence:** `john-harness/investigations/REPORT.md` describes Twikit bookmark pagination tests with mocked responses and stubbed signing. Live validation was deferred after the user encountered a temporary login limit. No authenticated bookmark reads succeeded in that investigation; its passing tests are not evidence of working live access.

[Twikit](https://github.com/d60/twikit) uses X's unofficial web interfaces and account sessions without an official API key. **Assessment:** session expiry, signing/query changes, and login restrictions make it a higher-maintenance choice than the documented API. Read-only behavior would need an explicit operation restriction because a browser session is not a read-scoped token. No session capture or login retry was performed here.

### Earlier official-API recommendation

The assistant initially recommended the official API if developer setup and charges were acceptable. The user instead requested further investigation of a lean, robust unofficial route ([D43](../decisions/index.md#d43-investigate-a-lean-unofficial-x-reader-25-september-2026)). No access method was selected. The official route remains researched background.

## Unofficial X investigation · 25 September 2026

**Conclusion from source review:** a user-started browser-assisted import is the most promising lean candidate. No inspected project establishes a maintenance-free, reliably unattended connector. No authenticated Clarity test was performed.

| Approach | Evidence inspected | Assessment for Clarity |
| --- | --- | --- |
| Direct private API client: Twikit / Bird variants | Lucia's Twikit probe; [bird-rs query-ID discovery](https://github.com/kevinmichaelchen/bird-rs/blob/f85d9ca16f24839f75e037bb6cccd53654ab3bff/docs/query-id-rotation.md) and xbird source | Background reads are possible in principle, but require session handling and changing request details. Automatic query-ID discovery still depends on X's bundle structure. More maintenance than the small command-line interface suggests. |
| Extension replays captured requests: xarchive | [Request capture](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/background.js), [request builder](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/lib/api.js), and [validation report](https://github.com/sytelus/xarchive/blob/ae9d0263617a200ce142e64fb2ddc6301ebf19cf/FINDINGS.md) | Avoids hand-entered credentials, but still replays private requests, stores captured headers, and manages IDs/features. Its regression tests do not establish live X compatibility. Useful reference, not a verified drop-in connector. |
| Read the page / observe responses the page loads | Bookmark X [DOM extractor](https://github.com/LucasDitchun/export-bookmarks-x-twitter/blob/933565f5d63ac26a05e677dd39cdbd2e72ee9613/src/content/extract-bookmarks.ts), navigation/wait code; [small response-capture exporter](https://gist.github.com/oneryalcin/fdc1111be1424f9676742005f3f4ff14) | Lets X's own page handle authentication and request construction. Requires an open browser page; DOM-only extraction can miss truncated text, while response capture can retain richer returned text. Best candidate for a narrow user-started importer. |

The original `steipete/bird` URL returned 404 during research. Inspected `openai1998/xbird` at `463510899261c7d708310b62fbbe0ef6d9b87935` and `kevinmichaelchen/bird-rs` at `f85d9ca16f24839f75e037bb6cccd53654ab3bff` as separate projects, not a verified maintained upstream. Twikit's current public head matched Lucia's already reviewed `c3b7220866f8582009fe2d1155b6fe92192a2711`; this adds no new live-validation evidence.

### What the small exporter proves and does not prove

Its author reports exporting 1,665 bookmarks in September 2026; this is an author report, not our test. Inspection confirms it wraps page `fetch`/XHR, reads returned data, scrolls, and exports locally without reconstructing request signatures.

It is not suitable to copy unchanged: its broad Bookmark/History filter can collect unrelated history such as likes; entering an already-loaded page misses cached initial results; roughly 12 seconds without new IDs is treated as finishing even if the page stalled. It also skips unavailable records. These are concrete reasons to narrow and validate a collector, rather than treating a short script as proven robust.

### Refresh interaction and limits

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

## Open questions

- What Linkding refresh interval is appropriate, and may imported fields be edited locally?
- How should duplicate URLs and deleted source items behave?
- Can invisible refresh use the same lean collector reliably, with visible refresh as the accepted fallback?
- Can the selected desktop shell support page response capture and login without disproportionate integration code?
- For imported items, does created date retain the source date or record when added to Clarity?

## Reference notes

[X](https://x.com/) and [linkding](https://github.com/sissbruecker/linkding) are requested sources. Lucia was found under `john-harness` after the user's path correction. Linkding reference code and X documentation/prior probes have been inspected. Neither integration has been live-tested for Clarity. See the [reference register](../references/index.md).

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
