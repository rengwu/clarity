---
title: Working principles
section: Overview
status: Current
updated: 2026-10-01
order: 20
summary: Lean tools, readable code, optional connections, and explicit platform tradeoffs.
---
# Working principles

## Current specification · 29 September 2026

This page owns the detailed workspace working rules. [Agent onboarding](../index.md#agent-onboarding) defines the required reading path; the repository's AGENTS.md is a short entry point. Product behavior and implementation contracts belong on their existing wiki topics, without a second specification in AGENTS.md ([D107](../decisions/index.md#d107-wiki-led-agent-onboarding-29-september-2026)). This project specification wiki is distinct from Clarity's user-owned in-app Wiki module.

### Scope and authorization

Implementation is authorized as of 28 September 2026 under [D102](../decisions/index.md#d102-build-clarity-with-lean-defaults-28-september-2026): build the complete agreed application, using safe, lean defaults for unfinished choices. Record those choices as delegated implementation defaults, not answers individually supplied by the user. Preserve settled scope and explain material limitations honestly. The earlier planning-only restriction is superseded. Disposable spikes remain authorized; keep their code, dependencies, fixtures, and packaging experiments outside this workspace and record findings with their limits.

Define module behavior before selecting technology. Keep every feature and its implementation intentionally lean; choose the smallest approach that satisfies the agreed behavior. Before adding a capability, establish that it is necessary. If that is unclear, consult the user. References and screenshots establish specific behaviors, not authorization to import every feature.

Raise hard questions, material concerns, and complexity early. If a feature cannot stay simple, explain why and the smallest viable alternative before adopting the complexity. Do not silently remove agreed behavior to simplify the implementation, or add infrastructure for unconfirmed future needs. Current scope and exclusions live on [Product vision](product.md); use the [feature map](../features/index.md) for module contracts.

UI text must serve navigation, an action, necessary guidance, or meaningful state. Avoid decorative copy, slogans, ornamental logos, repeated subtitles, and redundant labels.

### Readable code and learning

Treat the user as a beginner in the chosen agent architecture, including in future sessions. Explain new concepts in plain language when first used, connect them to the current feature, and walk through important control/data flow and tradeoffs in small steps. Do not assume familiarity with agents, tools, retrieval, middleware, persistence, or LangChain if it comes up. Learning is part of implementation, not a reason to expand scope or skip correctness checks.

Write for a beginner/intermediate programmer: descriptive names, straightforward control flow, small focused functions/modules, and clear responsibilities. Introduce abstractions only when they improve the current code or meet a concrete need. Avoid speculative generalization, clever metaprogramming, and framework layers that obscure behavior. Readability comes before terseness; simplicity does not mean one giant file or duplicated business rules.

Omit inline comments when code explains itself; use succinct comments for non-obvious reasons or constraints. Put learning explanations in conversation or concise supporting documentation, rather than narrating source code line by line.

### Question rounds

Use the wiki and source inspection to resolve facts; ask the user for preferences and tradeoffs. Do not reopen settled decisions or turn a proposal into an accepted requirement.

Group independent, currently answerable decisions into numbered question rounds, with a concise recommendation for each. The user prefers multiple questions per round. Wait for answers before asking dependent follow-ups.

### Documentation and validation

Wiki maintenance is part of completing work under [D105](../decisions/index.md#d105-wiki-as-rebuild-specification-29-september-2026). Before handoff:

1. Update existing topic pages for every meaningful requirement, UX, implementation, storage, integration, or validation change. Keep one coherent topic together. Document observable behavior, module boundaries, data ownership/formats, important interfaces, dependencies/setup, failure paths, and acceptance checks sufficiently to rebuild without the conversation or current source. Code links support the specification; they do not replace it.
2. Put the current specification first. Separate user requirements, assistant proposals, researched observations, delegated defaults, verified results, and known gaps. Clearly label superseded discussion and dated research as history. Preserve earlier discussion entries. If code omits accepted behavior, record that gap in its topic and the [current follow-up list](../discussions/open-questions.md); never silently redefine the requirement or claim a fixture proves live account compatibility.
3. Update the [decision register](../decisions/index.md) when a decision changes; mark superseded decisions and link their replacements. Add a dated journal entry explaining what changed and why, including remaining uncertainty. Journals preserve history rather than replace topic specifications. Keep the repository's IMPLEMENTATION.md delivery summary consistent with the [wiki implementation report](../references/implementation.md).
4. Use relative Markdown links and the page metadata format documented in the repository's README.md. Keep references attributable and record unavailable sources honestly.
5. Run checks appropriate to the change and record their actual evidence and limits. After wiki content or reader changes, run `node docs/wiki/_build.mjs`, then `node docs/wiki/_build.mjs --check` before handoff. Include the regenerated `docs/wiki/index.html` with the Markdown changes; never edit it directly.

### Verification and wiki maintenance

The user's jstack adoption request is recorded in [D113](../decisions/index.md#d113-jstack-verification-and-wiki-maintenance-1-october-2026). Follow [Verification setup](../verification/setup.md), using stable IDs and recipes on the existing topic pages rather than a second specification. Select checks from the change and relevant cancel/error/persistence paths. Exercise real entry points, observe underlying effects, record the actual dirty-build fingerprint, and retain credential-free evidence in a dated report. Keep Passed, Failed and Untested distinct; any selected unknown outcome prevents a Passed aggregate. An old pass is historical evidence, not a standing certification.

When maintaining verification, classify documentation drift, a harness gap, product regression or unclear intent before editing. Repair and rerun broken recipes within existing authorization; preserve product expectations and earlier reports. Do not call the same author's work an independent review. Wiki/report checks validate structure and metadata, not whether the product worked. Apply planning/interview conventions when relevant; do not impose a design interview or another permission step on an already authorized fix.

### Tooling boundaries

Never create `node_modules`, `package.json`, or package-manager lockfiles in this workspace or reusable wiki copies. Application dependencies, generated manifests, caches, fixtures, and packages belong outside the repository, using the external Clarity build cache described in [implementation setup](../references/implementation.md).

Wiki tooling requires only Node.js 22+ and the libraries already bundled in `_build.mjs`. Do not run package-manager installs for wiki work, including temporary builds or test setups; do not add a server. Markdown is authoritative and the offline HTML reader is derived output.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### User-stated direction

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

### Proposed guardrails

These are assistant proposals, not accepted requirements:

- Make disabled, disconnected, and unavailable features easy to distinguish.
- Keep authoritative data distinguishable from disposable caches.
- Make conflicts visible instead of silently discarding changes.
- Preserve context when ideas change; record the reason and the replacement decision.

### Tensions to explore

A broad harness can become complicated even when each tool is simple. Folder portability can conflict with machine-specific paths, credentials, live processes, and concurrent editing. These are design questions to resolve, not reasons to abandon the idea.

See [portability](../foundations/portability.md) and [module choices](../foundations/integrations.md).
