---
title: 24 September 2026 — Workflow packaging
section: Journal
status: Captured
updated: 2026-09-24
order: 20
summary: Explore reusing the planning process and reader across projects.
---
# 24 September 2026 — Workflow packaging

## Discussion

The user wants to reuse this planning workflow in other projects and asked how to package the Markdown discussion format together with the HTML reader and styles.

Verified that skills support bundled scripts and assets. Proposed a skill containing workflow instructions, an initializer, clean Markdown templates, and the reader/build sources. Each project would receive its own copy and generated HTML, so reading and rebuilding do not depend on the skill remaining installed.

## Current status

The [packaging proposal](../discussions/reusable-planning-workflow.md) separates reusable tooling from project-owned content and preserves the discussion, decision, and journal process. Package name, source location, default project directory, supported agent hosts, and upgrade behavior remain open. No skill or plugin was created or installed.
