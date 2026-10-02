---
title: Disposable technical spikes
section: References
status: Reference
updated: 2026-10-01
order: 90
summary: Runtime evidence for subscription access, local persistence, real files, Electron packaging, and browser limits.
---
# Disposable technical spikes

## Cursor Desktop design spike · 1 October 2026

**User-requested exploration ([D116](../decisions/index.md#d116-cursor-desktop-design-spike-1-october-2026)).** Build a redesigned Clarity prototype using Cursor Desktop's UI/UX language and make it visible in a browser. This is an external disposable implementation, not an accepted replacement for the production UI or its storage/agent contracts.

### Current expansion · all modules and motion

**Adoption interview, subsequent direction:** the [completed interview](../journal/2026-10-01-redesign-decisions.md) selects one general mode with agent/model and effort controls, a Clarity-only omni-input, section-based Settings, source preview and navigation history. Keep existing automation inputs without per-job checklists and use explicit connected-provider searches. The source behavior and verification below describe the existing all-module prototype; the interview decisions have not yet been ported to it or production. The separate source-preview example below demonstrates the accepted pane/history interaction.

**User requirement ([D117](../decisions/index.md#d117-all-module-cursor-prototype-and-interaction-polish-1-october-2026)):** include every agreed module, populated sample content, a studied Cursor Desktop design system, polished micro-interactions, and animations. The user also supplied non-exhaustive crops of unnecessary labels, inconsistent hover/selection, tab styling, an interrupted pane divider, and large Todo focus rectangles. Later feedback explicitly requires compactness across the whole system, more News headlines per viewport, aligned expense totals/amounts, and straight between-item separators that disappear beside hovered/active items, following the supplied Helium tab examples. Checkbox checks and dropdown chevrons must be aligned; adjacent hovered/selected items must have a visible gap. ChatGPT and VS Code are permitted secondary references. Apply the correction to equivalent controls throughout the prototype. This supersedes the first spike's optional-module exclusions; it does not change production defaults or authorize replacing the production UI.

### Reference and design translation

Studied Cursor Desktop **3.20.21** through the running Agents new-chat/Customize surfaces, a separate IDE window containing two disposable Markdown documents, and installed dark/light `theme-cursor` JSON plus workbench CSS. Native Accessibility became available during the expansion. The IDE reference confirms flat connected tabs, a document-colored active tab, transparent active top border, reserved close-button space, and continuous pane/header separators. The earlier rounded tab treatment and bright underline were rejected by the user and removed. Native account-bearing screenshots stay outside the repository under the spike's `reference/` directory; `design-study.json` records observations and their limits. A screenshot named `search.png` actually shows Customize; the attempted palette capture is not treated as palette evidence.

The shared system separates measured/source observations from Clarity translation defaults:

| Element | Cursor reference | Prototype rule |
| --- | --- | --- |
| Content and editor tabs | Dark editor `#181818`; inactive tab strip `#141414`; active tab matches editor; `tab.border` is `#F0F0F013`; transparent active top border | Flat adjacent 35px tabs, 13px labels, no rounded selected pills or bright underline, compact independent close controls |
| Agents shell | Lifted navigation surface, compact rows, soft selection, restrained icons and borders | Sidebar `#222222`, document area `#181818`, 5px row/control corners; all module navigation shares one implementation |
| Light theme | Sidebar/tab strip `#f3f3f3`, content `#fcfcfc` | Explicit readable foreground, hover, selection, input and button pairs |
| Pane hierarchy | Title/header separators join pane dividers | Shared header bottom separator connects file tree, settings, mail and context boundaries; no floating vertical line below a borderless header |
| Hover, selection, focus | Neutral pointer feedback; compact focused controls | Hover changes a surface, selected state is persistent, keyboard focus is a single 1px indicator; pointer-restored action focus does not draw a ring. Todo title keyboard focus belongs to the whole row, not a large inner text rectangle |
| Density | Small system typography and line icons; 10px editor-tab leading padding in source | 4px spacing rhythm, 12–13px content controls, 20px page titles, 14–16px line icons; reading columns stay bounded |
| Motion | Workbench CSS includes 150ms background/opacity/color transitions; not every element animates | Delegated durations: 120ms hover, 160ms panel/dialog entrance, 220ms sidebar/task movement; `cubic-bezier(.2,.8,.2,1)`. No continuous decoration outside active playback/loading |
| Reduced motion | Accessibility constraint for the prototype | System preference and Settings → Appearance → Reduced suppress CSS and scripted transitions; state changes remain immediate and legible |

The secondary sources are [VS Code views](https://code.visualstudio.com/api/ux-guidelines/views), [VS Code webviews](https://code.visualstudio.com/api/ux-guidelines/webviews), and [ChatGPT optional plugin UI guidance](https://developers.openai.com/plugins/concepts/ui-guidelines). The adopted principles are consistent icons and contextual actions, restrained type variation, system fonts, predictable spacing, and keyboard accessibility. The ChatGPT source describes partner UI guidance, not an exhaustive specification of its internal desktop application. No reference authorizes adding unrelated features.

**User-required compactness; delegated sizing defaults:** desktop shell header 44px; navigation rows 28px; file rows 26px; standard controls 26px; page inset 20px vertically/24px horizontally. Todos and News use 36px rows, Expenses and Songs 44px, Bookmarks 56px, and Mail 76px. Reading text retains its body size and bounded line length. News combines search/source controls and places each headline, source and date on one desktop line; narrow screens use a 48px two-line row. Fourteen synthetic prompts populate the list. Mail pages contain up to ten messages. Music uses a smaller adaptive cover grid and 64px desktop transport; its close control remains available on narrow screens, dismisses the player and stops playback, and selecting Play restores it. Automations use compact rows with an inline enable switch, rather than large framed cards with separate footers. Calendar hours use 44px, with a full 24-hour internally scrolling grid that fills the remaining page height without a second outer vertical scrollbar.

Expense totals and individual amounts share the same right content edge and tabular numerals; no hidden trailing icon reserves extra space. List separators are independent 1px pseudo-elements, not a bottom border bent around a rounded row. Bookmarks, News, Mail, board topics, Songs and Automations hide both adjacent separators on hover, focus, press or selection, and omit the trailing separator. Shared list, task, expense, file, collection and palette rows have a 2px gap so neighboring interaction surfaces remain distinct; separators sit in that gap. Editor tabs retain their connected geometry and use the same adjacency rule with inset vertical separators. Hover feedback and separator opacity use the shared 120ms transition, suppressed by reduced motion.

Checkboxes retain native input semantics with a 15px control and a centered 11px SVG mask for the checked mark; switches use their own treatment. Native selects use a shared 12px SVG chevron, centered vertically and inset 8px from the right, with 28px reserved text padding and theme-specific strokes. The compact composer uses a 4px inset. Dialog text/select/time fields share a 34px height. These are delegated geometry defaults, not measurements of every Cursor control. The [compactness and controls run](../verification/runs/2026-10-01T083600Z-cursor-density.md) records actual browser geometry, control behavior and inspected screenshots.

Clarity retains modules above recent chats, Settings below, shared data across conversations, read-only Wiki, and module-specific scopes. No IDE terminals, repositories, upgrade prompts, or coding-project machinery is imported. Cursor's entire design system has not been exhaustively audited; the documented surfaces ground this adaptation.

### Prototype behavior and limits

All eleven optional/navigation modules are enabled for this user-requested walkthrough, alongside Chat. Production's Chat/Notes/Todos/Wiki default remains unchanged. All records are synthetic and every module is populated.

| Surface | Working sample interactions |
| --- | --- |
| Chat | Recent/new conversations, saved drafts, source panel, removable Notes/Wiki context, Agent/Ask, scripted response/Stop, task proposal Apply/Dismiss and Todo item links |
| Notes | Folder groups/collapse, search, tabs, create/rename, autosaved Markdown source and preview, new folders, Trash/restore; closing every tab leaves a selectable empty editor |
| Todos | One list, optional dates, add/edit, complete/uncomplete, filters, cancel and confirmed delete; animated reorder with focus retained |
| Wiki | Topic tree/search, reader, Ask in chat without losing the existing draft; reviewed automation updates change the same page |
| Calendar | 24-hour Week grid and Month grid, previous/next/Today, event create/edit/delete, date/time double-click entry and dated Todo links; overlapping visible events share the column |
| Expenses | Date groups/totals, integer minor-unit digit entry, category/history suggestions, draft retention, create/create-another, edit/delete and search |
| Mail | Read-only sample inbox, plain-text message reader, local search, paging, selected-message retention and simulated refresh |
| News | Sample reading prompts linked to source websites, source filtering/search, add/remove source and simulated refresh; no article-reader expansion |
| Bookmarks | Title/URL/description/tags, local/import source labels, add/edit/delete, tag/search filtering and external links |
| Music | Home, Albums, Playlists, Artists, Songs; source filter and search, collection detail/back navigation, list/grid where applicable, queue/transport, seek/volume/shuffle/repeat and a dismissible shared player |
| Agent board | Populated threads/replies, search including replies, local new topics/replies and source links; no task-board or editing/deletion expansion |
| Automations | Populated schedules/history, create/edit/delete, enable/pause, simulated Run now, local review/dismiss/apply and Wiki result navigation |
| Settings and navigation | Appearance/motion, all module toggles, sample connection information, shortcuts/About/reset, workspace menu, responsive sidebar, command palette spanning modules and content |

Music uses original procedural cover art and an original synthesized audio preview. Spotify/Navidrome labels describe fictional catalog fixtures, not connected providers. News headlines are synthetic reading prompts, not claims about current published articles. Mail is fictional correspondence. About and Settings explain these boundaries; repetitive prototype/storage/ownership labels were removed from normal working screens.

Music detail navigation uses one native Back button containing both the chevron and the visible Albums, Playlists, or Artist label. Clicking either part invokes the existing history action; nested album navigation still returns to the artist first. Shared text-button styles provide hover and keyboard focus, and Enter/Space activate it. This fixes the reported unclickable Albums text without changing playback or history behavior. The [focused Back-control run](../verification/runs/2026-10-01T121353Z-music-back.md) verifies these interactions in an isolated browser at desktop/mobile widths and records current served source hashes.

`localStorage`, under `clarity-cursor-spike-v1`, owns the sample workspace. Version-2 hydration adds the new collections without replacing previous notes, tasks or chats, and enables all modules once for the expanded walkthrough. A separate density revision appends the extra News prompts once and rescales a saved Calendar scroll offset; it does not re-enable modules or overwrite existing records. Reload retains edits, draft/context, preferences and selections, and pauses audio. Prototype routing retains the selected module rather than the production cold-start chat rule. Reset is separately confirmed.

No model requests, real accounts, actual user files, background scheduler, OAuth, production action catalog, full GFM rich editor, or production permission machinery is connected. Notes remain source editing with a bounded preview. Automation actions are local deterministic demonstrations. Integration compatibility and production feature acceptance cannot be inferred from this spike.

### Source and reproduction

All executable source remains external at `~/Desktop/Projects/clarity-spikes/2026-10-01-cursor/`, without dependencies or package-manager files. `app.js` owns shared state, shell, core views and actions. `modules.js` and `music.js` implement the extended views; `data.js`/`fixtures.js` supply sample records and migration; `ui.js` supplies escaped markup/icons/preview; `style.css` plus `design.css` own presentation and `motion.js` owns motion/input modality. `index.html` boots the application. `server.mjs` serves exactly ten browser assets on loopback with no-store headers and a restrictive CSP; unknown paths return 404. No reference files or verification data are served.

Run `node ~/Desktop/Projects/clarity-spikes/2026-10-01-cursor/server.mjs` with Node 22+, then open `http://127.0.0.1:4318`. `CLARITY_SPIKE_PORT` selects another port; storage is origin-specific. Stop a terminal-launched server with Ctrl+C. Closing the browser does not erase the sample data. The wiki remains an offline build.

The preview runs as the temporary macOS login-session job `local.clarity.cursor-spike`, submitted with `launchctl submit` using the resolved Node executable and external `server.mjs`. Inspect with `launchctl list local.clarity.cursor-spike`; remove with `launchctl remove local.clarity.cursor-spike`. Logs live alongside the spike. No launch-at-login plist is installed; logout/reboot persistence is not configured. Restart the job after changing its allowlist; ordinary asset edits are served directly. This lifecycle corrects the original tool-owned server that ended after handoff.

### Verification recipe and history

**FEAT-shared-ui experimental scope:** open every module through the real sidebar and confirm populated content. Exercise create/edit/cancel/delete where exposed, digit-buffer expense entry, Mail paging/search, News source changes, Bookmark tags, Music collection/source/transport, board topic/reply, and automation review with the resulting Wiki text. Exercise Chat task approval, note/draft persistence and Wiki handoff. Observe DOM and stored records together, then reload. Check keyboard palette, sidebar and focus return, pointer versus keyboard focus, tab switching/closing, pane divider geometry, expense amount/total right edges, News visible row count, two-sided separator hiding, Light/Dark, Reduce Motion, and desktop/narrow layouts. Inspect checkbox/check and select-chevron centering in the Automation form; change and cancel native selections. Place hover immediately beside a selected Song and verify a 2px gap without adjoining separators. Check Music close/reopen at desktop and 390px, and that Week has only its internal vertical scrollbar. Confirm the independent server and every served asset hash. Screenshots prove appearance only.

The [initial browser run](../verification/runs/2026-10-01T060000Z-cursor-spike.md) retains the smaller first version and recovery evidence. The [expanded-module run](../verification/runs/2026-10-01T071700Z-cursor-all-modules.md) preserves intermediate interaction evidence and its then-pending visual checks. After explicit browser handoff, the [compactness and controls run](../verification/runs/2026-10-01T083600Z-cursor-density.md) passed its selected scenarios, including aligned glyphs and separated adjacent states, with final source identity and retained screenshots. These reports do not certify production integrations.

## Source preview and navigation example · 1 October 2026

**Purpose:** satisfy the user's Q8C request for a concrete context-panel example during the [adoption interview](../journal/2026-10-01-command-navigation.md). The user subsequently accepted the example and history scope, with a resizable pane and compact module-open button, under [D121](../decisions/index.md#d121-source-inspection-preserves-chat-1-october-2026). The [follow-up journal](../journal/2026-10-01-preview-controls.md) records that acceptance.

**Reviewable example:** open `http://127.0.0.1:4319`. A fictional conversation contains two source types: a note and a Todo. Source buttons preview the item beside Chat, preserve the draft and do not create app-history entries. “Open in Notes” or “Open in Todos” explicitly switches the main view. Back/Forward traverses those view changes and restores the conversation, open preview and scroll position; it does not undo edits or messages. Closing the preview keeps Chat active and returns focus to its trigger. The panel starts closed. This is an interaction example, not a general model-context inspector.

The source pane resizes from its left divider. Pointer capture follows the drag, suppresses selection and removes grid animation while dragging. A 1px boundary has an 8px hit target and restrained hover feedback. The focusable vertical separator exposes its current width and range; Left/Right move the divider 16px, Shift uses 40px steps, and Home/End reach the limits. Width starts at 344px, clamps to 280–640px while leaving at least 400px for Chat, and is retained through close/reopen and history for this page session. Below 761px the pane overlays Chat and clamps to 92% of the viewport. Window resize updates the range. These sizes are delegated example defaults. The module-open action is now a content-width, 28px-high shared secondary button, aligned to the footer's end.

The source is external at `~/Desktop/Projects/clarity-spikes/2026-10-01-navigation-review/`: `index.html`, `style.css`, `app.js` and `server.mjs`. It uses fictional inline content, page-session memory, a local-only composer demonstration and no model/provider/file calls. Notes/Todos destinations are read-only fixture views. There is no storage/reload persistence, parser, full module suite or real edit path in this narrow example. The existing all-module spike remains at port 4318.

Run `node ~/Desktop/Projects/clarity-spikes/2026-10-01-navigation-review/server.mjs` on Node 22+ and open port 4319. The server binds loopback, serves exactly three browser assets with no-store, and returns 404 otherwise. The temporary login-session job is `local.clarity.navigation-review`; inspect with `launchctl list local.clarity.navigation-review`, stop with `launchctl remove local.clarity.navigation-review`. No login plist is installed; logout/reboot requires a restart. Logs remain beside the external source.

**FEAT-shared-ui / FEAT-chat example recipe:** enter an unsent draft, open a source from a scrolled conversation and observe Chat plus preview. Drag the divider both ways and past its limits; use Tab and arrow/Home/End keys to verify focus and bounded values. Check the compact action's geometry. Close/reopen, record width/scroll/draft, open the named module, then use Back/Forward and compare the restored state. At 390px, drag the overlay and check for page overflow; restore the desktop viewport. Inspect the screenshot and served-source hashes. The [initial source-preview run](../verification/runs/2026-10-01T121000Z-source-preview.md) retains the original navigation evidence. The [resize/control run](../verification/runs/2026-10-01T122900Z-preview-controls.md) passes the changed controls and selected retention paths, with the browser console caveat recorded. Neither run verifies production navigation.

## Earlier runtime experiments · September 2026

**Dated research, not the current rebuild contract.** The observations below describe the inspected revisions and experiments at their stated dates. Later implementation choices and app validation are in [Implementation and validation](implementation.md); unresolved work is in [Current follow-up](../discussions/open-questions.md). Historical statements that integration, storage, or packaging were undecided do not reopen those choices.

The user authorized throwaway experiments while explicitly keeping Clarity in planning ([D101](../decisions/index.md#d101-disposable-spikes-without-starting-clarity-28-september-2026)). These results validate individual pieces, not a completed integration or permission to start the application.

## Results

| Area | Observed result | What remains unproven |
| --- | --- | --- |
| Codex subscription through Pi | Three real requests succeeded using the existing local ChatGPT sign-in. Pi streamed text, executed a fixture tool, and resumed a saved transcript with another model and effort level. | Fresh login, token refresh, integration with upstream's model router, and long conversations. |
| Local Worker storage | A SQLite-backed Durable Object retained its fixture value after the runtime was disposed and recreated. | Full upstream storage inventory, migration, backup, abnormal termination, and sleep/wake. |
| Actual Markdown files | A Worker called a small Node host binding to read/write a real file. A stale version was rejected without overwriting the external edit. | Production conflict handling, atomicity, crash-safe saving, and UI preservation of unsaved drafts. |
| Electron lifecycle | Closing the last window left the backend running; reopening worked; explicit Quit stopped the listener and observed child processes. Data survived relaunch. | Real Dock/menu-bar interactions, application crashes, and sleep/wake. |
| Minimal app bundle | A self-contained fixture `.app` launched its bundled workerd with a system-only PATH and passed lifecycle/persistence checks. | Full Cloudflare OS packaging, a clean Mac, signing/notarization, other CPUs, and Linux. |
| Browser | Persistent browser state survived restart. Batched extraction substantially reduced local driver overhead. | End-to-end agent speed, Codex parity, authenticated websites, and an agent-browser comparison. |
| Browser approvals | An intentionally naive POST-blocking filter stopped one mutation but allowed a destructive GET behind a harmless-looking button. | A reliable implementation of the accepted browsing behavior. The test disproves this shortcut. |

## Setup and reproducibility

Tests ran on the user's macOS machine with Node 22.19.0. Source inspection used Cloudflare OS revision `32ce152654e8a205b54e094e31be932c620dbc52`, newer than the prior research pin. Packages: Electron 44.4.5, Miniflare 5.20260921.1-alpha, Playwright Core 1.63.0, Pi AI and agent core 0.87.1 under `@earendil-works`, and esbuild 0.28.2. The browser test used installed Google Chrome with a separate temporary profile.

Disposable dependencies, app bundle, and fixture data live at `/private/tmp/clarity-spikes-20260928-h4I3Xg/lab`. Sources and non-secret result summaries were preserved at `~/Desktop/Projects/clarity-spikes/2026-09-28`, with reproduction instructions. Temporary files may disappear; the preserved folder contains no installed dependencies or credentials. No application scaffolding or package files were added to the Clarity workspace. Test processes were stopped after completion.

This was not a full upstream application launch. Its repository was cloned and relevant source inspected; the runtime experiments used small purpose-built fixtures with the selected dependencies. Current upstream's browser-runtime build script concerns export/rendering, not proof of an interactive browsing integration.

## Codex and Pi

First, the real Pi Codex SSE request encoder and stream parser were tested against injected HTTP fixtures. Checks covered streamed events, tool invocation and returned results, JSON transcript restoration, a different model/high effort on the next request, and blocking execution through Pi's `beforeToolCall` hook. That hook test does not establish that Clarity's upstream approvals are integrated.

Next, a live test read the existing Codex ChatGPT access token into memory and sent only fixture prompts to `https://chatgpt.com/backend-api/codex/responses`. It did not perform fresh login, refresh or overwrite the credential, copy it to the lab, or print it. No API key was used. Official documentation describes Codex's [ChatGPT authentication and credential storage](https://learn.chatgpt.com/docs/auth); the experiment, rather than that documentation, establishes this particular Pi request path worked.

GPT-5.5 called `read_fixture_note` once and streamed the expected marker. The tool returned a fixed artificial note, not private user content. The transcript was saved and loaded into a new Pi agent using GPT-5.6 Luna with high effort. It recalled the marker without another tool call. All three provider requests returned HTTP 200. The first tool-plus-answer turn took about 3.9 seconds; one tiny example is not a responsiveness benchmark or evidence of all account entitlements.

**Required adaptation:** current upstream's [model router](https://github.com/cloudflare/cloudflare-os/blob/32ce152654e8a205b54e094e31be932c620dbc52/packages/workshop-backend/src/ai-models.ts) imports four API stream implementations but does not include the Codex-specific provider route. Pi already supplies that provider; keeping Pi is supported by the experiment. Connecting credentials and the route to upstream is still work. No second agent loop or change to subscription billing is proposed.

## Local state and real files

Miniflare's current configuration differs from older examples. The initial fixture used the V4 conversion helper with `durableObjectsPersist`; inspection showed that the converted configuration did not retain that setting, and the restart test returned an empty store. Setting the V5 `resourcePersistencePath` explicitly corrected the fixture, after which restart persistence passed. This is a test setup finding, not evidence that upstream itself loses data.

A Worker using `node:fs` could not read the host note directly; it returned `ENOENT`. A narrowly scoped Miniflare service binding implemented in Node could read and write the actual Markdown file. This demonstrates the need and feasibility of a host file bridge without substituting database-only content.

The fixture compared a content hash before writing. An external edit between reading and attempting to save produced a conflict response, preserving the newer file. Static path traversal and an existing symlink outside the fixture root were rejected. **Limits:** the read/check/write sequence is not atomic against a simultaneous external editor; symlink replacement races and crash-safe writes were not solved. This small example is not a production filesystem boundary. The accepted preservation of unsaved human work still requires editor behavior and a deliberate conflict path.

## Electron and packaging

Electron hosted Miniflare in its main process; Miniflare launched workerd. A hidden, sandboxed fixture window could close without stopping the runtime. Reopening did not restart the backend. Explicit Quit awaited runtime disposal, and the listener and observed descendants exited. A subsequent application launch recovered the saved value.

The packaging follow-up copied the Electron app template and included the fixture entry point plus its own Miniflare/workerd dependencies. The app launched from `/private/tmp` with `/usr/bin:/bin:/usr/sbin:/sbin` as PATH, empty Node module/options overrides, and a data root outside the bundle. The test verified that the workerd executable came from inside the app bundle. This reduces the concern about requiring a user-installed Node runtime; it is not equivalent to testing on a fresh machine.

Observed development startup was about 1.4 seconds, with a 0.8-second relaunch. Packaged startup was about 2.4 seconds, with a 0.9-second relaunch. These are individual instrumented runs with hidden windows, not production startup benchmarks. The five-process trees had summed resident memory of roughly 366–440 MiB; summed RSS can double-count shared pages and is not exact physical memory use. The unoptimized fixture bundle occupied about 472 MiB on disk. These numbers justify measuring resource use as integration proceeds, not silently switching the accepted stack.

Upstream's [run-local script](https://github.com/cloudflare/cloudflare-os/blob/32ce152654e8a205b54e094e31be932c620dbc52/scripts/run-local.ts) performs dependency installation and builds before starting its development server. The packaged fixture did not package that script or the full application. A lean shipped launcher still needs prebuilt upstream assets and runtime configuration, without invoking a development install on each launch.

## Browser speed and approvals

On a controlled localhost page, a new Chrome process/profile context launched in about 2.1 seconds and the first navigation took about 234 ms. Across twelve trials, reading twenty headlines through separate driver calls had a median of 14.7 ms; one batch extraction had a median of 1.3 ms. Returning the relevant main content produced 607 characters versus 9,607 for the whole body. Browser local storage survived closing and reopening the persistent context.

This measures driver/extraction overhead on a simple fixture. It includes no model decisions, remote-site latency, real sign-in, or Codex comparison. It supports the chosen batching/focused-results direction but does not establish end-to-end speed parity. Keeping the browser warm avoids repeating launch work; it also retains browser processes and their memory.

The approval fixture deliberately blocked non-GET requests until an approval flag was set. A Send button was blocked, but a View statement button caused a mutation through GET and passed the filter. Button wording and HTTP method are therefore insufficient to classify consequences. Page scripts can also cause side effects independently of a requested click.

**Concern to resolve, not a new decision:** the accepted smooth browsing behavior cannot be promised as a universal read-only guarantee for arbitrary websites using a tiny generic filter. The simplest practical proposal is an agent instructed to stop before consequential or ambiguous actions, connected to upstream approval machinery, while openly acknowledging that this is not a complete technical sandbox. Stronger guarantees would need narrower supported actions/site integrations or more restrictive interaction. The user has not selected that tradeoff, and no new permission framework has been adopted.

## Next useful experiments

1. Exercise the full pinned upstream local application with the Codex route and real-file binding, keeping all changes disposable. This would test whether the small adapters compose with its storage and approvals.
2. Validate fresh sign-in and refresh without disturbing the working Codex login; an interactive account step may be needed. Test cancellation, long/resumed histories, and failure recovery through the actual route.
3. Run matched browser tasks against the user's Codex reference and agent-browser, separating model time, browser time, observations, and approval waits. Resolve the approval guarantee before building a large enforcement layer.
4. Test a complete package on a clean Mac, including sleep/wake and abnormal shutdown. Do not confuse the small bundle result with distribution readiness.

These are follow-ups, not newly accepted product scope or a claim that Clarity implementation has begun.
