---
title: 24 September 2026 — No package files
section: Journal
status: Captured
updated: 2026-09-24
order: 80
summary: Make the absence of package files and package installs a permanent constraint.
---
# 24 September 2026 — No package files

## User direction

The user explicitly said they never want `node_modules` or `package.json`.

## Changes

Recorded [D14](../decisions/index.md#d14-no-package-files-or-installs-24-september-2026) and updated workspace instructions, usage documentation, and the reusable wiki topic. Package files and installs are prohibited, including temporary build and test setups. Maintenance uses Node built-ins and the libraries already bundled in `_build.mjs`.

Verified the project contains no `node_modules`, package manifests, or package-manager lockfiles. The existing Node-only build remains the accepted workflow.

## Still open

The reusable skill wrapper's name and distribution location remain undecided. This change does not begin application implementation or choose its stack.
