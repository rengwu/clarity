---
title: Verification and wiki maintenance
section: Features
status: Current
updated: 2026-10-01
order: 120
summary: Project-local verification recipes, build fingerprints, dated outcomes and an offline evidence reader.
---
# Verification and wiki maintenance

Stable ID: **FEAT-verification-workflow**.

## Intent and basis

The user requested applying jstack to this repository, especially verification and wiki maintenance ([D113](../decisions/index.md#d113-jstack-verification-and-wiki-maintenance-1-october-2026)). Keep the existing Markdown topics authoritative. Verification adds reproducible evidence, without rewriting product requirements or treating documentation checks as application acceptance.

## Entry points and prerequisites

Use the commands in [Verification setup](../verification/setup.md). Reader/report checks need Node.js 22+ only. Product checks use the existing external dependencies. `tests/wiki-ui.mjs` uses installed Chrome through the external Playwright dependency to open the generated reader as a local file; it does not require a server or package install. A browser driver missing from another machine is an explicit prerequisite failure.

## Expected outcomes

Each affected feature has a stable ID, intent/basis, entry points, expected outcomes, concrete recipe, limits and dated history. Reports identify the actual build including dirty content fingerprints, isolate mutable instances, preserve per-scenario outcomes and evidence, and distinguish harness faults from product failures. Failed/untested scenarios cannot be called passed by changing a label or accepting current buggy behavior.

The reader remains self-contained and offline. Preserve Markdown navigation, headings, search, backlinks, source/download/print controls and sanitization. Generic metadata renders escaped labels, including verification `result`; only the separate report checker interprets allowed outcomes. Appearance offers Automatic/Light/Dark and remembers the preference. Local attachments under `attachments/` or `evidence/` open as separate files, are checked for existence/path safety and hashed into the snapshot. Changed evidence makes `--check` fail until rebuild. Share the attachment directories with the HTML when evidence access matters.

## Verification recipe

Execute the wiki/report commands from setup. Reader tests create isolated tiny wikis and verify navigation, duplicate anchors, stale-source/evidence detection, generic escaped metadata, missing files/dates/links, symlink/escape/executable rejection, and both supported attachment directories. Checker tests cover all three outcomes, invalid/missing/duplicate fields, custom report paths, and empty/missing directories. Their temporary fixtures are removed after each test.

After building the actual Clarity wiki, run `node --test tests/wiki-ui.mjs`. Open the local HTML, search for the feature map, navigate to a dated report, inspect the visible result, follow a linked evidence file, switch source/read views, and test saved dark appearance after reload. The driver also checks a narrow viewport and captures a fixture-safe screenshot in the external cache. Close the browser in `finally`.

## Coverage and limitations

These checks prove the selected reader/report behavior and executable verification recipes. They cannot prove every product feature, evidence truth, remote artifact availability or live provider compatibility. No independent verifier performed this adoption. Planning/interview instructions are workflow conventions, not runtime product features.

## Verification history

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md), with dirty-build fingerprints and selected evidence. Earlier audit findings are preserved in the [audit register](../references/ui-audit.md).
