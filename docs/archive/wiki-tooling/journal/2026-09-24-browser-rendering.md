---
title: 24 September 2026 — Browser rendering
section: Journal
status: Captured
updated: 2026-09-24
order: 40
summary: Explore eliminating content builds through a browser-based Markdown reader.
---
# 24 September 2026 — Browser rendering

## User question

Can the wiki eliminate its build step and generate the pages from Markdown when the user opens `index.html`?

## Findings and proposal

Browser-side rendering can remove content compilation. Portable access to separate local files requires an explicit user selection rather than assuming access to neighboring files. Proposed a fixed HTML reader with an Open folder control that builds navigation, rendered pages, and search in memory.

Recorded the browser constraints, directory-picker and file-input options, refresh behavior, and sharing tradeoff in the [reusable wiki proposal](../discussions/reusable-planning-workflow.md#earlier-folder-picker-proposal-rejected), with links to the browser documentation consulted.

## Remaining questions

Is selecting a folder acceptable, or must the wiki open directly into all content without further interaction? Does the intended Synara runtime support the necessary picker flow? No implementation or architectural decision was made. Clarity's current generated reader still uses the existing build process.
