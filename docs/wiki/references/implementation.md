---
title: Implementation and validation
section: References
status: Current
updated: 2026-10-03
order: 100
summary: Rebuild contracts, local runtime, data schemas, dependencies, checks, and known gaps.
---
# Implementation and validation

The user authorized building the complete agreed Clarity app under [D102](../decisions/index.md#d102-build-clarity-with-lean-defaults-28-september-2026). A first local build covers all agreed modules, with missing accepted behavior and unverified integrations identified below. This page is the engineering portion of the [rebuild specification](../index.md#rebuild-reading-order); module behavior belongs on the linked topic pages. Source paths identify the current implementation, but the contracts below stand on their own.

The [adversarial remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) closes all fourteen open QA01–QA14 findings from the [original audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) and retains QA15’s Settings correction. Three GPT-6.1 Sol agents with high reasoning worked in parallel after wiki/jstack briefing; the coordinator reviewed and froze their combined source. Both typechecks pass, the full suite has 65 passes and two gated live-Codex skips, all twenty new regression cases pass against the signed package, and relocation/restart checks pass. The tested bundle is installed at `~/Applications/Clarity.app` with its predecessor preserved; normal Quit/reopen loads it. Earlier failed evidence and live-account/OS-permission limits remain explicit.

The [global feedback research](../foundations/desktop-stack.md#global-feedback-research-and-pending-proposal) is a pending proposal. The user will select the method before implementation; this research changes documentation only and does not add a toast dependency or alter application behavior.

Board and Notes now use consistent search/list feedback spacing under the [shared contract](../foundations/desktop-stack.md#search-and-list-spacing-3-october-2026). The [spacing run](../verification/runs/2026-10-02T163455Z-list-spacing.md) records native layout checks and delivery evidence. Development and packaged layout checks, selected shared UI regressions, both typechecks and package relocation pass. The signed update is installed with its predecessor retained; normal Quit/reopen loads it.

## Architecture in the working app

Settings → X bookmarks now offers **Open X** through the OS default browser. The separate **Sign in for import** action retains the current collector's required profile, with explicit guidance that external browser login is not shared. The [Bookmarks contract](../features/bookmarks.md#x) and [focused run](../verification/runs/2026-10-02T160132Z-x-default-browser.md) cover dispatch, failure/retry and the remaining live-session limitation.

Music volume now updates during held drags and keyboard adjustments. Spotify applies the shared gain at output so already queued audio responds within Rodio's 5 ms control interval; Navidrome remains immediate. Normalization stays fixed per track. [The contract](../features/music.md#live-volume-response-2-october-2026) and [focused run](../verification/runs/2026-10-02T142157Z-volume-response.md) separate input/PCM/package evidence from unmeasured speaker or Bluetooth latency.

Music All search now groups Songs, Artists, Albums and Playlists into six-result previews with Show all. Cards identify kind and provider, and browse lists label the kind beside the artist. Existing filters, cached navigation and the independent Songs layout remain. The [search contract](../features/music.md#search-result-categories-2-october-2026) and [focused run](../verification/runs/2026-10-02T141800Z-music-search.md) record behavior, native visual/navigation checks and delivery. The signed bundle is installed with its predecessor backed up; normal Quit/reopen loads it.

Music Recently played now saves resolved collection metadata and a separate provider ID. Home repairs older incomplete references without changing playback order, preserves failed repairs for retry and protects newer plays/account changes from late writes. Spotify album metadata joins the existing page cache. The [history contract](../features/music.md#recently-played-metadata-and-repair-2-october-2026) and [focused run](../verification/runs/2026-10-02T041300Z-music-recent.md) own storage compatibility, native UI checks and delivery evidence. The tested signed update is installed at `~/Applications/Clarity.app` with the prior bundle preserved; normal Quit/reopen activates it. Live metadata recovery still depends on provider reachability.

Settings now follows the running Cursor Desktop General/Appearance screens and the earlier prototype: grouped section navigation, compact rows with right-aligned switches, responsive connection forms, theme previews and module-grouped approvals. All controls retain their existing saved behavior. The [visual contract](../foundations/integrations.md#settings-visual-system-2-october-2026) and [focused run](../verification/runs/2026-10-01T184717Z-settings-redesign.md) own exact geometry, keyboard/failure/persistence checks and delivery evidence. The signed update is installed at `~/Applications/Clarity.app`, with its predecessor retained. All 112 section/theme/window cases, eight targeted regressions, both typechecks and package relocation pass; all seven installed runtime hashes match the tested package. Normal Quit/reopen loads it.

Spotify collections now display their first page and continue as the user scrolls, with a Load more fallback and no 5,000-entry cutoff. Failed continuation keeps existing songs and retries only the missing page. A bounded main-process cache shares collection pages with the existing full playback queue, avoiding duplicate provider reads. [The collection contract](../features/music.md#large-spotify-collections-2-october-2026) owns refresh/account boundaries and the remaining wait when playback needs unfetched songs; [the focused run](../verification/runs/2026-10-01T182000Z-music-pagination.md) owns the 5,055-song fixture and package evidence. No disk cache or dependency is added.

Navidrome now reports actionable transport failures and the macOS package declares local-network access for chosen servers. Direct live authentication succeeds, while the normally launched installed app reports host-unreachable before authentication. [The connection run](../verification/runs/2026-10-01T182630Z-navidrome-connection.md) separates that diagnosis from passing Settings/stream/cache/package checks; installed recovery awaits OS access.

Music browse failures now use a compact, source-labelled notice with a separated retry action. Available playlists stay visible during retry, and successful recovery clears the notice. [The focused run](../verification/runs/2026-10-01T180000Z-music-error-layout.md) records dark/light and minimum-window checks, cache/retry behavior and package delivery. This UI fix does not diagnose the reported live connection failure.

The accepted Music volume update aligns both playback engines and adds Settings → Music → Normalize volume. Album playback preserves relative levels; playlists/shuffle use track gain. Quiet or untagged tracks are not amplified. [The focused run](../verification/runs/2026-10-01T171500Z-music-normalization.md) records native PCM/gain checks, controlled UI behavior and packaged delivery.

Spotify playlist metadata now survives the provider's boolean `track` field: envelopes unwrap at known endpoint boundaries, and the common mapper receives the raw object. Playlist detail retrieves its own name/cover and paginated songs, retained by the existing session cache. [The playlist contract](../features/music.md#spotify-playlist-details-2-october-2026) owns exact shapes, exclusions and failure behavior; [the focused run](../verification/runs/2026-10-01T164530Z-playlist-details.md) records an eight-song live reproduction/correction and package regressions. No storage or dependency change is introduced.

Music now uses a focused renderer-memory resource cache instead of the generic clear-and-reload hook. Only the selected list or collection loads; successful results and pending requests are shared across navigation. Refresh, account events, recent-history invalidation, errors and bounded retention follow the [Music cache contract](../features/music.md#browse-result-caching-2-october-2026). Successful Navidrome configuration emits an auth event after saving, including account replacement. There is no new dependency or storage migration. [The dated cache run](../verification/runs/2026-10-01T163445Z-music-cache.md) records native request-count checks, existing Music regressions and package/delivery evidence.

The external prototype’s Music Back control now makes its label and chevron one native button. [Focused browser checks](../verification/runs/2026-10-01T121353Z-music-back.md) pass for Albums, Playlists and Artist at desktop/mobile widths, nested history and Enter/Space. Reload the preview to load it; that run did not change production Music; the later production port is recorded below.

The external [Cursor Desktop browser spike](technical-spikes.md#cursor-desktop-design-spike-1-october-2026) explores a different visual treatment under D116/D117, with all modules, populated content, a compact shared design system and motion. The [compactness and controls run](../verification/runs/2026-10-01T083600Z-cursor-density.md) records browser-verified geometry, tabs, focus/separators, glyphs, row gaps and responsive controls. It is runnable with sample data; it has no connection to the production runtime. Its source, limitations, and evidence are recorded on the spike page.

The D118–D122 first port is now implemented in the native app: compact shared controls, one general Chat mode with searchable model/effort controls, Clarity-only omni-input and editable forms, section-based Settings, resizable source preview and Back/Forward. Current automation inputs and approvals remain. No data schema migration, new provider, sample-data insertion or npm dependency was added. [Shared UI/launcher contracts](../foundations/desktop-stack.md#compact-shared-design), [Chat](../foundations/chat.md#source-inspection-and-navigation) and [Settings](../foundations/integrations.md#redesign-settings-navigation) own the rebuild details. The [production run](../verification/runs/2026-10-01T142628Z-redesign-port.md) owns build-specific results and package evidence. External spikes remain standalone examples, not account-connected replacements.

The first installed redesign was rejected for incomplete spike fidelity. The [repair run](../verification/runs/2026-10-01T154700Z-redesign-repair.md) records the corrected shared motion, compact module controls, Wiki styling and Music connection feedback. Source-author checks distinguish UI/provider fixtures from actual account status; they do not imply successful live playback when a playback grant is missing. The original port and its bundle backup remain historical evidence.

The preceding 2 October Navidrome-connection package was installed at `~/Applications/Clarity.app`; the previous bundle is backed up at `~/Library/Caches/Clarity/build/Clarity-before-navidrome-20261001T182630Z.app`. Six connector/cache checks, the packaged Settings recipe, package relocation and application/Worker typechecks pass. All seven installed runtime hashes match the tested signed package, and its local-network usage description is verified. The updated normal launch now reads the existing encrypted connections without a credential warning. Navidrome still reports host-unreachable; the user’s Local Network check remains pending. [The run](../verification/runs/2026-10-01T182630Z-navidrome-connection.md) remains Untested for live installed recovery. Earlier Music reports retain their build-specific evidence.

The subsequent Music-pagination package is installed at `~/Applications/Clarity.app`; the previous bundle is preserved at `~/Library/Caches/Clarity/music-pagination-20261001T182000Z/Clarity-before-music-pagination-20261001T182000Z.app`. Thirteen selected Music/connector/cache/volume tests, five focused core tests, all three pagination tests against the signed bundle, package relocation and application/Worker typechecks pass. Development and packaged UI checks scroll through all 5,055 fixture songs. All seven installed runtime hashes match the tested package. Normal Quit/reopen loads the update. [The run](../verification/runs/2026-10-01T182000Z-music-pagination.md) records exact fingerprints, earlier build/setup failures, cache/account boundaries and validation limits. Real user data and credentials were unchanged by this run. Earlier reports retain their build-specific evidence.

- Electron and TypeScript, with a React interface. Cloudflare workerd/Miniflare provides persistent local SQLite state; Node handles actual Markdown files and account connections.
- Pi runs Codex using the existing ChatGPT subscription. The current implementation has one maintained module instance per enabled module, shared by chats.
- Cloudflare OS's scheduler and public approval contracts are vendored from commit `32ce152654e8a205b54e094e31be932c620dbc52`. Clarity selectively adapts these contracts and the queued-approval behavior. It does not run the complete upstream application, app-generation subsystem, or multi-user hosting machinery. This is a material implementation distinction from simply packaging the upstream app unchanged.
- Data is under the chosen root: `Notes/`, `Wiki/`, `Attachments/`, `Trash/`, and `.clarity/`. A machine-local bootstrap pointer remembers the root. Credentials use OS-backed encryption.
- Dependency installation and builds use an external Clarity cache. No package.json, lockfile, or node_modules is added to this repository. The standalone planning wiki's Node-only workflow stays unchanged.

## Defaults selected during implementation

| Area | Lean default |
| --- | --- |
| Browser permission | Exact-origin grants persisted on the chat; website authorization and consequential actions follow the action approval checklist, defaulting to review. This relies on agent classification, not universal read-only enforcement. |
| Time and location | Fresh device time/timezone per model request. Initial macOS location request; approximate saved coordinates with timestamp, launch refresh after a successful grant, manual fallback, and controls under Settings → Permissions (D104). |
| Browser implementation | Installed Chrome/Chromium with a separate persistent profile, batched Playwright actions, focused main-content reads. Broad research uses hosted Codex web search when available. |
| Conflicts | Preserve the external note and write the human draft to a separately named conflict copy; stale agent writes fail. |
| Interrupted work | Preserve history and mark interrupted runs; no automatic action replay. |
| Calendar | Double-click a time/day or use Event; edit an event by clicking it. Week and continuously scrollable month views include dated Todos, linked back to the task. |
| Expenses | Integer minor units with two decimal places, optional display symbol, daily entries with edit/delete. |
| News | RSS and Atom sources, explicit refresh, headlines opening externally. |
| Music | Source labels, flat libraries, combined search tab plus four type tabs; artist detail lists source albums. Spotify uses a bundled librespot audio helper; Navidrome uses the local player. |
| Attachments | Strictly below 30,000,000 bytes; 90 days from attachment time. Trash working retention is 30 days. |
| Automations | Daily/weekly local schedules, one run per automation, missed runs skipped. Changes are processed in bounded chronological batches; the cursor must not skip unprocessed input. |

## Runtime and interface contracts

The chosen implementation has three main boundaries. The React renderer displays state and captures user actions. Electron main owns filesystem access, secrets, shared modules, chat/agent runs, browser sessions, audio, and scheduling. A local workerd Durable Object persists structured records in SQLite. Start and stop them with Electron; there is no separately managed server or always-running service.

The renderer loads from `clarity://app/` with sandboxing and context isolation enabled and Node integration disabled. Preload exposes `window.clarity.call(method,args)` and event subscription through Electron IPC. Only the trusted app frame may call privileged methods. Return `{ok:true,value}` or `{ok:false,error,code?,details?}`; expose failures in the UI. Events have `{type,module?,id?,data?}`, with types `changed`, `chat`, `auth`, `playback`, and `navigate`. Files/wiki/audio use narrowly scoped custom-protocol handlers rather than exposing the data root as an unrestricted web server. The wiki reader is displayed at `clarity://wiki/index.html`.

Pi's agent tool is `module {module,method,args}`. A stable Modules service validates enablement and routes it to the same behavior used by the UI. Methods classified as reads (`list`, `read`, `sources`, `library`, `search`, `collection`, `recent`) run directly. Mutations check `settings.autoApproveActions`: selected exact IDs execute immediately; others are proposed for review. Human UI actions invoke modules directly. Browser origin authorization and consequential browser operations follow the same checklist and queue. A configured automation may write its own wiki topic directly; other writes follow the shared selection. The selected app does not require upstream Cap'nWeb, runtime-generated gadgets, or a public module REST API.

### Approval and interruption

Persist actions before presenting them. An action contains owner, module, method, arguments, description/display fields, status, and eventual result/error. Status transitions are `pending → rejected` or `pending → applying → applied/failed`. Claim `applying` with a revision check before performing the effect, so duplicate clicks cannot apply the same action twice. Tell the model a proposed action is pending, never completed. Keep action output in the owning chat or Automations page.

Automatic approval ([D109](../decisions/index.md#d109-agent-action-approval-checklist-29-september-2026)) reuses that executor and result/error persistence. The shared registry in `src/shared/agent-actions.ts` owns the 37 supported mutation IDs and checkbox labels; the [complete action map and UX contract](../foundations/chat.md#automatic-approval-checklist) are the rebuild specification. Validate/deduplicate the saved array against that registry; reject unknown IDs, wildcard values, or non-arrays. The agent cannot call settings mutations. Newly added IDs are not implicitly granted by an old Select all choice. All rows remain visible for disabled modules, without bypassing enablement or connection requirements.

For a checked action, persist `autoApproved:true` and status `applying` before execution, then store `applied` and its result or `failed` and its error. It never enters pending or offers review buttons. For an unchecked action, preserve the existing flow. Read the selection for each action and refresh it in every model request. Selection changes affect future calls only; they do not apply older pending actions or stop work already executing. Browser authorization remains per exact origin/chat and distinct from consequential-batch permission. Configured wiki-topic writes remain preauthorized for their schedule.

On startup, mark saved running chats interrupted and leftover applying actions failed with an uncertain-result explanation. Do not replay work automatically: an external effect may have happened before its result was saved. This does not promise exactly-once execution across crashes. Explicit Quit saves editor drafts and shuts down runs/profiles/storage; window close merely hides the app. A failed draft flush cancels Quit. Resume UI history without starting another model request just by opening a thread.

Chat renders messages and approval/action records together by original timestamp ([D111](../decisions/index.md#d111-chronological-chat-approvals-30-september-2026)). Merge message `timestamp` and action `createdAt`, including the live streaming message; never use an action's later `updatedAt` to place it. Stable message/card keys preserve the existing card during review. Same-time messages retain saved order and precede same-time cards; action IDs break card ties. This is renderer composition over existing records, without a storage migration. See the [Chat contract](../foundations/chat.md#chronological-action-cards).

### Context and secrets

Send recent complete turns within a bounded model-input budget while retaining the complete stored transcript. Search older chats only on request/reference. Read standing data-root `AGENTS.md` instructions with a size bound; do not infer every project's opt-in from module enablement. Supply fresh clock/IANA timezone and current saved location settings on every model request, including tool continuations and scheduled runs. Never infer physical location from timezone. [Chat](../foundations/chat.md) defines the immediate device request, approximate readings, retries, clearing, and website revocation.

Encrypt connection secrets with Electron safeStorage and write them atomically in `.clarity/credentials.bin` with restricted permissions. Serialize updates; preserve unreadable old credentials as a recovery file before replacement. Read installed Codex credentials without rewriting the CLI's file. Account disconnect removes secrets, not owned imported data. Browser profiles and playback scratch state stay under `.clarity/`. Credentials need not be portable between machines. Connection setup and callback addresses are specified on [Modules and connections](../foundations/integrations.md).

## Data contracts

[Data folder](../foundations/folders.md) defines directories, document versions, ownership, assets, Trash, and attachment expiry. Structured state uses a local Durable Object named `local-user` backed by this table:

```sql
CREATE TABLE records (
  collection TEXT NOT NULL,
  id TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (collection, id)
);
```

Public existing-record update/remove methods require a positive safe-integer `revision` before effects, including `news.removeSource`. Direct UI, reviewed and automatic actions share the same requirement. Missing/malformed revisions reject the call; stale revisions conflict without changing the target. Store’s optional internal guard below is not an opt-out for those module methods.

Each JSON record has `id`, `createdAt`, `updatedAt` (epoch milliseconds), and integer `revision`. Create starts revision 1; a put preserves creation time and advances update time/revision. Calls support `list`, `get`, `put`, and `delete`; an optional `expectedRevision` must match the stored revision, otherwise return `CONFLICT`. Patching reads the latest record and retries revision conflicts up to five times. IDs are generally UUIDs; imports/recent items may use namespaced source IDs. Store access uses an ephemeral authorization token and loopback-only Miniflare dispatch, not a public API.

| Collection | Content beyond common fields |
| --- | --- |
| `settings` / `default` | Enabled module IDs; autoApproveActions (array of exact mutation IDs); model/effort; lastChat; theme; reducedMotion and autoInterpretCommands (booleans, default false); musicNormalization (boolean, default true); linkdingRefreshMinutes (0/60/1440); display currency; manual location; useDeviceLocation, locationRequested, locationPermission, locationError; optional approximate deviceLocation. |
| `chats` | Title, saved Pi messages/tool results, status (`idle/running/interrupted/error`), error, exact-origin grants, attachment metadata. |
| `actions` | Owner, module, method, args, description/fields, status, result/error, optional autoApproved boolean and prior-value `before` snapshot. Owner is a chat ID or `automation:<id>`. |
| `todos` | Required title, boolean done, optional nullable date (`YYYY-MM-DD`, actual day in years 0001–9999). Omitted updates preserve the date; null/empty clears it. Legacy missing dates are undated. Calendar projects these records without creating events. |
| `calendar` | Required title and valid ISO start/end date-time strings with real Gregorian dates and clock components; end follows start. Local, UTC and colon-separated numeric offsets are supported; date-only values and 24:00 rollover are rejected. |
| `expenses` | Positive integer amountCents, category, description, and real Gregorian `YYYY-MM-DD` date in years 0001–9999. |
| `bookmarks` | Title, HTTP(S) URL, description, tag array; optional import source, sourceCreatedAt, sourceOrigin and sourceValues (last upstream field snapshot). Local creation time remains first local save/import. |
| `news-sources` | Feed title, URL, and enabled state. |
| `news` | Headline title, URL, source/sourceId, and published time. No article body/description archive. |
| `board` | Topic, text, threadId (null for a root; replies must identify an existing root), optional links `{module,id?,path?,label?}`. |
| `automations` | Title, instruction, topicPath, frequency/hour/minute/weekdays, enabled, normalized schedule/timezone, nextRun, since cursor, lastRun, status, result/error. |
| `connection-state` / `linkding` | Last refresh attempt timestamp, counts/truncation result or error; next due time is runtime state derived from the saved interval. |
| `music-recent` | Record `id` is `<source>-<type>-<provider ID>`; `itemId` holds the raw provider ID. Source, collection type, title, optional artist/cover and `playedAt` retain recent playback metadata. Home repairs legacy IDs/missing titles with revision checks and preserves the prior `updatedAt` as `playedAt`. No track index, queue or source-owned playlist copy. See [Music](../features/music.md#recently-played-metadata-and-repair-2-october-2026). |

Initial settings enable `chat`, `notes`, `todos`, `wiki`; autoApproveActions is empty (also the fallback for older records), theme is `system`, reducedMotion and autoInterpretCommands are false, musicNormalization is true, Linkding interval is 0 (manual), currency/manual location are empty, model is `gpt-5.5`, effort is `medium`, device use is enabled, first request is not yet made, and permission status is unknown. Model defaults are dated implementation choices and may change as available Codex models change. Device readings contain latitude, longitude, accuracyMetres, and measuredAt; round coordinates to two decimals, use accuracy of at least 1,500 metres, and reject invalid/stale incoming values. Do not confuse this local record with precise live location.

There is no general schema migration/export system yet. Preserve existing records when adding fields; settings merge defaults with saved values. For a future incompatible schema change, specify migration and recovery before writing it. The present SQLite representation is implementation detail, while actual Markdown ownership and preservation on conflict are required product contracts.

Draft text/attachment metadata/Wiki context and expense form fields persist in the existing Electron profile localStorage under `clarity:draft:`. Mail/Music browsing state is temporary renderer memory. [Data folder](../foundations/folders.md#draft-and-navigation-storage) owns retention. List reads accept bounded `offset`/`limit` pages with creation-time/ID ordering; human collection views load all pages before treating aggregates as complete. The item URL contract and read-only resolver are specified in [Wiki](../features/wiki.md#usability-fixes-1-october-2026). Attachment inspection/reveal validates owned IDs and expiry in main, with image-only protocol access.

## Dependencies and rebuilding

The workspace must not contain `package.json`, lockfiles, or `node_modules`. The Node launcher generates any needed application manifests and installs dependencies in an **external** cache: `~/Library/Caches/Clarity/build` on macOS, `~/.cache/Clarity/build` on Linux, or `CLARITY_BUILD_CACHE` outside the repository. Use Node.js 22+ with npm to build; internet is needed for initial dependency download. A packaged user needs neither Node nor Rust.

Current pinned application dependencies, audited 29 September 2026:

| Dependency | Version | Responsibility |
| --- | --- | --- |
| Electron | 44.4.5 | Desktop lifecycle, secure renderer bridge, OS secrets/location. |
| Miniflare | 5.20260921.1-alpha | Local workerd and persisted SQLite Durable Object. |
| `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core` | 0.87.1 each | Codex subscription access and agent loop. |
| React, React DOM | 19.2.0 each | Screens. |
| `@milkdown/crepe` | 7.19.1 | Rich GFM editor; retain the tested list-attribute/serialization compatibility fixes. |
| `marked`, `sanitize-html` | 17.0.1 / 2.17.0 | Markdown parsing and safe reader output. |
| `fast-xml-parser` | 5.3.6 | RSS/Atom parsing. |
| `temporal-polyfill` | 1.0.2 | Scheduler date/time calculations. |
| `playwright-core` | 1.63.0 | Installed Chrome/Chromium interaction. |
| `pdfjs-dist` | 5.4.296 | Local PDF text extraction. |
| esbuild / TypeScript / Prettier | 0.28.2 / 6.0.3 / 3.6.2 | Bundle, check, format. |
| `@types/node` | 22.19.0 | Node declarations. |
| `@types/react`, `@types/react-dom` | 19.2.0 each | React declarations. |
| `@types/sanitize-html` | 2.16.0 | Sanitizer declarations. |
| `@cloudflare/workers-types` | 5.20260928.1 | Worker declarations. |

The Spotify helper uses Rust 2024 edition, `librespot-core` and `librespot-playback` exactly 0.8.0 (core native-tls; playback default features disabled), Rodio exactly 0.22.2 with only its playback feature, Tokio 1, serde_json 1, and the vergen 9.0.6 build dependency required for librespot's build API. Librespot's bundled backend pins the crashing CPAL 0.16 path, so a small Sink adapter uses the newer output library; the validated build resolves CPAL 0.17.3. No second audio decoder is enabled in Rodio. Generate its Cargo workspace in the external cache too. JSON-line commands/events join Electron and the helper: initialize with a streaming OAuth access token and absolute expiry, update that token before expiry without restarting audio, load a track with optional millisecond position, pause/resume/stop/seek/set volume, and report ready/playing/paused/end/error states. The earlier login5 preflight is removed. Stop the previous source before loading another; do not auto-play after merely connecting. [Music](../features/music.md#persistent-sign-in) owns OAuth persistence, renewal, and one-attempt session recovery; the existing encrypted store is sufficient, with no extra credential cache or logging dependency.

The build supplies a small OAuth-token extension to the published `librespot-core` 0.8.0 source. `tooling/player.mjs` first resolves the unpatched registry crate using Cargo metadata, copies it to the external player workspace, checks two source anchors in `login5.rs`, and includes `src/player/login5_oauth.rs`. A path patch selects that copy for every dependent librespot crate. Never mutate the shared Cargo registry. The source, output adapter, extension, generated manifest and build script all contribute to the helper build signature. A mismatch stops the build. Packaged licenses include `CLARITY-MODIFICATIONS.txt` for the core extension. Run the native regression after building the helper with `cargo test --release --offline --manifest-path ~/Library/Caches/Clarity/build/spotify-player/Cargo.toml oauth_expiry`. The [Music specification](../features/music.md#playback-oauth-token-ownership) owns token lifetime, IPC, renewal and error behavior.

Cloudflare OS scheduler/approval files are vendored at `32ce152654e8a205b54e094e31be932c620dbc52`. Preserve their Apache-2.0 notices and the included librespot/dependency licenses. Reusing the contracts does not imply importing the whole upstream app. The actual dependency inventory lives in `tooling/dependencies.mjs`; when it changes, update this table and compatibility evidence together. These pins describe the tested build, not perpetual recommendations.

### Build and package contract

Current launcher commands from the repository root:

```sh
node tooling/clarity.mjs dev
node tooling/clarity.mjs build
node tooling/clarity.mjs check
node tooling/clarity.mjs test
node tooling/clarity.mjs player
node tooling/clarity.mjs package
```

`dev` builds and starts Electron; `build` bundles the app/Worker/renderer; `check` typechecks main application and Worker separately; `test` uses disposable roots/fixtures. `player` builds the Rust helper. `package` produces a macOS app in the external cache with the runtime, dependencies, helper, usage descriptions, and license notices. Bundle symlinks must point inside the bundle, not back to the build cache. Locally sign the app and its nested executables; launch a relocated copy with only system commands on PATH to verify independence. Notarization and Linux packaging are not delivered.

Use installed Chrome/Chromium for interactive browsing and X collection. Ordinary hosted search and direct page fetch must remain usable without that browser. Bundle Electron's native macOS location usage descriptions and select the platform location provider; no Google geolocation key, reverse geocoder, or extra native helper is required for the current version. Include `NSLocalNetworkUsageDescription` explaining access to chosen Navidrome/Linkding servers; packaging tests verify it. macOS controls consent, and a terminal-launched test does not establish normal installed-app permission. The packaged app goes in the user's Applications folder; it is independent of this checkout.

### Source responsibilities for a fresh implementation

| Boundary | Current source location and responsibility |
| --- | --- |
| Lifecycle and IPC | `src/main/main.ts`, `preload.ts`; data-root selection, secure protocols, window/menu, startup/recovery, Quit. |
| Data | `src/main/store.ts`, `src/worker/state.ts`, `src/main/files.ts`; records/revisions and ordinary files/conflicts/retention. |
| Shared actions | `src/main/modules.ts`; enabled method catalogue, direct calls, review queue, dispatch. |
| Redesign UI | `src/renderer/workspace.css`, `icons.tsx`, `motion.ts`, `model-picker.tsx`, `omni-input.tsx`, `source-preview.tsx`; shared tokens, controls and explicit preview/command flows. |
| Launcher | `src/shared/commands.ts`, `src/main/launcher.ts`, `src/main/chat.ts`; allowlisted forms, local search and tool-free model proposals. |
| Agent/context | `src/main/chat.ts`, `environment.ts`; Pi lifecycle/history, tools, model settings, time/location. |
| Connections | `src/main/auth.ts`, `integrations.ts`, `browser.ts`; secrets, OAuth, connector data, page reads and browser grants. |
| Wiki/jobs | `src/main/wiki.ts`, `wiki-style.ts`, `automations.ts`; derived HTML and scheduled topic updates. |
| Audio | `src/main/music.ts`, `spotify-player.ts`, `src/player/`; faithful source data, queue/state, source handoff and native Spotify playback. |
| UI | `src/renderer/` and `src/shared/types.ts`; module screens, typed bridge/events, editor and player presentation. |
| Tooling/evidence | `tooling/`, `tests/`, and vendored notices under `src/vendor/`. |

Rebuild from the module contracts and these boundaries; do not require the exact file split if a simpler equivalent preserves behavior. App state migrations and source extraction are separate concerns from generating this planning reader.

## Rebuild acceptance checks

1. Select a root, restart, reopen the last chat, and verify all state stays under that root except the machine pointer. Close hides; explicit Quit stops. Dirty note saving must finish or visibly block Quit.
2. Use the installed Codex subscription to propose a task, approve it once, restart, and continue the same thread after changing model/effort. Verify fresh local time/timezone and unknown/manual/device location handling. Pending actions must never be reported as applied.
3. Exercise real-file creation, rich/source GFM, autosave, external conflict recovery, image assets, wiki generation/navigation/sanitization, and Trash. Prove chat expiry does not remove embedded note/wiki assets. Keep full-GFM conformance as a target beyond the current sample tests.
4. Exercise every module's core CRUD/read/playback flow using controlled fixtures. Check revision conflicts, errors, pagination/retention, and single-source playback behavior. Then validate real connections separately; fixtures are not account evidence.
5. Test site grants per exact origin/thread, redirects, revocation, routine browser batches, and consequential review. Measure interactive browsing separately from hosted search before claiming Codex-level responsiveness.
6. Test scheduled runs, missed-run skipping, bounded new-input cursors, failure retention, stale wiki writes, and results staying out of chats. Keep Linkding's missing scheduled refresh visible as separate accepted work.
7. Relocate the packaged app and verify it starts without development dependencies, retains user data, launches the native helper, and saves an immediately edited note on Quit. Treat separate-machine/Linux/notarization as separate validation items.

The tests below are evidence for the current implementation; these checks define what a rebuild must demonstrate, including gaps the current build has not yet closed.

## UI audit · 1 October 2026

The subsequent Settings layout fix separates its stationary header from the scrolling body, moves a thin scrollbar to the workspace edge, pads every focused section, and aligns labelled input/select widths. Sixteen layout scenarios pass in each of development and packaged Electron across Light/Dark and normal/minimum windows, including real scrolling, keyboard focus, connection navigation, and refresh-choice persistence. Targeted UI/approval regression tests, application/Worker types, and repaired package relocation checks pass. [The Settings report](../verification/runs/2026-10-01T035337Z-settings-layout.md) preserves the tested package hashes, concurrent-source limits, failed harness attempts, and successful reruns. The signed update is installed with its previous bundle retained; normal Quit/reopen loads it.

The [audit resolution register](ui-audit.md#resolution-and-evidence) maps all nineteen findings to implemented fixes. The controlled suite passes 25 tests, including new real-Electron regressions for loss/duplication/limits/context/feedback and controlled Linkding reconciliation/scheduling. Two opt-in live-model tests are skipped outside this scope. Main application/Worker type checks and signed-package relocation/persistence/unsent-draft checks pass. The [dated verification report](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) records exact dirty-build fingerprints, selected outcomes, logs, screenshots and material limits.

The user also requested jstack adoption. [Verification setup](../verification/setup.md) and [stable feature recipes](../features/index.md#verification-map) now define real entry-point checks, conservative outcomes, retained evidence and maintenance classification. `tooling/fingerprint.mjs` records source/build identity, `tooling/check-reports.mjs` validates run outcomes, and the v1.2.0 offline reader validates generic metadata and hashed local evidence. The 13 reader/report checks and actual offline reader walkthrough pass. The signed app is installed with a retained backup; normal Quit/reopen activates the update. Wiki/report success remains structural evidence, separate from product acceptance.

## Validation · 30 September 2026

- **Chronological chat actions:** application/Worker type checks and a disposable Electron walkthrough pass in the development and packaged builds. The walkthrough checks action cards among multiple message turns, timestamp ties, automatic and failed records, Apply/Dismiss updating the same card without moving it, the latest streaming response remaining visible at the bottom, and persisted order/results after reopening. Package relocation, signature, dependency independence and persistence checks also pass. This verifies presentation with local fixture data; it does not make a new live model request. See the [journal](../journal/2026-09-30-chat-timeline.md).

## Validation · 29 September 2026

- **Direct OAuth playback:** an isolated live helper plays with the existing streaming OAuth token, avoiding the unnecessary login5 exchange that returns 503. The installed implementation passes five targeted music/core tests, all four connector tests, app/Worker type checks, the native token-expiry test, and package relocation/signature/persistence checks. Native expiry never falls back to login5; invalid replacements preserve the current token, and a fresh token restores access. An active helper receives renewal without restarting, while late results after close are discarded. After macOS Keychain approval, the installed app renewed both genuinely expired access tokens, played the reported song, sought while paused, and resumed beyond the sought position. The saved replacement expiry values and refresh tokens persisted across Quit/reopen, and a new playback attempt succeeded without another token renewal or sign-in. These checks establish access-token expiry recovery and installed playback controls; they do not establish speaker audibility, fresh browser authorization, or refresh-token expiry/revocation. See the [resolution journal](../journal/2026-09-29-spotify-oauth-playback.md).

- **Earlier Spotifast comparison (before the direct OAuth solution):** source inspection and a disposable helper built against its pinned librespot fork reproduce the same login5 503 after successful client-token and native-session authentication. The fork's in-memory cache receives a reusable credential, but playback-token acquisition still fails. Its login5 source matches stock 0.8.0; its ARM signature fix is Windows-specific. An unauthenticated HTTP/2 probe also receives 503. This does not test the complete Spotifast app, its TLS configuration, or saved-native-credential restoration. No production dependency or credential behavior changed; the active helper was restored. See the [comparison](../features/music.md#persistent-sign-in) and [journal](../journal/2026-09-29-spotify-endpoint.md#follow-up-spotifast-comparison).

- **Earlier Spotify 503 diagnosis:** isolated the failed request to `login5.spotify.com/v3/login` after successful catalogue search, native authentication and client-token exchange. The authenticated request returns 503 without `Retry-After`; an unauthenticated check returns the same status with `no healthy upstream`. This does not establish a global outage, account expiry, or rate limiting. Current librespot still uses that URL. The remote web-fetch tool could not provide a second-network comparison. That remains an unresolved diagnostic detail, not a prerequisite for the subsequently verified direct-token path. Diagnostic modifications remained in the external cache and were removed from the active native build afterward. See the [diagnosis journal](../journal/2026-09-29-spotify-endpoint.md).

- **Persistent Spotify sign-in:** four targeted music/core tests, all four connector tests, and application/Worker type checks pass. Coverage includes encrypted restart persistence, refresh-token preservation/rotation, concurrent renewal, one-time API/native rejection retries, temporary failures retaining credentials, and bounded playback recovery with position and cancellation. Live inspection found both Spotify connections unexpired with refresh tokens present. An intermediate live playback check returned upstream HTTP 503; the later direct-token experiment above addresses that dependency. That earlier check did not exercise live token expiry; the later direct-token verification above does. Fresh browser login and speaker audibility remain unverified. See the [journal](../journal/2026-09-29-spotify-sign-in.md).

- **Earlier full-suite validation: thirteen passing.** Core behavior, controlled connectors, and Electron end-to-end workflows passed; the live Codex test is opt-in and skipped by default. The later Spotify fix adds another regression test and passes the three connector tests, the existing music source-switch test, and app/Worker type checks; the full suite was not rerun for this focused change.
- **Time and permissions:** date rollover, DST, fractional timezone offsets, unknown location, approximate coordinate storage, invalid/stale readings and startup eligibility pass core checks. Electron fixtures exercise granted/denied/unavailable locations, the renderer permission gate, clearing, website revocation, and persisted settings. Live Codex uses fresh time/timezone, the saved manual location, and unknown after clearing it. The new code uses only existing dependencies.
- **Live Codex:** the actual application used the installed subscription, proposed a todo through its tool, applied it once after approval, quit/restarted, and recalled earlier thread content after changing from gpt-5.5 to gpt-5.6-luna with a different effort. A separate native hosted-search request succeeded with an official Electron release reference. This establishes working paths, not comparative latency.
- **Notes:** real-file autosave, rich/source round trips for task lists, nested bullets, numbered lists starting after 1, tables, strike/bold, links and code. The final pass found and fixed Milkdown 7.19's list-attribute validation mismatch and delayed serialization after editor destruction. Immediate typing followed by Quit preserves the new text. External-edit conflicts preserve both versions.
- **Files and approvals:** path/symlink rejection, strictly-below-30-MB enforcement, 90-day chat-copy cleanup, separate 30-day Trash cleanup, permanent module copies of embedded attachments, sanitized wiki output, revision conflicts, and duplicate-effect prevention pass.
- **Other screens:** todos, week/continuous-month calendar with no repeated dates, expense digit input, bookmark creation, configurable feeds, board threads/replies, automation creation, and wiki page/heading navigation pass in Electron. Window close hides; explicit Quit and restart preserve local state.
- **Controlled connections:** OAuth state/PKCE, encrypted credentials, recovery from unreadable credentials, refresh, Gmail read-only requests, Linkding local-edit preservation, and RSS/Atom parsing pass. An HTTP Navidrome fixture plays an actual audio stream inside Electron, supports pause/resume, mouse/keyboard seeking, and stops after a single song. The custom protocol forwards Range headers and preserves 206 partial-response status/body. Source handoff stops the previous engine first.
- **Spotify search fix:** a read-only comparison using the connected account returns 400 “Invalid limit” for the old request and 200 with results for `limit=10`. The Electron regression exercises visible search results, current playlist-item wrappers, null/non-music filtering, Liked Songs and album decoding, and useful JSON/non-JSON failure messages. This verifies catalogue search, not native audio or every live playlist. The [Music page](../features/music.md#spotify-api-compatibility-29-september-2026) preserves the API contract and sources.
- **Spotify playback/seek fix:** the original helper reproduced SIGSEGV in CoreAudio after readiness. Rodio 0.22.2 / CPAL 0.17.3 removes that observed crash. A live disposable app connected using the existing playback credential, advanced the selected song, paused, sought to 2:00, resumed, and sought again while playing. The seek bar stays usable at minimum window size. Both targeted core tests and all three connector tests pass, including helper process crashes/reconnection, intentional shutdown, source switching, seconds/milliseconds validation, and failure messages that do not cover controls. The final packaged app also passes the live seek sequence and forced-helper-exit recovery through Play. These observations do not establish listener-confirmed audibility, fresh OAuth/expiry, or every audio device. See [Music](../features/music.md#native-playback-and-failure-contract).
- **Automations:** missed-run skipping, no-new-input behavior, failed-run cursor preservation and output isolation from chats pass. Changes are processed in bounded chronological groups without advancing past omitted records.
- **Action approval checklist:** core checks verify catalog coverage, immediate execution, unrelated actions staying pending, invalid-selection rejection, revocation, restart persistence, disabled modules, stale-file protection, automatic success/failure records, browser grant separation, and scheduled-run behavior. Electron checks verify 37 rows, individual selection, all three Select all states, keyboard operation, and restart persistence; existing location/revocation checks still pass. A live Codex conversation adds one task immediately with `todos.add` selected, then queues a second after clearing the selection in that same thread. Application/Worker type checks and a packaged-checklist smoke check pass. Music routing is tested with a controlled player; this follow-up does not repeat live Spotify playback.
- **Songs layout:** a disposable packaged-app walkthrough with controlled results verifies the list default, both List/Grid toggle directions, independence from other result tabs, retention across searches, and reset on a new Music visit. Application and Worker type checks pass. See [Music](../features/music.md#screens-and-playback) and [D108](../decisions/index.md#d108-songs-default-to-list-view-29-september-2026).
- **Package:** the macOS arm64 bundle passes code-signature, location-usage-description and self-contained-symlink checks, launches after relocation with a system-only PATH, starts its bundled native Spotify helper, and persists tasks/notes across restart. The Spotify search and playback/seek fixes were repackaged and passed the same relocation check; the playback build also passed the live control/recovery checks above. A duplicate workerd executable is replaced by an internal symlink. End users need neither Node nor Rust.
- **Static checks:** TypeScript checks the application and Worker separately; the planning reader is rebuilt and checked against its Markdown sources.

Tests live in the repository's `tests/` directory, use external disposable data folders, and are distinct from the earlier [technical spikes](technical-spikes.md). Fixtures do not establish live account compatibility.

## Connections and limits

Music now uses one gain curve across Spotify/Navidrome and optional fixed normalization with automatic album/track selection. [The contract](../features/music.md#source-volume-and-normalization-2-october-2026) records the enabled-by-default setting, next-track timing, conservative attenuation and metadata assumptions. Real-account tag coverage and measured loudness parity remain separate validation limits.

**Remaining validation limits:** the previously missing Linkding schedule/reconciliation (D41), affected-item navigation (D18), and cross-module Wiki citations (D85) are implemented. Full GFM is required but representative round trips are not exhaustive conformance. Trash recovery is manual without an original-folder restore manifest. Live-provider and platform limits remain in [current follow-up](../discussions/open-questions.md).

- Real macOS location approval and successful native positioning still need the user's interaction and working Location Services. Permission fixtures do not access the real location. The packaged app carries location usage descriptions and selects the native platform provider; device lookup is macOS-only for now. Settings displays the last request result, not a live view of all OS permissions.
- Spotify library authorization and native-playback authorization are separate, following the separation studied in [Spotifast](https://github.com/crmne/spotifast). The bundled librespot 0.8.0 helper with updated Rodio output passes native session/playback/seek checks on this Mac using the existing account. Expired access-token renewal and persistence across restart now pass in the installed app. Fresh playback browser login and installed controls/restart also pass in the 2 October follow-up. Fresh library browser login, refresh-token expiry/revocation, other output devices, and listener-confirmed audibility remain unverified. Rust/Cargo is needed to build the helper, not to run the packaged app.
- Gmail, X and Linkding still require live account/server validation. Navidrome credentials now pass direct live authentication; normal installed recovery awaits macOS access, and real-server playback remains unverified. Gmail's client ID and Spotify's library client ID are supplied in Settings. No external account was silently connected.
- X imports are read-only and run headlessly after the visible sign-in browser is closed. Refresh is explicit from Bookmarks. Imported local records are retained; upstream absence does not prove deletion. The unofficial interface may change, and live X has not been exercised.
- Installed Codex subscription access is live-tested. Fresh ChatGPT sign-in and real expiry/refresh remain unverified; installed CLI credentials are read without rewriting its token file.
- Interactive browsing requires installed Chrome/Chromium. Exact-origin grants persist on the chat. Consequential-action classification depends on the agent and is not universal side-effect prevention. No measured Codex performance parity is claimed.
- Scheduled maintenance runs while Clarity is alive, including with its window closed. There is no independent service or login launch. Deleted source records are not inferred as authoritative retractions; existing wiki content and conflicting evidence are preserved unless a change is requested.
- Local secrets use OS-backed encryption. Moving files to another machine may require reconnecting accounts; no device sync or cross-machine credential portability is promised.
- The packaged target validated here is macOS arm64. Linux remains an unverified development route. The bundle is locally signed, not notarized for public distribution.
- The board's maintained module methods are available to opted-in app agents. An external-agent CLI/REST adapter remains outside the selected scope.

## Running and maintaining the app

Use the commands and contracts above, with the repository README as a shorter setup guide. Every meaningful implementation or validation change updates this page and the affected module topics in the same work, records rationale in the journal, and updates decisions when needed. Rebuild `docs/wiki/index.html` with `node docs/wiki/_build.mjs`, then run `node docs/wiki/_build.mjs --check`. Preserve the package-file/dependency-directory ban. The in-app Wiki folder and this specification wiki are separate systems.
