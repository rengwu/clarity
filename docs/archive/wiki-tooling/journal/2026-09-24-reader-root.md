---
title: 24 September 2026 — Reader root
section: Journal
status: Captured
updated: 2026-09-24
order: 60
summary: Confirm Markdown as the content source and reject folder selection.
---
# 24 September 2026 — Reader root

## User direction

Markdown must remain the single source of content. `index.html` should automatically use its own directory as the wiki root and parse Markdown there. No folder-selection step.

## Evidence and constraint

Inspected Synara's current local-preview source: it scopes file requests to the HTML's directory but rejects directory requests. A known root URL therefore does not provide automatic file discovery. See the [source and implications](../discussions/reusable-planning-workflow.md#confirmed-target-and-unresolved-file-access).

## Outcome

Recorded [D12](../decisions/index.md#d12-markdown-source-and-automatic-root-24-september-2026), marked the folder-picker proposal rejected, and kept earlier journal entries intact. A directory-listing host/server or an explicit Markdown page index remains to be resolved. No server was introduced and the current reader has not been replaced with an implementation that cannot meet these requirements.
