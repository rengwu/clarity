---
title: Working principles
section: Overview
status: Captured
updated: 2026-09-27
order: 20
summary: Lean tools, readable code, optional connections, and explicit platform tradeoffs.
---
# Working principles

## User-stated direction

- **Cloudflare OS with Electron/TypeScript.** This is the accepted platform direction. Terminal sessions are removed.
- **Local backend and real Markdown.** Notes/wiki are actual files; both are viewable in-app and notes editable. One chosen data root holds all app state; the second development folder is dropped. Internal layout and other state representation remain open. No sync is requested.
- **Explicit Quit.** Closing the window keeps Clarity running and accessible from the Dock/menu bar. Explicit Quit exits; no separate service or launch-at-login feature is implied.
- **Optional modules.** Users enable the features they want.
- **Optional accounts.** Integrations become useful when the user chooses to connect them.
- **Stable modules.** Every chat accesses the same enabled module instances. Maintain module code rather than offering per-user runtime code rewriting initially.
- **Upstream approvals.** Adopt Cloudflare OS behavior for now instead of the earlier bespoke confirmation/auto system.
- **One assistant runtime.** Keep Cloudflare OS’s Pi agent; LangChain is superseded.
- **macOS first.** Keep a route to Linux open within the Electron/TypeScript direction.
- **Lean tools.** Take the useful experience from the references without assuming their entire feature set.
- **Lean implementation by default.** Keep every feature intentionally simple. If simplicity is not possible, raise the tradeoff with the user before adopting complexity. Surface hard questions, concerns, and potentially complex implementations early ([D30](../decisions/index.md#d30-lean-by-default-25-september-2026)).
- **Resist feature additions.** Ask whether an addition is necessary for agreed behavior. When in doubt, consult the user; reference apps and screenshots do not authorize their entire feature sets.
- **Readable code.** Structure code for a beginner/intermediate programmer: descriptive names, focused modules, clear responsibilities, and straightforward control flow. Avoid unnecessary abstraction layers and keep inline comments absent or succinct ([D51](../decisions/index.md#d51-readable-code-and-learning-as-we-build-26-september-2026)).
- **Learn as we build.** Explain the chosen agent architecture and important control/data flow in small steps; assume beginner familiarity. Keep explanations in conversation or concise documentation rather than verbose inline comments.
- **Explore first.** Iterate requirements before building the app.
- **Functional UI text.** Every label, caption, and subtitle must have a justifiable UX reason. Remove unnecessary flourishes and ornamental text. See [D10](../decisions/index.md#d10-functional-ui-text-24-september-2026).

## Proposed guardrails

These are assistant proposals, not accepted requirements:

- Make disabled, disconnected, and unavailable features easy to distinguish.
- Keep authoritative data distinguishable from disposable caches.
- Make conflicts visible instead of silently discarding changes.
- Preserve context when ideas change; record the reason and the replacement decision.

## Tensions to explore

A broad harness can become complicated even when each tool is simple. Folder portability can conflict with machine-specific paths, credentials, live processes, and concurrent editing. These are design questions to resolve, not reasons to abandon the idea.

See [portability](../foundations/portability.md) and [module choices](../foundations/integrations.md).
