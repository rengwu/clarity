---
title: Desktop stack exploration
section: Foundations
status: Current
updated: 2026-10-03
order: 60
summary: Local Cloudflare OS, Electron, actual Markdown files, Pi, stable modules, and upstream approvals.
---
# Desktop stack exploration

Stable ID: **FEAT-shared-ui**.

## Current specification · 1 October 2026

**User direction:** Electron/TypeScript, macOS first, local backend, Pi/Codex, actual Markdown, no terminals. **Delegated implementation under D103:** React renderer, Electron main-process services, and Miniflare/workerd with a local SQLite Durable Object. Cloudflare OS's scheduler and public approval contracts are reused from commit `32ce152654e8a205b54e094e31be932c620dbc52`; the complete upstream hosted/app-generation runtime is not used.

The sandboxed renderer has no Node access. A context-isolated preload exposes a small request/event bridge to main. Main owns files, credentials, modules, approvals, browser, music, agent runs, and scheduling. The local Worker owns structured records and revision checks. One module instance serves every chat. See [implementation contracts](../references/implementation.md) for interfaces, schemas, pinned dependencies, build instructions, and acceptance checks.

Closing the window hides it while work continues. Dock/menu-bar actions reopen it. Explicit Quit flushes note drafts, stops running work, closes browsers and storage, and exits. A failed note flush cancels Quit and exposes the error. On the next start, interrupted conversations and uncertain applying actions are marked rather than silently replayed. No independent daemon or launch-at-login is included.

Application dependencies install only in an external cache through the Node launcher. A packaged macOS arm64 build bundles Electron, Worker runtime, dependencies, and the Spotify helper; end users need neither Node nor Rust. It is locally signed and tested after relocation, not notarized or verified on a clean separate machine. Interactive browsing/X imports use installed Chrome/Chromium; they do not require a second bundled browser. Linux remains a future validation route.

The older GPUI/SwiftUI/terminal/LangChain comparisons below explain how we arrived here. They are not stack decisions to repeat during a rebuild.

### Redesign omni-input and search

