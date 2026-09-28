---
title: 24 September 2026 — Planning-wiki skill
section: Journal
status: Captured
updated: 2026-09-24
order: 90
summary: Package the planning workflow in a sibling folder with its standalone reader builder.
---
# 24 September 2026 — Planning-wiki skill

## User direction

Create a folder named `planning-wiki` outside Clarity, in `~/Desktop/Projects`. The workflow will mainly be for planning, reversing the earlier general-purpose emphasis.

## Changes

Created `~/Desktop/Projects/planning-wiki/SKILL.md` and `assets/_build.mjs`. The skill records how to initialize and maintain a project's planning wiki, distinguish proposals from decisions, preserve discussion history, and rebuild the offline reader. Its builder asset includes the reader, styles, bundled libraries, and licenses. No package files, package installs, server, or additional runtime dependency were introduced.

Recorded [D15](../decisions/index.md#d15-planning-wiki-skill-folder-24-september-2026) and marked D11's workflow emphasis partially superseded. The reader remains general enough for arbitrary topics; the skill supplies the planning conventions. Clarity keeps its existing wiki.

## Still open

Global installation and broader distribution have not been requested or performed. The workflow can be used by pointing an agent at its `SKILL.md`. Clarity's application scope and implementation choices remain open.
