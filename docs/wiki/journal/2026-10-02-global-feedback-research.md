---
title: 2 October 2026 — Global feedback research
section: Journal
status: Proposal
updated: 2026-10-02
order: 2026100212
summary: Compare shared errors and informational toasts while reserving the final method for the user.
---
# 2 October 2026 — Global feedback research

The user requested research before choosing a global method for error messages and informational toasts. Source inspection found a single global error string, shared local error text, and separate Settings, Bookmarks and Music feedback paths. The existing adversarial audit also records duplicate/stale Board errors. No new runtime reproduction was performed.

The [shared UI research and proposal](../foundations/desktop-stack.md#global-feedback-research-and-pending-proposal) owns the source findings, primary references, behavior mapping, library comparison and proposed verification. The recommendation combines contextual notices with Radix-based toasts; Sonner and an in-house host remain alternatives. Native modal dialogs need explicit placement handling, and routine status updates should not all interrupt screen readers.

All proposed timings, placement and dependency choices remain unaccepted. Application code, dependencies, installed builds and existing verification outcomes are unchanged. Documentation validation passed: `node tooling/check-reports.mjs docs/wiki` checked 21 reports without errors; `node docs/wiki/_build.mjs` rebuilt 156 pages; `node docs/wiki/_build.mjs --check` verified their internal links and current HTML. These checks establish document integrity, not runtime or accessibility behavior.
