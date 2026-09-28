---
title: Disposable technical spikes
section: References
status: Reference
updated: 2026-09-28
order: 90
summary: Runtime evidence for subscription access, local persistence, real files, Electron packaging, and browser limits.
---
# Disposable technical spikes

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
