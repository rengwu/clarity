---
title: Open questions
section: Discussion
status: Open
updated: 2026-10-03
order: 0
summary: Remaining design choices and a record of resolved or deferred questions.
---
# Open questions

## Current follow-up · 3 October 2026

D102 authorizes implementation with safe, lean defaults. The stack, one data root, subscription, file-backed notes/wiki, and app lifecycle are settled. The local build has passed installed-Codex and relocated macOS package checks. Historical question rounds below are not a fresh preference questionnaire.

**X default-browser opening:** Open X now uses the OS default handler under [D128](../decisions/index.md#d128-open-x-in-the-default-browser-3-october-2026). The [Bookmarks contract](../features/bookmarks.md#default-browser-import-boundary-3-october-2026) distinguishes this from importing through that browser's session, which remains unsupported. The existing importer keeps a separately labelled sign-in action; no extension or paid API has been selected. The [focused run](../verification/runs/2026-10-02T160132Z-x-default-browser.md) verifies dispatch and retained UI access without claiming live X compatibility.

**Global feedback method — awaiting user choice.** On 2 October the user requested research into standard errors and informational toasts and explicitly reserved the final choice. [The shared UI proposal](../foundations/desktop-stack.md#global-feedback-research-and-pending-proposal) compares Radix Toast, Sonner and an in-house host, recommends contextual notices with shared toast rules, and records the current source observations and future checks. No application change or dependency selection is made by this research; the proposal must not be implemented as an already accepted default.

The Music search presentation now identifies each result kind and groups All into category previews, per [D126](../decisions/index.md#d126-identify-and-group-music-search-results-2-october-2026). The [focused run](../verification/runs/2026-10-02T141800Z-music-search.md) records labels, Show all, cached navigation and both layouts; live-provider ranking/completeness is outside this renderer change.

The Music tab-refetch report is resolved with [session result caching](../features/music.md#browse-result-caching-2-october-2026), shared pending reads, explicit refresh and account invalidation. The [cache run](../verification/runs/2026-10-01T163445Z-music-cache.md) passes selected development/package checks and records installation. Its controlled checks are separate from the installed playback/startup follow-up below.

The subsequent blank Spotify playlist rows are resolved by correcting boolean-field parsing and supplying playlist heading metadata. [Read-only live verification](../verification/runs/2026-10-01T164530Z-playlist-details.md) displays all eight songs from the reproduced owned playlist and retains the cache behavior. This closes that specific display regression; it does not certify the full playlist surface or change the separate playback/authorization evidence.

The later slow volume-control report is resolved under [D127](../decisions/index.md#d127-adjust-volume-while-dragging-2-october-2026): slider input now reaches both engines during dragging, and Spotify applies gain after its decoded queue. [The response run](../verification/runs/2026-10-02T142157Z-volume-response.md) records held input, queued-PCM timing and packaged checks. Hardware/Bluetooth end-to-end latency remains unmeasured.

The user accepted all three volume recommendations under [D124](../decisions/index.md#d124-music-volume-consistency-and-normalization-2-october-2026). Both engines now share one gain curve; optional fixed normalization is enabled by default, using album gain for albums and track gain for playlists/shuffle. [Music's contract](../features/music.md#source-volume-and-normalization-2-october-2026) owns metadata, conservative attenuation and next-track timing; [the focused run](../verification/runs/2026-10-01T171500Z-music-normalization.md) owns measured native PCM, provider-metadata/HTTP fixtures, settings and package evidence. Real-account tag coverage and actual speaker/loudness matching remain unverified; earlier transport tests do not establish those outcomes.

The subsequent Music UI report is corrected with a [source-labelled browse notice](../features/music.md#browse-failure-presentation-2-october-2026), spacing before artwork and retention of available results during retry. [The focused run](../verification/runs/2026-10-01T180000Z-music-error-layout.md) verifies controlled layouts and recovery; the cause of the user’s live fetch failure remains unestablished.

The later [Navidrome connection diagnosis](../verification/runs/2026-10-01T182630Z-navidrome-connection.md) confirms valid direct live authentication but reproduces `EHOSTUNREACH` only in the normal installed-app launch. The package now declares local-network usage and shows actionable connection guidance. Fixture/package checks pass; the updated app is installed with a backup. The updated app now reads its existing encrypted connections; real Navidrome recovery remains pending the user’s macOS Local Network check. No OS permission was silently changed.

The reported slow and truncated Liked Songs browse is corrected with [incremental Spotify collection loading](../features/music.md#large-spotify-collections-2-october-2026). The old 100-page cap is removed; the first page displays without waiting for the rest, and scrolling continues through provider pages. Loaded pages are shared with playback and retained on a continuation failure. [The focused run](../verification/runs/2026-10-01T182000Z-music-pagination.md) records a 5,055-song fixture, retries, refresh/account boundaries and delivery. Real-library latency remains unmeasured; playback still waits for unfetched pages when constructing its complete queue.

The later empty Recently played cards are corrected by saving fetched collection metadata, separating provider IDs from history keys and repairing older entries on Home reads. [The history contract](../features/music.md#recently-played-metadata-and-repair-2-october-2026) defines failure/retry, original-date preservation and concurrency guards; [the focused run](../verification/runs/2026-10-02T041300Z-music-recent.md) records fixture/UI evidence. Actual old entries require their source to be reachable for metadata recovery; the separate live Navidrome permission follow-up remains open.

### Adversarial QA follow-up · 2 October 2026

All fourteen remaining findings are resolved in the [adversarial remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md). Three GPT-6.1 Sol high workers received the wiki/jstack briefing and owned separate fixes; the coordinator froze the combined source and verified the full suite, twenty packaged regressions, types, relocation and installed hashes. QA15’s prior Settings correction still passes. The [original audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) remains a failed historical snapshot. Existing topics now own the repaired contracts and executable recipes. No live-provider certification, old invalid-record migration or global-feedback proposal implementation is implied.

### Cursor redesign adoption interview

**Complete for the first production port.** The user requested jstack's grill-me workflow and has answered the consequential product choices. The first question form was not visible, so subsequent rounds used visible numbered questions. Do not reopen settled choices or extend the interview with speculative features.

**Round 1 accepted:** an agent/model picker with effort instead of Ask/Agent ([D118](../decisions/index.md#d118-agent-and-effort-selection-in-the-redesign-1-october-2026)); an omni-input/search in the language of Raycast/Alfred/Spotlight ([D119](../decisions/index.md#d119-omni-input-and-search-direction-1-october-2026)); and the spike's one-section-at-a-time Settings navigation ([D120](../decisions/index.md#d120-section-based-settings-in-the-redesign-1-october-2026)). These choices are implemented in the subsequent production port.

**Round 2 accepted:** one general mode for everything, with no Ask/Agent split going forward; Clarity-only omni-input with no other Mac apps/files (Q6A); compact prefilled forms with explicit submission for quick entry (Q7A); and source/result inspection that preserves Chat until an explicit “Open in <module>” action ([D121](../decisions/index.md#d121-source-inspection-preserves-chat-1-october-2026)). The user requested discussion of intent detection and tentatively suggested Back/Forward controls.

**Round 3 accepted:** the source-preview example (Q8), with a draggable width and compact module-open button; a lean delegated intent detector with explicit Interpret by default and optional automatic interpretation in Settings (Q9); and Back/Forward for actual conversation/module/item navigation, excluding previews and filters (Q10A). These settle the earlier panel, mechanism and history branches. The [follow-up journal](../journal/2026-10-01-preview-controls.md) separates accepted requirements from the browser example's implemented scope.

**Round 4 accepted:** Q11 keeps the current automatic automation inputs for the first port, without per-job source checklists ([D122](../decisions/index.md#d122-preserve-automation-inputs-for-the-first-redesign-port-1-october-2026)). Q12A selects local omni-search results with explicit connected-provider searches ([D119](../decisions/index.md#d119-omni-input-and-search-direction-1-october-2026)); automatic interpretation remains a separate opt-in setting. These settle the last two branches, including Q2's earlier unanswered automation choice.

**Production port:** implemented after the user’s “ready to port?” request. The [native port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records compact shared UI, real local command saves, source/history behavior, settings and regression/package checks. Controlled model/provider fixtures validate request boundaries, not live interpretation quality or fresh provider-account compatibility. Existing account/platform gaps below remain separate. Incidental picker controls and expanded context inspectors remain outside scope.

The [round-one journal](../journal/2026-10-01-redesign-adoption.md), [round-two journal](../journal/2026-10-01-command-navigation.md), [round-three journal](../journal/2026-10-01-preview-controls.md) and [closing journal](../journal/2026-10-01-redesign-decisions.md) preserve accepted answers and their limits. Existing preservation of rich Notes, saved data, module behavior, chronological action cards and native app lifecycle is not reopened. Component cleanup and production regression testing are engineering work, not preference questions.

### Redesign port repair · 1 October 2026

The user rejected the first port for missing motion, design-system drift and Spotify connection problems. The [repair run](../verification/runs/2026-10-01T154700Z-redesign-repair.md) compares against the external spike and records actual sidebar/view/reorder motion, compact module presentation, fixed pane/scroll geometry, and explicit provider limits. The earlier port pass did not verify full visual fidelity or actual motion and must not be treated as certification of those areas.

The user unlocked Keychain and the installed app reopened successfully. The [2 October follow-up](../verification/runs/2026-10-01T163500Z-installed-playback.md) records fresh Spotify playback authorization, live search/play/pause/seek/resume, and a remaining duplicate-error race discovered during that walkthrough. Playback events and rejected requests now share one error state, with a compact footer before a queue exists. Twelve selected regressions and the relocated package pass. The final correction reopens after Keychain access with both grants and plays successfully. Its installed runtime bytes also match the Music-cache package; the original repair report preserves its earlier build and outcome.

Both Spotify grants are present after the normal playback sign-in flow. Separate disconnect actions preserve the other grant and refresh mounted connection state. No evidence establishes why the account’s playback grant was originally absent. Position/control checks do not establish listener-confirmed audibility; earlier account passes remain tied to their own builds.

### UI audit resolved

The user asked to fix all nineteen [audit findings](../references/ui-audit.md). The remediation covers draft persistence, safe deletion, guarded submissions, complete local lists/totals, theme and date context, note rename, action histories, local feedback, item links, Settings navigation, reply search, retained Mail/Music place, Linkding reconciliation/scheduling, attachment inspection, empty/loading states, and dialog names. The audit register maps each fix to its evidence; [D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026) records delegated details.

The previously recorded accepted gaps for scheduled Linkding refresh (D41), affected-item links (D18), and cross-module Wiki citations (D85) are implemented. Live-provider compatibility remains distinct from controlled UI/HTTP validation.

The subsequent Settings layout report is addressed with a stationary header, a thin scrollbar at the workspace edge, padded focus targets, and uniform form-field widths. [Settings](../foundations/integrations.md#usability-fixes-1-october-2026) owns the updated contract and dated layout evidence.

Full GFM remains the Notes target. Representative round trips pass; exhaustive conformance is unproven. Trash recovery is manual and preserves filenames without an original-folder manifest; automatic original-location restore was not an accepted requirement.

### Validation still needed

- The task-date work has retained passing module/UI logs, but its [reconstructed report](../verification/runs/2026-10-01T035738Z-task-dates.md) lacks a complete final source/package audit. Finish that association before claiming a fully verified delivery. This gap was found while repairing pre-existing missing report/journal links during the separate Cursor browser spike.
- Real macOS location authorization and successful positioning. Granted/denied/unavailable fixtures and live-model context tests are not real-device positioning evidence.
- Fresh ChatGPT OAuth and real expiry/refresh. Installed Codex subscription use, approval, restart, and same-thread model/effort changes already pass.
- Real Gmail, X import and Linkding connections; Navidrome installed recovery and playback (direct server authentication now passes). The 29 September Spotify direct streaming OAuth-token run passed installed-app playback, pause/seek/resume, real expired-access-token renewal, and playback after Quit/reopen without another sign-in. Controlled checks also cover renewal of a running helper without restarting it and bounded recovery. Listener-confirmed audibility remains unverified. See [Music](../features/music.md#playback-oauth-token-ownership) and the [resolution journal](../journal/2026-09-29-spotify-oauth-playback.md). Fresh playback browser OAuth and installed playback/control/restart passed in the [2 October follow-up](../verification/runs/2026-10-01T163500Z-installed-playback.md). Fresh library OAuth, actual refresh-token revocation/expiry, other audio devices, and the full library/playlist surface still need validation. Fixtures verify control flow, not every live provider.
- Matched browsing responsiveness measurements against Codex. Hosted search and interactive browsing are separate paths; vendor benchmarks do not establish parity. Agent-classified consequential actions are the selected lean boundary, not a guaranteed read-only browser sandbox.
- A clean separate machine and Linux. Same-machine macOS arm64 relocation and locally signed packaging pass; notarized public distribution is not delivered.

### Deferred scope

An external-agent board adapter needs a concrete runtime/use case before selection. Device sync, concurrent multi-machine writes, extra agent providers, terminal sessions, local-file music, launch-at-login, and a separate service are not current work. There is no need to reopen these choices to maintain the existing app.

The [implementation report](../references/implementation.md) is the evidence register. As gaps are resolved, update the affected topic and this list together, record the validation performed, and preserve the journal history.

## Historical question rounds

The remaining entries record what was open at their dates. Current specification sections and the follow-up above supersede stale phrases such as “not implemented” or “still undecided” in these rounds.

These questions are a conversation queue, not an implementation checklist. Accepted direction lives in the [decision register](../decisions/index.md).

### Implementation authorization · 28 September 2026

D102 authorizes the complete agreed implementation and delegates safe, lean defaults for unanswered decisions. The earlier question lists below are preserved as history. They no longer block implementation or require another preference round. Current defaults, limitations, and validation work are tracked in [implementation progress](../references/implementation.md).

The four post-spike defaults are practical agent classification of consequential browser actions, exact-origin site grants that last for the chat, separate note-conflict copies, and explicit continuation of interrupted work. Browser classification is not a guaranteed read-only boundary. Account-dependent tests remain engineering validation, not answered preferences. The macOS arm64 bundle has now passed relocation and system-only PATH checks; a separate clean machine and Linux remain untested.

### Delivery follow-up · 29 September 2026

The local build is implemented and its [validation report](../references/implementation.md) is current. The lists below preserve planning history. Calendar editing, local data layout, music engine and source labels, expenses precision, bounded automation input, interrupted chat behavior, and browser grant duration now have lean defaults under D102/D103.

Remaining follow-ups need real usage or account setup: live Spotify/Gmail/X/server compatibility, fresh Codex login/expiry, measured browsing latency, and Linux packaging if requested. External board adapters remain unspecified and are not necessary for app-agent use. No additional feature round is required before using the current macOS app.

The location follow-up is settled in [D104](../decisions/index.md#d104-device-location-and-permissions-29-september-2026): request device location immediately and manage permissions in Settings. Fresh time/timezone, approximate saved readings, manual fallback, clearing and per-chat website revocation are implemented. Native macOS approval and actual device positioning need the user's real OS response; fixture and live-chat context checks are recorded in the implementation report.

### Product shape

| ID | Question | Why it matters |
| --- | --- | --- |
| Q04 | How much of the developer workspace should a personal-only user see after terminal removal? | Helps define module enablement and navigation. |
| Q25 | How should wiki automation track changed or deleted source records? | D74 settles source instructions and enablement baseline; progress tracking and deletions remain open. |
| Q28 | How should users create, edit, and remove events directly in the calendar grid? | Views and minimal event fields are accepted; direct interaction details remain open. |

### Deployment and ownership

| ID | Question | Why it matters |
| --- | --- | --- |
| Q05 | What internal layout and backup behavior should the single Clarity root use? | One root and actual notes/wiki files are confirmed; other state representation remains open. |
| Q08 | Should existing repos stay in place? | Resolves ownership versus references outside the roots. Direct local music files are out of scope under D48. |

### Integrations and agent work

| ID | Question | Why it matters |
| --- | --- | --- |
| Q09 | Which Lucia flows should we preserve? | Located at `~/Desktop/Projects/john-harness`; bookmark integration code inspected, mail/automation implementation review remains. |
| Q10 | Which playback implementation fits Music, and what does an artist detail view do? | D61 requires in-app Spotify playback; D62 settles Navidrome address entry. D48/D49 settle sources, playlists, history, switching, search, and single-song stopping. Artist details, source styling, and the optional combined search tab remain open. |
| Q11 | Can Electron collect X bookmarks invisibly, and how do refreshes handle local edits? | The desired workflow remains unvalidated; collector lifetime depends on deployment. |
| Q20 | How does the working Pi/Codex subscription path connect to upstream routing and fresh sign-in/refresh? | The live disposable test passed tool use and resumed model/effort changes; full upstream integration remains. See [spike evidence](../references/technical-spikes.md). Billing preference stays settled. |
| Q21 | How do conversations switch providers/models, and where is history stored? | Determines continuity and ownership of chat state. |
| Q26 | What happens to failed, overlapping, or approval-pending wiki runs? | Missed runs are skipped (D69); use upstream scheduler and approvals for the remaining outcomes. |
| Q27 | How should expenses be corrected/deleted, and what precision/display unit is used? | Daily view and entry are accepted; keep remaining behavior within the two-screen scope. |

### Platform questions

| ID | Question | Why it matters |
| --- | --- | --- |
| Q35 | How do maintained module instances receive updates without losing user data or customizations? | Blueprint templates and user-data backups have different roles. |

### Agent board

| ID | Question | Why it matters |
| --- | --- | --- |
| Q36 | Which concrete external runtime needs connecting, if any, and can it use the existing module interface? | All-agent readability is accepted; a specific external adapter is not selected. |
| Q37 | Are board edit/delete actions needed? | Project AGENTS.md or equivalent instructions determine read/post triggers (D68); no universal cadence is needed. |

### Resolved direction

- **Fourth round:** D86–D90 capture full web intent, broad attachments conditional on simplicity, local note images, module text search, and recoverable Markdown deletion with automatic cleanup. See the follow-up questions below.

- **Q23 and third round:** full GFM without additional syntax (D83), autosave with existing conflict protection (D84), and ordinary clickable wiki sources (D85).

- **Second round:** D77–D82 settle existing Codex subscription use, resuming the last chat, full Markdown intent, immediate untitled note creation, preservation on edit conflict, and completed-task display. D83 subsequently settles the dialect as full GFM without extras.

- **First round:** D71–D76 settle first-version priorities, Codex target, navigation, wiki input/evidence rules, and automation output. See [round-one outcomes](#round-one-outcomes-27-september-2026).

- **Q26, missed runs:** skip missed occurrences and resume at the next scheduled time; no catch-up or replay ([D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026)).

- **Board:** topic threads with concise posts/replies and links; existing Cloudflare OS module methods and platform-managed local storage ([D66](../decisions/index.md#d66-agent-board-design-and-module-methods-27-september-2026)). Available to all agents; each project opts into reads/posts through AGENTS.md or equivalent instructions ([D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026)), clarifying D67. Standing instructions can authorize ongoing use.

- **Lifecycle:** window close keeps Clarity alive with Dock/menu-bar access; explicit Quit exits (D63).
- **Q07:** all app state lives under one chosen folder; the second development root is removed (D64).


- **Q10, playback and connection:** Spotify audio plays inside Clarity ([D61](../decisions/index.md#d61-spotify-plays-inside-clarity-27-september-2026)); Navidrome accepts HTTP/HTTPS address plus sign-in and attempts connection, without network classification ([D62](../decisions/index.md#d62-simple-navidrome-address-connection-27-september-2026)).

- **Q33:** backend runs locally for now (D56).
- **Q05, notes/wiki:** actual Markdown files; both viewable in-app, notes editable (D57). Wiki retains AI-requested edits.
- **Q34:** one stable maintained module instance per enabled module/user, shared by all chats (D59). Upgrade implementation remains open.


- **Q32:** Cloudflare OS-based Clarity accepted under [D53](../decisions/index.md#d53-cloudflare-os-direction-27-september-2026). Local deployment is subsequently settled by D56; exact adaptation implementation remains open.


- **Q29 / Q31:** terminal lifetime and agent-state detection are closed because the module was removed under [D54](../decisions/index.md#d54-terminal-sessions-removed-27-september-2026). Earlier D52 research is historical.

- **Q10, search and continuation:** full Spotify catalogue plus Navidrome library search, including artists without relying on Spotify follows. A single song played from search stops at its end; albums/playlists continue within their collection. No automatic radio or recommendations ([D49](../decisions/index.md#d49-music-search-and-single-song-playback-25-september-2026)).

- **Q10, Music simplifications:** flat playlists owned by Spotify/Navidrome, no direct local-file playback, Clarity-only recent collection history, and one active source with explicit stop-and-switch behavior ([D48](../decisions/index.md#d48-lean-music-scope-and-private-use-25-september-2026)).

- **Q10, desired Music shape:** one Spotify/Navidrome client, all-source views with item-level source identification, faithful single-source playlists, simple player/collection/search screens, and recent items on Music Home ([D47](../decisions/index.md#d47-combined-music-client-scope-25-september-2026)). Feasibility is still open. The combined search tab and badge/border styling remain tentative.

- **Q11, X interaction:** browser-assisted refresh is acceptable; prefer invisible refresh if feasible, retaining the visible-window fallback ([D44](../decisions/index.md#d44-x-refresh-visibility-preference-25-september-2026)). This does not select scheduled or closed-app execution.
- **Q11, direction:** follow Lucia's one-way Linkding import and manual/scheduled refresh ([D41](../decisions/index.md#d41-linkding-one-way-import-and-refresh-25-september-2026)); X is read-only with no like/unlike actions ([D42](../decisions/index.md#d42-read-only-x-integration-25-september-2026)).
- **Q09, location:** the user identified Lucia as `~/Desktop/Projects/john-harness`. [Bookmark reference findings](../features/bookmarks.md#lucia-reference-findings) distinguish working Linkding imports from the unavailable X connector.
- **Bookmark scope:** searchable local list with link adding/browser opening and title, URL, description, tags, and created date; optional linkding and X integrations following Lucia ([D40](../decisions/index.md#d40-local-bookmark-list-and-fields-25-september-2026)). Integration behavior remains open in Q11.
- **News scope:** headlines from chosen sources, with articles opening in the browser ([D38](../decisions/index.md#d38-news-headlines-and-browser-reading-25-september-2026)). Supported sources and refresh behavior remain open on the News page.
- **Mail scope:** inbox and message reader, with chat reading/summaries; no composing or replying ([D37](../decisions/index.md#d37-inbox-and-message-reader-25-september-2026)). The browser link was dropped ([D39](../decisions/index.md#d39-drop-the-gmail-browser-link-25-september-2026)); local/offline data behavior remains open on the Mail page.
- **Q28, event fields:** title plus start/end date and time are sufficient initially ([D36](../decisions/index.md#d36-minimal-calendar-event-fields-25-september-2026)).
- **Calendar views:** Week and Month following macOS Calendar, including seamless month scrolling; Notion Calendar remains an additional reference ([D35](../decisions/index.md#d35-week-and-month-calendar-25-september-2026)).
- **Todo scope:** one task list and marking items done ([D34](../decisions/index.md#d34-simple-task-list-25-september-2026)). Keep additional task-management features out of current scope.
- **Q23, basic screens:** one topic-organized HTML knowledge base with AI-requested edits ([D31](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026)); notes use the supplied folder-tree/tabbed-editor layout with New note in the active folder ([D32](../decisions/index.md#d32-notes-screen-and-new-note-action-25-september-2026)). Keep related wiki content together rather than fragmenting pages.
- **Q14:** Expensif daily view plus new-expense page, preserving Amount/Category/Description UX and omitting Currency/Paid By ([D33](../decisions/index.md#d33-lean-expensif-daily-view-and-entry-25-september-2026)).
- **Q24 / Q12:** adopt upstream approvals under [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026); custom blocking/auto modes and wiki-grant mechanics are set aside for now. Earlier D27/D29 records remain historical.
- **Q03:** notes are human-maintained, with agent editing allowed; wiki is organized knowledge created on request and ideally maintained thereafter by agents ([D26](../decisions/index.md#d26-notes-and-wiki-maintenance-25-september-2026)).
- **Q02 / Q30:** macOS first with a Linux route; Electron/TypeScript is the current desktop direction under [D55](../decisions/index.md#d55-electron-and-typescript-27-september-2026).
- **Q16:** chat acts across all modules ([D17](../decisions/index.md#d17-chat-across-all-modules-25-september-2026)).
- **Q17:** results stay in chat with links to items ([D18](../decisions/index.md#d18-results-stay-in-chat-25-september-2026)); Synara or Codex provide close UI references ([D19](../decisions/index.md#d19-chat-ui-references-25-september-2026)).
- **Q18 / Q20, execution:** retain upstream Pi under [D58](../decisions/index.md#d58-retain-the-pi-agent-27-september-2026), superseding LangChain. Use the existing 20× Codex subscription (D77); integration still needs validation.
- **Implementation and learning:** beginner/intermediate readability and incremental explanations remain. Learn the selected Pi/Cloudflare OS architecture; LangChain is no longer the implementation plan.
- **Q19:** all conversations access enabled modules; no per-conversation selector ([D21](../decisions/index.md#d21-all-conversations-access-enabled-modules-25-september-2026)).
- **Q22:** topic maintenance during chat and scheduled updates from new relevant app state remain. Approval mechanics now follow D60.

### Deferred

Spotify integration-policy/public-product review is deferred at the user's request: the current app is private and shared with friends ([D48](../decisions/index.md#d48-lean-music-scope-and-private-use-25-september-2026)). Revisit if public distribution is considered; do not keep raising it as an active planning blocker.

**Q06** (simultaneous use across machines), the transfer portion of **Q07**, and **Q13** (duplicate automation execution across machines) remain deferred. Backend execution is local; no device sync is requested.

### Suggested next conversation

The [first-version behavior round](#next-first-version-question-round-28-september-2026) is resolved by D97–D100. D101 authorized disposable spikes; initial results are recorded. The current [post-spike round](#post-spike-question-round-28-september-2026) asks about four remaining user-facing tradeoffs. Full upstream integration, auth lifecycle, and performance comparison remain engineering work. Earlier rounds below are retained as history.

Lifecycle, the single root, and board shape/interface are settled. Board usage is opt-in per project through AGENTS.md or equivalent instructions. Reading/posting cadence is delegated to those instructions; do not keep asking for a global trigger or require fresh requests for actions covered by standing instructions.

Missed runs, source instructions, initial baseline, evidence preference, and the location of automation output are settled (D69, D74–D76). Codex subscription intent, reopening behavior, note creation/conflicts, and completed-task display are also settled (D77–D82). D83–D85 also settle GFM without extensions, notes autosave, and clickable wiki sources. Prioritize read-only investigation of remaining first-version integration risks before asking more implementation-dependent questions. Board edit/delete and concrete external connectivity can be handled when needed, without inventing a project policy system. See [board behavior](../features/agent-board.md).

Implementation validation is a separate queue: package the local runtime; protect real files from stale writes; prove embedded Spotify playback; check upstream approvals for playback and scheduled edits. Existing approval behavior remains adopted. Codex access validation, input progress, and first-version details remain open. Chat, notes, todo, and wiki are the accepted priorities; do not reopen that selection.


The five architecture choices are settled in D56–D60. Do not keep asking about hosted deployment, database-only notes, LangChain, fresh modules per chat, or custom confirmation modes.

Music behavior is now settled: Spotify plays inside Clarity; Navidrome takes the supplied HTTP/HTTPS address and attempts connection. Do not repeat the separate-player or local/public-server questions. Select and validate the playback/connection implementation when implementation is authorized; no player engine is chosen yet.

X already has a visibility preference: invisible refresh where feasible, with visible fallback. Validate it; no need to ask the same preference again. Local file behavior is now decided; explain any required connection work rather than asking the user to choose internal mechanisms.

Next architectural concerns are packaging the local runtime and connecting agents to actual Markdown files. Closing the window keeps execution alive and explicit Quit stops it; missed runs are skipped (D69), with local sleep/restart behavior still to validate. No implementation is authorized yet.

### Current question round · 27 September 2026

The user requested several questions at a time, inspired by [Matt Pocock's grilling workflow](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md). Ask independent decisions together, with recommendations; defer dependent follow-ups until answers arrive. This round was answered. Decisions D71–D76 below record the outcome; the original recommendations remain here for discussion history.

| Question | Assistant recommendation pending user response |
| --- | --- |
| Which three modules must work for the first version to be useful? | Alongside chat, prioritize notes, wiki, and todos to exercise the core read/write workflow. This does not remove other modules from the intended product. |
| Which AI accounts must the first version use, and is separate API billing acceptable? | Start with one provider/access path; account compatibility must be verified before promising it. |
| How should the sidebar arrange modules and recent chats? | Enabled modules above recent chats, with Settings at the bottom. |
| Which sources should a scheduled wiki updater examine? | Name sources in its plain-language instruction; start with relevant changes in chats, notes, and bookmarks. This does not limit normal chat's access to enabled modules or introduce a selector UI. Board usage still requires project/task opt-in. |
| Should a newly enabled wiki schedule examine older material? | Start with changes from enablement, using the existing topic as a baseline; process older material only if explicitly requested. |
| What should happen when a new source contradicts an existing wiki claim? | Preserve references to both and mark the disagreement unless the source clearly corrects the earlier claim. No separate conflict-management UI is proposed. |
| Where should automation outcomes appear? | A concise latest result on the Automations page; avoid a new chat per run. This display would be an adaptation, not claimed upstream functionality. |

### Round one outcomes · 27 September 2026

- D71: chat, notes, todo, and wiki first.
- D72: Codex first; clarify subscription/API access without replacing Pi.
- D73: upstream navigation first; the simple sidebar recommendation is accepted.
- D74: source scope in plain-language instructions; use changes from enablement and the existing wiki as context. Older input only on request.
- D75: preserve conflicting evidence, with greater weight for newer evidence.
- D76: automation output stays in Automations, not chats.

### Next question round · 27 September 2026

This round was answered in D77–D82. The original recommendations below are historical; the proposed basic Markdown subset was rejected in favor of full Markdown support.

1. Codex access: confirm whether the existing ChatGPT/Codex subscription is intended. Recommend that route if supported; no separate API billing assumed.
2. Opening chat: resume the last chat or start blank? Recommend resuming the last chat with New chat available.
3. Notes formatting: which Markdown elements are essential? Recommend headings, emphasis, lists/checklists, links, quotes, and code; defer tables, embeds, and attachments unless needed.
4. New-note naming: recommend immediately creating Untitled.md in the active folder (notes root if none), numbering duplicates, and allowing filename rename.
5. External note edits: recommend refreshing clean files from disk, preserving unsaved local work on conflict, and raising a simple conflict rather than silent overwrite or automatic merging.
6. Completed tasks: recommend showing them below unfinished tasks, struck through, with uncheck to restore; no separate archive.

### Third question round · 27 September 2026

This round is resolved by D83–D85. The recommendations below are retained as discussion history; extra syntax extensions were explicitly declined.

1. Markdown compatibility: propose full GitHub Flavored Markdown, including its tables and task-list extensions. Clarify whether additional syntax such as math, footnotes, or double-bracket note links is required. Do not assume every Obsidian feature is in scope.
2. Notes saving: propose autosave while typing, retaining the accepted external-change conflict behavior. Exact timing is an implementation detail.
3. Wiki evidence: propose ordinary clickable source references for factual additions, including originating chats, notes, bookmarks, or external pages where applicable. This concerns showing evidence, not adding a new source-discovery scope or provenance database.

### Fourth question round · 27 September 2026

The user requested another batch. These are independent product questions for the first useful version, not implementation selections. This round is answered in D86–D90: full web intent, conditional broad attachments, note-image capture, title/content search, and recoverable deletion with cleanup. Web breadth and attachment processing require follow-up; 30 days is the user-suggested working retention period.

1. **Web research in chat:** should chat search the web and read webpages for topic research in the first version? Recommend yes, with sources. This does not expand scheduled wiki maintenance beyond its accepted app-state input. Availability through the selected runtime/account is a research question; no bundled search access or paid service is assumed.
2. **Chat attachments:** which types are essential initially? Recommend images/screenshots and plain-text/Markdown files; clarify whether PDFs are needed immediately before adding that processing scope. This does not change the notes file format.
3. **Images in Notes:** should pasting or dropping an image save a local copy and insert a standard Markdown image link? Recommend yes, with assets under the single data root and relative links. Image rendering is within GFM; the new question is capture/storage behavior, not extra Markdown syntax.
4. **Finding notes and wiki topics:** should each module have a title-and-content search? Recommend simple text matching in each module. No global search product or semantic retrieval implementation is selected.
5. **Deleting Markdown content:** should deleted notes/wiki files be recoverable? Recommend moving files to a Trash folder inside the data root, with manual recovery through Finder initially. Wiki deletion remains requested through AI and follows upstream approvals. No task/chat deletion behavior or version-history system is implied.

Answers may create follow-up questions about processing limits, asset paths, source links after deletion, and implementation fit. Those dependent questions should wait. A subsequent targeted inspection of web-fetch and attachment code is recorded in the chat page; the broader runtime review remains outstanding.

### Fifth question round · 27 September 2026

Two unresolved scope questions based on inspected upstream code:

1. Does “full web capabilities” include interactive browsing and user-authenticated sites? Recommend search/read plus reuse of an existing browser integration for click/type/download tasks if compatible. The inspected upstream fetch tool alone does not satisfy that broader interpretation. Do not invent a new permission system.
2. Can unsupported file types remain attached locally with an explicit cannot-read state? Recommend this fallback while analyzing supported inputs. Supporting every format's contents is a different, potentially complex requirement. Ask which formats require analysis if the fallback is insufficient.

The user suggested 30 days for Trash cleanup. Record it as the working default; measuring from deletion and cleaning while Clarity runs is an assistant implementation proposal. No live deletion or application implementation is authorized.

See [findings and limitations](../foundations/chat.md#web-and-attachments-27-september-2026).

### Research before the next decision · 28 September 2026

At the user's request, investigated the fifth round before asking for answers. See [web browsing and attachment research](../references/web-and-attachments.md). The two scope questions remain open. The material browser choice is now clearer: unchanged upstream MCP approvals interrupt even navigation/clicks; smoother browsing would require an agreed adaptation. The attachment recommendation is original-file storage with bounded text/image/PDF-text analysis and an explicit unsupported-file fallback. No new requirement or implementation is adopted by this research.

### Browser performance investigation · 28 September 2026

The user requests Codex-level speed and lightweight implementation (D91), with recent X/HN research. The [follow-up report](../references/web-and-attachments.md#browser-performance-follow-up) refines the earlier generic MCP recommendation toward focused observations and batched actions. Performance parity, exact browser driver, hosted search integration, and the approval mismatch remain unresolved. These need representative validation once application implementation is authorized; do not ask the user to select libraries based only on vendor benchmarks. Further attachment discussion is deferred by the user.

### Attachment question round · 28 September 2026

D92 accepts the Playwright batching direction and ends the attachment deferral. Browser approval behavior and performance validation remain open, but the current conversation moves to attachments. The following are the original proposals, preserved as discussion history. This round is now answered by D93–D96: the analysis baseline and controls are accepted, local copies must be under 30 MB, and the user replaces indefinite retention with 90-day attachment cleanup:

1. **Analysis baseline:** propose reading text/Markdown/code/CSV/JSON, supported images, and PDF text initially; keep other file types attachable with a clear unsupported-analysis message. Ask which additional formats, such as Office documents, scanned PDFs, audio, or video, must be understood from day one.
2. **Original-file ownership:** propose copying attachments into the Clarity data folder as snapshots, preserving the source file. Later changes to the source would not silently alter the conversation's attachment.
3. **Adding files:** propose drag-and-drop, a file-picker button, and pasted images in the chat composer. No attachment-management module is implied.
4. **Retention:** propose keeping attached originals until explicitly removed, with no automatic expiry of active attachments. The 30-day working Trash retention does not imply deleting chat attachments after 30 days. Chat-deletion and shared-reference cleanup details are not decided here.

Round complete. Do not ask these four questions again. Remaining implementation details include the exact byte-unit convention, model/combined payload limits, expiry timing (attachment date is the working assumption), and validating D100's separate persistent module copies for deliberately embedded attachments. Do not expand 90-day expiry to module content.

### Next first-version question round · 28 September 2026

Resolved by D97–D100: the user agreed to all four recommendations. The original questions below are preserved as discussion history; they do not authorize application implementation:

1. **Browser approval friction:** once the user authorizes browsing a site, recommend allowing routine navigation, search, and reading without a separate confirmation for every click, while confirming actions that send, publish, delete, purchase, or otherwise change external state. This would require adapting the generic upstream connector described in the research; D97 explicitly refines D60 for browser operations. Reliably enforcing the boundary needs validation, and arbitrary clicks cannot simply be labelled read-only. Raise complexity before adopting a custom permission implementation.
2. **Earlier conversations:** recommend using the current thread by default and looking up older chats when the user requests it or explicitly refers to an earlier discussion. Do not automatically mix all previous conversations into every chat or introduce an automatic memory subsystem. This concerns conversation-history retrieval, not access to enabled modules, which is already settled.
3. **Model/effort changes:** recommend applying a picker change to the next message in the same thread, preserving visible history and avoiding a new chat. First-provider scope remains Codex; no additional provider integration is requested. Actual context/input compatibility still requires validation.
4. **Attachments reused in Notes/Wiki:** when deliberately embedding a chat attachment there, recommend making a separate persistent module-owned asset copy with a relative link. The chat copy still expires after 90 days. Merely mentioning or summarizing an attachment does not preserve its original automatically. This avoids silently breaking embedded content without a shared-reference tracking system.

Keep credential integration, local runtime packaging, browser latency measurements, and model-input compatibility in the engineering research queue rather than asking the user to solve them as preferences.

### First-version round outcomes · 28 September 2026

D97 settles browser approval behavior; D98 settles earlier-chat retrieval triggers; D99 settles in-thread model/effort changes; D100 settles persistent copies for attachments embedded in Notes/Wiki. Do not ask these preference questions again. Q21's model-switch behavior is resolved; history storage and compatibility remain engineering questions. Browser permission enforcement and site-grant scope/duration still require design, with material complexity raised to the user before implementation.

### Proposed next engineering investigation · 28 September 2026

See [the validation order](../foundations/desktop-stack.md#proposed-first-version-validation-order-28-september-2026): chosen Codex subscription through Pi first; local desktop runtime and actual-file access second; browser approvals and performance third. Report reusable code, minimal adaptations, unknowns, and necessary future tests. These are source-review tasks before application implementation, not new user preference questions. That was the boundary for the explanation-only turn; D101 subsequently authorizes disposable runtime spikes without beginning Clarity implementation.

### Disposable spike findings · 28 September 2026

The [runtime report](../references/technical-spikes.md) distinguishes successful component tests from untested full integration. Q20 has live Pi/Codex evidence; local persistence, basic host-file access, Electron lifecycle, and a minimal app bundle also passed. Do not repeat these as wholly untested or treat them as proof that the complete upstream app works.

The main new concern is browser enforcement: blocking non-GET requests did not stop a fixture mutation through GET. A practical agent/approval convention and a universal technical read-only guarantee are different promises. Raise that tradeoff before adopting stronger infrastructure. Browser speed relative to Codex, fresh OAuth/refresh, full upstream packaging, and atomic file conflict handling remain research work.

### Post-spike question round · 28 September 2026

**Historical proposals; defaults adopted under D102's delegated implementation authority.** These questions refine unsettled behavior without reopening the chosen stack, first-version modules, subscription, or the requirement to preserve both versions of a conflicted note.

1. **Browser action classification:** is agent judgment acceptable for identifying consequential actions and routing them through confirmation, with ambiguous actions also prompting? Recommend this practical approach for the private app. It keeps the adaptation small, but classification can be mistaken; it is not a guaranteed technical read-only boundary. Stronger guarantees would require restricting supported interaction or introducing more complexity. D97's intended confirmation behavior remains; this asks about its enforcement tradeoff.
2. **Site authorization lifetime:** should permission to browse a site last for the current chat, including reopening it later? Recommend that scope initially; another chat requests its own authorization. Browser login sessions may remain saved separately, but being signed in does not itself grant an agent permission. Exact origin/redirect handling still needs validation; no cross-site permission is implied.
3. **Conflicted note recovery:** when an external edit conflicts with unsaved work, should Clarity save the unsaved draft as a separate clearly named conflict copy and notify the user, leaving the external version intact? Recommend this concrete preservation path, with manual reconciliation and no automatic merge. D81 already requires preserving work; only the user-facing recovery method is being refined. Agent edits based on stale content should re-read/reconsider rather than blindly retry.
4. **Interrupted chat work:** after a crash or explicit Quit interrupts an agent turn, should reopening show the saved partial work and require an explicit user request to continue? Recommend yes, preserving completed actions and avoiding automatic replay. Closing only the window still leaves execution running under D63. Reconciliation of an action whose completion is uncertain remains an engineering problem, not a claim of exactly-once execution.

Full upstream integration, fresh login/refresh, clean-machine packaging, and matched browser benchmarks should be investigated through the already authorized spikes. They are not questions for the user to solve by choosing libraries. The main outstanding product tradeoff from current evidence is browser enforcement; the other three are independent behavior choices.
