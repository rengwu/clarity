---
title: 24 September 2026 — TiddlyWiki storage
section: Journal
status: Captured
updated: 2026-09-24
order: 50
summary: Compare TiddlyWiki's embedded content with a wiki backed by separate Markdown files.
---
# 24 September 2026 — TiddlyWiki storage

## User question

What does TiddlyWiki do well that helps avoid a build step?

## Findings

Reviewed official documentation for its single-file storage, default saving method, and Node.js folder edition. Recorded the findings and sources in the [reusable wiki proposal](../discussions/reusable-planning-workflow.md#what-tiddlywiki-does).

The key distinction is where authoritative content lives. A reader with embedded content can render immediately; separate Markdown requires a file-access or packaging mechanism. Our current reader already embeds a snapshot, while the Markdown remains authoritative.

## Still open

The storage choice remains unresolved: embedded content, user-selected Markdown folder, or a host/server integration. No switch to TiddlyWiki, change of source format, or reader implementation was made.
