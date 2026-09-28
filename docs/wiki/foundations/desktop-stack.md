---
title: Desktop stack exploration
section: Foundations
status: Exploring
updated: 2026-09-29
order: 60
summary: Local Cloudflare OS, Electron, actual Markdown files, Pi, stable modules, and upstream approvals.
---
# Desktop stack exploration

## Application implementation · 28 September 2026

The user has now authorized implementation and safe lean defaults (D102). The working app selectively adapts Cloudflare OS's scheduler and approval contracts, with Electron/TypeScript, local workerd/SQLite, real Markdown files, and Pi. It does not run the complete upstream application. The macOS arm64 bundle now passes relocation, standalone dependency, signature and persistence checks. The earlier comparisons below remain historical. See [implementation progress](../references/implementation.md) for the exact reuse boundary and application tests; the sections below preserve the earlier architecture investigation.

## Runtime evidence · 28 September 2026

[Disposable tests](../references/technical-spikes.md) now support the core local-runtime, real-file bridge, Pi/Codex, and Electron direction. A minimal app bundle also passed; the complete upstream application remains untested. Browser approval enforcement and concurrent file edits require explicit design care. This is evidence, not a new stack decision. D101 authorizes further disposable investigation while product implementation stays on hold.

## Current direction · 27 September 2026

