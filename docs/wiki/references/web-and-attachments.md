---
title: Web browsing and attachment research
section: References
status: Exploring
updated: 2026-09-28
order: 10
summary: Source review of interactive browsing, persistent sign-in, and broad local attachments.
---
# Web browsing and attachment research

The user requested research before answering the [web and attachment follow-ups](../discussions/open-questions.md#fifth-question-round-27-september-2026). Findings below are observations and assistant recommendations, not new accepted scope or technology decisions.

## Assessment

**Approval update:** D97 now accepts routine browsing without per-click confirmation after site authorization, retaining confirmation for consequential actions. This explicitly changes the earlier unchanged-upstream preference for browser operations only; implementation and performance remain unvalidated. D100 resolves embedded attachment ownership with separate persistent module copies. Historical research below describes the upstream behavior and earlier proposals.

**Current decision:** [D92](../decisions/index.md#d92-playwright-with-batched-browser-actions-28-september-2026) accepts Playwright with batched actions, keeping agent-browser as the alternative to compare. Attachments are now defined by D93–D96: supported text/image/PDF-text analysis with unsupported-file notice, local originals below 30 MB, composer controls, and 90-day cleanup. Earlier pending proposals below are historical. The earlier research and proposals below are preserved; approval integration and speed parity remain unvalidated.

**Later direction, 28 September:** the user wants browsing to feel at least as fast as Codex while remaining lean, and requested recent X/Hacker News research. Attachment discussion is deferred. The [performance follow-up](#browser-performance-follow-up) refines the initial Playwright MCP recommendation below; no browser driver or approval change is selected.

Both capabilities are feasible, with different complexity. Saving arbitrary attachment types is straightforward; understanding every format is not. Interactive browsing has reusable implementations, but its fit with Cloudflare OS approvals is a material unresolved issue. Neither capability is supplied automatically by choosing the Codex subscription as the model connection.

Research was source/documentation inspection on 28 September 2026. No dependencies were installed, account connected, application built, or runtime compatibility/performance test performed. Cloudflare OS references are pinned to `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`; other upstream documentation reflects the inspected date.

## Web browsing

### What the current platform supplies

The inspected [web-fetch tool](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/web-fetch.ts) makes public HTTPS GET requests without forwarding credentials. It does not operate an interactive browser. Its document conversion invokes Workers AI, so running the backend locally does not make that processing local. Fetching a known address also does not itself supply web search.

Browser tools must be connected to the Pi loop explicitly. Searching through a browser is possible, but a dedicated search provider and its availability/cost have not been selected or validated. Do not assume the Codex subscription supplies the tools of the Codex application to an unrelated agent runtime.

### Reusable approaches

| Approach | Useful properties | Cost for Clarity |
| --- | --- | --- |
| Microsoft Playwright MCP with a managed browser | Existing page snapshots, interaction tools, persistent sessions, and HTTP tool endpoint. | Browser/process packaging, local endpoint connection, and the approval mismatch below. The browser would initially be a separate managed window. |
| Electron browser view with an automation bridge | Browsing can appear inside Clarity and use Electron's bundled Chromium. | More application integration: navigation, popups, downloads, login handoff, and coordinating human/agent control. |
| Vercel agent-browser | Existing command interface for browser operations; current implementation has a native Rust daemon. | Still needs Chrome and a host command bridge from the Worker runtime. It does not remove approval or lifecycle work. |

[Playwright MCP](https://github.com/microsoft/playwright-mcp) exposes a local HTTP endpoint and supports a dedicated persistent profile. Its extension can instead use an existing browser, but that introduces an extension dependency and profile state outside Clarity's folder. [Agent-browser](https://github.com/vercel-labs/agent-browser) documents Chrome discovery/installation and a native daemon that does not require Node or Playwright at runtime. Neither was benchmarked here; no speed or robustness ranking is established.

Electron's [WebContentsView](https://www.electronjs.org/docs/latest/api/web-contents-view) and [session.fromPath](https://www.electronjs.org/docs/latest/api/session#sessionfrompathpath-options) provide embedded web content and a profile at an explicit absolute path. Attaching automation is separate work: Playwright documents [lower fidelity when connecting through CDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp), the browser debugging protocol, than through its own protocol. These primitives do not make an embedded browser a drop-in MCP integration.

Local Synara source provides relevant prior art: `apps/desktop/src/browserManager.ts`, `browserAutomation/betterwrightRuntime.ts`, and `browserAutomation/betterwrightCdp.ts` combine Electron views with BetterWright and a custom debugging bridge. The inspected runtime also handles control leases, cancellation, background throttling, and uploads/downloads. Its desktop manifest pins BetterWright 2.7.3, with a repository patch. This is evidence of concrete integration responsibilities, not a recommendation to copy the whole subsystem or a verified portable library choice.

### The approval mismatch

Cloudflare OS's [generic MCP connector](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/gatekeeper-mcp/README.md) executes tools annotated read-only immediately. Other calls queue and reach the server only after approval. User-supplied endpoints cannot make writes auto-apply by claiming tool annotations. This connector also has no simulation for those actions.

Playwright MCP marks navigation, clicking, and filling forms as not read-only. Consequently, using that connector unchanged would interrupt ordinary interactive browsing for approval, including operations that merely move between pages. Reading the next page depends on executing the previous navigation, so collecting an entire browsing workflow as a speculative batch does not resolve this.

**Recommendation:** use Playwright MCP as the first integration candidate to validate, while treating approval flow as an explicit product tradeoff. Unchanged upstream approvals offer the smallest adaptation but can be cumbersome. Smoother browsing needs further approval-integration design and user agreement. Do not silently relabel all browser actions read-only or introduce a new permission framework.

The connector's development override allows local HTTP by disabling endpoint checks broadly. A packaged local integration should narrowly allow its own endpoint rather than adopting that global development switch by default. This is an integration detail to validate, not a new user configuration screen.

### Proposed lean browsing behavior

Use one Clarity-owned browser profile under the chosen data root. The user signs in there when necessary, and the browser retains the site's session. Reuse it for agent browsing; make it visible when manual login or interaction is needed. Login persistence is not a guarantee that every site works: expiry, multifactor authentication, CAPTCHA, and site restrictions can require human intervention.

For an initial implementation, serialize browser tasks instead of building parallel browser orchestration. This is an assistant proposal: concurrent conversations otherwise need coordination, and Playwright documents that separate browser instances cannot share one persistent profile simultaneously. Browser processes should follow Clarity's lifetime, including explicit Quit, rather than become an independent service.

## Attachments

### What needs changing upstream

The [validator](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-validation.ts) permits recognized text, supported images, and PDFs for selected providers, with a 1 MiB stored/upload limit per file. [Frontend preparation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-frontend/src/features/chat/composer/attachments/prepareChatAttachment.ts) caps the combined payload at 5 MiB and resizes images. Merely removing the file-picker filter will not make arbitrary files work.

The [PDF bridge](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-pdf.ts) rewrites inputs for particular API paths. That does not establish native PDF support through Clarity's intended Codex subscription connection.

Synara separates generic local file storage from model-native inputs. Inspected `apps/server/src/attachmentStore.ts` stores files, while `provider/attachmentProjection.ts` adds file paths to the prompt with instructions to read/extract using tools. A path reference is not file understanding. Clarity's Worker agent would still need an explicit local-file reading/extraction method; copying the prompt alone is insufficient.

### Proposed minimum

Keep the original file under the data root, with basic metadata and a chat reference. Prepare model inputs separately; do not replace the original with resized images or extracted text. Read only what the current request needs rather than injecting every attachment into every message.

| File kind | Proposed initial analysis |
| --- | --- |
| Plain text, Markdown, code, JSON, CSV | Bounded text reads with explicit reporting when only part was read. |
| Supported images | Prepare the selected model's supported image input while preserving the original. |
| PDFs with embedded text | Local text extraction, retaining page references; do not claim full layout or chart understanding. |
| Scanned PDFs, Office documents, audio, video, archives, other binaries | Keep attached; explicitly report when no supported reader is available. Add a format only when needed. |

Mozilla's [PDF.js Node example](https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs) demonstrates page-by-page text extraction. It is a plausible JavaScript option for PDFs without requiring a separate Python runtime. Text extraction alone does not read image-only scans or interpret diagrams; rendering selected pages for an image-capable model is a possible later addition, not an accepted requirement.

[Microsoft MarkItDown](https://github.com/microsoft/markitdown) covers many more formats, but requires Python and format-specific optional dependencies. It is worth revisiting if Office/audio analysis becomes essential; adopting its entire conversion stack now would increase packaging scope.

**Recommendation:** accept arbitrary file types for local storage, analyze the bounded set above, and clearly distinguish attached, analyzed, partially read, and unsupported. These can be ordinary attachment/message states, not a new management UI. Store limits and model-request limits should be separate; broad file types do not imply unlimited sizes. Exact limits remain undecided.

## Remaining validation

- Actual browser action/result flow through the local Cloudflare OS connector, including approval pauses and local endpoint access.
- Browser packaging, manual sign-in, downloads, restart persistence, and cleanup on explicit Quit.
- Text/image input through the selected Codex subscription connection and the local host-to-Worker file interface.
- Representative PDFs and unsupported files, preserving originals and avoiding false claims of complete analysis.

These are future implementation checks. The present research does not authorize a prototype or settle the two pending product choices.

## Browser performance follow-up

### What is documented about Codex

OpenAI distinguishes [hosted web search](https://learn.chatgpt.com/docs/web-search) from its [interactive browser](https://learn.chatgpt.com/docs/browser). Local Codex search normally uses an OpenAI-maintained index, with live retrieval configurable. Its speed is not a measure of a local browser clicking through search results. The browser has a separate profile and interactive page controls.

OpenAI's [June browser update](https://learn.chatgpt.com/docs/changelog#codex-2026-06-09-app) attributes an improvement of up to twice the speed to CDP and DOM snapshot optimizations that reduce browser round trips. CDP is Chrome's debugging/control protocol; DOM snapshots describe page structure. This is a product-reported improvement against its earlier version, not a benchmark against Clarity. The inspected documentation does not disclose enough of the implementation to identify an exact reusable engine or guarantee equivalent performance.

The current Codex manual was refreshed through the OpenAI docs skill. No internal/private implementation was inspected. The user's Codex subscription choice remains; the integration must not assume that a model sign-in automatically exposes the product's hosted search or browser tooling to Pi.

### Recent discussion and primary-source checks

Searches covered X and Hacker News on 28 September. X direct page retrieval was intermittently blocked or empty; the readable indexed X posts below are February–April, not September. Recent September evidence comes from HN timestamps and upstream releases. Do not describe older posts as fresh merely because their search crawl date is recent.

| Reference | Observation | Interpretation for Clarity |
| --- | --- | --- |
| [Playwright CLI discussion on X, 13 February](https://x.com/kei31/status/2022475473780117511), quoting a user of the CLI | Reports substantial token savings after moving from MCP. This is an anecdote, not an independently reproduced benchmark. | Microsoft's [current CLI documentation](https://github.com/microsoft/playwright-cli) confirms the deliberate avoidance of unsolicited page data and large tool schemas. The underlying Playwright browser engine is not inherently slow. |
| [Chris Tate on X, 8 April](https://x.com/ctatedev/status/2041928222766399805) | Describes agent-browser with Lightpanda, batching, and multiple sessions, reporting a fast benchmark task. | Several variables change together. The post does not isolate batching, browser engine, model, or parallelism as the cause. |
| [Public Browser HN submission, 24 September](https://news.ycombinator.com/item?id=49836880) | Author reports fewer calls and lower task duration than several competitors. | Its [repository](https://github.com/Silbercue/public-browser) supports multi-action plans, compact/differential observations, and a Node library. Interesting design evidence, not proof of general superiority. |
| [Stagehand evaluation HN discussion, 24 September](https://news.ycombinator.com/item?id=49833760) | Project authors discuss evaluating different models, tools, and harnesses for accuracy, speed, and cost. | [Published evaluations](https://www.stagehand.dev/evals) reinforce the need to compare complete task performance. This is vendor-run evidence; it does not establish a universal fastest driver. |
| [Tencent BrowserSkill changelog, 23 September](https://github.com/Tencent/BrowserSkill/blob/main/CHANGELOG.md) | Recent work includes reducing repeated observations, bounded reads, background navigation, and session recovery. | [BrowserSkill](https://github.com/Tencent/BrowserSkill) reuses an existing Chrome/Edge profile through an extension and CLI/daemon. Useful if existing-browser access is wanted; it adds setup and puts profile state outside Clarity's root. |

HN submission dates were checked against the official item API, not inferred from relative search-result dates. HN and X are discovery/discussion evidence; capabilities above were checked against project-owned documentation.

The [Public Browser benchmark method](https://github.com/Silbercue/public-browser/tree/master/test-hardest) publishes its own synthetic page and run data. Its reports acknowledge tool-guidance differences and that batching's causal contribution was not isolated. The inspected README also had summary/table discrepancies in version labels and durations. Do not reuse its headline percentages as established comparative measurements. No benchmark here used Clarity's exact Pi/Codex-subscription path.

### Approaches worth considering

| Approach | Fit assessment |
| --- | --- |
| Playwright with short scripts or bounded action batches | Proposed default to investigate for a TypeScript app. Reuse maintained browser automation and return only needed results. [Playwright CLI](https://github.com/microsoft/playwright-cli) is an existing way to explore this interface; embedding its core instead avoids requiring a general shell inside the Worker. |
| [agent-browser](https://github.com/vercel-labs/agent-browser) | Strong alternative to test: current native Rust daemon, compact snapshots, persistent browser, and batch commands. It still needs a browser and a host bridge. A small driver is not evidence that total Chromium memory or model latency is small. |
| [dev-browser](https://github.com/SawyerHood/dev-browser) | Useful minimal-script reference: persistent named pages and short JavaScript with compact snapshots. The current implementation uses Puppeteer and bundles Bun in its binary; do not describe it from older Playwright-based tutorials. Extra runtime packaging makes it a reference rather than an automatic choice. |
| Public Browser | Worth tracking for compact observations and multi-action plans. Its Node library may avoid the generic MCP boundary, but integration and permissions still require design. Current evidence is insufficient to choose it solely for speed. |
| Lightpanda | A different browser engine, not just a thinner Chrome driver. [Project benchmarks](https://github.com/lightpanda-io/browser) concern page crawling and memory; it has no graphical rendering engine, and its image output is text-only rendering. Promising for extraction, but not a demonstrated replacement for visual, interactive, signed-in browsing. Adding it plus a Chromium fallback would increase initial scope. |
| Website-specific adapters or WebMCP | [bb-browser](https://github.com/epiral/bb-browser) invokes website functionality from logged-in pages. Google's [WebMCP introduction](https://developer.chrome.com/blog/webmcp-epp) describes sites exposing structured actions. Both can avoid UI steps where supported; undocumented site adapters require maintenance, and WebMCP requires site/browser support. Neither universally replaces browser interaction. |

Do not adopt another autonomous browser-agent framework around Pi merely to obtain browser controls. That would introduce another planning loop and potentially another model/account configuration without an established need. Reuse the driver and its page-reading/action primitives instead.

### Proposed lean performance design

This is a refinement of the assistant's earlier recommendation, not an accepted implementation:

1. Use search and direct page retrieval for ordinary public research. Invoke the browser when JavaScript, authentication, or actual interaction is needed. The search provider remains an open integration question.
2. Start one managed browser on demand, keep it warm while needed, and retain one dedicated profile under the data root. Close idle browser processes while preserving login state; explicit Clarity Quit terminates its managed processes. Exact idle timing remains unspecified.
3. Return focused page text and relevant interactive elements. Request screenshots for visual questions or when structural information is insufficient; do not automatically send full-page screenshots/trees after every action.
4. Batch short, known sequences such as filling several observed fields and reading the result. Stop for new information, unexpected state, or an approval boundary. Do not invent selectors or replay stale element references to save a call.
5. Wait for a relevant element/result rather than a fixed sleep or universal network-idle rule. [agent-browser's guidance](https://github.com/vercel-labs/agent-browser) notes that streaming and polling pages may never become network-idle.
6. Expose the small browser capability through the existing module interface. Cloudflare OS already has [executeCode and binding discovery](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/agent.ts); reuse that orchestration rather than create a new agent, plugin framework, or general host-shell capability.

This proposes Playwright-backed batching first and agent-browser as the concrete alternative. It does not imply implementing every route in the table, or writing our own CDP engine. Electron's existing Chromium is worth testing for reuse, but embedded-browser control still requires the integration work described earlier. A separate managed Chrome may be less code while consuming more disk/memory; neither is declared the lighter overall implementation without measurement.

The approval mismatch remains. Short scripts and CLI commands do not legitimately bypass action approvals. Keeping the generic MCP connector unchanged preserves current behavior but adds human waits; smoother browsing requires an agreed adaptation. This research does not amend D60.

### Verifying the user's speed target

Treat “at least as fast as Codex” as a target requiring comparison on the same tasks, not an achieved guarantee. Once implementation is authorized, compare public research separately from interactive tasks: reading a page, searching a dynamic site, extracting a list, and navigating a signed-in account. Match model/effort where possible; document unavailable parity and service differences.

Measure completion success, end-to-end time, model turns, tool time, approval waits, cold/warm startup, and incremental memory. Repeat tasks and include slow/failing runs rather than selecting one demonstration. Smaller tool payloads or quicker CLI startup alone do not establish faster completed work.

Attachments remain deferred at the user's request; the earlier attachment proposals above have not become accepted requirements.
