---
title: 24 September 2026 — UI cleanup
section: Journal
status: Captured
updated: 2026-09-24
order: 10
summary: Remove ornament and require a UX purpose for interface text.
---
# 24 September 2026 — UI cleanup

## User feedback

The user asked to remove unnecessary flourishes and ornamental text. All labels, captions, and subtitles must have a justifiable UX reason to exist.

## Changes

Removed the decorative monogram, sparkle, taglines, local-state dots, repeated wiki identification, article subtitles, page-count caption, and blanket planning banner. Removed the repeated offline-reader footer and sidebar explanation. Simplified the remaining typography and removed colored status badges.

The reader keeps the home link, page title, grouped navigation, search, contents, article/source controls, download and print actions, and backlinks. Each supports navigation or a concrete action. Contents are hidden when irrelevant, including search and source view.

Meaningful document statuses and the update date appear as plain footer metadata to help assess maturity and recency. Source-editing instructions appear only in source view, where they explain how to change the document. Search retains result counts, excerpts, and recovery guidance for empty results.

## Decision and remaining scope

Recorded [D10](../decisions/index.md#d10-functional-ui-text-24-september-2026) and added the rule to workspace instructions. This change concerns the planning reader. No application implementation choices were made; the existing [product questions](../discussions/open-questions.md) remain open.
