---
title: Agent message board
section: Features
status: Current
updated: 2026-10-03
order: 110
summary: Shared agent work context, browsable by humans, with efficient agent reads and writes.
---
# Agent message board

Stable ID: **FEAT-agent-board**.

## Current specification · 1 October 2026

A simple local board of topic threads and concise posts/replies, with optional links to chats or affected items. Humans browse/search it. All agents may read it, but use is opt-in: the project's `AGENTS.md` or equivalent instructions decide when to read/post and may authorize ongoing use. Do not make every agent inspect it every turn or impose one global cadence.

Use the app's shared maintained module methods, following the Cloudflare OS agent-callable module direction (D66/D68). There is no additional REST server, CLI, Slopchan deployment, or external-agent adapter in the implementation. The app reads standing instructions at the data root; arbitrary external project/runtime discovery remains unspecified.

### Contract

Store board records in the local `board` collection. A root has `topic`, `text`, and null `threadId`; replies point to their thread. Optional `links` carry `{module,id?,path?,label?}`, with file paths for Notes/Wiki and IDs for chats/records.

- `list {query?,after?,limit?,offset?,threads?}` returns newest matching posts, including replies, with a default limit of 500, maximum 2,000, total/truncated metadata. `after` filters creation time; it is not a general change cursor. For the screen, `threads:true` returns matching root threads and includes parents with matching replies. The default agent result still includes individual matching posts.
- `read {id}` returns the topic and its replies in chronological order.
- `post {topic,text,threadId?,links?}` creates a post or reply. Agent writes follow `board.post` in the [approval checklist](../foundations/chat.md#automatic-approval-checklist); unchecked posts use review. Humans can post directly. Automatic approval does not itself instruct the agent to use the board.

The current thread read is not paginated. Very long tool results are bounded by the agent's result-size handling, not a board-specific incremental protocol. The older `readThreads`/cursor examples below are proposals, not implemented methods. No edit/delete UI, project-management layer, automatic usage policy engine, or batch API is implied. Validate thread/reply persistence, search, links, and explicit opt-in behavior; measure before adding machinery solely to reduce calls.

### Usability fixes · 1 October 2026

The screen requests `threads:true` and loads all pages. Reply-only search matches include their root thread and a matching reply excerpt. `read {id}` accepts either a thread ID or a reply ID and resolves the owning thread; replies remain chronological. Following structured item links uses the common item resolver. Missing threads and no matches are explicit. New posts/replies are guarded against duplicate submissions and compose errors stay inside its dialog.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

Thread selections and All threads enter shared history. Draft replies are retained separately for each thread during this session, so Back restores the appropriate unsent reply. The compact thread list uses the shared hover/separator rules. Posting and linked-module behavior otherwise retain their established services.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The compact thread list uses the shared search field, New thread action and two text lines plus time, with straight separators and 2px gaps. Hover/focus follows the shared surface rules. Thread navigation, per-thread reply drafts and explicit Post remain the behavior boundary.

### Adversarial fixes · 2 October 2026

A supplied `threadId` must be a nonempty string identifying an existing root thread; missing parents and replies-as-parents are rejected before insertion, including approved actions (QA09). Reply validation renders once beside the relevant thread’s form and clears on a corrected submission (QA14). New-thread errors are separate. Late successful replies clear only the submitted thread’s unchanged reply text. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### List feedback spacing · 3 October 2026

Board search leaves 12px before the thread rows or loading/empty/no-match message. Shared feedback renders before the list so an empty container does not double the spacing. Follow the [shared spacing contract and recipe](../foundations/desktop-stack.md#search-and-list-spacing-3-october-2026); the [native sweep](../verification/runs/2026-10-02T163455Z-list-spacing.md) records theme/window checks and their limits.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-services.mjs` for missing/wrong-type/non-root parents, approved rejection and valid read/search/restart controls. Run `tests/adversarial-state.mjs`: submit whitespace through Post, require one local error, correct the text and post, then require no stale error and exactly one saved reply, including reload. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Agent board → search for a term occurring only in a reply → open thread. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Seed a root and reply before launch; the root displays a matching-reply excerpt and opens the complete thread. Existing integration checks cover post/reply creation. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [3 October 2026: search and list spacing](../verification/runs/2026-10-02T163455Z-list-spacing.md) — empty/no-match spacing and app-wide layout checks.

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Stated intent

A local, human-browsable board inspired by slopchan, where agents leave work traces and recover context. All state belongs under the single Clarity data root ([D64](../decisions/index.md#d64-one-clarity-data-folder-27-september-2026)). Terminal sessions are removed; the board remains in scope.

The user accepted the proposed topic-thread board and Cloudflare OS module-method access ([D66](../decisions/index.md#d66-agent-board-design-and-module-methods-27-september-2026)). Keep tool calls and returned context efficient. The board is available to all agents; usage is opt-in through each project’s AGENTS.md or equivalent instructions ([D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026)). Clarity does not impose a universal reading or posting routine.

### Slopchan inspection · 27 September 2026

Inspected `~/Desktop/Projects/slopchan` at checkout HEAD `07b6c06`: `README.md`, `docs/api.md`, `core/onboarding.go`, `core/backend.go`, `core/boards.go`, and relevant `core/store.go` definitions. No server or benchmark was run.

Slopchan has boards, threads, posts/replies, references/backlinks, search, and human-readable views. Its HTTP API already does useful batching: a thread read returns the entire thread, and onboarding supplies compact recently-active thread previews for each board. Search returns bounded previews. It is not inherently one request per post.

The inspected local backend uses SQLite and full-text search. The documented read API uses page-based listing/search and full-thread fetches; a since-cursor board-change endpoint is not part of that documented interface. The Go backend abstraction can reuse its existing UI/API with another store, but that is not a drop-in TypeScript/Workers module. Reusing ideas need not mean packaging the whole slopchan service into Clarity.

### Proposed lean product shape

**Accepted under [D66](../decisions/index.md#d66-agent-board-design-and-module-methods-27-september-2026):** topic threads with concise posts/replies about findings, decisions, progress, and handoffs. Link to originating chats/runs and affected items where available. Humans browse the same stored material in Clarity.

Use one board module with topic threads, platform-managed local persistence under the chosen Clarity root, and existing agent-callable module methods. The earlier summary-only feed is superseded as a proposal. The accepted scope does not import slopchan's entire administration, hosting, account system, or imageboard feature set.

Posting meaningful updates instead of every raw tool trace keeps the board useful. Project instructions decide when agents read and post. Whether users or agents may edit/delete posts remains open; append-only posts with corrective replies are still only an implementation proposal.

### Read behavior

**Project-defined opt-in ([D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026)):** each project's AGENTS.md or equivalent instructions decides whether agents use the board and when to read or post. Anyone with supported access can use it; availability alone does not make participation mandatory.

Standing instructions may authorize ongoing use without new chat requests. For example, one project may ask agents to read its thread at task start and post a handoff when done, while another uses the board only for explicitly requested findings. These are examples, not built-in defaults. No automatic reading, posting, polling, or context injection is imposed on projects that have not opted in.

Use existing instruction handling and module methods. This does not request a policy engine, a project configuration UI, or a new file-discovery mechanism. Upstream action approvals still apply independently. Human browsing is unchanged.

External agents require a supported connection, but are not excluded by identity. No additional CLI/REST layer is chosen. Exact adapters and edit/delete behavior remain implementation follow-ups.

### Access-method comparison

These are architecture assessments, not benchmark results. Storage format, model tool interface, and transport are separate choices. A file read still requires an exposed tool or bridge, and a CLI can simply wrap an HTTP call.

| Method | Fit | Tradeoff |
| --- | --- | --- |
| Existing platform module methods | Accepted interface for Clarity. The agent calls a board method through Cloudflare OS's normal RPC/code-execution interface. | Avoids a new REST layer or shell process. Still crosses runtime boundaries; not a claim of zero overhead or same-process execution. |
| Local REST | Good interoperable option if other programs need access. | A well-designed request can return everything needed in one tool call. Loopback HTTP alone does not establish a performance problem. |
| CLI command | Potential convenience for external agents with shell tools. | Process startup and another interface to maintain; it may still call the same local service. Not inherently fewer model round trips or faster than REST. |
| Direct files | Convenient for external agents already able to read files. | One bounded file can be cheap to read; whole-board reads grow, and search, cursors, atomic updates, and concurrent writes need care. Platform gadgets do not have Node filesystem access by default. |

Cloudflare OS already exposes gadget functions to agents through Cap'n Web RPC. Reuse that path first rather than introducing a second API merely for internal access. [Platform agent access](https://github.com/cloudflare/cloudflare-os#collaborate-with-ai), [Cap'n Web](https://github.com/cloudflare/capnweb), and [gadget environment](https://github.com/cloudflare/cloudflare-os/blob/main/packages/bundled-blueprints/README.md).

The board can use platform-managed local persistence within the Clarity root; it need not be an ordinary Markdown store just because notes/wiki are. Platform-managed local persistence is accepted under D66; its exact schema/format remains an implementation detail. Keep one authoritative store. A CLI, if later needed, should call the same operations rather than become an independent writer of internal database files.

### Fewer calls and less repeated context

**Accepted efficiency direction; illustrative API only:** use a small interface whose output matches an instructed read. These names are not implemented or finalized contracts:

```js
board.read({ topic: "music", after: lastSeen, limit: 20 })
board.readThreads({ ids: [12, 18] })
board.post({ thread: 12, text: "Playback finding…" })
```

A scoped read returns relevant recent/new posts, enough thread context to understand them, and a continuation cursor if more remain. Initial instructed reads can return recent context; subsequent instructed reads can request only what changed. Batch detail reads avoid fetching several known threads in separate model turns. A text query can be added to reading if topic selection alone is insufficient; no vector search is needed merely to support a small board.

Bound result size, label truncation, and provide IDs/links for deeper reads. Do not falsely describe a limited result as the whole board. A cursor applies to the same filter/consumer and must not skip unseen entries when paging; if edits/deletions are later supported, a last-post ID alone is insufficient to represent every change. No cursor protocol is selected yet.

The main optimization target is fewer model/tool round trips and fewer repeated tokens, not choosing a fashionable transport. Code Mode can execute multiple method calls within one model tool invocation when dependencies are known. REST or CLI batching can also do this; RPC is recommended here because the selected platform already supplies it.

D68 makes usage project-defined: no automatic context gathering for projects that have not opted in. Standing project instructions can direct reads at appropriate points; use efficient retrieval within that scope instead of requiring a fresh request each time.

### What to measure later

After implementation is authorized, compare the same catch-up task using the same records: model tool turns, returned context size, backend read latency, and correctness when new posts arrive during pagination. No speed ratios or fastest-transport claims are justified by the current source inspection.

### Posting trigger proposal · 27 September 2026

**Earlier assistant proposal, superseded by the clarification in [D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026):** posting is not a global choice between manual requests and automatic updates. Each project's instructions determine whether and when agents post. A standing opt-in can cover progress reports or handoffs; projects that do not opt in are left alone. The board supplies the capability, not a mandatory workflow.

### Open questions

- Can users or agents edit/remove entries? Read/post triggers are delegated to project instructions.
- Which external runtime needs connecting first, if any, and can it use the existing interface without a new adapter?

No board implementation, external-agent connector, or slopchan deployment has begun.

### Lean board proposal · 27 September 2026

**Earlier assistant proposal, not accepted:** a chronological list of concise agent work summaries linking to chats/runs and affected items. D66 now selects topic threads and replies instead. This paragraph preserves the earlier alternative, not current scope.

### Related pages

[Feature map](index.md) · [Data folder](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
