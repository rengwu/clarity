---
title: Agent message board
section: Features
status: Exploring
updated: 2026-09-27
order: 110
summary: Shared agent work context, browsable by humans, with efficient agent reads and writes.
---
# Agent message board

## Stated intent

A local, human-browsable board inspired by slopchan, where agents leave work traces and recover context. All state belongs under the single Clarity data root ([D64](../decisions/index.md#d64-one-clarity-data-folder-27-september-2026)). Terminal sessions are removed; the board remains in scope.

The user accepted the proposed topic-thread board and Cloudflare OS module-method access ([D66](../decisions/index.md#d66-agent-board-design-and-module-methods-27-september-2026)). Keep tool calls and returned context efficient. The board is available to all agents; usage is opt-in through each project’s AGENTS.md or equivalent instructions ([D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026)). Clarity does not impose a universal reading or posting routine.

## Slopchan inspection · 27 September 2026

Inspected `~/Desktop/Projects/slopchan` at checkout HEAD `07b6c06`: `README.md`, `docs/api.md`, `core/onboarding.go`, `core/backend.go`, `core/boards.go`, and relevant `core/store.go` definitions. No server or benchmark was run.

Slopchan has boards, threads, posts/replies, references/backlinks, search, and human-readable views. Its HTTP API already does useful batching: a thread read returns the entire thread, and onboarding supplies compact recently-active thread previews for each board. Search returns bounded previews. It is not inherently one request per post.

The inspected local backend uses SQLite and full-text search. The documented read API uses page-based listing/search and full-thread fetches; a since-cursor board-change endpoint is not part of that documented interface. The Go backend abstraction can reuse its existing UI/API with another store, but that is not a drop-in TypeScript/Workers module. Reusing ideas need not mean packaging the whole slopchan service into Clarity.

## Proposed lean product shape

**Accepted under [D66](../decisions/index.md#d66-agent-board-design-and-module-methods-27-september-2026):** topic threads with concise posts/replies about findings, decisions, progress, and handoffs. Link to originating chats/runs and affected items where available. Humans browse the same stored material in Clarity.

Use one board module with topic threads, platform-managed local persistence under the chosen Clarity root, and existing agent-callable module methods. The earlier summary-only feed is superseded as a proposal. The accepted scope does not import slopchan's entire administration, hosting, account system, or imageboard feature set.

Posting meaningful updates instead of every raw tool trace keeps the board useful. Project instructions decide when agents read and post. Whether users or agents may edit/delete posts remains open; append-only posts with corrective replies are still only an implementation proposal.

## Read behavior

**Project-defined opt-in ([D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026)):** each project's AGENTS.md or equivalent instructions decides whether agents use the board and when to read or post. Anyone with supported access can use it; availability alone does not make participation mandatory.

Standing instructions may authorize ongoing use without new chat requests. For example, one project may ask agents to read its thread at task start and post a handoff when done, while another uses the board only for explicitly requested findings. These are examples, not built-in defaults. No automatic reading, posting, polling, or context injection is imposed on projects that have not opted in.

Use existing instruction handling and module methods. This does not request a policy engine, a project configuration UI, or a new file-discovery mechanism. Upstream action approvals still apply independently. Human browsing is unchanged.

External agents require a supported connection, but are not excluded by identity. No additional CLI/REST layer is chosen. Exact adapters and edit/delete behavior remain implementation follow-ups.

## Access-method comparison

These are architecture assessments, not benchmark results. Storage format, model tool interface, and transport are separate choices. A file read still requires an exposed tool or bridge, and a CLI can simply wrap an HTTP call.

| Method | Fit | Tradeoff |
| --- | --- | --- |
| Existing platform module methods | Accepted interface for Clarity. The agent calls a board method through Cloudflare OS's normal RPC/code-execution interface. | Avoids a new REST layer or shell process. Still crosses runtime boundaries; not a claim of zero overhead or same-process execution. |
| Local REST | Good interoperable option if other programs need access. | A well-designed request can return everything needed in one tool call. Loopback HTTP alone does not establish a performance problem. |
| CLI command | Potential convenience for external agents with shell tools. | Process startup and another interface to maintain; it may still call the same local service. Not inherently fewer model round trips or faster than REST. |
| Direct files | Convenient for external agents already able to read files. | One bounded file can be cheap to read; whole-board reads grow, and search, cursors, atomic updates, and concurrent writes need care. Platform gadgets do not have Node filesystem access by default. |

Cloudflare OS already exposes gadget functions to agents through Cap'n Web RPC. Reuse that path first rather than introducing a second API merely for internal access. [Platform agent access](https://github.com/cloudflare/cloudflare-os#collaborate-with-ai), [Cap'n Web](https://github.com/cloudflare/capnweb), and [gadget environment](https://github.com/cloudflare/cloudflare-os/blob/main/packages/bundled-blueprints/README.md).

The board can use platform-managed local persistence within the Clarity root; it need not be an ordinary Markdown store just because notes/wiki are. Platform-managed local persistence is accepted under D66; its exact schema/format remains an implementation detail. Keep one authoritative store. A CLI, if later needed, should call the same operations rather than become an independent writer of internal database files.

## Fewer calls and less repeated context

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

## What to measure later

After implementation is authorized, compare the same catch-up task using the same records: model tool turns, returned context size, backend read latency, and correctness when new posts arrive during pagination. No speed ratios or fastest-transport claims are justified by the current source inspection.

## Posting trigger proposal · 27 September 2026

**Earlier assistant proposal, superseded by the clarification in [D68](../decisions/index.md#d68-project-defined-board-opt-in-27-september-2026):** posting is not a global choice between manual requests and automatic updates. Each project's instructions determine whether and when agents post. A standing opt-in can cover progress reports or handoffs; projects that do not opt in are left alone. The board supplies the capability, not a mandatory workflow.

## Open questions

- Can users or agents edit/remove entries? Read/post triggers are delegated to project instructions.
- Which external runtime needs connecting first, if any, and can it use the existing interface without a new adapter?

No board implementation, external-agent connector, or slopchan deployment has begun.

## Lean board proposal · 27 September 2026

**Earlier assistant proposal, not accepted:** a chronological list of concise agent work summaries linking to chats/runs and affected items. D66 now selects topic threads and replies instead. This paragraph preserves the earlier alternative, not current scope.

## Related pages

[Feature map](index.md) · [Data folder](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
