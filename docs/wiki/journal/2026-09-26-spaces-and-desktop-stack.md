---
title: 26 September 2026 — Spaces and desktop stack exploration
section: Journal
status: Exploring
updated: 2026-09-26
order: 430
summary: Accept terminal spaces and compare frameworks without selecting a stack or Herdr.
---
# 26 September 2026 — Spaces and desktop stack exploration

The user wants chartr-style spaces containing terminal sessions, illustrated by their screenshot. They use Herdr in chartr for agent-state detection but are unsure whether Clarity needs it. They dislike xterm.js, prefer native terminal technology such as libghostty or Alacritty, and lean toward Rust/GPUI. They also invite Electron, SwiftUI, and other feasible options, while noting less confidence with SwiftUI.

Recorded [D52](../decisions/index.md#d52-terminal-spaces-and-stack-preferences-26-september-2026), updated [terminals](../features/terminals.md), and opened one [desktop stack comparison](../foundations/desktop-stack.md) page. The accepted Spaces layout replaces the earlier list-or-tabs proposal; the xterm.js suggestion is set aside. Stack preferences are not a selection. Earlier stop-on-full-quit behavior remains unaccepted.

Read chartr's ADRs for its Zed layer and complete terminal stack, relevant Spaces/webview notes, and dependency manifests. Chartr now shares Zed's model and view rather than maintaining a frontend around only a VT engine. This saves custom terminal behavior at the cost of a larger pinned dependency graph and vendored changes. Its child-webview integration also involves platform patches. Checked upstream framework, terminal-library, and LangChain documentation; no app or prototype was run.

Assistant proposal: evaluate Rust/GPUI first, with Electron as the web UI/LangChain comparison. Tauri is an additional candidate; SwiftUI's Apple-only UI and the user's learning burden count against it for this project. Flagged native terminal embedding, rich-text notes, webview integration, and a separate LangChain runtime for Rust/Swift as material complexity. A small app-started helper need not be an HTTP server or persistent daemon.

Assistant proposal: omit Herdr only if basic process state and app-owned session lifetime suffice. Spaces do not require it. Reliable CLI-agent state, surviving full quit, and structured conversation traces are separate needs and must not be silently dropped. LangChain's own execution state does not reveal independent CLI-agent state.

Remaining questions: terminal lifetime and window close, required agent indicators and traces, space/folder association, complete terminal and notes editor choices, LangChain language/runtime packaging, and desktop framework. No application implementation or dependency installation began.