**Implemented under the accepted direction ([D119](../decisions/index.md#d119-omni-input-and-search-direction-1-october-2026)):** the global entry point is an omni-input/search like Raycast, Alfred or Spotlight, restricted to Clarity's harness. Do not index or operate other Mac applications or files outside Clarity's workspace. Quick-entry commands produce an editable form inside the launcher; a named submission action performs the operation. For example, `task buy milk tomorrow` can lead to an Add task form with visible title and date, without creating the record while the user types.

Primary reference observations: Raycast's [Search Bar](https://manual.raycast.com/search-bar) combines search, command selection and command arguments; its [Action Panel](https://manual.raycast.com/action-panel) exposes actions for the selected result. Alfred documents [file search and actions](https://www.alfredapp.com/help/features/file-search/), and Apple documents [Spotlight search and actions](https://support.apple.com/en-gb/guide/mac-help/-mchlp1008/mac). These support the input/results/actions interaction family; the Clarity-only boundary and inline forms are explicit user selections from Q6/Q7.

**Accepted mechanism delegation:** use the recommended layered approach, keeping it lean and cutting complexity that is not justified by actual examples. Start with a small catalog of exposed commands, aliases and typed fields backed by existing validated module methods. Match exact command names first; lightweight typo-tolerant ranking may suggest candidates. Use bounded field parsers for supported dates, amounts and URLs. Regex is suitable for these small patterns, not an expanding grammar for arbitrary sentences. Resolve relative dates from the current device date/timezone and leave ambiguous fields editable. Prefer the form or Interpret action over adding a parser framework for uncommon wording.

[Fuse's fuzzy matching](https://www.fusejs.io/fuzzy-search.html) and [Chrono's date parsing](https://github.com/wanasit/chrono) informed the discussion; neither is an installed or selected dependency. Do not treat fuzzy scores as reliable intent confidence. Preserve the original query, show extracted fields, and validate submission through existing services. The production catalog exposes task, note, expense, event and bookmark forms, with exact aliases and one-edit command suggestions. An event with a recognized time starts with an editable one-hour duration; unsupported or incomplete fields remain visible for correction.

**Accepted interpretation policy (Q9A with an optional setting):** explicit **Interpret** is the default for model-assisted interpretation. Settings may enable **Automatically interpret commands**, off by default. Both use the existing connected agent to propose a supported command and structured fields, never execute tools or submit the form. Add/Save remains the mutation boundary. This does not create a second Chat mode or change agent approvals.

**Delegated automatic-path safeguards:** attempt interpretation of unresolved command text after a pause, not on every keystroke. Keep at most one current request, discard stale responses after edits/close, and never replace fields the user is already editing. Failure or an unavailable model leaves local search, command selection and manual fields usable. No semantic index, extra provider or autonomous action framework is required. The pause threshold and supported syntax can be chosen during implementation from concrete examples; do not promise universal natural-language understanding.

**Accepted provider-search policy (Q12A):** typing shows locally available Clarity content and commands first. Query connected Mail/Music providers only after an explicit action such as **Search Mail** or **Search Music** for the current query. Do not issue provider-search requests merely because the input changes. Automatic command interpretation is a separate opt-in setting and does not enable automatic provider searches. Reuse existing enabled-module and connection checks; show provider progress/errors locally while keeping local results available. Discard responses for an abandoned query and require another explicit search for changed text.

**Implemented defaults:** local search debounces for 140 ms and returns up to 60 records from enabled local modules, including Notes/Wiki text and saved conversations. It reads existing files/records without a separate index. Each Markdown area contributes at most 12 matches. No app or file outside the selected root is indexed. A very large data folder may still make these reads expensive; this is a bounded result list, not a virtualized search engine.

Automatic interpretation waits 700 ms on unresolved text of at least six characters. The main process uses the selected Codex model and effort in a separate proposal request with **no tools** and a 30-second transport timeout; it neither creates a conversation nor persists a proposal. Allowlisted command/field normalization rejects unknown commands and malformed output. Cancelling, editing or closing invalidates the request; an obsolete reply cannot replace an open form. The five forms call existing validated module methods only after their named submit action. Original input remains visible. `launcher.search`, `launcher.interpret` and `launcher.cancel` use the existing isolated IPC bridge.

The [production port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) distinguishes real local saves/navigation from controlled model/provider responses. Tests cover all five command forms, incomplete/invalid dates, cancellation, duplicate submission, opt-in persistence, stale proposals and explicit provider searches. They do not establish universal natural-language understanding or new live-account compatibility.

### Compact shared design

The production renderer adopts the studied Cursor spike language across every module, using existing services and user data. No sample records or scripted chat replies are installed into the user's folder. Shell code and shared controls are separate from module behavior; styles live in `style.css` and `workspace.css`, with one SVG icon set and native button/input semantics.

| Element | Implemented contract |
| --- | --- |
| Surfaces | Dark content `#181818`, sidebar `#222222`, tabs `#141414`, line `#ffffff0f`; light content `#fcfcfc`, sidebar `#f3f3f3`, line `#14141412`. System theme follows the OS. |
| Density | 44px shared header, 28px module navigation, 26px file rows/buttons, 35px flat Notes tabs; 13px controls, 14px reading text, 20px module titles. |
| Lists | News about 36px, tasks about 36px, expense entries at least 44px, Music track rows 44px plus 2px row spacing. Meaningful descriptions may wrap in reading lists. |
| Boundaries | Continuous pane dividers. List separators are straight pseudo-elements between rows, omitted after the last row and hidden beside hovered/selected/focused rows. Adjacent surfaces have a 2px gap. |
| Feedback | Subtle hover/selection backgrounds, 1px keyboard focus, no pointer hover rings. Task-title keyboard focus outlines its containing row. Checkbox marks and select chevrons use centered SVG geometry. |
| Motion | 120ms hover feedback, 160ms view/dialog/menu appearance, 220ms sidebar resizing and task reordering. OS or Settings reduced motion disables CSS and Web Animations motion, including running animations. |

The shell keeps visited modules mounted so drafts and editors survive module switches. Back/Forward stores conversation/module/item destinations and reading offsets for this session; preview changes and filters do not create visits. Notes tabs/files, Mail messages, Board threads, Music collections and Wiki pages feed this history. Existing canonical item URLs still open their explicit destination. Shortcuts: ⌘K search/commands, ⌘B sidebar, ⌘[ / ⌘] history, ⌘L composer, ⇧⌘L new chat. Native minimum window remains 850 × 600.

The spike-fidelity repair restores motion with a small shared `motion.ts` helper: view entry fades from 0.45 opacity with a 4px vertical offset, task reordering animates measured positions, and the mounted sidebar changes grid width while collapsed controls become inert. Default sidebar width is 232px (210px below 1150px, 248px above 1550px). Preserve `minmax(0,1fr)` grid rows and minimum height zero so document scrolling stays inside the workspace. Tooltips appear after 450ms, use viewport bounds, and close on input/scroll. Motion is functional feedback, not an added decoration layer. Shared native dialogs use 34px fields, 26px actions and a 6px corner radius; SVG glyphs remain aligned in checked, unchecked and dropdown states.

### Search and list spacing · 3 October 2026

The user reported the Board search touching its empty message and requested a sweep for similar cases. Standalone search fields directly inside a module page leave 12px before content, whether rows or feedback. Search fields inside an existing toolbar keep that toolbar's spacing. Shared loading, empty and no-match paragraphs use 12px vertical margins; adjacent block margins collapse rather than doubling existing 12–16px toolbar gaps. This also separates Notes feedback from its root-folder control. Board feedback precedes its thread list, like the other local lists, so an empty list container cannot add a second gap. These are delegated spacing defaults using existing density, with no new component dependency.

### Usability fixes · 1 October 2026

Shared primary hover styles explicitly retain the foreground/background pair in both themes. Named native dialogs use `aria-labelledby` pointing to their visible heading, keep native modal focus handling, and show failures locally. Destructive record deletion uses a reusable confirmation with Cancel initially focused; the action label includes the affected item. Submission guards lock immediately, before awaiting IPC, and expose a busy state. Shared list presentation distinguishes loading, empty, no-match and failed results.

Structured list reads accept `offset` with bounded pages (default 500, maximum 2,000) and deterministic creation-time/ID ordering. Local collection screens retrieve all pages before treating lists/aggregates as complete. This is a lean in-memory view of local records, not a virtualized large-data architecture; very large libraries can still cost time/memory. Structured `read {id}` resolves item targets. Shared navigation carries IDs, paths, Music source/type, or a Settings section. Canonical external item URLs only navigate, never execute module actions; the packaged macOS app registers the `clarity` scheme. Attachment preview/reveal requests stay behind the context-isolated IPC boundary.

Acceptance includes real double-click interactions, full 2,001-record totals and event visibility, dialog accessibility names, and both theme hover colors at the 850 × 600 minimum window. VoiceOver itself has not been exercised.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Adversarial fixes · 2 October 2026

Global navigation shortcuts leave a native modal and its draft in the active module until the dialog closes (QA02). Global handlers respect already-handled keyboard events; ⌘B belongs to an input or rich editor while it has focus and toggles the sidebar outside those editing contexts (QA03). Malformed source URLs are contained by the Markdown preview (QA01), as specified in [Chat](chat.md). The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### Global feedback research and pending proposal

**2 October 2026 — research only, awaiting the user's selection.** The user requested a global standard for errors and informational toasts and reserved the final method choice. The following recommendations are not accepted requirements or implemented behavior. Existing module contracts remain in force.

#### Current implementation observations

Source inspection finds a single dismissible error string in `src/renderer/main.tsx`, exposed through `AppContext.error`. A later error replaces the earlier one. Its bottom-right `.toast` uses `role="alert"` and has no shared success/info variants, queue or timing policy. `ErrorText` in `api.tsx` supplies local alert text; Settings associates errors with sections, Bookmarks mixes refresh outcomes in a status string, and Music has separate browse/retry and player notices. The preload already preserves error `code` and `details` from main, although many views use only `message`.

The [adversarial audit's QA14](../verification/runs/2026-10-01T181800Z-adversarial-qa.md#qa14) recorded duplicated Board reply errors that survived a successful correction; the later [remediation](../features/agent-board.md#adversarial-fixes-2-october-2026) fixes that local error lifecycle without selecting a global feedback method. The earlier [UI09 finding](../references/ui-audit.md#ui09-p2-errors-appear-away-from-the-failed-action) motivated local dialog errors; it is historical remediation evidence, not a newly reproduced defect. Native `Dialog` still uses `showModal()`, while the global toast is outside the dialog. These observations identify integration constraints; no new app walkthrough was performed for this research.

#### Research findings

- [Carbon's notification guidance](https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications) separates message severity from presentation. It places task feedback near the relevant work, distinguishes toasts from inline notices and banners, and keeps actionable or critical messages available. This supports a shared policy with contextual placement.
- [W3C status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) calls for programmatically exposed updates without requiring focus changes. Announcements need appropriate urgency; making every message an assertive alert is not a useful default.
- [React Aria's toast guidance](https://react-aria.adobe.com/Toast) recommends at least five seconds for timed messages, pausing on hover/focus, and auto-dismissal only for noncritical information or information available elsewhere. Five seconds is guidance from that library, not a universal WCAG duration.
- [MDN's native dialog documentation](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) explains that modal dialogs enter the browser's top layer and make outside content inert. **Clarity inference:** increasing toast `z-index` cannot make an ordinary outside host usable in a modal workflow; the policy must handle dialog scope explicitly.

#### Proposed behavior

**Recommendation:** one shared visual vocabulary and message format, with placement chosen by the owning operation. The following mapping and numeric defaults are assistant proposals for Clarity.

| Situation | Proposed presentation | Lifetime and recovery |
| --- | --- | --- |
| Invalid field | Message beside that field, linked to the input | Remains until corrected; preserve entered values. |
| Form or dialog submission failure | Shared inline notice inside the form/dialog | Remains through retry; clear on successful correction or cancellation. |
| Module/provider read failure | Shared notice beside the affected content | Offer retry when safe; retain valid partial results within the same account. |
| Brief information or completion worth announcing | Compact toast at the upper right, below shell controls | Six seconds, with a labelled close control; pause on hover, keyboard focus and window blur/hide. |
| Failure of an action with no visible local owner | Persistent error toast naming the action and source | Dismiss or resolve; offer an optional route to the owning screen when useful. |
| Ongoing app-wide loss of capability | Shared persistent banner below shell navigation | Retain until recovery; acknowledge separately from resolving the underlying condition. |
| Rendering/startup failure | Recoverable view fallback or existing native startup error | A renderer crash cannot depend on the failed renderer's toast host. |

Use the existing compact theme, SVG icons and reduced-motion setting. Distinguish info, success, warning and error with text/icon cues as well as color. Keep titles brief and include the failed action, useful source and next step: for example, “Couldn't load Navidrome music. Check the server connection.” with “Try again.” Show only safe, relevant diagnostic details; preserve the existing restriction against exposing authenticated URLs or credentials.

Limit the toast area to three visible messages, combine repetitions of the same operation, and retain unresolved errors in their owning view rather than silently dropping them during a burst. Routine autosaves, task toggles and successful operations already obvious in the UI need no toast. Actionable/important notices do not expire; dismissing a notice does not declare the operation successful. Do not promise Undo without an actual reversible operation.

While a modal is open, its own failures appear inside it. Defer unrelated informational toasts until it closes and start their timers only when visible. An app-wide failure affecting the modal needs an accessible local notice immediately. Do not steal focus for routine updates; announce ordinary status politely and reserve assertive announcements for failures needing immediate attention. A failure should have one presentation owner, avoiding simultaneous inline and toast announcements. Persisted Chat/Automation action outcomes keep their existing owning records and screens.

#### Implementation options for selection

All three candidates below can implement the same proposed placement policy. The fit and effort assessments are engineering judgments from source/documentation review, not measured prototypes.

| Choice | Approach | Fit and tradeoff |
| --- | --- | --- |
| A — recommended | Clarity `Notice` components plus a small wrapper around [Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast) | Unstyled primitives fit the existing CSS. Radix documents hover/focus/window-blur pausing, keyboard access and announcement controls. Clarity still owns the queue, deduplication and placement rules. More assembly than Sonner. |
| B | The same local notices plus [Sonner](https://sonner.emilkowal.ski/) | Ready-made React toasts with severity variants and configurable appearance offer a shorter initial implementation. Its [toast API](https://sonner.emilkowal.ski/toast) includes actions, IDs and promise updates; the [host API](https://sonner.emilkowal.ski/toaster) covers placement, themes and visible count. Configure Clarity's timing/dismissal policy and verify focus/modal behavior. |
| C | Extend the current React components with an in-house toast host | Adds no dependency and provides complete control, but Clarity must implement and maintain timers, queueing, keyboard access and announcements. The smallest dependency list does not imply the least maintenance. |

[React Aria Toast](https://react-aria.adobe.com/Toast) was also reviewed for its accessibility guidance and queue/keyboard model. Its component page is labelled alpha at the time of this research, so it is not the preferred new dependency for this focused change. No library was installed, benchmarked or tested in Electron; exact dependency versions would be pinned after selection through the external cache workflow.

The proposed shared layer contains a message with severity, operation identity, safe text, owning scope and optional recovery action; reusable local notices; and one application toast host. Call sites retain enough context to choose placement. Reuse the existing IPC error envelope instead of broadcasting a toast for every rejected request. Start by consolidating `ErrorText`, the global error path and bespoke notices while preserving Music's [single player-error behavior](../features/music.md#connection-clarity-and-independence-1-october-2026). This proposal does not itself authorize a notification-history store or OS notifications.

#### Verification after selection

Extend the shared UI recipe with real field/form failures, a failed dialog submission, successful correction clearing the Board error once, simultaneous/repeated events, retained partial Music results, and playback failures delivered in either event/reply order. Check timers during hover/focus/window hiding; keyboard dismissal and focus return; modal deferral; light/dark and 850×600 layouts; long text and reduced motion. Manually check VoiceOver announcements and modal reachability before making accessibility claims. Verify stale/account-switched results never reappear through feedback state. Record the chosen dependency, actual build and evidence in a new run. None of these product checks was executed by this research task.

### Verification recipe and coverage

**List-spacing recipe:** build, copy the [retained native driver](../evidence/2026-10-02T163455Z-list-spacing/verify.txt) to an external `.mjs` file, and run it from the checkout with `SPACING_EVIDENCE` pointing to a fresh external directory. It visits all twelve modules and Settings at 1200×800 and 850×600 in both themes; measure 12–16px from the preceding control to each visible list message and reject horizontal overflow. Search Board/Notes/News/Bookmarks/Mail for no matches; hold/fail a Board read, recover, create/open a thread, and verify its first row is 12px below search and persists after reload. Mail uses an empty connected fixture, not a live account. Use `CLARITY_TEST_EXECUTABLE` and `CLARITY_TEST_MAIN` for a packaged repeat. Existing `tests/redesign.mjs` covers populated shared rows and navigation. See the [spacing run](../verification/runs/2026-10-02T163455Z-list-spacing.md) for actual outcomes and limits.

**Adversarial recipe:** Run `tests/adversarial-renderer.mjs`: open New task, press navigation shortcuts, verify the modal stays visible and usable, then Cancel and verify navigation works. Select real rich-editor text and press ⌘B; require bold saved content and an unchanged sidebar, then check sidebar toggling outside the editor. `tests/adversarial-state.mjs` measures nested Bookmark overflow and retained Settings labels at the minimum window. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Fidelity/motion recipe:** run `node --test tests/redesign.mjs`. The spike-parity case observes real 220ms sidebar/task animations, persistence after task reordering, 36px rows/2px gaps, connected Notes dividers and scroll, straight neighbour-aware separators, keyboard controls/tooltips, and zero animation under reduced motion. Inspect populated native screens against the external spike at normal and 850×600 sizes in both themes; wait for finite animations before recording settled screenshots.

**Experimental browser redesign:** the separately authorized [Cursor Desktop spike](../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026) owns its visual choices, source location, local-storage boundary, reproduction steps and browser recipe. Its [compactness and controls run](../verification/runs/2026-10-01T083600Z-cursor-density.md) verifies selected disposable UI scenarios, not this production stack. D118–D122 are now implemented in the production port below; the earlier browser evidence remains specific to its external build.

**Entry points and prerequisites:** Record forms, delete dialogs, loading lists and primary hover. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Redesign recipe:** after building, run `node --test tests/redesign.mjs`, then the shared regression and package checks from Verification setup. This covers local command saves, controlled interpretation/provider boundaries, session history and minimum-window layout.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions|Mail and Music' tests/usability.mjs`. Exercise native accessible dialog names, real double-clicks and Cancel, complete paginated lists, and foreground/background colors at both themes and the minimum supported window. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [3 October 2026: search and list spacing](../verification/runs/2026-10-02T163455Z-list-spacing.md) — Board/Notes corrections and shared app layout sweep.

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — actual motion, compact controls and native visual review following user-reported port gaps.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — command boundaries, source/history, compact UI, regression suite and package evidence.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Application implementation · 28 September 2026

The user has now authorized implementation and safe lean defaults (D102). The working app selectively adapts Cloudflare OS's scheduler and approval contracts, with Electron/TypeScript, local workerd/SQLite, real Markdown files, and Pi. It does not run the complete upstream application. The macOS arm64 bundle now passes relocation, standalone dependency, signature and persistence checks. The earlier comparisons below remain historical. See [implementation progress](../references/implementation.md) for the exact reuse boundary and application tests; the sections below preserve the earlier architecture investigation.

### Runtime evidence · 28 September 2026

[Disposable tests](../references/technical-spikes.md) now support the core local-runtime, real-file bridge, Pi/Codex, and Electron direction. A minimal app bundle also passed; the complete upstream application remains untested. Browser approval enforcement and concurrent file edits require explicit design care. This is evidence, not a new stack decision. D101 authorizes further disposable investigation while product implementation stays on hold.

### Current direction · 27 September 2026

**Accepted:** Cloudflare OS with Electron/TypeScript, backend running locally for now, real Markdown notes/wiki files, the upstream Pi agent, one stable maintained module instance per user, and upstream approval behavior. Terminals are removed. See [D56](../decisions/index.md#d56-local-backend-27-september-2026) through [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026).

Electron is the desktop app; Cloudflare OS still uses its Workers runtime locally. The user's choice settles location, not the packaging implementation. Sources: [upstream runtime documentation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md) and [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model).

#### Remaining work and questions

| Area | Settled behavior | Remaining work or question |
| --- | --- | --- |
| Local backend | Runs on the user's machine initially. | Package and manage the runtime; keep running after window close, with Dock/menu-bar access, and stop on explicit Quit. No separate service is requested. |
| Notes/wiki | Actual Markdown files, both viewable in-app; notes editable in-app. | A narrow file interface must connect the platform to those files. Handle external changes without silently overwriting newer content. One data root is accepted; internal layout and other module state remain open. |
| Agent | Keep upstream Pi; no LangChain replacement. | Provider/access setup and model/effort capabilities. |
| Modules | One stable instance per enabled module/user, maintained module code. | Bind all chats to the same data and preserve it through module upgrades. Avoid a custom registry unless upstream mechanisms prove insufficient. |
| Approvals | Adopt upstream behavior; custom blocking/auto modes and wiki-grant machinery are set aside for now. | Verify how actual file changes and scheduled wiki actions use upstream approvals. A queued result must not be mistaken for a committed file edit. |
| X | Read-only bookmarks, invisible refresh preferred, visible fallback accepted. | Validate authenticated collection and session expiry; this is an implementation check, not a new feature choice. |
| Spotify | Audio plays inside Clarity; a separate player is not the selected experience (D61). | Choose and validate an embedded playback implementation in Electron. Connect control alone is insufficient. |
| Navidrome | Accept a supplied HTTP/HTTPS address and credentials, then attempt connection (D62). | Validate connection and streaming; report failures normally. No local/public classification or discovery flow. |

**Assistant assessment:** local runtime packaging and the actual-file connection remain the two unavoidable platform adaptations. They are not already solved by choosing Electron. Start with the smallest file interface and one authoritative Markdown copy; do not add an independent synchronized content database. The implementation must be validated before promising a packaged distribution.

A local process cannot perform scheduled work while the machine is off. Window close keeps the app running; explicit Quit stops it (D63). Missed runs are skipped and recurring work resumes at the next scheduled time (D69). Local sleep/restart execution still needs validation; pending-approval outcomes remain open. No separate service is requested.

#### Evidence and limits

Sources: [blueprints](https://github.com/cloudflare/cloudflare-os/blob/main/docs/blueprints.md), [agent source](https://github.com/cloudflare/cloudflare-os/blob/main/packages/workshop-backend/src/agent.ts), [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-spotify/README.md), and [Scheduler](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md). Earlier source review used revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`. The runtime/Spotify docs were rechecked on 27 September. At that review, runtime packaging, authenticated import, playback, file bridge, and data migration had not been tested. The later [disposable spikes](../references/technical-spikes.md) add limited runtime, packaging, and file-bridge evidence; imports, playback, and migration remain untested.

### Historical exploration · 26 September 2026

The remaining sections preserve the sequence leading to this direction. Statements such as “no stack selected” and terminal proposals describe that earlier discussion.

### User direction

On 26 September the user opened framework and language comparison, expressing a preference for Rust and GPUI while remaining open to Electron, SwiftUI, and other feasible options. They are less confident with SwiftUI. They dislike xterm.js and prefer exploring libghostty or Alacritty for terminals. These are preferences, not a selected stack. [D52](../decisions/index.md#d52-terminal-spaces-and-stack-preferences-26-september-2026) records the direction.

Keep the whole application in view: macOS first with a Linux route, rich-text Markdown notes, an HTML wiki webview, chat, ordinary module screens, music playback, and embedded terminals. LangChain already owns the assistant loop under [D50](../decisions/index.md#d50-langchain-runs-the-assistant-26-september-2026). Research does not authorize implementation.

### Comparison

The fit assessments below are assistant judgments based on inspected documentation and chartr source, not runtime benchmarks.

| Candidate | Fit for Clarity | Material cost |
| --- | --- | --- |
| Rust + GPUI | Matches the user's language preference and native terminal direction. Chartr provides an existing macOS/Linux integration reference. | A complete terminal view still needs selection. Rich Markdown editing and native webview focus/layering need validation. LangChain requires a separate supported-language runtime. Reusing broad Zed components reduces custom code but increases dependency and maintenance scope. |
| Electron + TypeScript | Web UI suits chat, the HTML wiki, forms, and existing web editor components. LangChain JS can use Electron's Node runtime. | Bundles Chromium and Node. Native terminal embedding is a separate integration problem; cannot assume the familiar xterm.js route given the user's preference. A Ghostty-based browser frontend would need its own evaluation. |
| SwiftUI + AppKit | Strong macOS fit. Ghostty's macOS app is an existing Swift/native terminal reference. | Adds the user's Swift learning burden and a LangChain helper runtime. SwiftUI targets Apple platforms; a Linux UI would be a separate effort. Native terminal integration still needs work. |
| Tauri + Rust + web UI | Additional candidate: Rust backend with system webviews, naturally suited to the HTML wiki and web editors. | A system webview is not a native terminal widget or a Node runtime. Native terminal integration and a LangChain helper remain; multiple boundaries can outweigh the smaller browser distribution. |

Primary framework sources: [GPUI](https://gpui.rs/), [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [SwiftUI](https://developer.apple.com/swiftui/), and [Tauri architecture](https://v2.tauri.app/concept/architecture/). Electron's bundled runtime and Tauri's use of system webviews are architectural differences, not measured Clarity performance results.

### Terminal embedding

A **PTY** is the operating-system connection that lets a shell behave interactively. Terminal emulation interprets its output; the terminal view handles drawing, selection, keyboard input, resizing, and related interactions. A good emulation library is not automatically a complete embeddable widget.

- **libghostty:** upstream now documents usable C/Zig embedding libraries and examples. Its public `libghostty-vt` parses terminal sequences and maintains state; it does not supply a GPUI view. The inspected README says API signatures are still changing and no libghostty version has been tagged. Do not confuse Ghostty's mature desktop app with a version-stable, ready-made Clarity integration. [Upstream README](https://github.com/ghostty-org/ghostty/blob/main/README.md).
- **Alacritty:** `alacritty_terminal` exposes terminal state, grid, selection, and PTY I/O. It is useful Rust infrastructure, not a complete GPUI widget. [Crate API](https://docs.rs/alacritty_terminal/latest/alacritty_terminal/).
- **Zed's complete terminal stack:** local chartr's ADR 0004 records reuse of the terminal model plus `TerminalView`, avoiding a separately maintained renderer/input path. Its dependency graph includes Zed's Alacritty fork. It explicitly accepts more dependencies and source-vendoring upkeep. This is a concrete GPUI route to examine before attempting a custom frontend around either engine.

Chartr's ADR 0002 also records component licensing distinctions; reuse boundaries need inspection if copying code. This research has not selected a library or audited the complete dependency graph.

### LangChain and a Rust or Swift application

LangChain's documented implementations include [Python](https://docs.langchain.com/oss/python/langchain/overview) and [JavaScript/TypeScript](https://docs.langchain.com/oss/javascript/langchain/overview). Selecting it does not select the desktop UI language, but a Rust or Swift UI needs a connection to one of those runtimes.

One proposed arrangement is a small local helper process started by Clarity. The UI sends a request; the helper runs LangChain's model/tool loop and streams events back. It can communicate over process pipes, without introducing an HTTP server or an always-running service. Packaging, cancellation, restart behavior, and permission enforcement across that connection are real work. Python versus TypeScript remains undecided. Electron can use LangChain JS in its Node environment, avoiding an additional language runtime while still retaining UI/backend separation.

### Current recommendation and open checks

**Assistant proposal:** prioritize Rust/GPUI for further evaluation because it matches the user's preferences, with Electron as the comparison for reducing web UI and LangChain integration work. Tauri is worth considering but is not automatically simpler once native terminals and LangChain are included. SwiftUI is less aligned with the Linux goal and the user's experience.

Before choosing GPUI, establish a maintainable route for three existing requirements: the complete terminal view, rich-text Markdown editing, and the HTML wiki webview. Chartr already uses Wry, but ADR 0005 and its manifest show platform-specific work for child-webview layering; embedding is possible, not free. A source editor or Markdown preview alone does not satisfy the agreed rich-text notes experience. Music playback/runtime fit must also be checked once a playback route is narrowed.

No app or prototype was run, no performance claims were measured, and no framework was selected. Herdr, session lifetime, and traces are separate decisions on the [terminal page](../features/terminals.md).

### Electron and TypeScript obstacles · 26 September 2026

The user asked what would obstruct choosing Electron/TypeScript. **Assistant assessment:** it is a plausible way to reduce whole-app implementation work. Chat, forms, the wiki reader, and web editor integration fit its UI model, and LangChain JS can run in its Node environment. This does not select Electron, a UI library, an editor, or storage.

#### Terminal experience is the largest preference-dependent obstacle

An embedded native Ghostty/Alacritty view would need integration with Electron's window, focus, input, resizing, and view layering. A Node native binding can expose an engine but does not by itself embed a complete native terminal view. No ready-made native integration meeting Clarity's needs has been established in this research.

There is another candidate: [Coder's ghostty-web](https://github.com/coder/ghostty-web). Its README describes a Ghostty parser compiled to WebAssembly, with an xterm.js-compatible API. The inspected [renderer source](https://github.com/coder/ghostty-web/blob/main/lib/renderer.ts) uses a browser 2D canvas. API compatibility does not mean it uses xterm.js internally; using Ghostty parsing does not mean it shares Ghostty's native renderer or identical behavior.

**Proposal:** investigate ghostty-web with a local PTY backend before attempting native view embedding. [node-pty](https://github.com/microsoft/node-pty) is an existing Electron-compatible PTY candidate, separate from the renderer. Electron's process messaging could carry terminal data without a localhost web server; the project's WebSocket demo is not a required architecture.

This is promising, not validated. Check actual CLI-agent redraws, keyboard input/IME, selection/copy, resizing, scrollback, and sustained output before judging it robust. The user has not accepted browser rendering as satisfying their native-terminal preference. If native rendering itself is essential, Electron's terminal path becomes substantially more bespoke.

#### Other costs

| Concern | What it means for Clarity | Lean direction or remaining choice |
| --- | --- | --- |
| Runtime footprint | Electron bundles Chromium and Node and uses multiple processes. It is not a minimal native runtime, although actual app startup, memory, and battery use are unmeasured. | Share the main app UI, mount module screens as needed, and bound terminal buffers. Keep process and playback lifetimes separate from screen visibility. Accept the runtime baseline rather than promising native-sized resource use. |
| Spotify playback | The Web Playback SDK requires a compatible encrypted-media environment; Chromium ancestry alone does not establish packaged Electron support. | Validate embedded playback, use a native/helper player, or control an existing Spotify player. None is selected. This is a runtime concern; public-product policy remains deferred. |
| Native packaging | A PTY module or native music helper means platform/CPU-specific artifacts alongside TypeScript. Electron native modules need compatible builds. | Keep native dependencies few; verify packaged output for each supported target. Linux is a separate validation target even when most code is shared. |
| UI/backend boundary | Clarity displays email, web-derived content, and generated HTML while also accessing files and terminals. Those content views must not inherit arbitrary filesystem or shell access. | Use isolated content views and a narrow, validated bridge to backend actions. Keep credentials and permission enforcement on the trusted side. This is necessary implementation work, not a new user permission flow. |
| Responsiveness and lifetime | Blocking file/parse work or unbounded terminal output can stall a UI or backend event loop. Screen navigation must not accidentally stop music, chats, or live terminals. | Use asynchronous I/O, bounded output delivery, and workers/helper processes where concrete work requires them. Do not put every module in its own process. |

Sources: [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [native module compatibility](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules), [content isolation guidance](https://www.electronjs.org/docs/latest/tutorial/security), and [Spotify SDK initialization errors](https://developer.spotify.com/documentation/web-playback-sdk/reference#initialization_error). Existing [music research](../features/music.md#spotify-playback-tradeoffs-25-september-2026) compares playback alternatives.

Rich-text Markdown round-tripping, X session expiry/hidden refresh, file ownership, and execution after full quit remain application/integration problems under any framework. Electron provides useful browser and filesystem facilities; it does not settle those behaviors. Navidrome audio still needs format/stream handling, but it does not inherit the Spotify SDK's encrypted-player requirement.

Electron also implies a normal application build and dependency workflow. The current workspace prohibition on package manifests, lockfiles, and node_modules remains in force; any future Electron setup requires explicitly resolving that boundary before implementation. The standalone planning wiki retains its Node-only build regardless of the eventual app framework.

#### Refined assessment

The earlier GPUI-first recommendation prioritized the user's Rust/native preference. If reducing implementation work across all modules is the priority, Electron/TypeScript may be the stronger fit, **provided the terminal experience is acceptable**. ghostty-web gives us a concrete alternative to investigate; it is not an accepted substitute for native rendering. Spotify playback is the other early feasibility check. No dependency installation, terminal test, account connection, playback test, or application build occurred.

### Building on Cloudflare OS · 26 September 2026

The user asks whether to fork Cloudflare OS, either following its extension model and accepting tradeoffs or extensively altering it. This is exploration, not authorization to fork, deploy, build Clarity, or replace accepted requirements. Findings below come from upstream revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`; no runtime tests were performed.

#### What the platform would give us

Cloudflare OS provides agent chat, model integrations, application execution, connection management, and action review. Its extension units are **gadgets**, small apps with UI, server code, and their own state. **Blueprints** are templates for creating gadgets. **Gatekeepers** mediate access to services. These could save substantial integration and agent-platform work if we adopt the surrounding model, rather than extracting each piece.

The [blueprint system](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/docs/blueprints.md) supports shipping custom templates, including a separate bundled-blueprint directory. This is a concrete route for adding modules with fewer core modifications. It does not automatically provide the exact persistent module sidebar, canonical shared module data, or HomeOS screenshot UI; those need verification or custom work. The HomeOS X collector has not been located.

#### Material differences from our plan

| Area | Inspected evidence | Consequence for Clarity |
| --- | --- | --- |
| Runtime and state | The backend config binds SQLite-backed Durable Objects, KV metadata, R2 blueprint content, and dynamic Worker loading. A Durable Object is a runtime-managed unit of code with persistent state. | This is a platform dependency, not a storage adapter we can casually swap for a folder. Ordinary Markdown notes and local projects need explicit integration. Local database acceptance remains open in Q05; plain-file state is not silently reimposed as settled. |
| Local operation | The README documents local Wrangler/workerd execution and storage beneath `.wrangler`; standalone workerd self-hosting is possible, but its deployment tooling/documentation is marked coming soon at the inspected revision. | Cloudflare hosting is not mandatory. A dependable local desktop distribution still needs runtime packaging, data location, upgrades, backup/restore, and lifecycle work. Running the developer command is not a finished local-first app. |
| Agent loop | `agent.ts` imports and uses `pi-agent-core` and `pi-ai`, alongside Cloudflare RPC and platform-specific hooks. | Keeping the existing loop would supersede D50's LangChain choice. Replacing it would require adapting tool calls, streaming, chat persistence, and approvals. Adding a second competing loop is not proposed. |
| Approvals | Gatekeepers can queue writes and simulate pending results so the agent continues; auto-approval is scoped by eligible action kind and gatekeeper, with additional restrictions. | This differs from Clarity's simple Proceed/Cancel versus Auto modes. Exact compatibility and thread-long wiki grants require deliberate design or an explicit requirement change. |
| Module upgrades and portability | Blueprint instances have independent state; template changes do not automatically update existing instances. Blueprint export excludes application SQLite data, chat history, and credentials. | Good for personal customization; module upgrades across friends require a strategy. A blueprint export is not a complete backup or the requested portable app-state folder. |
| Local developer work | Gadgets run in the Workers environment. The documented blueprint server/client environments do not expose Node's filesystem API. | Host folders, local CLI agents, and real PTYs need a desktop companion or a runtime bridge. A gadget code sandbox is not the user's terminal. |
| Existing integrations | The Spotify Gatekeeper supports catalogue/library operations and Spotify Connect control; Scheduler has persistent callbacks backed by Durable Object alarms. | Useful starting points, but not embedded Spotify audio, Navidrome playback, or Clarity's exact automation behavior. Scheduler currently skips missed occurrences; its management UI is read-only. |

Sources: [backend runtime config](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/wrangler.jsonc), [README and local deployment](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/README.md), [agent implementation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/agent.ts), [auto-approval implementation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/auto-approval.ts), [blueprints](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/docs/blueprints.md), [bundled-blueprint environments](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/bundled-blueprints/README.md), [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/gatekeeper-spotify/README.md), and [Scheduler](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/gatekeeper-scheduler/README.md).

#### Three approaches — assistant assessment

| Approach | Benefit | Cost and recommendation |
| --- | --- | --- |
| Follow the platform | Keep the runtime, existing agent, storage, and connector interfaces. Add Clarity gadgets/blueprints and limited navigation changes. Most plausible way to benefit from upstream work and updates. | A credible option if the user accepts platform-shaped state and agent behavior, and cloud hosting or a separately engineered local workerd distribution. Define one canonical instance per module or equivalent shared data access so chat does not create fragmented task lists or knowledge bases. |
| Extensively rewrite the fork | Retain useful UI and behavior while replacing internals to fit Clarity exactly. | Replacing runtime, storage, agent loop, and approvals together is likely to consume much of the saved effort. We would learn the old system, build its replacement, migrate data/contracts, and maintain divergence. Upstream is explicitly early access and changing. Not recommended as the default lean path. |
| Build a small Clarity app and selectively reuse | Preserve local desktop ownership and LangChain, drawing on the platform's UI patterns and narrowly reusable code. | Less functionality on day one and no automatic inheritance of upstream fixes, but fewer conflicting architectural assumptions. Inspect dependencies before copying: much connector code expects platform RPC/storage. Recommended if the current local desktop and learning requirements remain central. |

Heavy visual customization or new modules is different from replacing the execution platform. A sustainable fork boundary could keep upstream core intact while owning Clarity templates, connectors, and navigation. The more foundational parts we replace, the less useful the fork becomes as a shortcut. Merely removing a layer can also break guarantees relied on elsewhere; changes need dependency-level review rather than wholesale deletion.

**Current recommendation:** consider the platform-aligned fork seriously as an alternative product direction; do not assume an extensive rewrite is leaner than a small new app. First decide whether Clarity must remain a local desktop app with local terminal/folder access, and whether LangChain is a durable requirement or a learning choice the user would revisit. Existing decisions remain binding until explicitly changed.

If the user later authorizes an evaluation, bound it to one task-list gadget accessible from chat and one real local Markdown or PTY interaction. Check persistence/restart, module ownership, and permission behavior before extrapolating to all modules. This is a proposed evaluation, not work begun or permission to install dependencies. No effort estimate or robustness claim has been established.

### Remaining concern triage · 27 September 2026

**Updated:** D63 settles close/quit behavior and D64 chooses one data root. D66/D67 subsequently accept topic threads, module-method access, and reads only when instructed; posting triggers remain open. Recommendations are recorded on the [automations](../features/automations.md#lifecycle-proposal-27-september-2026), [portability](portability.md#folder-simplification-proposal-27-september-2026), and [agent-board](../features/agent-board.md#lean-board-proposal-27-september-2026) pages. The lifecycle, single-root, and board/interface directions are now accepted; exact posting and external-connection behavior remain open.

The technical risks to validate once implementation is authorized are:

- Local runtime packaging and restart with preserved data. Upstream still describes its quick local command as a development setup, not a production distribution. [Runtime documentation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md).
- Actual-file access and stale-write protection, including both UI and agent edits. Queued approval must not apply an obsolete file version over newer edits.
- Embedded Spotify playback in packaged Electron. Existing Connect control does not supply this. [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-spotify/README.md).
- Whether upstream approval settings allow the intended scheduled updates and responsive music controls. The connector documents gated playback writes; inspect behavior before proposing changes. Adopted upstream approvals are not being reopened by speculation.

X refresh, module upgrades, and persistent shared module bindings also remain untested. These are implementation checks, not reasons to ask the user to choose internal libraries. Rechecked upstream runtime, Spotify, and Scheduler documentation on 27 September; no live runtime or account tests occurred.

Provider/access setup and first-release scope remain open, but need not be resolved as part of every module discussion.


### Proposed first-version validation order · 28 September 2026

The user asked for elaboration on the next steps. This section preserves the assistant-proposed investigation plan from that explanation-only turn. D101 later authorized disposable runtime spikes; [their results](../references/technical-spikes.md) supersede its source-review-only boundary, without authorizing Clarity implementation. The plan itself introduced no new research findings. Product behavior is sufficiently defined to investigate the foundational fit before adding more feature questions.

#### First: the chosen Codex subscription through Pi

Trace the path from sign-in through the local backend to Pi model requests, streamed responses, tool calls, and saved conversation state. Establish which parts already exist in the pinned upstream versions and which require a desktop adaptation. Check model/effort selection, supported attachment input, cancellation, and reconnection without changing the subscription decision or introducing a second agent loop.

Source review can identify the available provider/auth interfaces and missing plumbing. Only a later authorized live test can demonstrate that the user's actual account works end to end. The success case is one signed-in chat that streams a response, performs a simple module action under the intended approvals, and reopens with preserved history. Do not inspect credentials or begin login simply to elaborate this plan.

#### Second: local desktop operation and real files

Map what Electron must start, which backend processes must stay alive after window close, and what explicit Quit must stop. Identify every persistent store and how its location is assigned beneath the chosen data root. Find any operation that still needs a remote service; local backend execution does not mean the model and web work offline.

Inspect the smallest host interface for reading/writing actual notes/wiki files from the Worker runtime. A narrow file-access bridge should serve the accepted module operations, not expose a general filesystem shell. Include stale-write checks so an agent edit approved later cannot overwrite a more recent human save. Outline note autosave, wiki reader regeneration, and attachment/module-asset ownership without choosing a new storage framework by implication.

Later runtime checks should cover startup, close/reopen, explicit Quit, restart persistence, a changed external Markdown file, and an approved edit whose underlying file changed in the meantime. Packaging also needs validation on a machine without the developer repository or toolchain. No hosted deployment or independent background service is proposed.

#### Third: browser execution and approval boundaries

Trace where the existing approval machinery can support D97 and where adaptation is required. Browser commands should combine short known sequences and return focused results while stopping before consequential operations. A generic click or arbitrary script cannot be classified safely from its name alone; this is the principal complexity to surface rather than hide behind a promise of a tiny wrapper.

Evaluate a narrow adaptation using existing browser controls and upstream review. If maintaining the accepted behavior needs a larger permission subsystem, explain that finding and the smallest viable tradeoff before adopting it. Site authorization scope/duration remain design details. Hosted search availability is a separate integration question from browser performance.

Later comparison should test successful tasks, latency, model turns, approval waits, and memory against the user's Codex reference, keeping public research separate from signed-in browser operations. Driver selection alone cannot establish parity.

#### What the next research report should deliver

For each area: what can be reused unchanged, the smallest required adaptation, concrete unknowns, and a narrowly scoped runtime test needed to resolve them. Start with subscription integration and local runtime/file access because they affect the entire first version. If either undermines the lean premise of the fork, raise the finding rather than silently replacing Pi, the runtime, or the accepted file model.

Once the user requests implementation, the proposed first working path is: launch locally, open the selected root, connect Codex, chat, perform a todo or real Markdown operation, and verify state after restart. This is an incremental validation proposal; chat, notes, todo, and wiki all remain first-version priorities. At the time of that explanation request, only source inspection was authorized. D101 subsequently permits disposable prototypes and their dependencies outside the workspace, while application implementation remains unauthorized.
