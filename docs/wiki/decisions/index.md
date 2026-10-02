---
title: Decision register
section: Decisions
status: Accepted
updated: 2026-10-03
order: 0
summary: User decisions, delegated implementation defaults, and their replacements.
---
# Decision register

User decisions and assistant-selected defaults are identified separately below. D102 delegates lean implementation choices; D103 records those choices. Each entry is dated: old validation/open-question wording describes that moment, not the current app. Read the topic specifications and [current follow-up](../discussions/open-questions.md) for present status. A later decision supersedes earlier conflicting scope; retain the earlier entry with its replacement link.

## Initial direction · 24 September 2026

| ID | Direction | Source |
| --- | --- | --- |
| D01 | Explore and iterate before building the Clarity app. **Planning-only restriction superseded by [D102](#d102-build-clarity-with-lean-defaults-28-september-2026).** | Initial user brief |
| D02 | User-selected folders own local application state. **Refined by D56/D57 and [D64](#d64-one-clarity-data-folder-27-september-2026): local backend, actual Markdown, one chosen root; concrete layout selected under D103.** | Initial user brief |
| D03 | Separate personal and development roots. **Superseded by [D64](#d64-one-clarity-data-folder-27-september-2026): one Clarity data folder.** | Initial user brief |
| D04 | Bring synced files to another machine and open them with another instance. **Superseded for current scope by [D24](#d24-local-state-with-sync-deferred-25-september-2026):** no device sync for now; the later D103 selects local SQLite plus actual Markdown. | Initial user brief; 25 September revision |
| D05 | Let users choose modules and authenticate optional accounts. | Initial user brief |
| D06 | Mail requires a connected Google account. | Initial user brief |
| D07 | Music supports local files or Spotify authentication. **Superseded in source scope by [D47](#d47-combined-music-client-scope-25-september-2026) and [D48](#d48-lean-music-scope-and-private-use-25-september-2026):** Spotify and Navidrome; direct local files are out of scope. | Initial user brief; 25 September revisions |
| D08 | Bookmarks are local, with optional X and linkding sources. | Initial user brief |
| D09 | Maintain a Markdown tree and a self-contained Wikipedia-inspired reader for brainstorming. | Wiki request |

## D10 — Functional UI text · 24 September 2026

**Accepted from user feedback:** remove unnecessary flourishes and ornamental text. Every label, caption, and subtitle must have a justifiable UX purpose.

For the planning reader, retain text that identifies a page or destination, names an action, provides necessary instructions, or communicates meaningful state. Remove slogans, decorative marks, repeated context, and subtitles that duplicate the article. This refines D09's Wikipedia-inspired presentation; it does not replace the Markdown or standalone-reader requirement.

See the [UI cleanup journal](../journal/2026-09-24-ui-cleanup.md) for the changes and rationale.

Wiki-tooling decisions D11–D15 are preserved in `docs/archive/wiki-tooling/decisions/index.md`, outside this reader. Their IDs remain reserved. The current workflow is maintained by the sibling `planning-wiki` skill.

## D16 — Chat opening screen · 25 September 2026

**Accepted from the user:** “the first screen should just be a chat screen, with a recent chats on the sidebar.”

Clarity opens to chat, with recent conversations in the sidebar. This establishes the initial screen; module navigation and whether to start a new conversation or resume one remain open. Chat capabilities were subsequently clarified by D17. No prior opening-screen decision is superseded.

See [product vision](../vision/product.md#opening-screen) and the [discussion journal](../journal/2026-09-25-chat-opening-screen.md).

## D17 — Chat across all modules · 25 September 2026

**Accepted from the user:** chat should be able to act across all modules: summarize news headlines, add or edit todo items, add calendar events, read notes, read and summarize mail, retrieve bookmarks, search and play music, and alter the in-app wiki.

This extends D16's chat opening screen with a functional role across Clarity. The existing optional-module and account requirements remain in force. Specific operations for expenses, terminals, the agent board, and automations still need definition. Result presentation, permissions, and confirmation behavior are not decided here.

See [chat and module actions](../foundations/chat.md) and the [discussion journal](../journal/2026-09-25-chat-module-actions.md). This resolves Q16's broad scope without selecting an agent implementation or model provider.

## D18 — Results stay in chat · 25 September 2026

**Accepted by the user:** the assistant proposed staying in chat with a compact result and a link to the relevant item; the user replied, “yes, that would be nice. staying in chat.”

Module actions keep the conversation visible. Users can open the linked item themselves; the app does not automatically navigate away after completing the action. This resolves the result-navigation question left open in D17. Exact result styling remains to be designed.

See [chat presentation](../foundations/chat.md#results-stay-in-chat) and the [discussion journal](../journal/2026-09-25-chat-presentation.md).

## D19 — Chat UI references · 25 September 2026

**Accepted from the user:** “chat UI just closely refer to synara or codex's”.

Use Synara or Codex as close references for Clarity's chat UI. Neither is chosen as the sole reference, and exact layouts and interactions still need review. This applies to the app's chat interface; the planning reader retains its existing style. No application stack or model/provider choice is implied.

See the [reference register](../references/index.md#chat-ui-references) and the [discussion journal](../journal/2026-09-25-chat-presentation.md).

## D20 — Two action modes · 25 September 2026

**Superseded for current implementation by [D60](#d60-adopt-upstream-approvals-27-september-2026).** Retain the earlier text as history. Cloudflare OS approval behavior is adopted for now; custom wiki-grant mechanics are set aside, while topic maintenance remains intended.

**Partially superseded by [D27](#d27-session-authorized-wiki-maintenance-25-september-2026):** wiki maintenance can receive one scoped approval for the session, replacing repeated approval of each covered edit. General action modes remain in force elsewhere.

**Accepted from the user:** offer “ask for confirmation” and “auto mode”. Confirmation mode surfaces all actions as an in-chat question with **Proceed** or **Cancel**, before execution. Auto mode executes without confirmation. No exceptions for reads or low-impact actions have been selected. Default mode, setting scope, and multi-step cancellation remain open.

See [action modes](../foundations/chat.md#action-modes).

## D21 — All conversations access enabled modules · 25 September 2026

**Accepted from the user:** every conversation can access all enabled modules; keep this simple. No per-conversation module scoping is required. Required account connections and the chosen action mode remain applicable. Context retrieval implementation is not selected.

See [conversation access](../foundations/chat.md#conversation-access).

## D22 — Installed harnesses and model selection · 25 September 2026

**Partially superseded by [D50](#d50-langchain-runs-the-assistant-26-september-2026):** LangChain now owns assistant execution and calls a model directly. Installed-harness detection/connection is no longer the chat execution plan. Model/effort selection and no local models remain. Separate developer terminal sessions are unaffected.

**Accepted from the user:** follow Synara by detecting installed harnesses such as Codex, Claude, Kimi, and Pi, then allowing users to connect. Include a model/effort picker in chat, using the supplied screenshot as reference. No local model support for now.

Specific adapter protocols and supported versions remain to be investigated. See [harness connections](../foundations/harnesses.md).

## D23 — macOS first · 25 September 2026

**Accepted from the user:** support macOS first and keep a route to Linux open. This sets platform priority without choosing a desktop framework or committing to a Linux release date.

See [product vision](../vision/product.md#platform).

## D24 — Local state with sync deferred · 25 September 2026

**Local-only storage reopened by [D53](#d53-cloudflare-os-direction-27-september-2026).** No new sync feature has been requested. Hosted versus local runtime remains unresolved; the text below records the earlier direction.

**Accepted from the user:** no device sync for now; Clarity is fully local with state saved locally. Explore local-first technologies, including CRDTs, ElectricSQL, WatermelonDB, Jazz, and Automerge, without choosing a stack yet.

This supersedes D04's synced-folder promise for current scope. The original ordinary-file/Dropbox/Google Drive approach is historical motivation; whether every datum must remain directly editable as a file is reopened. D02's local user ownership and D03's personal/development separation have not been withdrawn. Their storage implementation remains open.

See [portability and sync](../foundations/portability.md), [storage exploration](../foundations/local-first.md), and the [discussion journal](../journal/2026-09-25-runtime-and-local-state.md), which records D20–D24.

## D25 — Define modules before choosing technology · 25 September 2026

**Accepted from the user:** determine what the modules look like and how they work before choosing technology. The named local-first technologies are examples, not an exhaustive list or a closed shortlist; better-fitting alternatives may exist.

This sets the sequence for D24's storage exploration. Keep research as background and evaluate technology against the module requirements once those are clearer. No file/database split, library, or app framework has been accepted.

See the [feature map](../features/index.md#module-definition) and [discussion journal](../journal/2026-09-25-modules-before-technology.md).

## D26 — Notes and wiki maintenance · 25 September 2026

**Later clarification:** [D31](#d31-one-topic-organized-html-knowledge-base-25-september-2026) selects one topic-organized knowledge base and rules out direct user editing for now. Earlier references to separate topic wikis should be read in that light.

**Accepted from the user:** notes are fully user-maintained and intended for the human, although agents can edit them. Wiki is organized knowledge maintained by agents at the user's request. A user can ask for a wiki on a topic they are researching; once created, it is ideally fully maintained and updated by the agent.

This resolves the maintenance-role distinction in Q03. It does not make notes inaccessible to agents or prohibit human editing of wiki pages. What triggers later wiki updates, how maintenance appears in the UI, and the storage representation remain open. Existing action-mode requirements still apply.

See [notes](../features/notes.md), [wiki](../features/wiki.md), and the [discussion journal](../journal/2026-09-25-notes-and-wiki.md).

## D27 — Session-authorized wiki maintenance · 25 September 2026

**Superseded for current implementation by [D60](#d60-adopt-upstream-approvals-27-september-2026).** Retain the earlier text as history. Cloudflare OS approval behavior is adopted for now; custom wiki-grant mechanics are set aside, while topic maintenance remains intended.

**Accepted from the user:** maintain the topic's wiki automatically as research happens in chat. Before entering allowed-to-edit mode, ask an in-chat Yes / No question such as “Should I update the wiki on this topic during this session?” Yes permits autonomous wiki updates for the entirety of that session; No grants no automatic editing.

This refines D26's maintenance trigger and partially supersedes D20's per-action confirmation requirement for covered wiki edits. It does not authorize edits to unrelated modules. The initial grant prompt is specified; an auto-mode bypass is not. D29 subsequently clarifies session lifetime as the entire saved chat/thread; revocation controls and supporting-action scope remain open.

See [wiki behavior](../features/wiki.md#during-research-in-chat) and the [discussion journal](../journal/2026-09-25-wiki-maintenance-triggers.md).

## D28 — Scheduled wiki updates from new app state · 25 September 2026

**Target clarified by [D31](#d31-one-topic-organized-html-knowledge-base-25-september-2026):** select topic content within one knowledge base, rather than a separate wiki instance.

**Accepted from the user:** the Automations page lets users select a wiki and configure a schedule to update it automatically. Explore only new app state and update when new relevant information is found. No independent web-research step was requested.

This specifies a personal-knowledge automation in addition to developer workflows. It does not select a scheduler, database, or harness protocol. What counts as new state, the initial baseline, and recurring authorization remain to be defined. Missed-run behavior was subsequently settled by D69.

See [automations](../features/automations.md#scheduled-wiki-maintenance) and the [discussion journal](../journal/2026-09-25-wiki-maintenance-triggers.md).

## D29 — Wiki permission lasts for the chat thread · 25 September 2026

**Superseded for current implementation by [D60](#d60-adopt-upstream-approvals-27-september-2026).** Retain the earlier text as history. Cloudflare OS approval behavior is adopted for now; custom wiki-grant mechanics are set aside, while topic maintenance remains intended.

**Accepted from the user:** “this session” means the entirety of that particular chat, including reopening the same thread tomorrow. It is not limited to a model context window.

This clarifies D27 without replacing its Yes / No grant. Permission persists with the saved chat and does not expire merely because the app is closed, the chat is reopened, or context is compacted. It remains scoped to that chat's wiki maintenance. Revocation controls remain open; this is not standing permission for a separate scheduled automation.

See [wiki maintenance](../features/wiki.md#during-research-in-chat) and the [discussion journal](../journal/2026-09-25-lean-default-and-thread-permission.md).

## D30 — Lean by default · 25 September 2026

**Accepted from the user:** keep everything LEAN by default. Implementation must be intentionally simple for all features. If a module or feature cannot be kept simple, raise that with the user. Also surface hard questions, concerns, and implementation choices that could become complex.

Added this rule to project `AGENTS.md`. Prefer the smallest approach that satisfies agreed behavior; explain complexity and simpler alternatives before committing to a complex approach. Do not silently remove agreed requirements or add speculative infrastructure. This strengthens the original lean-product direction and applies throughout planning and eventual implementation.

**Further user clarification during calendar discussion:** resist introducing features, question their necessity, and consult the user when in doubt. Added this explicitly to `AGENTS.md`; a reference app's extra features do not become requirements by default.

See [working principles](../vision/principles.md) and the [discussion journal](../journal/2026-09-25-lean-default-and-thread-permission.md).

## D31 — One topic-organized HTML knowledge base · 25 September 2026

**Accepted from the user:** one knowledge base separated by topic. Keep a single topic, idea, feature, function, or event together; split into pages only when absolutely necessary and warranted by sufficiently different content.

The wiki module is a single webview targeting local `index.html`, browsed like the planning-wiki reader. Changes are requested by asking AI; no direct editing for now. This resolves Q23's wiki organization and interaction choices and clarifies D26's topic-wiki wording. It does not select the rest of Clarity's storage or app stack.

See [wiki](../features/wiki.md#organization-and-reader) and the [screen-definition journal](../journal/2026-09-25-module-screens.md).

## D32 — Notes screen and new-note action · 25 September 2026

**Accepted from the user and supplied screenshot:** a folder/file list on the left, open-note tabs and a rich-text Markdown editor on the right. Put **New note** at the top of the file list; it creates a note file in the active folder.

This resolves the basic notes screen in Q23. New-note naming and supported Markdown features remain open. No editor library is selected.

See [notes](../features/notes.md#screen-and-new-note-behavior) and the [screen-definition journal](../journal/2026-09-25-module-screens.md).

## D33 — Lean Expensif daily view and entry · 25 September 2026

**Accepted from the user:** use a lean Expensif with only the supplied daily view and new-expense page. Preserve Amount, Category, and Description input methods and UX. Currency and Paid By are not important; omit their controls initially.

The screenshots and inspected source define daily grouping, totals, add actions, and digit-buffer/suggestion entry. The lean form retains Date and the reference's creation actions. No expense-calendar screen or additional budgeting/reporting scope is selected. This resolves Q14's reference-flow question; correction/deletion behavior and a default display unit remain open.

See [expenses](../features/expenses.md) and the [screen-definition journal](../journal/2026-09-25-module-screens.md).

## D34 — Simple task list · 25 September 2026

**Accepted from the user:** keep todos simple: just a task list and marking things as done. This answers the single-list versus multiple-list question with a single minimal list.

Adding and editing tasks through chat remains accepted under D17. Additional task-management features are outside current scope. Completed-item presentation and storage remain implementation details to resolve later.

See [todos](../features/todos.md) and the [discussion journal](../journal/2026-09-25-simple-todos.md).

## D35 — Week and month calendar · 25 September 2026

**Accepted from the user:** calendar switches between Week and Month views. Both follow macOS Calendar; Month must support seamless scrolling. Notion Calendar is also a useful reference. Keep the module lean and consult the user before introducing features whose necessity is unclear.

This replaces the earlier assistant agenda proposal. It does not adopt all controls visible in the supplied screenshots, choose a calendar library, or define the complete event form.

See [calendar](../features/calendar.md) and the [discussion journal](../journal/2026-09-25-calendar-views.md).

## D36 — Minimal calendar event fields · 25 September 2026

**Accepted from the user:** title plus start/end date and time are sufficient for initial event creation. The user confirmed the proposed minimal field set with “yes sufficient.”

This resolves the event-fields portion of Q28 and keeps the form within the lean scope of D35. Direct grid creation, editing, and removal interactions remain open.

See [calendar](../features/calendar.md#event-fields) and the [discussion journal](../journal/2026-09-25-calendar-event-fields.md).

## D37 — Inbox and message reader · 25 September 2026

**Partially superseded by [D39](#d39-drop-the-gmail-browser-link-25-september-2026):** the browser-link request below was dropped; the inbox, reader, and chat scope remains accepted.

**Accepted from the user:** Mail is just an inbox and message reader, with no composing or replying. Reading and summarizing through chat remains accepted under D17; a Google connection remains required under D06.

The user would also like a link opening the corresponding email in a browser, if possible. Record this as desired conditional behavior; reliable targeting of the message and account still needs verification. Keep the module lean rather than expanding it into a full mail client.

See [mail](../features/mail.md) and the [discussion journal](../journal/2026-09-25-mail-reader.md).

## D38 — News headlines and browser reading · 25 September 2026

**Accepted from the user:** a headline list from chosen sources, with articles opening in the browser, is sufficient for News. The user confirmed this proposed minimal reading experience. Chat headline summaries remain accepted under D17.

Source types, source configuration, and refresh behavior remain open. This does not select RSS/Atom or add an in-app article reader.

See [news](../features/news.md) and the [discussion journal](../journal/2026-09-25-news-headlines.md).

## D39 — Drop the Gmail browser link · 25 September 2026

**Accepted from the user:** drop the link opening an email in Gmail after the assistant noted that reliable message/account targeting still needed validation. This supersedes only D37's conditional browser-link request.

Mail remains a Google-connected inbox and message reader with chat reading and summaries. Browser-link implementation and feasibility validation are removed from the work queue. News articles still open in the browser under D38.

See [mail](../features/mail.md) and the [discussion journal](../journal/2026-09-25-drop-mail-browser-link.md).

## D40 — Local bookmark list and fields · 25 September 2026

**Accepted from the user:** Clarity keeps its own bookmarks in a searchable list, with link adding and browser opening. Bookmark fields are title, URL, description, tags, and created date. Support linkding and X integrations much like Lucia.

This confirms the proposed main screen and refines D08's local-bookmark direction. The user subsequently identified Lucia as `~/Desktop/Projects/john-harness`; [reference inspection](../features/bookmarks.md#lucia-reference-findings) found read-only Linkding imports and an unavailable X connector. D41 subsequently accepts Linkding's one-way import/refresh, and D42 establishes read-only X access. Duplicate handling and imported-date semantics remain open.

See [bookmarks](../features/bookmarks.md) and the [discussion journal](../journal/2026-09-25-bookmark-fields.md).

## D41 — Linkding one-way import and refresh · 25 September 2026

**Accepted from the user:** follow Lucia's Linkding integration after reviewing its one-way import and manual/scheduled refresh behavior. Connect with an instance URL and API token, import locally, never write changes back to Linkding, and retain imported records when disconnected.

This resolves Q11's Linkding direction. Exact refresh interval and whether imported fields allow local edits remain open; it does not import Lucia's broader UI or architecture into Clarity.

See [bookmarks](../features/bookmarks.md#integrations) and the [research journal](../journal/2026-09-25-read-only-bookmark-integrations.md).

## D42 — Read-only X integration · 25 September 2026

**Accepted from the user:** investigate X with read-only access; no like/unlike actions. The active module requirement is reading bookmarks, not an expansion into other X surfaces.

This decision establishes the read-only boundary without selecting paid API access or an unofficial client. D44 subsequently accepts the browser-assisted interaction; implementation remains unselected. Research observations and recommendations are recorded separately from accepted scope.

See [bookmarks](../features/bookmarks.md#integrations) and the [research journal](../journal/2026-09-25-read-only-bookmark-integrations.md).

## D43 — Investigate a lean unofficial X reader · 25 September 2026

**User-stated direction:** investigate the unofficial X route further, seeking a lean and robust option if possible. This steers research beyond the assistant's earlier official-API recommendation while retaining D42's read-only boundary.

No library or browser extension was selected by this research direction. D44 subsequently accepts the browser-assisted interaction and sets its visibility preference; live validation and implementation choices remain open.

See [unofficial X investigation](../features/bookmarks.md#unofficial-x-investigation-25-september-2026) and the [discussion journal](../journal/2026-09-25-unofficial-x-reader.md).

## D44 — X refresh visibility preference · 25 September 2026

**Accepted from the user:** the proposed browser-assisted bookmark refresh with a visible X connection window is acceptable. Invisible background refresh would be better if possible. Keep visible refresh as an acceptable fallback.

This resolves the visibility preference without promising hidden operation before validation. The lean rule still applies: raise complexity rather than introducing substantial machinery to hide the window. No automatic schedule, closed-app execution, library, or desktop shell is selected.

See [refresh interaction](../features/bookmarks.md#refresh-interaction-and-limits) and the [discussion journal](../journal/2026-09-25-x-refresh-visibility.md).

## D45 — Compare Spotify playback options · 25 September 2026

**Resolved by [D61](#d61-spotify-plays-inside-clarity-27-september-2026):** Spotify audio must play inside Clarity. Preserve the comparison request below as history.

**User-stated preference:** either playback inside Clarity or control of an existing Spotify player is acceptable in principle. Discuss the advantages and disadvantages before selecting an approach.

This does not require implementing both modes. The assistant recommends external Spotify control first for simplicity, but that recommendation remains unaccepted. Local files were part of the original scope and subsequently removed by D48.

See [music tradeoffs](../features/music.md#spotify-playback-tradeoffs-25-september-2026) and the [discussion journal](../journal/2026-09-25-spotify-playback-tradeoffs.md).

## D46 — Music core implementation references · 25 September 2026

**Accepted from the user:** use the open-source music clients to copy or emulate whichever relevant core implementation is most robust. Reproducing a reference client's complete UI is not the objective. Keep the Music module lean under D30.

This clarifies the purpose of the client survey and redirects the earlier assistant emphasis on UI references. It does not select a project, audio library, framework, helper process, or music source. Robustness needs source-level evidence and validation beyond README claims. Application implementation remains deferred.

See [core implementation evaluation](../features/music.md#core-implementation-evaluation) and the [discussion journal](../journal/2026-09-25-music-core-reuse.md).

## D47 — Combined Music client scope · 25 September 2026

**User-stated direction, subject to feasibility:** combine Spotify and Navidrome in one lean Music client. Connect Spotify and sign into a Navidrome server. All album, playlist, artist, and search views include connected sources and clearly identify each item's source. The final all-source clarification supersedes the earlier Navidrome-only album suggestion in the same message.

Show Spotify-created playlists and Liked Songs, with a requested nested playlist-folder structure. Preserve source collections faithfully; never create playlists mixing Spotify and Navidrome tracks. Keep separate source-labelled entries for artists present in both.

Required surfaces: player bar with volume, order/shuffle, previous/play/pause/next; list/grid albums and playlists; simple single-collection views; search tabs for Playlists, Albums, Artists, and Songs; and Music Home with recently played playlists/albums/artists. An additional combined “smart” search tab is tentative. Pills/borders/table source columns are styling candidates, not accepted designs. Screenshots do not expand scope.

This refines D07 and supersedes Navidrome's earlier candidate-only status. Spotify playback implementation, direct local files, history semantics, source-switching behavior, and playlist-folder feasibility remain open. Research surfaced a material Spotify combined-service policy concern; the desired behavior is recorded without declaring it feasible or dropping it. No app implementation is authorized.

**Partially superseded by [D48](#d48-lean-music-scope-and-private-use-25-september-2026):** nested folders are replaced by a flat list, direct local files are removed, history and source switching are resolved, and the policy discussion is deferred for the private-use phase.

See [current Music scope](../features/music.md#current-screen-scope) and the [discussion journal](../journal/2026-09-25-combined-music-scope.md).

## D48 — Lean Music scope and private use · 25 September 2026

**Accepted from the user:** Clarity is currently a private app shared among friends. Defer the Spotify integration-policy discussion until considering a public product; do not treat it as an active planning blocker. This records the user's direction without claiming a policy exemption.

- Spotify and Navidrome are the music sources. Direct local-file playback is out of scope, superseding that part of D07.
- A flat playlist list is sufficient, superseding D47's nested-folder requirement.
- Use the simplest lean recent-history method. In context this accepts the proposed local record of collection playback through Clarity, without merging history from other apps.
- Explicit source switching stops the current source and replaces the playback context with the selected item from the other source, in either direction. One source plays at a time; no mixed-source playlists.
- Playlists are saved on their respective source services, not stored as locally owned Clarity playlists. This establishes ownership, not an additional playlist-editing feature.

D47's combined views, item source indicators, and lean screens remain. Search scope is subsequently resolved by D49. Playback implementation, exact source styling, and the optional combined search tab remain open.

See [Music behavior](../features/music.md#playback-and-local-state) and the [discussion journal](../journal/2026-09-25-music-simplifications.md).

## D49 — Music search and single-song playback · 25 September 2026

**Accepted from the user:** search Spotify's full catalogue plus the connected Navidrome library. Artist search uses both sources, not a list restricted to followed Spotify artists; the user does not follow artists there. This replaces the assistant's unaccepted followed-artists proposal.

Playing a single song from search stops at the end of that song. No automatic radio, recommendations, or continuation through search results. Playing an album or playlist continues through its selected collection. Preserve D47's source labels and separate artist entries, and D48's source-owned playlists and explicit source switching.

This settles the search boundary and single-song continuation without selecting a playback engine or expanding scope. Artist-detail behavior and optional presentation details remain open.

See [Music scope](../features/music.md#current-screen-scope) and the [discussion journal](../journal/2026-09-25-music-search-playback.md).

## D50 — LangChain runs the assistant · 26 September 2026

**Superseded for current implementation by [D58](#d58-retain-the-pi-agent-27-september-2026).** Retain the earlier text as history. The user has confirmed using the upstream Pi agent.

D53 reopened this choice; D58 now resolves it in favor of the upstream Pi loop.

**Accepted from the user:** after discussing what it means for LangChain to run the assistant directly, the user said “that sounds great. lets make that our plan.” LangChain will manage the assistant loop, calling a model through a provider integration and invoking Clarity's module tools. Clarity remains responsible for its UI, module behavior, storage, and permissions.

This supersedes D22's installed-harness chat execution. Retain model/effort selection, enabled-module access, action modes, scoped wiki grants, and the current exclusion of local models. It does not remove the separately planned developer terminal sessions or select a language, provider/model, credential method, desktop framework, storage engine, or full LangGraph workflow design. The proposed notes/todos learning sequence is not a finalized release scope. Application implementation has not begun.

See [assistant execution](../foundations/harnesses.md) and the [decision journal](../journal/2026-09-26-langchain-and-readable-code.md).

## D51 — Readable code and learning as we build · 26 September 2026

**Accepted from the user:** keep the codebase simple and understandable at beginner/intermediate level, with clear abstractions and readable code. Inline comments should be unnecessary where code is clear, or succinct where useful; avoid comment bloat. The user wants to learn as implementation progresses, and future sessions must treat them as a LangChain beginner.

Apply this through descriptive names, focused functions/modules, straightforward control flow, and abstractions that clarify present responsibilities. Avoid speculative layers and clever machinery. Explain new LangChain concepts and important flow/tradeoffs in conversation or concise supporting documentation, rather than embedding tutorials in source code. These rules complement D30's lean scope without weakening correctness or verification.

Persisted in project `AGENTS.md` and [working principles](../vision/principles.md). See the [decision journal](../journal/2026-09-26-langchain-and-readable-code.md).

## D52 — Terminal spaces and stack preferences · 26 September 2026

**Terminal scope superseded by [D54](#d54-terminal-sessions-removed-27-september-2026); framework exploration resolved by [D55](#d55-electron-and-typescript-27-september-2026).** Preserve the following as historical context.

**Accepted from the user:** terminal sessions use a chartr-style Spaces view, with sessions nested beneath each space. The screenshot establishes this navigation direction without importing all chartr features.

The user dislikes xterm.js, prefers exploring native terminal technology such as libghostty or Alacritty, and has a preference for Rust/GPUI. Electron, SwiftUI, and other feasible options remain open. This replaces the earlier assistant list-or-tabs and conditional xterm.js suggestions; it does not choose a terminal engine or framework. The user explicitly opens whole-app stack comparison, still subject to D25's behavior-led choices and D30's lean rule.

Herdr is used in the user's chartr setup for agent-state detection, but its use in Clarity is undecided. Stop-on-full-quit behavior, process persistence, agent-state indicators, and trace details remain open. No implementation is authorized.

See [terminal sessions](../features/terminals.md), [desktop stack exploration](../foundations/desktop-stack.md), and the [discussion journal](../journal/2026-09-26-spaces-and-desktop-stack.md).

## D53 — Cloudflare OS direction · 27 September 2026

**Accepted from the user:** “i'll reshape clarity around cloudflare OS”, subsequently confirmed as a Cloudflare OS-based direction. This resolves the base-platform question in Q32. Clarity remains in planning; no fork, deployment, installation, or application build is authorized by this discussion.

**Assistant assessment:** retain the platform runtime, agent, storage mechanisms, and extension interfaces wherever possible, adding Clarity modules and navigation instead of replacing the core. Gadgets are small apps, blueprints are their reusable templates, and Gatekeepers mediate service connections. This boundary is a recommendation to validate, not acceptance of every upstream behavior.

D02/D03/D24's folder and local-only assumptions and D50's LangChain choice are reopened. Cloud hosting is not implied. Notes/wiki file ownership, action approvals, shared module access, and module upgrades still need explicit treatment. Retained module behavior must not be silently dropped to fit upstream.

See [remaining tensions](../foundations/desktop-stack.md#current-direction-27-september-2026) and the [journal](../journal/2026-09-27-cloudflare-os-electron.md).

## D54 — Terminal sessions removed · 27 September 2026

**Accepted from the user:** “i'm also dropping terminals sessions.” Terminal sessions are removed, including their Spaces view, PTY/renderer selection, process persistence, and Herdr/terminal agent-state questions. This supersedes the terminal scope in D52 and the earlier terminal portion of the initial brief and D17.

The [terminal page](../features/terminals.md) is retained as historical research. Agent message board, automations, and chat history remain in scope. Their existence does not require an embedded terminal. The original development-root arrangement needs reassessment; removing terminals does not silently delete all other developer-workflow ideas.

## D55 — Electron and TypeScript · 27 September 2026

**Accepted working direction from the user:** “we're settling on cloudflare os based direction and electron/typescript.” Electron is the desktop shell and TypeScript the application language direction. This resolves Q30's framework comparison, superseding the open framework choice associated with D52. macOS-first and a later Linux route remain compatible.

Electron's Node runtime is distinct from the Workers/workerd runtime used by Cloudflare OS. This does not select hosted versus local backend execution, storage location, a model provider, or an embedded Spotify player. No application implementation has begun.

## D56 — Local backend · 27 September 2026

**Accepted from the user:** “backend runs locally for now.” Resolve Q33 in favor of local Cloudflare OS execution alongside the Electron app. Do not plan hosted deployment for the initial direction. This resolves D53's hosting uncertainty and reaffirms local state from D24 without reinstating device sync or requiring every datum to be an ordinary file.

Packaging workerd, choosing data directories, clean startup/shutdown, backup, and upgrades remain engineering work. This lifetime question is subsequently resolved by D63: closing the window keeps Clarity running, explicit Quit exits. Local execution does not make connected services or model calls work offline.

## D57 — Notes and wiki are real files · 27 September 2026

**Accepted from the user:** notes and wiki are actual files, viewable in the app; notes must also be editable there. In the existing Markdown context, this confirms ordinary Markdown as their authoritative content, rather than database-only documents with export. Preserve the notes folder/tree/tab editor and the wiki's topic organization, HTML reader, and AI-requested edits. The user has not requested direct wiki editing in-app.

This settles the notes/wiki part of Q05 and the reopened ownership question in D31/D32. Exact paths, external edit refresh/conflict handling, and the storage format for other modules remain open. Reusing platform storage for other state remains a proposal, not a new all-data file requirement.

## D58 — Retain the Pi agent · 27 September 2026

**Accepted from the user:** “we can use pi”, responding to the recommendation to keep Cloudflare OS's existing agent. This supersedes D50's LangChain implementation choice. Reuse the upstream Pi-based loop instead of replacing it or adding a second loop. It does not mean launching the Pi CLI as a separate installed harness.

The learning and readable-code principles from D51 remain. Explain the chosen architecture incrementally. Provider/model/access setup and supported effort controls remain open; local models are still out of scope.

## D59 — Stable maintained modules · 27 September 2026

**Accepted by the user:** “go with your recomendation”, referring to one persistent instance of each enabled module per user and maintained module code initially. Chats reuse the same task list, notes, wiki, and other enabled data; they do not create independent module instances per conversation.

Agents operate on module content through the supported interface. Per-user runtime rewriting of module code is not part of this initial scope. Module updates must preserve data, but the upgrade mechanism is not selected. This resolves Q34's product direction; bindings and upgrade implementation still need validation.

## D60 — Adopt upstream approvals · 27 September 2026

**Partially superseded by [D97](#d97-browser-navigation-without-per-click-confirmation-28-september-2026) and [D109](#d109-agent-action-approval-checklist-29-september-2026):** routine browsing proceeds after site authorization; D109 adds exact per-action automatic approval choices in Settings. The review queue remains the default for unchecked actions. The original decision below is preserved.

**Accepted from the user:** “ignore our requirement for now, go with adopting cloudflare OS's behavior”, responding to the approval-model tension. Use upstream approval behavior, including its queued actions and simulation where supported, rather than implementing D20's custom blocking Proceed/Cancel and unrestricted Auto modes.

The custom wiki-grant mechanics of D27/D29 are set aside for current implementation along with the bespoke permission system; topic maintenance and scheduled updates remain intended. Do not assume upstream automatically provides the same saved-thread grant, and do not add custom machinery to reproduce it without discussing a concrete need. This choice is not a blanket approval of all agent actions and does not change Mail/X read-only scope.

See [chat behavior](../foundations/chat.md#action-modes) and the [follow-up journal](../journal/2026-09-27-local-files-pi.md).

## D61 — Spotify plays inside Clarity · 27 September 2026

**Accepted from the user:** “spotify: music plays inside clarity.” This resolves D45's choice between embedded playback and controlling another player. Clarity must produce Spotify audio through its own player; relying on a separately opened Spotify app/device does not satisfy the selected experience.

The embedded playback engine remains undecided and unvalidated in the packaged Electron runtime. No library, native helper, or SDK is selected by this decision. Preserve existing collection/search behavior, single-song stopping, and exclusive source switching. No implementation is authorized yet.

See [Music](../features/music.md) and the [journal](../journal/2026-09-27-music-playback-and-address.md).

## D62 — Simple Navidrome address connection · 27 September 2026

**Accepted from the user:** accept any supplied HTTP or HTTPS address and attempt connection. Keep the existing account sign-in requirement. Do not ask users to classify the server as local, home-network, or internet-hosted; whether the address is reachable is discovered by attempting the connection.

Use the supplied address rather than forcing HTTPS or adding discovery/setup flows. This does not imply that unreachable addresses or invalid credentials will work. Basic URL handling and reporting connection/sign-in failure are implementation necessities, not extra setup choices. No live connection is made in this planning session.

See [Music](../features/music.md) and [modules and connections](../foundations/integrations.md).

## D63 — Stay running until explicit Quit · 27 September 2026

**Accepted from the user:** closing the window should keep Clarity alive in the taskbar/menu bar; only explicitly quitting exits. On macOS, provide access through the Dock/menu bar with a way to reopen the main window and Quit. Backend work, agent runs, music, and refreshes must not depend on the main window remaining visible.

This accepts and refines the earlier lifecycle proposal. Normal window close is not application shutdown. Sleep, shutdown, crashes, and missed schedule handling are separate; this is not a promise to run while the computer is asleep/off. No separate service or launch-at-login feature is requested.

## D64 — One Clarity data folder · 27 September 2026

**Accepted from the user:** drop the second development folder; everything belongs in one folder now that terminals are removed. One user-chosen Clarity root contains notes, wiki, and the other durable application state, including agent-board and automation state. This supersedes D03 and resolves the two-root part of Q07.

Notes/wiki remain actual Markdown files. One root does not require every other datum to be a user-editable Markdown/JSON file; internal representation and directory layout remain to be defined. Keep runtime-managed state under that root rather than silently creating another authoritative development store. Device sync remains out of scope.

## D65 — Efficient agent-board access · 27 September 2026

**Subsequently resolved in part by [D66](#d66-agent-board-design-and-module-methods-27-september-2026) and [D67](#d67-board-reads-only-when-instructed-27-september-2026):** the proposed board shape and module interface are accepted; all agents may read, only when instructed. The following records the earlier exploration.

**Accepted objective from the user:** discuss the agent board further, compare it with slopchan, and optimize agent access for tool calls and speed. They specifically ask whether CLI commands or file reads could improve on REST.

This does not accept an exact slopchan clone, the earlier summary-only feed, a CLI, a file-backed store, or a new REST service. Topic threads and direct platform method calls are assistant proposals to discuss. Whether external agents need access remains open; removing terminal sessions does not answer that question.

See [board investigation](../features/agent-board.md) and the [journal](../journal/2026-09-27-background-folder-board.md).

## D66 — Agent board design and module methods · 27 September 2026

**Accepted by the user:** use Cloudflare OS's existing agent-callable module methods and “go with your proposal.” This accepts topic threads with short findings, decisions, and handoffs; links to originating chats and affected items; the same stored content browsable by humans; and platform-managed local persistence under the single Clarity root.

Optimize for bounded relevant reads, incremental catch-up, and batched thread details instead of repeatedly returning the whole board. Exact method names, cursor schema, database schema, and limits remain implementation details. This supersedes the earlier unaccepted summary-only-feed alternative; it does not require a complete slopchan clone.

Reuse the existing platform interface. No additional CLI, REST service, direct-file interface, or automatic context injection is selected. All-agent readability is clarified in D67; external compatibility may need a small adapter later, but no concrete adapter or protocol is chosen now. Posting triggers and edit/delete behavior remain open.

## D67 — Board reads only when instructed · 27 September 2026

**Clarified by [D68](#d68-project-defined-board-opt-in-27-september-2026):** project instructions are a standing opt-in and can direct ongoing reads/posts. The earlier wording must not be interpreted as requiring a new chat request for every use.

**Accepted from the user:** “it is an open board, readable by all agents. but only when instructed to.” Availability and use are separate: agents can access the shared board without per-thread ownership restrictions, but must not proactively read it, poll it, or load its contents into conversations by default.

An instruction to consult the board can use the bounded/incremental method path from D66; a saved cursor alone is not an instruction to read again. No extra confirmation question per read is requested. Human browsing remains available.

“All agents” is not restricted by agent identity to Clarity's own agents. How an external runtime connects to the existing interface remains an integration detail to validate; this does not authorize a public internet endpoint or bypass the platform's connection rules. The read trigger does not decide when agents should post, edit, or remove entries.

See [board behavior](../features/agent-board.md) and the [journal](../journal/2026-09-27-board-methods-and-instructed-reads.md).

## D68 — Project-defined board opt-in · 27 September 2026

**Accepted from the user:** the board is simply available for use; whether and how agents use it depends on the project, through its AGENTS.md or equivalent instructions. Availability is not a requirement that every agent or project participate.

Project instructions determine reading and posting behavior. An opted-in project can direct agents to read at task start, post findings, or leave handoffs without a fresh chat request for every covered action. These are examples, not default triggers. Projects without opt-in do not automatically read or post. Explicit task instructions can also request use within their stated scope.

This clarifies D67 and resolves the global posting-trigger question: Clarity should not choose one universal cadence or build a policy engine to enforce a new workflow. The prior per-request-versus-automatic posting framing is replaced by project-defined instructions. Existing module methods, storage, and upstream action approvals remain unchanged. No project registry, instruction editor, filesystem watcher, or external adapter is selected.

See [board usage](../features/agent-board.md#read-behavior) and the [journal](../journal/2026-09-27-project-board-opt-in.md).

## D69 — Skip missed automation runs · 27 September 2026

**Accepted from the user:** “yeah skip it. keep things lean.” Missed scheduled occurrences are skipped. Recurring automations resume at the next scheduled time after Clarity becomes available; waking the Mac or reopening Clarity does not trigger a catch-up run or replay missed intervals.

This chooses the proposed upstream scheduling behavior and rejects the earlier catch-up suggestion for simplicity. Window close still keeps Clarity running (D63). Failed executions, pending approvals, and incremental wiki-input progress are separate concerns; this decision does not settle their implementation.

See [Automations](../features/automations.md) and the [journal](../journal/2026-09-27-skip-missed-runs.md).

## D70 — Batched planning questions · 27 September 2026

**Accepted request from the user:** ask multiple questions at a time, referring to Matt Pocock's skills repository. Use rounds of independent questions with recommendations, then use the answers to determine the next questions. Keep the existing wiki as shared memory and continue distinguishing suggestions from decisions. This changes the planning workflow, not Clarity's application scope.

See the [current question round](../discussions/open-questions.md#current-question-round-27-september-2026) and [journal](../journal/2026-09-27-batched-planning-questions.md).

## D71 — First useful version · 27 September 2026

**Accepted from the user:** chat, notes, todo, and wiki are the first useful version's priorities. Other intended modules remain in the broader direction; this does not authorize application implementation or imply that automations and integrations must ship in the first version.

## D72 — Codex first · 27 September 2026

**Accepted from the user:** “codex,” in response to the initial AI-account question. Target Codex access first while retaining the Pi agent loop (D58). This does not choose a specific model, approve separate API billing, or select the Codex CLI as a replacement runtime. Subsequently clarified by [D77](#d77-existing-codex-subscription-27-september-2026): use the existing subscription. The local connection still needs validation.

See [assistant execution](../foundations/harnesses.md#codex-access-27-september-2026).

## D73 — Follow upstream navigation first · 27 September 2026

**Accepted from the user:** follow Cloudflare OS's design first and use the proposed simple navigation arrangement. Start with enabled modules above recent chats and Settings below, using upstream design and components where possible. This replaces the earlier tentative sidebar direction; it does not authorize a navigation redesign or extra controls. Chat remains the opening screen.

## D74 — Lean wiki input scope and baseline · 27 September 2026

**Accepted recommendation:** name source modules in an automation's plain-language instruction; the initial example is relevant changes in chats, notes, and bookmarks as available. No additional source-selector UI is required. Regular chat still accesses all enabled modules; the board still requires opt-in instructions.

**Accepted baseline:** start with changes from when the schedule is enabled, using the existing wiki topic as context. Do not automatically process years of older material; do so only on explicit request. Tracking subsequent input progress and source edits/deletions remains an implementation detail to resolve. This accepts source scope and the initial baseline, not a new retrieval or indexing engine.

## D75 — Wiki disagreements with a recency preference · 27 September 2026

**Accepted with user refinement:** preserve references to conflicting sources and mark the disagreement unless a source clearly corrects the earlier claim. Give newer evidence greater weight, but recency alone does not turn an uncertain contradiction into an established fact or justify silently discarding the older evidence. Keep this in ordinary wiki prose; no conflict-management interface is requested.

## D76 — Automation results stay in Automations · 27 September 2026

**Accepted from the user:** automation activity belongs in Automations and must not leak into chats. Keep run results and review/failure state there, without automatically creating conversations or injecting run summaries into existing chats. A concise latest result is the accepted starting point; a full run-history UI is not implied.

This clarifies D18: results from user-initiated chat actions stay in that chat, while scheduled-run output belongs to Automations. Upstream approvals still apply. If their existing UI cannot keep automation review within Automations, raise that specific mismatch before adapting it.

See [Automations](../features/automations.md) and the [round-one journal](../journal/2026-09-27-round-one-decisions.md).

## D77 — Existing Codex subscription · 27 September 2026

**Accepted from the user:** use their existing “20x codex sub,” confirming subscription-backed access rather than separate API billing. This refines D72. Retain Pi and validate the Codex authentication path in the local runtime; do not claim that a paid plan by itself establishes Clarity compatibility or silently substitute API-key billing. No account connection is authorized by this planning decision.

## D78 — Resume the last chat · 27 September 2026

**Accepted recommendation:** reopening Clarity resumes the last chat, with New chat available. If there is no prior conversation, show a new chat. This settles the opening-screen question without changing the chat-first direction or automatically running a new agent turn.

## D79 — Full Markdown support · 27 September 2026

**User correction:** “full markdown spec,” replacing the assistant's proposed small formatting subset. Notes must support the full chosen Markdown specification, rather than only headings, lists, and basic formatting. The dialect was subsequently resolved by [D83](#d83-full-gfm-without-extra-extensions-27-september-2026): full GFM without extra extensions. Neither full Obsidian compatibility nor a particular editor implementation is selected.

Preserving Markdown through rich-text editing may be complex. Raise limitations before adopting an implementation; do not silently downgrade support or discard source syntax to keep the editor simple. See [Notes](../features/notes.md#markdown-compatibility).

## D80 — Immediate untitled note creation · 27 September 2026

**Accepted recommendation, “like obsidian”:** New note immediately creates Untitled.md in the active folder and opens it for editing. Use the notes root if no folder is selected, number duplicates to avoid overwriting files, and allow filename renaming. The Obsidian reference does not import its unrelated features.

## D81 — Preserve work on external file conflicts · 27 September 2026

**Accepted recommendation:** refresh a note from disk when it has no unsaved editor changes. If an external change arrives while there is unsaved work, preserve that work and show a conflict instead of silently overwriting either version. Automatic merging is not selected. Agent writes also need stale-content checks as an implementation correctness concern.

## D82 — Completed tasks remain in the list · 27 September 2026

**Accepted recommendation:** completed tasks appear below unfinished tasks, struck through. Unchecking restores them to unfinished state. No separate archive. The one-list scope remains; this does not add task-management fields or organization.

See the [round-two journal](../journal/2026-09-27-round-two-decisions.md).

## D83 — Full GFM without extra extensions · 27 September 2026

**Accepted from the user:** full GitHub Flavored Markdown, kept simple; no math, footnotes, note-link syntax, or other additional Markdown extensions. This resolves D79's dialect question while retaining full support of the selected specification. It does not require all GitHub website features, Obsidian compatibility, or a particular editor library. Surface any implementation limitation rather than silently dropping supported syntax.

## D84 — Notes autosave · 27 September 2026

**Accepted recommendation:** notes autosave while typing. D81's preservation of unsaved work on external-edit conflicts remains in force; autosave must not bypass that protection. Save timing and implementation remain engineering details.

## D85 — Clickable wiki source references · 27 September 2026

**Accepted recommendation:** factual wiki additions include ordinary clickable source references to relevant chats, notes, bookmarks, or webpages. Keep evidence in the page; no separate tracking system is requested. This establishes source presentation without expanding discovery scope. It supplements D75's handling of conflicting evidence.

See [Notes](../features/notes.md), [Wiki](../features/wiki.md), and the [round-three journal](../journal/2026-09-27-round-three-decisions.md).

## D86 — Full web capability intent · 27 September 2026

**Accepted from the user:** chat should have “full web capabilities,” expanding the requested search-and-read research capability. Public web research is confirmed. Whether this also includes interactive browsing, authenticated sessions, form submission, and downloads must be clarified rather than silently reduced to URL fetching or assumed to authorize every web action.

Retain upstream approvals. This chat requirement does not expand scheduled wiki maintenance beyond its agreed app-state sources. No web provider, browser engine, paid service, or access to a real account is selected.

## D87 — Broad attachment preference · 27 September 2026

**Refined by D93–D96:** the analysis fallback is now accepted, local originals must be under 30 MB, composer controls are settled, and attachment cleanup is 90 days. The original conditional preference below is preserved as history.

**User preference, conditional on simplicity:** preferably anything can be attached “if it's not a problem.” Do not keep the earlier text/image-only proposal as accepted scope. Attaching/storing a file and understanding its contents are separate capabilities; universal processing has not been promised or approved as a complex implementation.

Raise actual upstream file-type/size restrictions and the costs of additional format handling. A local original-file attachment with explicit unsupported-analysis state is an assistant proposal pending user agreement, not a settled fallback.

## D88 — Local images in Notes · 27 September 2026

**Accepted recommendation:** pasting or dropping an image into Notes saves a local copy under the single Clarity data root and inserts a relative standard Markdown image link. No additional Markdown syntax or media-management module is requested.

## D89 — Text search in Notes and Wiki · 27 September 2026

**Accepted recommendation:** each module provides simple text search across titles and content. This does not select an index implementation, a global search UI, or semantic search.

## D90 — Recoverable Markdown deletion with cleanup · 27 September 2026

**Accepted with refinement:** deleted notes/wiki Markdown files move to a Trash folder inside the Clarity data root, recoverable through Finder initially. Add automatic cleanup after a retention period; the user suggested 30 days. Use 30 days as the working default, with the tentative duration distinguished from the accepted cleanup requirement.

**Assistant proposal:** measure retention from the time the file enters Trash and permanently remove expired entries when Clarity is running, including a check at startup. This requires no independent service or exact execution while asleep/quit. It is local housekeeping, not replay of skipped user automations. Do not expand cleanup to active files, shared images, chat attachments, or unrelated state without defining their lifecycle. Wiki deletion still follows AI-requested edits and upstream approvals.

See [chat](../foundations/chat.md#web-and-attachments-27-september-2026), [data folder](../foundations/folders.md#trash-and-retention-27-september-2026), and [journal](../journal/2026-09-27-round-four-decisions.md).

## Not decided

D63/D64 settle lifecycle and the data root. D66/D67 settle the board shape, module-method access, and instructed-only reads. D68 delegates read/post triggers to project instructions. Edit/delete behavior and concrete external-agent connectivity remain open.

- Local runtime packaging, shutdown cleanup, validation across sleep/restart, backup/restore, and installation for friends.
- Internal layout within the single root, implementation of accepted file-conflict behavior, and other module storage.
- Validation of Codex subscription access and model/effort configuration, stable module bindings, and data-preserving upgrades.
- Embedded Spotify playback implementation in Electron; validation of Navidrome connection/streaming with supplied HTTP/HTTPS addresses; live validation of invisible X collection.
- Incremental wiki-maintenance input and unattended-run outcomes under upstream approvals.
- Remaining behavior within the first-version priorities (chat, notes, todo, wiki) and later modules. Spotify public-product policy review remains deferred.

## How later decisions are recorded

Give a decision an ID, date, context, chosen direction, reasoning, affected pages, and the source conversation. Record alternatives only where they explain a real tradeoff. When direction changes, keep the old entry, mark it superseded, and link the replacement.

See [open questions](../discussions/open-questions.md) and [initial journal](../journal/2026-09-24-initial-idea.md).

## D91 — Browser speed target and research priority · 28 September 2026

**Status:** speed target remains current; the unselected driver direction and temporary attachment deferral below are superseded by [D92](#d92-playwright-with-batched-browser-actions-28-september-2026).

**User-stated target:** agent-controlled browsing should be at least as fast as Codex while remaining lean and lightweight. Research recent approaches, including X and Hacker News, before choosing the integration. This is a performance goal, not verified parity or selection of a browser driver. Compare hosted search separately from interactive browsing.

The user deferred further arbitrary-attachment discussion. D87's conditional preference remains, with no acceptance of the proposed unsupported-file fallback. D60's upstream approval direction is unchanged; any performance-related adaptation must be discussed.

See the [performance research](../references/web-and-attachments.md#browser-performance-follow-up).

## D92 — Playwright with batched browser actions · 28 September 2026

**Accepted recommendation:** proceed with Playwright-backed batched actions as the planning direction, with agent-browser as the alternative to compare. Reuse persistent sessions and focused page summaries to reduce model round trips. This refines D91's previously unselected driver direction; the Codex-level speed target remains unverified.

The user's “lets do it that way” accepts the proposed direction, not permission to begin application implementation. The exact host integration and upstream approval mismatch remain open; D60 is unchanged. No independent browser agent or general shell capability is implied.

The user resumes attachment discussion. D91's temporary deferral has ended; D87's conditional broad-file preference and the unsupported-analysis fallback remain unresolved.

See [chat](../foundations/chat.md#accepted-browser-direction-and-attachments) and the [discussion journal](../journal/2026-09-28-browser-choice-attachments.md).

## D93 — Attachment analysis baseline · 28 September 2026

**Accepted recommendation:** initially analyze text/code files (including Markdown, JSON, and CSV), supported images, and PDFs containing text. Other file types may be attached within the size limit, with a clear message when their contents cannot be read. Universal conversion and initial Office/scanned-PDF/audio/video analysis are not required. This resolves D87's pending fallback; provider and extraction compatibility still require validation.

## D94 — Local attachment copies under 30 MB · 28 September 2026

**Accepted with user limit:** save an independent original-file copy inside the Clarity data root only when the file is less than 30 MB. Otherwise skip that file and notify the user. The wording is strictly less than: files at or above the threshold are skipped, rather than silently linked to their external location or resized to evade the original-file limit. Source files remain unchanged; later source edits do not change the stored attachment. Exact byte-unit convention and combined-message/model-input limits remain implementation details to resolve.

## D95 — Composer attachment controls · 28 September 2026

**Accepted recommendation:** drag-and-drop, a file-picker button, and pasting images into the chat composer. No separate attachment-management module is implied.

## D96 — Attachment cleanup after 90 days · 28 September 2026

**User decision:** chat attachments have a 90-day cleanup period. This replaces the assistant's proposed indefinite retention until explicit removal; that proposal was never accepted. The period applies to Clarity's stored attachment copies, not the external source files. It is distinct from the 30-day working Trash retention for deleted notes/wiki files and does not authorize deleting chat text or note/wiki content.

**Working implementation assumption, not separately confirmed:** count age from when the file is attached; clean expired copies and any derived attachment data while Clarity is running, including startup, and show an expired-file state in the chat. No independent cleanup service or execution while quit is implied. The original pending module-asset ownership question is now resolved by D100: create a separate persistent module copy when deliberately embedding an attachment. Do not purge that copy under chat-attachment cleanup.

See [attachment requirements](../foundations/chat.md#attachment-decisions-28-september-2026) and [journal](../journal/2026-09-28-attachment-decisions.md).

## D97 — Browser navigation without per-click confirmation · 28 September 2026

**Accepted recommendation:** after the user authorizes browsing a site, routine navigation, searching, and reading proceed without confirmation for every click. Confirm consequential actions such as sending, publishing, deleting, purchasing, or otherwise changing external state. This partially supersedes D60's unchanged-upstream direction specifically for browser operations; other module approvals retain D60.

The desired behavior is settled, but the adaptation is not implemented or validated. Do not label arbitrary browser scripts/clicks read-only. Enforcing the boundary and choosing the duration/scope of site authorization require implementation design; do not silently create a general permission framework or assume permanent account access. This is a Clarity product decision, not authorization to operate the user's current accounts.

## D98 — Earlier chats retrieved on request or reference · 28 September 2026

**Accepted recommendation:** use the current conversation by default. Retrieve older chats when the user requests them or refers to a previous discussion. Do not automatically mix previous conversations into every thread or introduce automatic cross-chat memory. All enabled modules remain accessible under the existing shared-module decision.

## D99 — Model and effort changes preserve the thread · 28 September 2026

**Accepted recommendation:** switching model or effort applies to the next message in the same conversation and preserves its history. It does not create a new chat or restart an in-flight response. The selected Codex-first access path remains; this does not authorize new provider integrations. Actual context and model-input compatibility still need validation.

## D100 — Persistent module copies of embedded attachments · 28 September 2026

**Accepted recommendation:** deliberately embedding a chat attachment in Notes or Wiki creates a separate persistent asset copy owned by that module under the data root, referenced by a relative link. The chat attachment copy remains subject to 90-day cleanup, without breaking the page. Merely mentioning or summarizing a file does not automatically preserve its original.

This resolves D96's pending cross-module ownership rule without requiring shared-reference tracking. Persistent means outside chat-attachment expiry, not a new promise to retain assets after deliberate deletion of their owning content. Orphan-asset cleanup and additional media-management UI are not introduced.

Source: the user agreed to all four first-version recommendations. See [chat behavior](../foundations/chat.md#first-version-behavior-decisions-28-september-2026) and [journal](../journal/2026-09-28-first-version-decisions.md).

## D101 — Disposable spikes without starting Clarity · 28 September 2026

**Historical authorization; its implementation restriction is superseded by [D102](#d102-build-clarity-with-lean-defaults-28-september-2026).** The experiment evidence and workspace dependency restrictions remain relevant.

**User authorization:** run throwaway technical experiments to resolve the integration unknowns; the user explicitly does not want application implementation to begin. This extends the previous source-review-only investigation boundary, without superseding D01's planning phase.

Keep spike code, dependencies, fixtures, and packaging experiments outside the Clarity workspace. Preserve findings and limitations in the wiki; no result automatically becomes a production implementation decision. The workspace/wiki prohibition on package manifests, lockfiles, and installed dependencies remains. See [results](../references/technical-spikes.md) and [journal](../journal/2026-09-28-technical-spikes.md).

## D102 — Build Clarity with lean defaults · 28 September 2026

**User authorization:** start a persistent goal and build the entire agreed app, choosing safe and lean defaults for unfinished decisions. This supersedes D01's planning-only phase and D101's prohibition on application implementation. It does not restore terminals, direct local music files, device sync, or other removed scope.

The assistant chose thread-scoped browser site grants, practical agent classification of consequential actions, explicit continuation after interruption, and separate conflict copies for unsaved note drafts. These are implementation defaults under the user's delegated authority, rather than answers individually supplied by the user to the previous question round.

Preserve the repository's package-file and dependency-directory ban: application dependencies, generated manifests, caches, test fixtures, and packaged output live outside the repository. Wiki builds still need Node only. See [implementation progress](../references/implementation.md) and [journal](../journal/2026-09-28-implementation.md).

## D103 — Lean local implementation defaults · 29 September 2026

**Approval follow-up:** [D109](#d109-agent-action-approval-checklist-29-september-2026) adds a Settings checklist for automatic execution of selected actions, retaining the same queue for unchecked actions.

**Assistant-selected under the user's delegation in D102, not separate user answers:** use Electron/TypeScript with local workerd/SQLite, Pi and maintained module methods. Reuse Cloudflare OS's scheduler and public approval contracts selectively; omit the full upstream hosted/app-generation runtime. Actual Markdown remains authoritative for Notes/Wiki.

Use data-root folders Notes, Wiki, Attachments, Trash and .clarity; thread-scoped exact-origin browser grants; conflict copies; no automatic replay of interrupted actions; daily/weekly wiki schedules with bounded new input and missed runs skipped. Use flat source-labelled music libraries, local recent-collection history, a bundled librespot helper for Spotify, and in-app Navidrome audio. Build/package dependencies stay outside the repository.

These defaults resolve the previously unspecified implementation details, without restoring removed scope or promising live external-account compatibility. See [implementation and validation](../references/implementation.md) and [delivery journal](../journal/2026-09-29-local-build.md).

## D104 — Device location and permissions · 29 September 2026

**User requirement:** Clarity should immediately request location from the device and have a Settings section managing its permissions. This follows a reported chat response that defaulted to UTC/U.S. time and guessed the user's country.

**Assistant implementation defaults under D102:** read the system clock and IANA timezone automatically for every model request; ask macOS for location on first opening the chosen data folder. Save only approximate coordinates with precision and measurement time. Refresh on later launches after a successful grant, or explicitly in Settings; do not repeatedly prompt after refusal or an unsuccessful first lookup. No continuous tracking, reverse-geocoding service, or new native helper. Offer manual city/country as fallback and never infer physical location from timezone.

Settings → Permissions controls device-location use, clearing and refresh, opens macOS Location Settings, and lists/revokes existing per-chat website grants. This exposes current permissions, without replacing the module approval system. Turning location off clears the stored device reading; historical chat/model requests may already contain previously shared information. See [chat context](../foundations/chat.md#time-location-and-permissions) and [journal](../journal/2026-09-29-location-permissions.md).

## D105 — Wiki as rebuild specification · 29 September 2026

**User requirement:** keep Clarity's wiki always up to date; a future version may be rebuilt entirely from it.

**Maintenance practice implementing that requirement:** a meaningful product or implementation change is not complete until its topic specification, current gaps/validation, and dated journal are updated. Update the decision register when choices change and keep `IMPLEMENTATION.md` consistent. Rebuild/check `index.html` in the same work. Record observable behavior, data ownership/formats, important interfaces, dependencies/setup, failure paths, and acceptance checks in the wiki itself; code references alone are insufficient.

Put current specifications before clearly labelled historical discussion. Preserve user requirements, delegated defaults, evidence, and gaps as separate categories. Do not let a current implementation omission silently supersede an accepted behavior. This extends D09's brainstorming wiki into the maintained rebuild specification without changing app scope or the separate in-app Wiki module.

The [audit journal](../journal/2026-09-29-wiki-rebuild-spec.md) records the reconciliation and newly visible gaps. Start from the [rebuild reading order](../index.md#rebuild-reading-order).

## D106 — Music seeking · 29 September 2026

**User requirement:** fix silent Spotify playback and provide the missing seek bar. This extends the player controls in D47 without changing source ownership or queue behavior.

**Implementation default under D102:** one seek bar with elapsed/total time for Spotify and Navidrome, mouse/keyboard interaction, and unchanged pause/play state after seeking. Show playback failures persistently in the player and allow retry with Play. The existing native Spotify engine remains; a small adapter uses an updated audio output library to fix the reproduced macOS crash. See [Music](../features/music.md#screens-and-playback) and the [fix journal](../journal/2026-09-29-music-playback.md).

## D107 — Wiki-led agent onboarding · 29 September 2026

**User requirement:** shorten AGENTS.md, move the bulk of its information into the wiki, and direct freshly onboarded agents to use the wiki as the more complete resource. Avoid maintaining the same detailed instructions and product specification in both places.

AGENTS.md now provides a short mandatory reading path and immediate workspace guardrails. The [wiki home](../index.md#agent-onboarding) owns onboarding, [Working principles](../vision/principles.md) owns detailed collaboration and maintenance rules, and existing feature/foundation pages own product contracts. Reuse existing coverage and migrate missing details rather than append a duplicate copy of the old file. This extends D105's wiki-as-specification decision without changing product scope, implementation authorization, or tooling restrictions.

See the [migration journal](../journal/2026-09-29-agent-onboarding.md).

## D108 — Songs default to list view · 29 September 2026

**User requirement:** the Songs search tab opens as a list and can switch to grid. Keep the existing toggle. Its layout is independent of the other music views; retaining the choice only during the current Music visit is the lean implementation default. See [Music](../features/music.md#screens-and-playback) and the [journal](../journal/2026-09-29-songs-list-view.md).

## D109 — Agent action approval checklist · 29 September 2026

**User requirement:** add a Settings list of all agent action approvals with checkboxes. Checked actions execute without asking; `music.play` is the motivating example. A top-level Select all supports unchecked, indeterminate, and checked states. The user asked to map all possible actions and raise concerns.

**Delegated lean defaults:** expose the 37 existing mutation methods, start unchecked, and save exact selections per data folder for all chats and automations. Browser website authorization and consequential batches are separate rows, included in Select all. Reads and an automation's configured wiki-topic writes keep their existing direct behavior. The choices do not enable modules, connect accounts, bypass validation, change board opt-in, or apply already-pending work. Newly introduced methods are unchecked rather than inherited through a wildcard. Automatic actions reuse the existing applying/applied/failed records and return actual results.

This extends D60/D103 and the browser approval defaults without restoring the earlier per-thread wiki permission design. The [Chat topic](../foundations/chat.md#automatic-approval-checklist) owns the complete action map, behavior, persistence, and acceptance checks. See the [journal](../journal/2026-09-29-agent-approvals.md).

## D110 — Long-lived Spotify sign-in · 29 September 2026

**User requirement:** repeated login is a problem; a login should last long-term. The immediate report concerns Spotify playback.

Persist and renew both Spotify connections automatically through normal access-token expiry and app restarts. Preserve credentials during temporary failures. A generic playback error is not evidence that authentication expired. The lean implementation adds one retry for a rejected token and one recovery attempt for interrupted playback, with cancellation when the user pauses or changes context. Provider revocation and rejected renewal credentials can still require sign-in; no permanent-login guarantee or new login UI is introduced. See [Music](../features/music.md#persistent-sign-in) and the [journal](../journal/2026-09-29-spotify-sign-in.md).

## D111 — Chronological chat approvals · 30 September 2026

**User requirement:** approval messages must appear chronologically with the conversation. Grouping accumulated action cards at the bottom hides newer responses above them and forces unnecessary scrolling.

Use original creation time for each card and update it in place as its status changes. Include automatically approved actions and completed/failed/rejected outcomes in the same timeline. Existing controls and approval rules remain. The lean implementation merges existing message/action timestamps in the renderer, with no new record type or migration. See [Chat](../foundations/chat.md#chronological-action-cards) and the [journal](../journal/2026-09-30-chat-timeline.md).


## D112 — UI audit remediation · 1 October 2026

**User instruction:** fix all nineteen findings in the [UI audit](../references/ui-audit.md). This authorizes implementation and verification, beyond the earlier request for an audit list.

**Delegated lean defaults:** persistent Chat/Expense drafts inside the existing data profile; confirmation for permanent record deletion; shared immediate submission guards; complete paginated local lists; readable action previews with optional prior snapshots; canonical item URLs that only navigate; explicit theme propagation to Wiki; temporary Mail/Music navigation memory; attachment text/image inspection plus Finder reveal; and named dialogs/local feedback. Existing approval policy, module scope, chronology, and D108 layout reset remain settled.

D41's existing Linkding requirement is completed with Manual/hourly/daily intervals while Clarity runs, source snapshots and per-field local-edit preservation, single-flight requests and explicit outcomes. No daemon, write-back, upstream deletion mirroring, or new general automation type is added. Relevant [topic contracts](../features/index.md), [Chat](../foundations/chat.md#usability-fixes-1-october-2026), and the [remediation journal](../journal/2026-10-01-ui-fixes.md) own the implementation and evidence.


## D113 — jstack verification and wiki maintenance · 1 October 2026

**User instruction:** apply the practices available in local `~/Desktop/Projects/jstack` to Clarity, especially verification and wiki maintenance, during the UI fixes.

**Applied defaults:** preserve existing topic paths and decision IDs; add stable feature IDs and executable recipes, shared verification setup, dated build-specific reports, local safe evidence, conservative Passed/Failed/Untested outcomes and drift classification. Use actual entry points and persisted effects, not screenshots or source inspection alone. Keep product authorization separate from verification while honoring the already authorized fixes.

Upgrade the uncustomized offline builder from v1.0.0 to jstack v1.2.0 after comparison, retain licenses, adopt its generic metadata/hashed attachments/appearance controls, and include local report/reader checks. No package install is needed for wiki tooling. The source is jstack revision `cdda753adc7ed81d3eb3abf0283b29e7c226670c`; jstack itself and its preserved examples are unchanged. [Setup](../verification/setup.md) owns reproducible commands and provenance; [the feature record](../features/verification-workflow.md) owns outcomes and verification history. Planning/grilling remains contextual, without reopening settled decisions or imposing another approval gate.

## D115 — Optional task dates in Calendar · 1 October 2026

**User requirement:** Todos can have an optional date; dated Todos appear in Calendar. This supersedes the historical Todo exclusion of dates while retaining the simple single list.

**Delegated lean defaults:** a date-only optional picker on creation/edit, nullable `YYYY-MM-DD` storage, Clear date and Cancel, and no migration for old undated records. Week shows tasks above its time grid; Month includes them in their day cells. Clicking a task focuses the same Todo. Completed tasks remain visible and struck through. Read directly from Todos without duplicating event records; respect optional-module settings and existing add/update/remove approvals. No reminders, times, recurrence or task hierarchy is added. [Todos](../features/todos.md) and [Calendar](../features/calendar.md) own the full contracts; the [journal](../journal/2026-10-01-task-dates.md) records implementation and verification.

## D114 — Settings layout polish · 1 October 2026

**User report:** Settings has an intrusive scrollbar, overlapping sticky navigation, a highlighted section without padding, and inconsistent form-control widths.

**Delegated implementation:** retain section navigation in a stationary title/header above a separate full-width scrolling body; keep the content centered, use a thin scrollbar at the workspace edge, pad all sections consistently, retain accessible section/control focus using the theme accent, and give labelled form controls the same responsive maximum width. This replaces the sticky-selector layout introduced with D112 without changing connection or approval behavior. [Settings](../foundations/integrations.md#usability-fixes-1-october-2026) owns the rebuild contract and verification recipe.

## D116 — Cursor Desktop design spike · 1 October 2026

**User request:** build a redesigned Clarity spike based on Cursor Desktop's UI and UX language, explore the already-open app where possible, and continue until the prototype is visible in a browser.

**Delegated implementation:** an external dependency-free browser prototype with synthetic data, local persistence, compact navigation, contextual chat, tabbed notes, simple tasks, read-only Wiki and Light/Dark appearance. Optional Calendar illustrates dated-task navigation. The [spike record](../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026) owns observed reference details, interactions, limits, reproduction and verification. This authorizes design exploration; it does not supersede production UI decisions, the Electron stack, real-file ownership, full GFM or live module contracts.


## D117 — All-module Cursor prototype and interaction polish · 1 October 2026

**User requirement:** expand the Cursor Desktop browser spike to every agreed Clarity module with sample populated content, studied and consistent design language, micro-interactions, and animations. Continue until the reviewable browser UI is available. Apply the non-exhaustive screenshot feedback throughout the system, including tabs, pane dividers, and hover/active/focus treatments.

**Further user direction:** remove wasteful space system-wide. Use compact lists and controls; align expense totals with individual amounts; show more News headlines without scrolling. Separators must remain straight and disappear beside hovered/active rows, following the supplied Helium examples. Study useful patterns from ChatGPT and Visual Studio Code as secondary references.

**Control and spacing follow-up:** correct misaligned checkbox marks and dropdown selection icons, and separate adjacent selected/hovered Music rows. Apply equivalent corrections throughout the shared system. Delegated defaults use centered SVG glyphs and a 2px row gap; native input behavior remains. The [compactness and controls run](../verification/runs/2026-10-01T083600Z-cursor-density.md) records verification after the user's explicit browser handoff.

**Delegated implementation:** preserve the external disposable boundary and existing local edits; enable all sample modules once; centralize surfaces, spacing, control states, input modality and reduced-motion handling; use deterministic simulated integrations with their limits in About. Restudy the actual Cursor editor before translating its flat connected tabs. Remove pointer-triggered action focus rings while retaining deliberate keyboard focus. The [spike topic](../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026) owns the full reference, behavior, recipe, evidence and limitations. Production feature scopes and default module enablement remain unchanged.

## D118 — Agent and effort selection in the redesign · 1 October 2026

**User correction during the requested jstack interview:** use an agent selector and effort selector, with the supplied model-picker screenshot as the reference, instead of the spike's Ask/Agent mode switch. The screenshot depicts searchable named models and an effort control; the user did not request a second permission mode. Preserve the current action-approval contract. The available model list and supported effort values come from the connected runtime; the reference's model names are not a hardcoded product catalog.

**Accepted direction, not implemented by this interview:** the [Chat adoption specification](../foundations/chat.md#redesign-agent-and-effort-picker) owns the control behavior and reference. Favorites, provider tabs, numeric shortcuts and fast-mode controls visible in the reference are not separately accepted capabilities. [The interview journal](../journal/2026-10-01-redesign-adoption.md) records the answer and interpretation.

**Explicit follow-up:** there will be no Ask/Agent modes going forward. Use one general mode for everything, with the agent/model and effort selectors. This is a settled requirement, not a first-port omission or a deferred mode feature. It does not remove per-action approval settings.

## D119 — Omni-input and search direction · 1 October 2026

**User requirement during the requested jstack interview:** the global entry point should be an omni-input/search in the language of Raycast, Alfred or Spotlight. This replaces the earlier assistant proposal of treating it simply as a command/content search box; it does not by itself select every capability of those apps.

**Follow-up accepted in Q6/Q7:** restrict the omni-input to Clarity's harness; exclude other Mac applications and files outside Clarity's workspace. Quick-entry commands show a compact prefilled form in the launcher with an explicit submission action, rather than immediately mutating a record or automatically sending the instruction to Chat.

**Accepted follow-up:** the user delegates intent detection to the recommended command catalog, aliases/candidate matching, small field parsers and existing-agent interpretation, explicitly requiring a lean implementation and removal of unjustified complexity. Q9 selects explicit Interpret by default, with optional automatic interpretation enabled in Settings. Both produce an editable form; only explicit Add/Save performs the operation. No new agent mode or approval policy is introduced.

**Q12A settles provider search:** show local Clarity content/commands first, with explicit Search Mail/Search Music actions for connected-provider queries. Typing alone does not query those providers; enabling automatic interpretation does not change this boundary. Reuse existing module services and connection requirements. The [closing journal](../journal/2026-10-01-redesign-decisions.md) records the acceptance.

The [shared UI topic](../foundations/desktop-stack.md#redesign-omni-input-and-search) owns the planned mechanism and failure boundaries; [Settings](../foundations/integrations.md#redesign-settings-navigation) owns the off-by-default preference. The [round-two journal](../journal/2026-10-01-command-navigation.md) preserves the earlier open discussion, and the [follow-up journal](../journal/2026-10-01-preview-controls.md) records its resolution. No production parser implementation or acceptance test is claimed.

## D120 — Section-based Settings in the redesign · 1 October 2026

**User acceptance during the requested jstack interview:** use the spike's Settings navigation, showing one selected section at a time. This selects the proposed replacement for the long scrolling page and Go to selector in D114 when the redesign is adopted. The existing production layout remains the implemented version until that port is delivered.

Carry current connection, module, data-folder, permission and agent-approval behavior into the chosen navigation. Existing destination links must select the corresponding section. The [Settings adoption specification](../foundations/integrations.md#redesign-settings-navigation) owns the planned contract; [the journal](../journal/2026-10-01-redesign-adoption.md) records the answer. This is a navigation decision, not approval to remove settings.

## D121 — Source inspection preserves Chat · 1 October 2026

**User requirement:** do not implicitly navigate the user away from Chat; source/result inspection must stay in the conversation. Opening another module from those surfaces requires an explicit “Open in <module>” action. This strengthens D18's stay-in-chat direction for the redesign's source interactions.

The user first selected Q8C to review a concrete example, then accepted it in Q8 with two corrections: the source pane must resize by dragging its divider, and “Open in <module>” must use a compact shared-system button rather than spanning the footer. Q10A accepts Back/Forward for actual conversation/module/item navigation, restoring the user's place. Preview selections and filter changes do not create history entries; history never undoes data changes.

The [Chat contract](../foundations/chat.md#source-inspection-and-navigation) owns the planned behavior and delegated sizing/accessibility defaults. The [external source-preview example](../references/technical-spikes.md#source-preview-and-navigation-example-1-october-2026) now demonstrates the accepted interaction and corrected controls with fictional data. Browser evidence applies to that example only, not production delivery. The [initial journal](../journal/2026-10-01-command-navigation.md) and [accepted follow-up](../journal/2026-10-01-preview-controls.md) preserve the progression.

## D122 — Preserve automation inputs for the first redesign port · 1 October 2026

**User acceptance in Q11:** keep the current automatic input behavior for the first port, choosing the lean recommendation over per-automation source checklists. This resolves Q2's earlier “no opinion yet.” Candidate sources remain Notes, chats, Todos, Calendar, Expenses, News and Bookmarks under the existing module enablement, change cursor and relevance rules. Do not port the spike's source checklist or extend automatic collection to Mail, board, Wiki or automation output.

The [Automations specification](../features/automations.md#redesign-adoption-scope-accepted) owns the runtime boundary, planned screen and regression expectations. Existing scheduled-topic writes and other-action approvals retain their contract. Together with Q12A, this closes the consequential product choices in the [redesign interview](../journal/2026-10-01-redesign-decisions.md); production UI adoption and its verification remain implementation work.

## D123 — Reuse fetched Music results · 2 October 2026

**User requirement:** switching Music tabs should reuse fetched results instead of sending the requests every time. This extends navigation retention to the fetched data. The [Music cache contract](../features/music.md#browse-result-caching-2-october-2026) specifies session memory, bounded retention, shared pending requests, explicit refresh and account/error handling as delegated lean defaults under D102/D103. It does not add offline playback, persistent provider copies or a dependency. The [journal](../journal/2026-10-02-music-cache.md) records the cause, implementation and validation limits.

The 2 October [large-collection correction](../features/music.md#large-spotify-collections-2-october-2026) refines the delegated cache lifetime: fetched Spotify pages also remain in main for the app session so playback can reuse them. Renderer reload clears view state; Refresh and music-account changes invalidate the relevant pages, and Quit clears both caches. Incremental scrolling replaces the silent 100-page cutoff; it does not change source scope or queue semantics.

## D124 — Music volume consistency and normalization · 2 October 2026

**User acceptance:** “go with all 3 steps” accepts fixing the shared slider mismatch, optional metadata-based normalization for Spotify/Navidrome, and automatic album gain for albums versus track gain for playlists/shuffle. Preserve dynamics, leave unsuitable/missing metadata unadjusted and avoid an always-changing compressor.

**Delegated lean defaults:** the existing Spotify 60 dB curve for both engines; a saved Settings → Music checkbox enabled by default; conservative gain reduction without amplifying quiet tracks; consistent nominal reference levels; and changes at the next track. The [Music contract](../features/music.md#source-volume-and-normalization-2-october-2026) owns calculation, metadata, timing, interfaces and limits. This supersedes the earlier proposal-only status recorded in the [investigation journal](../journal/2026-10-02-music-volume.md), without adding file rewriting, library analysis or manual per-source offsets.


## D125 — Settings desktop design correction · 2 October 2026

**User request:** the production Settings UI looks poor; refer to Cursor Desktop, the earlier Cursor-based prototype and optionally Codex Desktop. Preserve D120’s one-section navigation and the existing settings capabilities.

**Delegated defaults:** grouped section navigation, Appearance on first entry, a centered readable column, subdued grouped rows, right-aligned switches, responsive label/control alignment, module-grouped approval checkboxes and consistent connection/permission presentation. Keep all current controls, data-folder settings, connection targets and independent grants. Reuse native keyboard/input semantics, shared icons, themes and reduced-motion behavior. [Settings](../foundations/integrations.md#settings-visual-system-2-october-2026) owns the dimensions, behavior, reference provenance and verification recipe; [the journal](../journal/2026-10-02-settings-redesign.md) records implementation and limits. This refines the production presentation; it does not import reference-app features.

## D126 — Identify and group Music search results · 2 October 2026

**User direction:** distinguish songs, playlists, albums and artists in search, through type labels or grouped categories, using the supplied Spotify screenshot as a reference. **Delegated choice:** use both explicit type labels and nonempty category sections in All, with six-item previews and Show all selecting the existing type filter. Preserve provider identity, existing layout choices, cached results and playback behavior. The [Music contract](../features/music.md#search-result-categories-2-october-2026) owns ordering, metadata, navigation and validation. This refines the earlier flat All presentation under D103; it does not add Spotify's ranking, recommendations or other result types.

## D127 — Adjust volume while dragging · 2 October 2026

**User requirement:** Music volume must respond immediately while the slider is still being dragged. **Delegated implementation:** send every changed value immediately, preserve local input against delayed echoes, and apply Spotify gain at the final output so queued decoded audio follows the new level. Preserve D124's volume curve, fixed normalization and next-track setting timing. The [Music contract](../features/music.md#live-volume-response-2-october-2026) owns input/output behavior and the boundary between software responsiveness and audio-device latency.

## D128 — Open X in the default browser · 3 October 2026

**User direction:** launch whichever installed browser the user has selected as the default. **Delegated implementation:** Settings → X bookmarks exposes Open X through the existing OS external-link launcher. Label it as opening X rather than claiming to connect bookmark import. Retain Sign in for import separately because the existing headless importer needs its own persistent profile; explain that limitation in the UI. This changes the primary opening action while preserving D42/D44's read-only import contract. Importing from the default browser's session remains unsupported; no extension, paid API or browser debugging setup is selected. [Bookmarks](../features/bookmarks.md#x) owns behavior and validation; the [journal](../journal/2026-10-03-x-default-browser.md) records the distinction.
