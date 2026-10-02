---
title: Reference register
section: References
status: Reference
updated: 2026-10-02
order: 0
summary: Inspiration, inspected sources, and references still to investigate.
---
# Reference register

**Dated research, not the current rebuild contract.** The observations below describe the inspected revisions and experiments at their stated dates. Later implementation choices and app validation are in [Implementation and validation](implementation.md); unresolved work is in [Current follow-up](../discussions/open-questions.md). Historical statements that integration, storage, or packaging were undecided do not reopen those choices.

## Global feedback research · 2 October 2026

The [2 October global feedback research](../foundations/desktop-stack.md#global-feedback-research-and-pending-proposal) compares contextual errors and toasts using Carbon, W3C, native-dialog guidance, Radix, Sonner and React Aria. It is a pending proposal based on source/documentation inspection, with the final method reserved for the user; no candidate was installed or exercised.

## UI and usability evidence · 1 October 2026

The [UI audit](ui-audit.md) records nineteen prioritized findings from the current development build, isolated UI fixtures, and source review. It retains the original evidence and now maps all nineteen findings to implemented fixes and regression evidence. The [fix journal](../journal/2026-10-01-ui-fixes.md) records the remediation; no new live-provider compatibility is claimed.

## Disposable runtime evidence · 28 September 2026

[Technical spikes](technical-spikes.md) record live subscription/Pi results, local state and real-file tests, Electron lifecycle and minimal packaging, browser measurements, and a failed approval shortcut. They use a newer pinned upstream revision and clearly separate small fixtures from full application validation.

## Platform reassessment · 27 September 2026

Rechecked Cloudflare OS’s [README](https://github.com/cloudflare/cloudflare-os/blob/main/README.md), [blueprints](https://github.com/cloudflare/cloudflare-os/blob/main/docs/blueprints.md), [agent source](https://github.com/cloudflare/cloudflare-os/blob/main/packages/workshop-backend/src/agent.ts), [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-spotify/README.md), and [Scheduler](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md), alongside [Electron’s process model](https://www.electronjs.org/docs/latest/tutorial/process-model). Findings inform the [current tensions](../foundations/desktop-stack.md#current-direction-27-september-2026). Runtime operation and integrations were not tested. Chartr/terminal research below is historical following removal of that module.

References are inputs to discussion. Referencing a product does not import its entire feature set, architecture, or licensing into Clarity.

## Local projects

Reference root: `~/Desktop/Projects`. These are paths on the current machine, not portable dependencies of this wiki.

| Reference | Evidence inspected | Relevance and limits |
| --- | --- | --- |
| `expensif` | Add/form/daily templates, day-row partials, CategoryPills, DescriptionPills, PillSelect, input-filter hook; user screenshots | Confirmed digit-buffer amount, selectable categories, category-dependent descriptions, daily grouping and dated add links. Found at `~/Desktop/Projects/expensif`; latest requested `~/Projects/expensif` was absent. UI not run. |
| `chartr` | `README.md`, ADRs 0001/0002/0004, relevant ADR 0005 passages, dependency manifests, `crates/chartr-conversations/src/session_logs.rs`; user Spaces screenshot | Private Herdr lifecycle, separate harness conversation export, complete Zed terminal model/view, and Wry platform integration. Inspected 25–26 September 2026. No app run or full implementation audit. |
| `slopchan` | `README.md`, `docs/api.md`, `core/onboarding.go`, `core/backend.go`, `core/boards.go`, relevant store definitions; HEAD `07b6c06` | Boards/threads/posts, complete-thread reads, compact onboarding briefs, SQLite full-text search. Inspected 27 September for efficient board access. No server, load test, or benchmark run. |
| Lucia (`john-harness`) | `README.md`, `docs/RENAMING.md`; bookmark connector, source capabilities/disconnect, item upserts, sync scheduling, Settings UI | User identified `~/Desktop/Projects/john-harness` as Lucia. Linkding uses read-only imports and refresh; X is unavailable/deferred. Mail and automation descriptions read in README only; their implementations not audited. No app or live connectors run. |

## External references

- [Spotifast](https://github.com/crmne/spotifast) — music reference. Revisited its README on 25 September 2026: native Rust/librespot playback and Connect control. Also reviewed Spotify's official SDK, playback/device APIs, and quota documentation for the [music comparison](../features/music.md#spotify-playback-tradeoffs-25-september-2026). Both official playback routes require Premium; app distribution and embedded-runtime compatibility need resolution. No player was run or stack selected.
- [X](https://x.com/) — read-only bookmark source. Reviewed official bookmark lookup, endpoint, OAuth PKCE, and pricing documentation on 25 September 2026; see [feasibility research](../features/bookmarks.md#x-feasibility-research-25-september-2026). Also inspected Lucia's report/probe, Twikit, Bird variants, xarchive request capture/replay, Bookmark X DOM collection, and a small page-response exporter. [Unofficial findings](../features/bookmarks.md#unofficial-x-investigation-25-september-2026) record source revisions, observed limitations, and a proposed foreground workflow. No account connection or authenticated X request made.
- [linkding](https://github.com/sissbruecker/linkding) — requested bookmark source. Lucia's token-authenticated, read-only import/refresh implementation has been inspected; no live provider validation was performed for Clarity.
- macOS Calendar — primary calendar reference, with user-supplied Week and Month screenshots; seamless month scrolling explicitly requested. No running calendar was inspected.
- Notion Calendar — additional named calendar UX reference; not inspected in this session.
- Obsidian — named Markdown editing and folder-ownership reference; not inspected in this session.

For Music, the [open-source client survey](../features/music.md#open-source-client-survey-25-september-2026) covers Spotifast, spotify-player, ncspot, Psst, Supersonic, Yuzic, EKO, Feishin, and SonicLair. Upstream documentation and release metadata were inspected on 25 September 2026, plus Yuzic's dependency manifest, Supersonic's Go dependencies, and EKO's license. No runtime performance or live playback was tested. The user supplied Yuzic as an additional reference; this does not select its mobile stack for Clarity.

Music references have a separate purpose: [D46](../decisions/index.md#d46-music-core-implementation-references-25-september-2026) prioritizes copying or emulating robust core implementations, rather than reproducing their entire UI. The earlier music survey is preliminary research, not a robustness ranking.

On 29 September, inspected Spotifast revision `70d42a560c4204278abfbc28646376792749e869` and its pinned librespot fork, then built a disposable Clarity helper against that fork. It reproduced the observed login5 503 after successful native authentication. This is distinct from testing the full Spotifast app. A subsequent live experiment played successfully by supplying the existing streaming OAuth token directly; the installed implementation now follows that path. Credential persistence findings, source links, evidence and limits are recorded together on [Music](../features/music.md#playback-oauth-token-ownership), in the [diagnosis journal](../journal/2026-09-29-spotify-endpoint.md#follow-up-spotifast-comparison), and in the [resolution journal](../journal/2026-09-29-spotify-oauth-playback.md).

For the later [combined Music scope](../features/music.md#current-screen-scope), inspected official Spotify saved-album, saved-track, playlist, recent-history, and Developer Policy documentation, plus OpenSubsonic search/playlist references. The user subsequently accepted flat playlists and deferred the policy discussion for private use under [D48](../decisions/index.md#d48-lean-music-scope-and-private-use-25-september-2026). The supplied artist-grid and album-track-table screenshots are layout references only; source badges/borders and a combined search tab remain undecided.

## Chat UI references

On 25 September 2026, the user requested that Clarity's chat UI closely follow Synara or Codex. This is an accepted reference direction ([D19](../decisions/index.md#d19-chat-ui-references-25-september-2026)), not an inspected UI specification.

- Synara — chat UI and installed-harness connection reference. The latest user-supplied screenshot shows model search, model choices, favorites, keyboard hints, and effort selection above the composer. Read local `apps/marketing/content/docs/getting-started/providers.mdx` and model descriptors in `packages/contracts/src/providerDiscovery.ts` on 25 September 2026; see [harness connections](../foundations/harnesses.md). No running provider was tested.
- Codex — chat UI reference. No specific version, layout, or component behavior has been inspected for Clarity. No model or provider choice follows from the visual reference.

## Local-first research · 25 September 2026

The user requested exploration of [LoFi](https://lofi.so/), [Ink & Switch's local-first essay](https://www.inkandswitch.com/essay/local-first/), CRDTs, ElectricSQL, WatermelonDB, Jazz, and Automerge. Read the essay and the official sources linked in [local-first storage exploration](../foundations/local-first.md).

That page separates source observations from fit assessments. Electric's current documentation redirects to `electric.ax`; Jazz's current and classic documentation describe different models and must not be conflated. No library was installed or benchmarked, and no storage stack was chosen.

## Module screen references · 25 September 2026

- Notes screenshot: file/folder tree, open-note tabs, and an editor explicitly described in the image as rich-text Markdown. The user adds a New note button at the top of the file list, targeting the active folder.
- Expensif daily/new-expense screenshots: accepted as the two expense screens, with Amount/Category/Description behavior preserved and Currency/Paid By omitted. Source details and remaining scope are in [expenses](../features/expenses.md).
- Existing planning-wiki reader: the in-app wiki uses one webview targeting local `index.html`, with AI-requested edits and no direct editing. This does not authorize a redesign of the planning reader or select a framework for other modules.

## HomeOS and Cloudflare OS · 26 September 2026

The user shared [Aaron Francis's X post](https://x.com/aarondfrancis/status/2103549792370430003) and a screenshot, saying it looks good. This is a new reference, not acceptance of its design, modules, or stack for Clarity.

**Observed in the supplied image:** the app is labelled HomeOS, with “Cloudflare OS” beneath the account name. Navigation includes Home, Inbox, Reminders, Finance, Loyalty, Knowledge, X (Saved posts/My posts), Newsletter, Agents, and Operations. Saved posts use a dense masonry-style card layout with text, images/video, author/date details, search, source-opening links, and a Sync from X action. Status text reports hourly checks, media-save results, and search indexing. These are visible UI claims; the actual collector, completeness, media storage, and search implementation were not tested.

**Post verification:** web fetching returned 403, but the public post and reply thread were readable in Synara's shared browser without signing in. The post discusses bookmarking inspiration rather than its implementation. Asked whether he had previously discussed HomeOS, Aaron [replied](https://x.com/aarondfrancis/status/2103583661845102637) “I havent 🙈”. This describes that exchange, not proof that no other explanation exists.

**Repository evidence:** Aaron has a public [cloudflare-os fork](https://github.com/aarondfrancis/cloudflare-os) of [Cloudflare's upstream project](https://github.com/cloudflare/cloudflare-os). The GitHub API lists branches `homeos/agents-telegram-permissions` and `homeos/telegram-chat-model`; inspected heads were `480927666a081e36fdcf58ea4c9c4c9c9d2fed5f` and `98c965d838a2cc0e8ec813f67252538be39312eb`. Combined with the screenshot branding, this strongly suggests HomeOS is a personal customization built on Cloudflare OS. That relationship is an inference; the exact screenshot application was not located in the inspected source trees.

The upstream platform supplies agent chat, individually sandboxed apps called gadgets, and service-access controls called Gatekeepers. It targets Cloudflare Workers; its local Wrangler/workerd setup is documented as a development/demo route, not a production local-first desktop design. This makes it a useful reference rather than an automatically suitable base for Clarity. The [public fork's frontend manifest](https://github.com/aarondfrancis/cloudflare-os/blob/main/packages/workshop-frontend/package.json) includes React, TypeScript, Tailwind, Vite, and Cloudflare Kumo. These establish the base frontend stack, not the exact HomeOS screen's component library or an Electron runtime.

**Assistant assessment:** its restrained sidebar, narrow action toolbar, and content-heavy cards are relevant to Clarity's lean direction and bookmark browsing. This visual style is feasible in a web UI, including Electron. It does not resolve terminal rendering, local state, or Spotify playback. Do not adopt new sidebar modules, hourly refresh, media archiving, or image search just because they appear here.

No repository was cloned, package files written, dependencies installed, account connected, or app run. The exact HomeOS UI source, X import mechanism, and deployment details remain unverified.

The subsequent [fork assessment](../foundations/desktop-stack.md#building-on-cloudflare-os-26-september-2026) inspected upstream revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`: README, blueprint documentation, bundled-blueprint environments, backend runtime config and manifest, agent/overseer/auto-approval excerpts, local startup scripts, and Gatekeeper kit/Google/Spotify/Scheduler documentation. It confirms local workerd execution is possible, while deployment packaging and local host access remain separate work. This corrects any implication that a fork necessarily requires Cloudflare-hosted state. Source review only; no complete dependency audit or runtime validation.

## Research discipline

The Electron follow-up on 26 September also inspected Coder's ghostty-web README and browser canvas renderer, node-pty's README, Electron native-module/process/content-isolation documentation, and Spotify's SDK initialization-error reference. These establish available building blocks and constraints, not verified Clarity terminal or playback behavior. Links and findings are in [desktop stack exploration](../foundations/desktop-stack.md#electron-and-typescript-obstacles-26-september-2026).

For the [desktop stack comparison](../foundations/desktop-stack.md), inspected GPUI, Electron, Tauri, SwiftUI, Ghostty's upstream README, Alacritty's crate API, and LangChain's Python/JavaScript documentation on 26 September 2026. Sources are linked on the topic page. The comparison is an engineering assessment; no integration prototype, benchmark, or framework selection was made. Chartr's local ADRs provide implementation experience rather than a guarantee that its approach is the leanest fit for Clarity.

Record what was actually observed, when, and where. Keep source behavior separate from proposed Clarity behavior. Provider capabilities need fresh verification when integration design begins.

Initial inspection date: 24 September 2026.

## Board access and background app · 27 September 2026

Revisited [Cloudflare OS agent access](https://github.com/cloudflare/cloudflare-os#collaborate-with-ai), [gadget execution environment](https://github.com/cloudflare/cloudflare-os/blob/main/packages/bundled-blueprints/README.md), [Cap’n Web](https://github.com/cloudflare/capnweb), and [Electron Tray](https://www.electronjs.org/docs/latest/api/tray). The platform already offers agent-callable module methods; gadgets do not directly inherit Node filesystem access. Tray/menu-bar integration is an available Electron mechanism. Architectural fit does not establish measured end-to-end performance.

## Interactive browsing and attachments · 28 September 2026

The [research report](web-and-attachments.md) reviews Cloudflare OS fetch, attachment handling and MCP approvals; Playwright MCP; Electron views/sessions; agent-browser; PDF.js; MarkItDown; and local Synara browser/attachment code. It separates source observations from recommendations and records the approval mismatch, format limits, and missing runtime validation. No account connection, install, or application build occurred.

The later [browser-performance follow-up](web-and-attachments.md#browser-performance-follow-up) adds OpenAI's browser/search documentation, current Playwright CLI, agent-browser, dev-browser, Public Browser, BrowserSkill, Lightpanda, and structured site approaches. September HN submission dates were checked using the official item API. X coverage was limited by inaccessible pages; readable February–April indexed posts are dated honestly. Vendor performance claims were not reproduced.
