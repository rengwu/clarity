---
title: 16 October 2026 — Portable UI design system
section: Journal
status: Documented
updated: 2026-10-16
order: 2026101601
summary: Extract the current desktop UI into a self-contained reference for agents in other projects.
---
# 16 October 2026 — Portable UI design system

The user requested a wiki topic describing the UI Clarity has now, specifically so agents from other projects can emulate it. [D132](../decisions/index.md#d132-portable-ui-design-system-reference-16-october-2026) records this documentation scope. The new [UI design system](../foundations/ui-design-system.md) provides exact light/dark tokens, typography and dimensions, component states, pane/scroll geometry, Settings/Chat/launcher/media patterns, feedback timing, keyboard behavior and motion. A receiving-agent brief, visual callouts, reproduction checklist and sharing instructions make the topic usable without Clarity's source tree.

Source inspection used revision `27b83eb469f745968d3e0ce311a1f45952cba542`, including the full stylesheet cascade and shared control/motion implementations. Existing fixture screenshots were visually reviewed, with their original dates and limits retained. The extraction distinguishes existing CSS variables from hardcoded conventions, notes purpose-specific dimensions and switch variations, and labels cross-project adaptation guidance separately from current Clarity behavior. It does not claim newly captured images or an executable component export.

Shared design and spacing details moved from Desktop stack into the new topic; the older headings remain as links for historical reports. Feedback presentation now lives with the design system while runtime interfaces remain on Desktop stack. Settings retains its product groups, connection behavior and validation recipe, linking to the consolidated presentation pattern. Onboarding, the feature map and both implementation summaries point to the new reference. The latest installed-volume and OS-permission follow-ups remain unchanged.

## Validation and limits

Validation on Node.js 22.19.0:

- Source comparison: all 15 documented light/dark color pairs match the stylesheet; current cascade, dimensions and component behavior were inspected alongside retained fixture images.
- `node --test tests/wiki-reader.mjs tests/wiki-reports.mjs`: 13 passed, zero failed or skipped.
- `node tooling/check-reports.mjs docs/wiki`: 30 reports, no errors.
- `node docs/wiki/_build.mjs` and `node docs/wiki/_build.mjs --check`: the 176-page snapshot builds and passes metadata, links, heading anchors, attachment integrity and freshness checks.
- `git diff --check`: no whitespace errors; the change contains only documentation and its generated reader snapshot.

No application source, dependencies, user data, installed package or runtime behavior changed. App/provider tests were not selected for this documentation-only extraction; historical runtime evidence remains tied to its original builds. No independent review, new accessibility certification or mobile design is claimed.
