---
title: Chat and module actions
section: Foundations
status: Current
updated: 2026-10-02
order: 40
summary: Chat can read information and perform actions across all Clarity modules.
---
# Chat and module actions

Stable ID: **FEAT-chat**.

## Current specification · 1 October 2026

### Conversation and navigation

**Implemented redesign:** [D118](../decisions/index.md#d118-agent-and-effort-selection-in-the-redesign-1-october-2026) selects an agent/model picker and effort control instead of the external spike's Ask/Agent switch. The [picker contract](#redesign-agent-and-effort-picker) below describes the production control.

Chat is the opening screen. Resume the last thread, show recent chats in the main sidebar, and provide New chat. All conversations access shared enabled modules. Stay in chat after actions; opening another module is explicit. D18's affected-item links resolve the record or file through the common navigation target.

Use Pi with the existing Codex subscription. Model/effort changes apply to the next message in the same thread, preserving history. Persist streaming progress and tool results locally. A restart marks unfinished runs interrupted, with no automatic replay. Earlier conversations are retrieved only when requested or referenced; there is no automatic cross-chat memory. `chats.find` currently returns up to five matching threads with up to eight matching messages each.

### Redesign agent and effort picker

**Implemented accepted direction:** the user requested an agent selector and effort selector and supplied [this picker reference](../attachments/2026-10-01-agent-effort-reference.png). Its list contains named models, so the working interpretation of “agent selector” here is model selection within the existing connected agent runtime. The searchable picker exposes available models and their supported effort levels, preserving same-thread history and next-message application. The screenshot's search/list and effort presentation guide the UI; its example model names do not establish availability.

**Explicit user requirement:** one general mode for everything; no Ask/Agent split now or as a deferred redesign feature. Agent/model and effort are the requested selectors. Existing per-action approval settings remain authoritative. Stars/favorites, provider tabs, numeric shortcuts and the reference's fast-mode toggle are visible reference details, not automatically adopted features or evidence of provider support.

The composer grows with the draft from a 40px minimum to a 240px cap, then scrolls internally. Source-pane entry uses a 160ms opacity fade; the drag boundary stays at its final position so immediate resizing does not miss the handle. Shared reduced-motion settings suppress this transition.

### Source inspection and navigation

**Accepted rule ([D121](../decisions/index.md#d121-source-inspection-preserves-chat-1-october-2026)):** inspecting a citation, source or action result from Chat must not switch the active module implicitly. Leaving the conversation through that surface requires an explicit “Open in Notes,” “Open in Todos,” or corresponding module action. Existing explicit main navigation remains an intentional user action. In-chat item links now open the source pane; external item-link addressing itself remains the same.

**Accepted after reviewing the example (Q8):** keep the source pane closed until a source is selected; show the selected source beside Chat, with Close and an explicit module-open action. The user requires a draggable divider and a compact, content-width “Open in <module>” button following the shared controls, not a full-width footer action. Retain the adjusted width through close/reopen and navigation during the session. Viewing a source does not attach it to a message or establish that the agent retrieved it. A general inspector grouping all attached/retrieved material is not required by this source-preview decision.

**Accepted history (Q10A):** Back and Forward record actual conversation/module/item navigation and restore the relevant reading position and draft. Source-preview selections and filter changes do not add history entries. Navigation history does not undo data changes. Use session navigation state without introducing cross-launch history persistence; production draft persistence remains governed by its existing contract. The [clickable example](../references/technical-spikes.md#source-preview-and-navigation-example-1-october-2026) demonstrates Notes/Todos visits and return to one fictional chat, not the complete production route graph.

**Delegated resize details:** a thin continuous divider with a larger invisible drag target, subtle hover/drag feedback and no layout animation during dragging. Provide a keyboard-focusable vertical separator, labelled value/range, arrow-key adjustment and bounded widths that preserve usable main content. The example starts at 344px, clamps desktop width to 280–640px while leaving at least 400px for Chat, and uses a bounded overlay below 761px; these are example defaults, not individually selected product constants.

**Acceptance:** inspect a source from a scrolled conversation with an unsent draft and confirm Chat remains active. Resize with pointer and keyboard, check both limits and a narrow window, close/reopen, then use the compact module button and Back/Forward. Verify the same chat, draft, main reading position and pane width; source selections must not add destinations. The [original example run](../verification/runs/2026-10-01T121000Z-source-preview.md) and [resize/control follow-up](../verification/runs/2026-10-01T122900Z-preview-controls.md) cover only the disposable demonstration. The [production port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) adds native source, draft, route, save and layout checks; live provider/model coverage remains explicitly bounded.

Implementation uses a 344px initial source pane, draggable from 260px to the lesser of 640px or workspace width minus 360px. Arrow keys change 16px, Shift changes 40px, Home/End reach its bounds. At narrow desktop widths it overlays the right side while keeping the conversation mounted. Close restores the initiating control where it still exists, or the Chat composer. Width is session state. Preview reads existing module services; Notes/Wiki render sanitized Markdown and relative local assets, Music reads a collection, and older chats show a short transcript excerpt. Missing/disabled sources report an error inside the pane. “Open in <module>” is a compact footer button.

The model control searches the runtime's real available-model list and clamps effort to the selected model's supported levels. A change persists as the default and applies to the next message without clearing the thread or interrupting an in-flight response. No new provider, fast mode, favorites or Ask/Agent state is added.

### Module actions and approval

The agent's `module` tool accepts `{module, method, args}` and uses the same module services as the UI. Reads return immediately. Other actions follow the Settings → Agent approvals checklist below: checked actions execute immediately and return their real result; unchecked actions create a persistent pending review record and explicitly tell the agent nothing has been applied. The user applies or rejects pending work. Revision checks claim application once; errors are visible. Pending/applying/applied/rejected/failed are distinct states. Human button/form actions call modules directly because the human is already performing the action.

The checklist extends the existing approval queue under D109; D60/D103 remain the default for unchecked actions. Wiki edits in chat follow the same settings; the original persistent topic-grant prompt remains superseded. Scheduled writes to an automation's configured wiki page remain preauthorized, with other mutations following the checklist and their results/reviews staying under Automations. Board use still requires user or standing instructions. See individual [module contracts](../features/index.md).

### Chronological action cards

**User requirement ([D111](../decisions/index.md#d111-chronological-chat-approvals-30-september-2026)):** approval requests and completed action cards belong in the conversation at the time they were created. Do not collect them after all messages or pin them below newer replies. This includes automatically approved actions, pending reviews, and applied/rejected/failed outcomes.

Merge saved messages, the currently streaming message, and actions owned by the chat into one ascending timeline. Use each Pi message's `timestamp` and each action's immutable `createdAt` (epoch milliseconds). Updating an action's status, result, error, or `updatedAt` updates its existing card without moving it. Preserve message order when timestamps tie; put same-time messages before action cards and use action ID as a deterministic tie-breaker between cards. Existing timestamped chats gain this layout without rewriting their history or changing storage.

Keep the existing Apply, Dismiss, result navigation, and error display. New streaming responses appear in the timeline after earlier actions. Follow the bottom only while the user is already following it; reading older messages must not be interrupted by automatic scrolling. Scheduled results stay on Automations as before.

Acceptance checks: a conversation with multiple turns interleaves actions with the matching messages; applying/dismissing an older action leaves it in place; automatic and failed actions use the same ordering; the newest response is visible at the bottom; streaming and reopening preserve the order. The [journal](../journal/2026-09-30-chat-timeline.md) records validation.

### Automatic approval checklist

**User requirement ([D109](../decisions/index.md#d109-agent-action-approval-checklist-29-september-2026)):** Settings contains a list of agent actions with checkboxes. Checking an action skips its approval prompt. A top-level **Select all** checks every listed action; it is unchecked for zero selections, checked for all, and indeterminate for any partial selection. Clicking or pressing Space on a partial selection selects all; activating a fully checked control clears all.

**Lean defaults:** start with all boxes unchecked, including for existing data folders. Save the selection with that folder and apply it to every chat and scheduled automation. List all actions even when their module is disabled; selecting one does not enable a module or connect an account. This is one list of exact `module.method` IDs, not an additional global mode or wildcard. A future action starts unchecked even if the user previously selected all.

Each row controls an existing method, so compound methods retain their current scope: task update includes renaming and completion, wiki write includes page creation and editing, and music control groups pause/resume/skip/seek/volume/shuffle/repeat. The complete 37-action map is:

| Module | Checklist actions and method IDs |
| --- | --- |
| Notes | Create note (`notes.create`); edit (`notes.write`); embed attachment (`notes.embed`); move/rename (`notes.move`); create folder (`notes.folder`); move to Trash (`notes.remove`). |
| Todos | Add (`todos.add`); edit/complete (`todos.update`); delete (`todos.remove`). |
| Wiki | Create empty page (`wiki.create`); create/edit page content (`wiki.write`); embed attachment (`wiki.embed`); move/rename (`wiki.move`); create folder (`wiki.folder`); move to Trash (`wiki.remove`). |
| Calendar | Add (`calendar.add`); edit (`calendar.update`); delete (`calendar.remove`). |
| Expenses | Add (`expenses.add`); edit (`expenses.update`); delete (`expenses.remove`). |
| News | Add source (`news.addSource`); remove source (`news.removeSource`); refresh feeds (`news.refresh`). |
| Bookmarks | Add (`bookmarks.add`); edit (`bookmarks.update`); delete (`bookmarks.remove`); import Linkding (`bookmarks.refreshLinkding`); import X (`bookmarks.refreshX`). |
| Music | Start playback (`music.play`); playback controls (`music.control`). |
| Agent board | Post/reply (`board.post`). |
| Automations | Create schedule (`automations.add`); edit/enable/disable (`automations.update`); delete schedule (`automations.remove`). |
| Browser | Authorize a website for the current chat (`browser.authorize`); perform a consequential or ambiguous action batch (`browser.batch`). |

No approval checkbox is needed for module listing/search/reading, music library/collection/recent reads, `chats.find`, `web.read`, hosted web search, or routine browser batches on authorized sites: these already run without review. Mail remains read-only. Account sign-in, module/settings changes, OS permissions, and Run now are human UI controls, not agent methods. Unknown agent mutations are rejected rather than implicitly approved.

Changes take effect at the next action check, including within an existing chat. Inject the latest exact selection into each model request and tell the agent to call the tool directly for requested actions; it must not insert a conversational confirmation for a checked action. The execution service remains authoritative. Keep an action record for automatic mutations (`autoApproved:true`, `applying → applied/failed`) and return success only after execution. Failed actions report their actual error. Module enablement, account requirements, file path/version checks, and revision checks still apply.

The [2 October Settings presentation](integrations.md#settings-visual-system-2-october-2026) groups actions by module with a selected-count summary. Visible action labels omit the repeated module prefix; accessible checkbox names retain the complete labels in the action map. All actions remain available, including disabled modules.

Changing the checklist does not apply existing pending work, cancel work already executing, or undo earlier effects. Unchecked actions continue using the existing persistent review flow. Browser website access and consequential actions are independent rows: permitting consequential batches does not authorize a new origin. Automatic website authorization grants the requested exact origin only when the agent calls it; saved grants remain per chat. A revoked site can be authorized again without prompting while that row stays checked, which Settings → Permissions explains. Interactive browsing remains limited to chats, not scheduled automations.

Acceptance checks cover immediate music playback without a review prompt, unrelated actions remaining pending, revocation at the next call, module/file/revision protections, saved choices after restart, automatic success/failure records, browser scope, and all three Select all states with mouse and keyboard. Current evidence is in the [implementation report](../references/implementation.md#validation-29-september-2026).

### Web capabilities

Use hosted Codex search for broad research, direct page fetching for simple reading, and Playwright with installed Chrome/Chromium for interactive or authenticated browsing. Keep sessions persistent and batch up to twelve navigate/read/links/click/fill/press operations per call. Focus page reads on relevant content rather than always sending screenshots or the whole DOM. Current limits are 3 MB for a fetched page, 30,000 characters for extracted direct-page text, 18,000 for an interactive read, and 100 returned links.

Authorize each exact origin for the chat, including after reopening; redirects to another origin need their own grant. Routine browsing then avoids per-click prompts. Website authorization and consequential/ambiguous batches enter review unless their corresponding checklist action is checked. The agent still classifies each batch: this does not guarantee technical read-only enforcement. One browser page belongs to each chat; saved login state and site authorization are distinct. Settings can revoke grants. Target at least Codex-level responsiveness while staying lean. Compare hosted search separately from interactive browsing, with agent-browser as the alternative to compare rather than an additional installed engine. Performance relative to Codex remains unmeasured; research and vendor benchmarks do not establish parity.

### Attachments

Provide picker, drag/drop, and pasted-image controls. Copy originals only below 30,000,000 bytes, skip oversized files with notice, and preserve external originals. Analyze text/code, supported images, and PDF text. Other formats may be stored with an unsupported-analysis notice; no universal conversion, OCR, Office, or audio/video analysis is promised. The saved-original limit is separate from bounded text sent to the model.

Stored chat copies expire after 90 days from attachment time, with expired state visible in chat. Deliberately embedding an attachment into Notes/Wiki creates a separate persistent relative-linked copy. Merely referencing it does not. Full ownership and cleanup rules are on [Data folder](folders.md).

## Time, location and permissions

**User request, 29 September 2026 ([D104](../decisions/index.md#d104-device-location-and-permissions-29-september-2026)):** the app should immediately request device location and provide a Settings section for Clarity permissions. The reported problem was an agent giving UTC/U.S. time conversions and guessing a U.S. location.

**Implementation defaults under the existing lean-build authorization:** inject fresh system time and the device's IANA timezone into every model request, including tool continuations and automation runs. Refresh saved location settings for each request. Physical location remains unknown unless supplied by the device or user; timezone, language and provider guesses are not location evidence.

On first opening the chosen data folder, request macOS location. Store coordinates rounded to two decimal places, a conservative accuracy estimate, and measurement time. A previous successful grant permits a launch refresh; a refused or failed initial request is retried only through Settings. This is a last-known reading, not continuous tracking. The agent must respect the reading's date and precision.

Settings → Permissions provides the device-location switch, refresh, last-request result, last reading, a macOS Location Settings link, and optional manual city/country. Disabling device use clears the stored reading; saving a manual location replaces device use. Both types are shared with the AI provider for chats and automations. Information already sent in earlier requests or included in replies cannot be withdrawn by the toggle. OS permission itself is managed by macOS.

The same section lists existing website origin grants by chat and can revoke them. Revocation closes that chat's browser page and cancels already queued browser work; other chats retain their own grants. Future access needs the existing authorization flow. This adds controls over current grants, without a new permission framework. Account connections remain in their existing Settings sections.

The bundled Electron/Chromium version supports Apple's native location provider. Clarity selects that provider and adds the macOS usage descriptions, avoiding a second location service or native helper. See [Electron's macOS initialization](https://github.com/electron/electron/blob/v44.4.5/shell/browser/electron_browser_main_parts_mac.mm), [Chromium's provider settings](https://github.com/chromium/chromium/blob/152.0.7977.130/services/device/public/cpp/device_features.cc), and [Apple's location authorization](https://developer.apple.com/documentation/CoreLocation/requesting-authorization-to-use-location-services). Real positioning and OS approval remain distinct from fixture validation.

### Usability fixes · 1 October 2026

Unsent text, attachment metadata, and optional Wiki context persist per conversation (including the initial unsent composer) in the selected folder's Electron profile. Module navigation, reload, and restart preserve the draft; a successful send clears only the submitted draft generation and attachment IDs, while later edits and failed-send drafts remain. Account disconnection does not silently discard it.

One readable action card is used by Chat and Automations. Use the action checklist's human label, affected title/path, labelled fields, formatted money/dates/booleans, and before/after values for changed fields. Markdown writes show rendered before/after content. Main captures an optional `before` snapshot when creating an action; older records without a snapshot say it is unavailable rather than inventing prior content. Raw arguments remain in collapsed Technical details. Keep the D111 chronological order and the D109 approval rules unchanged.

Completed-action links resolve the result/argument ID or file path to the affected item. Deleted items have no open link. Canonical citations use the [Wiki item-link contract](../features/wiki.md#usability-fixes-1-october-2026); missing/disabled destinations report the problem. Wiki Ask in chat adds removable current-page context to the draft before any send.

Composer and sent-message attachment chips open a named inspection dialog. Retained images preview inline; supported text/code previews at most 100,000 characters, with truncation guidance. Other files offer Show in Finder for the retained original. Main validates the attachment ID, metadata, path and 90-day retention before preview/reveal; the image protocol exposes eligible image files only. Expired/missing copies report their state. This does not add PDF/Office/media rendering or change analysis/embedding scope.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Adversarial fixes · 2 October 2026

Malformed relative Markdown links/images are contained in the source preview instead of blanking the renderer (QA01). A send acknowledgement clears only the submitted text/context generation and submitted attachment IDs; later edits, including editing away and back to identical text, remain saved (QA12). When creating a conversation for Send, migrate the latest draft before mounting its composer. Failed send preparation preserves it and reports the failure even after navigation. Existing-record module actions require a positive safe-integer revision at execution; missing, malformed and stale guards cannot overwrite or delete a newer record (QA07). These requirements also apply to automatically approved actions. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-renderer.mjs` with controlled delayed create/send replies: replace text/context/attachments, edit away and back to identical text, navigate, reload, and check saved drafts plus the actual submitted payload. Cover preparation failure after creation. Run `tests/adversarial-services.mjs` for direct, queued and automatic revisionless/stale actions and verify target records as well as action outcomes. No live model is needed for these boundary checks. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Entry points and prerequisites:** Chat → type unsent draft → reload; review card; attachment chip. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Check persistent draft, readable before/after and collapsed technical details, file inspection/reveal, exact-item handoff and no renderer errors. Attachments are fixture originals; provider execution is not mocked as proof of a real model response. Package checks additionally reopen an unsent draft after full process exit. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: Settings desktop design correction](../verification/runs/2026-10-01T184717Z-settings-redesign.md) — grouped approval/permission presentation; complete checklist, partial Select all, revocation and persistence retained.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — source-pane resize/history retained, composer autosizing, compact shared controls and reduced motion.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — real Chat/source navigation, resized preview, drafts/history and picker; model proposal transport checked with controlled responses.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

**Implemented under D102/D103:** Pi calls the shared maintained module methods. Reads return immediately; writes enter a persistent review queue, and the agent is told they have not been applied. Clarity adapts Cloudflare OS's public approval contracts without running the full upstream Gatekeeper platform. Browser navigation uses thread-scoped origin grants. See [current evidence](../references/implementation.md).

**Current implementation:** local Worker/SQLite persistence, the Pi agent, stable maintained module instances, queued approvals, and actual Markdown notes/wiki files. A live Codex request also accepted hosted web search, avoiding an interactive browser for ordinary research. The live application test now passes tool approval, restart, and model/effort switching within one thread. Fresh live sign-in/expiry remains unverified. Earlier discussions below are retained as history; the current implementation report governs the delivered behavior.

Chat should be able to act across all modules. It is the opening screen, with recent chats in the sidebar, and provides access to module information and actions through conversation. See [D17](../decisions/index.md#d17-chat-across-all-modules-25-september-2026).

### User-specified examples

| Module | Chat capability |
| --- | --- |
| [News](../features/news.md) | Summarize news headlines. |
| [Todo list](../features/todos.md) | Add and edit items in the single task list, and mark them done. |
| [Calendar](../features/calendar.md) | Add calendar events. |
| [Notes](../features/notes.md) | Read and edit notes; the human remains their intended maintainer. |
| [Mail](../features/mail.md) | Read and summarize mail. |
| [Bookmarks](../features/bookmarks.md) | Retrieve bookmarks. |
| [Music](../features/music.md) | Search and play music. |
| [Wiki](../features/wiki.md) | Create topic knowledge and maintain it during research, using upstream approval behavior. |

The all-modules requirement also covers expenses, the agent message board, and automations. Their specific chat operations have not yet been described; the Automations page now has a defined scheduled wiki-maintenance workflow. These examples do not define an exhaustive operation list or establish additional actions such as sending mail.

### Results stay in chat

**Accepted by the user:** stay in the conversation after a module action. Show a compact result with a link to the relevant item, such as the newly created calendar event. Opening the module is a user action; completing a chat action does not automatically switch the view. See [D18](../decisions/index.md#d18-results-stay-in-chat-25-september-2026).

The exact presentation of summaries, results, and item links remains to be designed.


### Action modes

**Use Cloudflare OS's approval behavior for now ([D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026)).** The previous custom Proceed/Cancel-before-every-action and Auto-mode requirements are superseded for current implementation.

Upstream Gatekeepers can queue writes and simulate pending results so the agent can continue before review. Behavior varies by connector; adopting it does not mean every action is simulated or automatically approved. Reuse its supported controls and clearly distinguish pending outcomes from completed actions. [Upstream explanation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md#gatekeepers-a-capability-based-security-layer).

Do not build an additional permission system to reproduce the earlier topic/thread wiki grant. Its custom mechanics are set aside for now; wiki maintenance remains intended. Validate actual local-file actions through the chosen platform integration. These product decisions do not change authorization for this planning conversation.

### Conversation access

**Accepted from the user ([D21](../decisions/index.md#d21-all-conversations-access-enabled-modules-25-september-2026)):** every conversation can access all enabled modules. Keep the user-facing model simple; no per-conversation module selector is required. Connection requirements and the selected action mode still apply. The implementation for retrieving relevant context remains undecided.

**Board-specific usage rule:** all agents may access the board, but usage is opt-in through project AGENTS.md or equivalent instructions (D68). Those instructions may direct ongoing reads/posts without fresh chat requests. Enabled-module access alone does not opt every project into board use. Use the same stable module and upstream approvals.

### Assistant and model selection

Retain Cloudflare OS's Pi-based agent under D58; the LangChain plan is superseded. Keep model/effort selection as a UX requirement where supported by the chosen provider. Local models remain out of scope. See [assistant execution](harnesses.md).

### Chat UI references

**User-stated requirement:** closely refer to Synara's or Codex's chat UI. See [D19](../decisions/index.md#d19-chat-ui-references-25-september-2026). Neither has been selected as the sole reference for the whole screen. The latest supplied Synara screenshot establishes the model/effort picker reference; earlier screenshots showed its browser. Full chat layout behavior still needs review.

This is a direction for Clarity's future chat screen. It does not change the planning wiki reader's Wikipedia-inspired style or select a model provider or app implementation.

### Existing requirements

Users choose which modules to enable and which accounts to connect. Mail requires Google authentication; music uses Spotify and Navidrome connections, with direct local-file playback out of scope. See [modules and connections](integrations.md). Provider-specific technical feasibility remains to be researched when designing the integrations.

The wiki capability here refers to Clarity's future in-app knowledge base. This planning notebook is a separate tool.

### Still open

- Exact result and item-link presentation, using the selected chat UI references.
- Validate upstream approval behavior for Clarity module operations and actual file changes.
- Detailed operations for each module, particularly developer workflows.
- Model provider/access setup, capability discovery, context retrieval, and conversation storage.

These are design questions, not chosen policies or implementation commitments.

### Navigation and scheduled output · 27 September 2026

Follow Cloudflare OS navigation first (D73): enabled modules above recent chats, Settings below. User-initiated module results stay in chat. Automation run output stays in Automations (D76); it must not create chats or insert scheduled summaries into conversations.

### Reopening · 27 September 2026

Resume the last chat when reopening Clarity, with New chat available (D78). Show a new chat when no history exists. Merely opening a conversation does not send a message or resume agent execution.

### Web and attachments · 27 September 2026

**D86:** the user wants full web capabilities. Search and page reading are confirmed; interactive/authenticated browsing and web actions need an explicit scope decision. Do not equate the user's requirement with fetching public pages only. Chat research does not change scheduled wiki source restrictions or upstream approvals.

**D87:** prefer allowing any file type to be attached, provided this remains simple. This is not a promise to analyze arbitrary formats or unlimited sizes. File storage, model input, and any conversion need separate treatment.

#### Upstream findings

Inspected revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a` on 27 September 2026:

- [web-fetch.ts](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/web-fetch.ts) exposes public HTTPS GET requests without forwarded credentials or write methods. Conversion of supported document formats uses a Workers AI binding. This inspected tool is not an interactive authenticated browser; search and browser-session support remain to investigate. Local backend execution does not imply that this conversion service is local.
- [Attachment validation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-validation.ts) accepts recognized text-like files and JPEG/PNG/WebP, plus PDFs for selected providers. It rejects unsupported MIME types and caps uploaded attachment bytes at 1 MiB per file. The [frontend preparation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-frontend/src/features/chat/composer/attachments/prepareChatAttachment.ts) also defines a 5 MiB combined limit and prepares/resizes images. These are upstream limits, not accepted Clarity limits.
- The [PDF bridge](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-pdf.ts) handles named model API paths. It does not establish PDF compatibility through the intended Codex subscription route. No end-to-end attachment test was run.

**Assistant assessment:** supporting every format's contents would add conversion, extraction, and possibly transcription work. The simplest proposed approach is to retain original attachments locally, analyze formats supported by the selected runtime/model, and clearly say when a file was attached but cannot be read. The user must agree to that distinction before treating it as the scope. File-size limits and original-file preservation need validation; no arbitrary unlimited upload promise is made.

#### Follow-up questions

1. Does full web capability include clicking, typing, downloads, and sites signed into by the user? Recommend search/read plus an existing browser integration for interactive tasks if one can fit the local runtime; preserve the upstream action-approval model. This is a proposal, not a selected tool.
2. Is attaching any file with a clear unreadable-file state acceptable when no supported reader exists? Recommend this lean fallback over building universal conversion. If analysis is essential for particular formats, identify those formats before selecting conversion tools.

### Research follow-up · 28 September 2026

The user requested research before deciding the two follow-ups. The [web and attachment report](../references/web-and-attachments.md) compares reusable browser integrations and local file handling. Playwright MCP is a candidate, but the generic upstream connector queues navigation/clicks for approval; smooth browsing is not a drop-in fit. Saving arbitrary file types is simpler than analyzing them. Proposed initial readers cover text, supported images, and PDF text, preserving originals and explicitly reporting unsupported inputs. These are recommendations, not new accepted scope. No runtime prototype was run.

### Browsing speed · 28 September 2026

D91 adds the user's target of browsing at least as fast as Codex while remaining lean. [Recent research](../references/web-and-attachments.md#browser-performance-follow-up) distinguishes hosted search from interactive browsing and favors warm sessions, focused observations, and bounded action batches. The assistant now recommends comparing Playwright-backed batching with agent-browser rather than defaulting to generic Playwright MCP. No driver or approval adaptation is accepted; no performance test was run. Attachment discussion is deferred.

### Accepted browser direction and attachments

D92 accepts Playwright with batched actions, persistent sessions, and focused page summaries, with agent-browser as the alternative to compare. The approval integration and performance validation remain open. This is a planning decision, not an application build request.

The attachment round is resolved by D93–D96 below. The user accepted the supported analysis baseline and composer controls, capped independent local copies below 30 MB, and chose 90-day cleanup instead of indefinite retention. See [the question round](../discussions/open-questions.md#attachment-question-round-28-september-2026).

### Attachment decisions · 28 September 2026

- **Analysis (D93):** text/code files, supported images, and PDFs containing text initially. Other file types remain attachable within the limit; clearly report unsupported analysis. Do not imply universal format understanding.
- **Storage (D94):** preserve an independent original-file copy under the data root only for files less than 30 MB. Skip files at or above the threshold and notify the user. Do not modify or rely on the external original after attaching.
- **Controls (D95):** drag-and-drop, file picker, and pasted images in the composer.
- **Retention (D96):** clean stored attachments after 90 days. This replaces the unaccepted indefinite-retention proposal and does not change Notes/Wiki Trash retention.

Working assumptions are age measured from attachment, cleanup while the app runs/startup, and an expired-file message in older chats while keeping conversation text. These mechanics are proposals; the 90-day period itself is settled. D100 now defines the ownership path: deliberate embedding creates a separate persistent module asset copy. Provider limits, extraction correctness, and aggregate payload limits still require implementation validation.

### First-version behavior decisions · 28 September 2026

The user accepted all four recommendations (D97–D100):

- After site authorization, routine browsing/navigation/search/reading proceeds without per-click confirmation. Confirm consequential actions such as sending, publishing, deleting, and purchasing. This is an explicit browser-specific refinement of D60; its enforcement and site-grant scope/duration remain to validate.
- Use the current thread by default. Retrieve earlier chats when the user asks or refers to a previous discussion; no automatic cross-chat memory. Enabled-module access remains unchanged.
- Apply model/effort changes to the next message in the same thread, preserving history; do not start a new chat or restart an in-flight response.
- Deliberately embedding an attachment in Notes/Wiki creates a separate persistent module asset with a relative link. The chat copy still expires after 90 days. Mentioning/summarizing alone does not preserve the original.

See [the resolved round](../discussions/open-questions.md#next-first-version-question-round-28-september-2026). The user approved behavior, not application implementation or a new generic permission system.
