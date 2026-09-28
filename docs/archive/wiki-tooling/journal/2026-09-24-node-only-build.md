---
title: 24 September 2026 — Node-only build
section: Journal
status: Captured
updated: 2026-09-24
order: 70
summary: Accept and implement a portable builder with Node as the only prerequisite.
---
# 24 September 2026 — Node-only build

## User direction

The user accepted a build script with Node as the only dependency, then asked to continue. This resolves the prior conflict between automatic file discovery and a standalone browser reader.

## Changes

Moved the wiki to `docs/wiki`. Created one `_build.mjs` containing the existing Markdown parser and sanitizer, their license information, the reader, and its styles. The script scans Markdown in its own directory and generates a standalone `index.html`. Plain Markdown and arbitrary topic folders work; Clarity-specific metadata remains optional and supported.

Removed the old per-project npm setup and separate reader/build files. Updated workspace instructions and usage documentation to the Node build/check commands. Kept earlier discussion entries and marked D12's no-build requirement superseded by [D13](../decisions/index.md#d13-node-only-build-24-september-2026).

## Verification

Built and checked all 32 wiki pages after removing the npm setup. Copied the builder to an isolated wiki and ran it from an unrelated working directory with only Node available. Verified plain Markdown, optional metadata, nested and encoded paths, links and anchors, sanitization, deterministic output, and stale-output detection. File-URL DOM interaction checks covered navigation, search, source view, and missing-page recovery. Synara's browser host was unavailable, so no visual browser verification was performed in this session.

## Scope

The Clarity application remains unbuilt. The general-purpose wiki builder is reusable now; creating and installing a skill wrapper remains separate work.
