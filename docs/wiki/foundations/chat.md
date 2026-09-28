---
title: Chat and module actions
section: Foundations
status: Captured
updated: 2026-09-29
order: 40
summary: Chat can read information and perform actions across all Clarity modules.
---
# Chat and module actions

**Implemented under D102/D103:** Pi calls the shared maintained module methods. Reads return immediately; writes enter a persistent review queue, and the agent is told they have not been applied. Clarity adapts Cloudflare OS's public approval contracts without running the full upstream Gatekeeper platform. Browser navigation uses thread-scoped origin grants. See [current evidence](../references/implementation.md).

**Current implementation:** local Worker/SQLite persistence, the Pi agent, stable maintained module instances, queued approvals, and actual Markdown notes/wiki files. A live Codex request also accepted hosted web search, avoiding an interactive browser for ordinary research. The live application test now passes tool approval, restart, and model/effort switching within one thread. Fresh live sign-in/expiry remains unverified. Earlier discussions below are retained as history; the current implementation report governs the delivered behavior.

Chat should be able to act across all modules. It is the opening screen, with recent chats in the sidebar, and provides access to module information and actions through conversation. See [D17](../decisions/index.md#d17-chat-across-all-modules-25-september-2026).

## User-specified examples

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

## Results stay in chat

**Accepted by the user:** stay in the conversation after a module action. Show a compact result with a link to the relevant item, such as the newly created calendar event. Opening the module is a user action; completing a chat action does not automatically switch the view. See [D18](../decisions/index.md#d18-results-stay-in-chat-25-september-2026).

The exact presentation of summaries, results, and item links remains to be designed.

## Action modes

**Use Cloudflare OS's approval behavior for now ([D60](../decisions/index.md#d60-adopt-upstream-approvals-27-september-2026)).** The previous custom Proceed/Cancel-before-every-action and Auto-mode requirements are superseded for current implementation.

Upstream Gatekeepers can queue writes and simulate pending results so the agent can continue before review. Behavior varies by connector; adopting it does not mean every action is simulated or automatically approved. Reuse its supported controls and clearly distinguish pending outcomes from completed actions. [Upstream explanation](https://github.com/cloudflare/cloudflare-os/blob/main/README.md#gatekeepers-a-capability-based-security-layer).

Do not build an additional permission system to reproduce the earlier topic/thread wiki grant. Its custom mechanics are set aside for now; wiki maintenance remains intended. Validate actual local-file actions through the chosen platform integration. These product decisions do not change authorization for this planning conversation.

## Conversation access

**Accepted from the user ([D21](../decisions/index.md#d21-all-conversations-access-enabled-modules-25-september-2026)):** every conversation can access all enabled modules. Keep the user-facing model simple; no per-conversation module selector is required. Connection requirements and the selected action mode still apply. The implementation for retrieving relevant context remains undecided.

**Board-specific usage rule:** all agents may access the board, but usage is opt-in through project AGENTS.md or equivalent instructions (D68). Those instructions may direct ongoing reads/posts without fresh chat requests. Enabled-module access alone does not opt every project into board use. Use the same stable module and upstream approvals.

## Assistant and model selection

Retain Cloudflare OS's Pi-based agent under D58; the LangChain plan is superseded. Keep model/effort selection as a UX requirement where supported by the chosen provider. Local models remain out of scope. See [assistant execution](harnesses.md).

## Chat UI references

**User-stated requirement:** closely refer to Synara's or Codex's chat UI. See [D19](../decisions/index.md#d19-chat-ui-references-25-september-2026). Neither has been selected as the sole reference for the whole screen. The latest supplied Synara screenshot establishes the model/effort picker reference; earlier screenshots showed its browser. Full chat layout behavior still needs review.

This is a direction for Clarity's future chat screen. It does not change the planning wiki reader's Wikipedia-inspired style or select a model provider or app implementation.

## Existing requirements

Users choose which modules to enable and which accounts to connect. Mail requires Google authentication; music uses Spotify and Navidrome connections, with direct local-file playback out of scope. See [modules and connections](integrations.md). Provider-specific technical feasibility remains to be researched when designing the integrations.

The wiki capability here refers to Clarity's future in-app knowledge base. This planning notebook is a separate tool.

## Still open

- Exact result and item-link presentation, using the selected chat UI references.
- Validate upstream approval behavior for Clarity module operations and actual file changes.
- Detailed operations for each module, particularly developer workflows.
- Model provider/access setup, capability discovery, context retrieval, and conversation storage.

These are design questions, not chosen policies or implementation commitments.

## Navigation and scheduled output · 27 September 2026

Follow Cloudflare OS navigation first (D73): enabled modules above recent chats, Settings below. User-initiated module results stay in chat. Automation run output stays in Automations (D76); it must not create chats or insert scheduled summaries into conversations.

## Reopening · 27 September 2026

Resume the last chat when reopening Clarity, with New chat available (D78). Show a new chat when no history exists. Merely opening a conversation does not send a message or resume agent execution.

## Web and attachments · 27 September 2026

**D86:** the user wants full web capabilities. Search and page reading are confirmed; interactive/authenticated browsing and web actions need an explicit scope decision. Do not equate the user's requirement with fetching public pages only. Chat research does not change scheduled wiki source restrictions or upstream approvals.

**D87:** prefer allowing any file type to be attached, provided this remains simple. This is not a promise to analyze arbitrary formats or unlimited sizes. File storage, model input, and any conversion need separate treatment.

### Upstream findings

Inspected revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a` on 27 September 2026:

- [web-fetch.ts](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/web-fetch.ts) exposes public HTTPS GET requests without forwarded credentials or write methods. Conversion of supported document formats uses a Workers AI binding. This inspected tool is not an interactive authenticated browser; search and browser-session support remain to investigate. Local backend execution does not imply that this conversion service is local.
- [Attachment validation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-validation.ts) accepts recognized text-like files and JPEG/PNG/WebP, plus PDFs for selected providers. It rejects unsupported MIME types and caps uploaded attachment bytes at 1 MiB per file. The [frontend preparation](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-frontend/src/features/chat/composer/attachments/prepareChatAttachment.ts) also defines a 5 MiB combined limit and prepares/resizes images. These are upstream limits, not accepted Clarity limits.
- The [PDF bridge](https://github.com/cloudflare/cloudflare-os/blob/004ab773fad6d4fb7fe67be920a3ef37e46dc58a/packages/workshop-backend/src/chat-attachment-pdf.ts) handles named model API paths. It does not establish PDF compatibility through the intended Codex subscription route. No end-to-end attachment test was run.

**Assistant assessment:** supporting every format's contents would add conversion, extraction, and possibly transcription work. The simplest proposed approach is to retain original attachments locally, analyze formats supported by the selected runtime/model, and clearly say when a file was attached but cannot be read. The user must agree to that distinction before treating it as the scope. File-size limits and original-file preservation need validation; no arbitrary unlimited upload promise is made.

### Follow-up questions

1. Does full web capability include clicking, typing, downloads, and sites signed into by the user? Recommend search/read plus an existing browser integration for interactive tasks if one can fit the local runtime; preserve the upstream action-approval model. This is a proposal, not a selected tool.
2. Is attaching any file with a clear unreadable-file state acceptable when no supported reader exists? Recommend this lean fallback over building universal conversion. If analysis is essential for particular formats, identify those formats before selecting conversion tools.

## Research follow-up · 28 September 2026

The user requested research before deciding the two follow-ups. The [web and attachment report](../references/web-and-attachments.md) compares reusable browser integrations and local file handling. Playwright MCP is a candidate, but the generic upstream connector queues navigation/clicks for approval; smooth browsing is not a drop-in fit. Saving arbitrary file types is simpler than analyzing them. Proposed initial readers cover text, supported images, and PDF text, preserving originals and explicitly reporting unsupported inputs. These are recommendations, not new accepted scope. No runtime prototype was run.

## Browsing speed · 28 September 2026

D91 adds the user's target of browsing at least as fast as Codex while remaining lean. [Recent research](../references/web-and-attachments.md#browser-performance-follow-up) distinguishes hosted search from interactive browsing and favors warm sessions, focused observations, and bounded action batches. The assistant now recommends comparing Playwright-backed batching with agent-browser rather than defaulting to generic Playwright MCP. No driver or approval adaptation is accepted; no performance test was run. Attachment discussion is deferred.

## Accepted browser direction and attachments

D92 accepts Playwright with batched actions, persistent sessions, and focused page summaries, with agent-browser as the alternative to compare. The approval integration and performance validation remain open. This is a planning decision, not an application build request.

The attachment round is resolved by D93–D96 below. The user accepted the supported analysis baseline and composer controls, capped independent local copies below 30 MB, and chose 90-day cleanup instead of indefinite retention. See [the question round](../discussions/open-questions.md#attachment-question-round-28-september-2026).

## Attachment decisions · 28 September 2026

- **Analysis (D93):** text/code files, supported images, and PDFs containing text initially. Other file types remain attachable within the limit; clearly report unsupported analysis. Do not imply universal format understanding.
- **Storage (D94):** preserve an independent original-file copy under the data root only for files less than 30 MB. Skip files at or above the threshold and notify the user. Do not modify or rely on the external original after attaching.
- **Controls (D95):** drag-and-drop, file picker, and pasted images in the composer.
- **Retention (D96):** clean stored attachments after 90 days. This replaces the unaccepted indefinite-retention proposal and does not change Notes/Wiki Trash retention.

Working assumptions are age measured from attachment, cleanup while the app runs/startup, and an expired-file message in older chats while keeping conversation text. These mechanics are proposals; the 90-day period itself is settled. D100 now defines the ownership path: deliberate embedding creates a separate persistent module asset copy. Provider limits, extraction correctness, and aggregate payload limits still require implementation validation.

## First-version behavior decisions · 28 September 2026

The user accepted all four recommendations (D97–D100):

- After site authorization, routine browsing/navigation/search/reading proceeds without per-click confirmation. Confirm consequential actions such as sending, publishing, deleting, and purchasing. This is an explicit browser-specific refinement of D60; its enforcement and site-grant scope/duration remain to validate.
- Use the current thread by default. Retrieve earlier chats when the user asks or refers to a previous discussion; no automatic cross-chat memory. Enabled-module access remains unchanged.
- Apply model/effort changes to the next message in the same thread, preserving history; do not start a new chat or restart an in-flight response.
- Deliberately embedding an attachment in Notes/Wiki creates a separate persistent module asset with a relative link. The chat copy still expires after 90 days. Mentioning/summarizing alone does not preserve the original.

See [the resolved round](../discussions/open-questions.md#next-first-version-question-round-28-september-2026). The user approved behavior, not application implementation or a new generic permission system.