**Accepted:** Cloudflare OS with Electron/TypeScript, backend running locally for now, real Markdown notes/wiki files, the upstream Pi agent, one stable maintained module instance per user, and upstream approval behavior. Terminals are removed. See [D56](../decisions/index.md#d56-local-backend-27-september-2026) through [D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026).

Electron is the desktop app; Cloudflare OS still uses its Workers runtime locally. The user's choice settles location, not the packaging implementation. Sources: [upstream runtime documentation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md) and [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model).

### Remaining work and questions

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

### Evidence and limits

Sources: [blueprints](https://github.com/cloudflare/cloudflare-os/blob/main/docs/blueprints.md), [agent source](https://github.com/cloudflare/cloudflare-os/blob/main/packages/workshop-backend/src/agent.ts), [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-spotify/README.md), and [Scheduler](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md). Earlier source review used revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`. The runtime/Spotify docs were rechecked on 27 September. At that review, runtime packaging, authenticated import, playback, file bridge, and data migration had not been tested. The later [disposable spikes](../references/technical-spikes.md) add limited runtime, packaging, and file-bridge evidence; imports, playback, and migration remain untested.

## Historical exploration · 26 September 2026

The remaining sections preserve the sequence leading to this direction. Statements such as “no stack selected” and terminal proposals describe that earlier discussion.

## User direction

On 26 September the user opened framework and language comparison, expressing a preference for Rust and GPUI while remaining open to Electron, SwiftUI, and other feasible options. They are less confident with SwiftUI. They dislike xterm.js and prefer exploring libghostty or Alacritty for terminals. These are preferences, not a selected stack. [D52](../decisions/index.md#d52-terminal-spaces-and-stack-preferences-26-september-2026) records the direction.

Keep the whole application in view: macOS first with a Linux route, rich-text Markdown notes, an HTML wiki webview, chat, ordinary module screens, music playback, and embedded terminals. LangChain already owns the assistant loop under [D50](../decisions/index.md#d50-langchain-runs-the-assistant-26-september-2026). Research does not authorize implementation.

## Comparison

The fit assessments below are assistant judgments based on inspected documentation and chartr source, not runtime benchmarks.

| Candidate | Fit for Clarity | Material cost |
| --- | --- | --- |
| Rust + GPUI | Matches the user's language preference and native terminal direction. Chartr provides an existing macOS/Linux integration reference. | A complete terminal view still needs selection. Rich Markdown editing and native webview focus/layering need validation. LangChain requires a separate supported-language runtime. Reusing broad Zed components reduces custom code but increases dependency and maintenance scope. |
| Electron + TypeScript | Web UI suits chat, the HTML wiki, forms, and existing web editor components. LangChain JS can use Electron's Node runtime. | Bundles Chromium and Node. Native terminal embedding is a separate integration problem; cannot assume the familiar xterm.js route given the user's preference. A Ghostty-based browser frontend would need its own evaluation. |
| SwiftUI + AppKit | Strong macOS fit. Ghostty's macOS app is an existing Swift/native terminal reference. | Adds the user's Swift learning burden and a LangChain helper runtime. SwiftUI targets Apple platforms; a Linux UI would be a separate effort. Native terminal integration still needs work. |
| Tauri + Rust + web UI | Additional candidate: Rust backend with system webviews, naturally suited to the HTML wiki and web editors. | A system webview is not a native terminal widget or a Node runtime. Native terminal integration and a LangChain helper remain; multiple boundaries can outweigh the smaller browser distribution. |

Primary framework sources: [GPUI](https://gpui.rs/), [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model), [SwiftUI](https://developer.apple.com/swiftui/), and [Tauri architecture](https://v2.tauri.app/concept/architecture/). Electron's bundled runtime and Tauri's use of system webviews are architectural differences, not measured Clarity performance results.

## Terminal embedding

A **PTY** is the operating-system connection that lets a shell behave interactively. Terminal emulation interprets its output; the terminal view handles drawing, selection, keyboard input, resizing, and related interactions. A good emulation library is not automatically a complete embeddable widget.

- **libghostty:** upstream now documents usable C/Zig embedding libraries and examples. Its public `libghostty-vt` parses terminal sequences and maintains state; it does not supply a GPUI view. The inspected README says API signatures are still changing and no libghostty version has been tagged. Do not confuse Ghostty's mature desktop app with a version-stable, ready-made Clarity integration. [Upstream README](https://github.com/ghostty-org/ghostty/blob/main/README.md).
- **Alacritty:** `alacritty_terminal` exposes terminal state, grid, selection, and PTY I/O. It is useful Rust infrastructure, not a complete GPUI widget. [Crate API](https://docs.rs/alacritty_terminal/latest/alacritty_terminal/).
- **Zed's complete terminal stack:** local chartr's ADR 0004 records reuse of the terminal model plus `TerminalView`, avoiding a separately maintained renderer/input path. Its dependency graph includes Zed's Alacritty fork. It explicitly accepts more dependencies and source-vendoring upkeep. This is a concrete GPUI route to examine before attempting a custom frontend around either engine.

Chartr's ADR 0002 also records component licensing distinctions; reuse boundaries need inspection if copying code. This research has not selected a library or audited the complete dependency graph.

## LangChain and a Rust or Swift application

LangChain's documented implementations include [Python](https://docs.langchain.com/oss/python/langchain/overview) and [JavaScript/TypeScript](https://docs.langchain.com/oss/javascript/langchain/overview). Selecting it does not select the desktop UI language, but a Rust or Swift UI needs a connection to one of those runtimes.

One proposed arrangement is a small local helper process started by Clarity. The UI sends a request; the helper runs LangChain's model/tool loop and streams events back. It can communicate over process pipes, without introducing an HTTP server or an always-running service. Packaging, cancellation, restart behavior, and permission enforcement across that connection are real work. Python versus TypeScript remains undecided. Electron can use LangChain JS in its Node environment, avoiding an additional language runtime while still retaining UI/backend separation.

## Current recommendation and open checks

**Assistant proposal:** prioritize Rust/GPUI for further evaluation because it matches the user's preferences, with Electron as the comparison for reducing web UI and LangChain integration work. Tauri is worth considering but is not automatically simpler once native terminals and LangChain are included. SwiftUI is less aligned with the Linux goal and the user's experience.

Before choosing GPUI, establish a maintainable route for three existing requirements: the complete terminal view, rich-text Markdown editing, and the HTML wiki webview. Chartr already uses Wry, but ADR 0005 and its manifest show platform-specific work for child-webview layering; embedding is possible, not free. A source editor or Markdown preview alone does not satisfy the agreed rich-text notes experience. Music playback/runtime fit must also be checked once a playback route is narrowed.

No app or prototype was run, no performance claims were measured, and no framework was selected. Herdr, session lifetime, and traces are separate decisions on the [terminal page](../features/terminals.md).

## Electron and TypeScript obstacles · 26 September 2026

The user asked what would obstruct choosing Electron/TypeScript. **Assistant assessment:** it is a plausible way to reduce whole-app implementation work. Chat, forms, the wiki reader, and web editor integration fit its UI model, and LangChain JS can run in its Node environment. This does not select Electron, a UI library, an editor, or storage.

### Terminal experience is the largest preference-dependent obstacle

An embedded native Ghostty/Alacritty view would need integration with Electron's window, focus, input, resizing, and view layering. A Node native binding can expose an engine but does not by itself embed a complete native terminal view. No ready-made native integration meeting Clarity's needs has been established in this research.

There is another candidate: [Coder's ghostty-web](https://github.com/coder/ghostty-web). Its README describes a Ghostty parser compiled to WebAssembly, with an xterm.js-compatible API. The inspected [renderer source](https://github.com/coder/ghostty-web/blob/main/lib/renderer.ts) uses a browser 2D canvas. API compatibility does not mean it uses xterm.js internally; using Ghostty parsing does not mean it shares Ghostty's native renderer or identical behavior.

**Proposal:** investigate ghostty-web with a local PTY backend before attempting native view embedding. [node-pty](https://github.com/microsoft/node-pty) is an existing Electron-compatible PTY candidate, separate from the renderer. Electron's process messaging could carry terminal data without a localhost web server; the project's WebSocket demo is not a required architecture.

This is promising, not validated. Check actual CLI-agent redraws, keyboard input/IME, selection/copy, resizing, scrollback, and sustained output before judging it robust. The user has not accepted browser rendering as satisfying their native-terminal preference. If native rendering itself is essential, Electron's terminal path becomes substantially more bespoke.

### Other costs

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

### Refined assessment

The earlier GPUI-first recommendation prioritized the user's Rust/native preference. If reducing implementation work across all modules is the priority, Electron/TypeScript may be the stronger fit, **provided the terminal experience is acceptable**. ghostty-web gives us a concrete alternative to investigate; it is not an accepted substitute for native rendering. Spotify playback is the other early feasibility check. No dependency installation, terminal test, account connection, playback test, or application build occurred.

## Building on Cloudflare OS · 26 September 2026

The user asks whether to fork Cloudflare OS, either following its extension model and accepting tradeoffs or extensively altering it. This is exploration, not authorization to fork, deploy, build Clarity, or replace accepted requirements. Findings below come from upstream revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`; no runtime tests were performed.

### What the platform would give us

Cloudflare OS provides agent chat, model integrations, application execution, connection management, and action review. Its extension units are **gadgets**, small apps with UI, server code, and their own state. **Blueprints** are templates for creating gadgets. **Gatekeepers** mediate access to services. These could save substantial integration and agent-platform work if we adopt the surrounding model, rather than extracting each piece.

The [blueprint system](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/docs/blueprints.md) supports shipping custom templates, including a separate bundled-blueprint directory. This is a concrete route for adding modules with fewer core modifications. It does not automatically provide the exact persistent module sidebar, canonical shared module data, or HomeOS screenshot UI; those need verification or custom work. The HomeOS X collector has not been located.

### Material differences from our plan

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

### Three approaches — assistant assessment

| Approach | Benefit | Cost and recommendation |
| --- | --- | --- |
| Follow the platform | Keep the runtime, existing agent, storage, and connector interfaces. Add Clarity gadgets/blueprints and limited navigation changes. Most plausible way to benefit from upstream work and updates. | A credible option if the user accepts platform-shaped state and agent behavior, and cloud hosting or a separately engineered local workerd distribution. Define one canonical instance per module or equivalent shared data access so chat does not create fragmented task lists or knowledge bases. |
| Extensively rewrite the fork | Retain useful UI and behavior while replacing internals to fit Clarity exactly. | Replacing runtime, storage, agent loop, and approvals together is likely to consume much of the saved effort. We would learn the old system, build its replacement, migrate data/contracts, and maintain divergence. Upstream is explicitly early access and changing. Not recommended as the default lean path. |
| Build a small Clarity app and selectively reuse | Preserve local desktop ownership and LangChain, drawing on the platform's UI patterns and narrowly reusable code. | Less functionality on day one and no automatic inheritance of upstream fixes, but fewer conflicting architectural assumptions. Inspect dependencies before copying: much connector code expects platform RPC/storage. Recommended if the current local desktop and learning requirements remain central. |

Heavy visual customization or new modules is different from replacing the execution platform. A sustainable fork boundary could keep upstream core intact while owning Clarity templates, connectors, and navigation. The more foundational parts we replace, the less useful the fork becomes as a shortcut. Merely removing a layer can also break guarantees relied on elsewhere; changes need dependency-level review rather than wholesale deletion.

**Current recommendation:** consider the platform-aligned fork seriously as an alternative product direction; do not assume an extensive rewrite is leaner than a small new app. First decide whether Clarity must remain a local desktop app with local terminal/folder access, and whether LangChain is a durable requirement or a learning choice the user would revisit. Existing decisions remain binding until explicitly changed.

If the user later authorizes an evaluation, bound it to one task-list gadget accessible from chat and one real local Markdown or PTY interaction. Check persistence/restart, module ownership, and permission behavior before extrapolating to all modules. This is a proposed evaluation, not work begun or permission to install dependencies. No effort estimate or robustness claim has been established.

## Remaining concern triage · 27 September 2026

**Updated:** D63 settles close/quit behavior and D64 chooses one data root. D66/D67 subsequently accept topic threads, module-method access, and reads only when instructed; posting triggers remain open. Recommendations are recorded on the [automations](../features/automations.md#lifecycle-proposal-27-september-2026), [portability](portability.md#folder-simplification-proposal-27-september-2026), and [agent-board](../features/agent-board.md#lean-board-proposal-27-september-2026) pages. The lifecycle, single-root, and board/interface directions are now accepted; exact posting and external-connection behavior remain open.

The technical risks to validate once implementation is authorized are:

- Local runtime packaging and restart with preserved data. Upstream still describes its quick local command as a development setup, not a production distribution. [Runtime documentation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md).
- Actual-file access and stale-write protection, including both UI and agent edits. Queued approval must not apply an obsolete file version over newer edits.
- Embedded Spotify playback in packaged Electron. Existing Connect control does not supply this. [Spotify connector](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-spotify/README.md).
- Whether upstream approval settings allow the intended scheduled updates and responsive music controls. The connector documents gated playback writes; inspect behavior before proposing changes. Adopted upstream approvals are not being reopened by speculation.

X refresh, module upgrades, and persistent shared module bindings also remain untested. These are implementation checks, not reasons to ask the user to choose internal libraries. Rechecked upstream runtime, Spotify, and Scheduler documentation on 27 September; no live runtime or account tests occurred.

Provider/access setup and first-release scope remain open, but need not be resolved as part of every module discussion.


## Proposed first-version validation order · 28 September 2026

The user asked for elaboration on the next steps. This section preserves the assistant-proposed investigation plan from that explanation-only turn. D101 later authorized disposable runtime spikes; [their results](../references/technical-spikes.md) supersede its source-review-only boundary, without authorizing Clarity implementation. The plan itself introduced no new research findings. Product behavior is sufficiently defined to investigate the foundational fit before adding more feature questions.

### First: the chosen Codex subscription through Pi

Trace the path from sign-in through the local backend to Pi model requests, streamed responses, tool calls, and saved conversation state. Establish which parts already exist in the pinned upstream versions and which require a desktop adaptation. Check model/effort selection, supported attachment input, cancellation, and reconnection without changing the subscription decision or introducing a second agent loop.

Source review can identify the available provider/auth interfaces and missing plumbing. Only a later authorized live test can demonstrate that the user's actual account works end to end. The success case is one signed-in chat that streams a response, performs a simple module action under the intended approvals, and reopens with preserved history. Do not inspect credentials or begin login simply to elaborate this plan.

### Second: local desktop operation and real files

Map what Electron must start, which backend processes must stay alive after window close, and what explicit Quit must stop. Identify every persistent store and how its location is assigned beneath the chosen data root. Find any operation that still needs a remote service; local backend execution does not mean the model and web work offline.

Inspect the smallest host interface for reading/writing actual notes/wiki files from the Worker runtime. A narrow file-access bridge should serve the accepted module operations, not expose a general filesystem shell. Include stale-write checks so an agent edit approved later cannot overwrite a more recent human save. Outline note autosave, wiki reader regeneration, and attachment/module-asset ownership without choosing a new storage framework by implication.

Later runtime checks should cover startup, close/reopen, explicit Quit, restart persistence, a changed external Markdown file, and an approved edit whose underlying file changed in the meantime. Packaging also needs validation on a machine without the developer repository or toolchain. No hosted deployment or independent background service is proposed.

### Third: browser execution and approval boundaries

Trace where the existing approval machinery can support D97 and where adaptation is required. Browser commands should combine short known sequences and return focused results while stopping before consequential operations. A generic click or arbitrary script cannot be classified safely from its name alone; this is the principal complexity to surface rather than hide behind a promise of a tiny wrapper.

Evaluate a narrow adaptation using existing browser controls and upstream review. If maintaining the accepted behavior needs a larger permission subsystem, explain that finding and the smallest viable tradeoff before adopting it. Site authorization scope/duration remain design details. Hosted search availability is a separate integration question from browser performance.

Later comparison should test successful tasks, latency, model turns, approval waits, and memory against the user's Codex reference, keeping public research separate from signed-in browser operations. Driver selection alone cannot establish parity.

### What the next research report should deliver

For each area: what can be reused unchanged, the smallest required adaptation, concrete unknowns, and a narrowly scoped runtime test needed to resolve them. Start with subscription integration and local runtime/file access because they affect the entire first version. If either undermines the lean premise of the fork, raise the finding rather than silently replacing Pi, the runtime, or the accepted file model.

Once the user requests implementation, the proposed first working path is: launch locally, open the selected root, connect Codex, chat, perform a todo or real Markdown operation, and verify state after restart. This is an incremental validation proposal; chat, notes, todo, and wiki all remain first-version priorities. At the time of that explanation request, only source inspection was authorized. D101 subsequently permits disposable prototypes and their dependencies outside the workspace, while application implementation remains unauthorized.
