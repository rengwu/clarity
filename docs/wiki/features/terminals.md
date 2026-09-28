---
title: Terminal sessions
section: Features
status: Dropped
updated: 2026-09-27
order: 100
summary: Removed from scope; earlier terminal research is preserved here.
---
# Terminal sessions

**Removed from scope on 27 September 2026 ([D54](../decisions/index.md#d54-terminal-sessions-removed-27-september-2026)).** Everything below records historical requirements and research. Do not plan terminal spaces, PTYs, renderers, Herdr, or session persistence. Agent work traces remain a separate requirement under the [agent board](agent-board.md).

## Stated intent

Include terminal sessions similar to chartr. Keep development-related session and conversation traces in the development folder.

**Accepted direction, 26 September 2026:** use chartr's Spaces view: spaces with terminal sessions nested underneath, and the selected terminal in the main area. The supplied screenshot is a navigation reference, not authorization to copy splits, plugins, worktree management, or every status indicator. See [D52](../decisions/index.md#d52-terminal-spaces-and-stack-preferences-26-september-2026).

The user dislikes xterm.js and prefers exploring native terminal technology such as libghostty or Alacritty. Rust/GPUI is their preference, with Electron, SwiftUI, and other feasible stacks open for comparison. No terminal library or whole-app stack is selected. See [desktop stack exploration](../foundations/desktop-stack.md).

## Candidate lean scope

**User inquiry, 25 September 2026:** what is the simplest leanest implementation? The following is an assistant proposal, not an accepted process-lifetime or stack decision.

For terminals embedded in Clarity, use an existing terminal renderer connected to one pseudoterminal (PTY) and shell process per session. The PTY makes interactive shells and terminal applications work normally. Clarity supplies a small amount of session management: open in a chosen project folder, forward input/output and resize events, and close the session.

The earlier list-or-tabs screen proposal is replaced by the accepted Spaces view. Proposed minimum controls: create a space, create a terminal under it, select a session, and close it. Associating a space with a working folder is a proposal; exact folder ownership remains open. Users can run installed CLI agents in the shell without a custom launcher for each one. Other chartr features are not implied.

### Proposed lifetime

| Action | Proposed behavior |
| --- | --- |
| Switch tab or navigate to another module | Keep the terminal running while Clarity remains running. |
| Close a terminal session | Terminate the managed session and release its PTY. |
| Fully quit Clarity | Shut down managed terminal sessions. Saved traces remain. |
| Reopen Clarity | Old traces are available; starting a terminal creates a fresh shell. No claim of restoring a live process. |

Closing a macOS window and fully quitting an app are different actions. Exact window-close behavior remains to be defined. Process cleanup must be implemented deliberately; do not assume that killing the parent shell always terminates every descendant or deliberately detached command. A small notice when quitting with live sessions is a possible UX safeguard, not yet selected.

### Trace boundary

Keep basic session metadata and terminal output in the development folder, with bounded in-memory scrollback. Exact on-disk format and retention are not chosen. Saved output preserves an activity trace; it does not preserve a running process.

**Material limit:** full-screen terminal apps redraw and overwrite text. Their raw output stream is not automatically a clean, readable conversation transcript. Structured agent conversations should come from the harness's own logs/exports where available; parsing arbitrary terminal output into conversations would add complexity. Existing requirements for conversation traces remain, but per-harness access and completeness need definition rather than being silently replaced with terminal logs.

### Why this is the smallest embedded approach

Clarity owns the terminals during its own lifetime, so no separate service, daemon version negotiation, or post-quit reattachment is needed. If surviving full quit becomes required, reconsider an existing session manager instead of inventing one. A button opening the user's external terminal would be even smaller, but would give up the embedded session view and Clarity-owned trace capture; it does not fully satisfy the implied chartr-like experience.

The earlier xterm.js renderer suggestion is set aside following the user's preference on 26 September. PTY ownership and terminal rendering are separate choices: a PTY connects the shell to the application; a terminal engine interprets output and a view displays it and handles input. Choosing libghostty or Alacritty does not by itself choose the complete UI integration. See the [terminal comparison](../foundations/desktop-stack.md#terminal-embedding).

Even the lean version needs resize handling, cleanup, and bounded output delivery. The [xterm.js flow-control guide](https://xtermjs.org/docs/guides/flowcontrol/) explains how excessive output can overwhelm the renderer; this is essential integration behavior, not an extra user feature.

## Open questions

- Is the proposed stop-on-full-quit lifetime acceptable, and what should closing the window do?
- Which terminal output and structured harness traces must be retained, and for how long?
- Does a space reference an existing folder, and can terminals exist without a project folder?
- Are basic running/exited states sufficient, or are agent-specific working/waiting/approval states needed?

Cross-machine restoration is deferred with device sync. It is not an initial implementation requirement.

## Herdr

For the Electron option, [the stack follow-up](../foundations/desktop-stack.md#electron-and-typescript-obstacles-26-september-2026) identifies ghostty-web as a possible Ghostty-engine browser terminal with a separate local PTY backend. Its browser canvas renderer is distinct from native Ghostty rendering; neither acceptance nor runtime compatibility has been established. This does not change the user's preference or choose Herdr.

The user currently uses Herdr in chartr for agent-state detection and asks whether Clarity needs it. No decision to adopt or reject it has been made.

**Assistant recommendation:** initially omit Herdr if app-owned session lifetime and basic process state are sufficient. Grouping sessions into spaces does not require a daemon. Process running/exited can come from process events; working, waiting for input, and awaiting approval need agent-specific signals. Output silence is not a reliable substitute. Do not add heuristic state detection just to reproduce screenshot badges.

This recommendation is conditional: surviving full app quit remains undecided, and structured conversation traces still need an explicit design. If either requires an independent session owner or harness integration, revisit Herdr's existing implementation before writing a replacement. Clarity's LangChain assistant controls its own loop, but that does not expose the state of independently launched CLI agents.

## Reference notes

Revisited `~/Desktop/Projects/chartr/README.md` and read `docs/adr/0001-a-private-herdr.md` on 25 September 2026. Chartr uses a private Herdr daemon, a pinned sidecar, its own socket/namespace, and live handoff when backend versions change. This supports processes surviving app exit, but adds machinery beyond the proposed Clarity baseline.

Also inspected `crates/chartr-conversations/src/session_logs.rs`: its OpenCode export path uses the harness's own export command, validates session identity, and handles failures/timeouts. This is evidence that structured conversation export is separate from terminal output capture, not an endorsement of copying that particular implementation. Clarity has not adopted chartr's Rust/GPUI stack, Herdr, or process model. No terminal prototype or runtime validation was performed.

On 26 September, inspected chartr's `docs/adr/0002-the-zed-layer.md`, `0004-the-zed-terminal-stack.md`, relevant portions of `0005-spaces-follow-zed-multi-workspace.md`, and dependency manifests. Chartr now reuses Zed's terminal model and view together, with an Alacritty-derived engine in its dependency graph. Its ADR explains why a VT engine alone left too much frontend behavior to maintain. This avoids a custom terminal frontend but brings pinned Zed dependencies and vendored view changes. Its Wry webview integration also has platform patches for popup/modal layering. These are concrete complexity signals for Clarity's stack evaluation, not an instruction to copy the whole architecture.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
