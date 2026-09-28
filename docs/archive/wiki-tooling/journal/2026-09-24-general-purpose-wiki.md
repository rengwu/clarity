---
title: 24 September 2026 — General-purpose wiki
section: Journal
status: Captured
updated: 2026-09-24
order: 30
summary: Broaden the reusable wiki beyond planning and reduce its project footprint.
---
# 24 September 2026 — General-purpose wiki

## User direction

The wiki can cover any subject. The user suggested `your-project/docs/wiki` and asked whether package manifests and lockfiles are necessary, preferring the leanest possible setup.

## Revised proposal

The current manifests support build dependencies, not reading the HTML. Proposed distributing one build script with its renderer, sanitization, template, styles, and browser code already bundled. Each project would keep Markdown, that script, and the generated HTML. Rebuilding would require Node.js but no per-project package installation.

Made planning-specific structures optional in the [reusable wiki proposal](../discussions/reusable-planning-workflow.md). Proposed deriving titles and navigation from content, with optional metadata instead of mandatory configuration. Recorded the general-purpose scope and preference for minimal files in [D11](../decisions/index.md#d11-general-purpose-reusable-wiki-24-september-2026).

## Still open

The bundled builder, skill name, distribution location, and update mechanism are not selected or implemented. This session updates the proposal; Clarity continues to use its existing builder and package files.
