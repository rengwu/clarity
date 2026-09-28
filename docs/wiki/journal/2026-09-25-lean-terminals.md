---
title: 25 September 2026 — Lean terminals
section: Journal
status: Captured
updated: 2026-09-25
order: 400
summary: Propose app-owned terminal sessions and distinguish saved output from live persistence.
---
# 25 September 2026 — Lean terminals

The user asked for the simplest leanest terminal-session implementation. Revisited chartr's README and inspected its private-Herdr architecture decision and harness session-export code, alongside official xterm.js and node-pty documentation.

The assistant proposes an existing terminal renderer connected to app-owned PTYs, a minimal session list/tabs, project working directories, and saved traces. Sessions would keep running across navigation but end on full app quit. This avoids adopting chartr's independent daemon and live-reattachment machinery. It is a proposal, not an accepted lifetime or framework decision.

Raised the material distinction between saved terminal output, a live process, and a structured agent conversation. Full-screen terminal redraws do not automatically produce readable transcripts; harness-native logs/exports require separate support. Retain the original trace requirement while resolving its exact scope.

Findings and sources are on the [Terminal sessions page](../features/terminals.md). No Clarity code, package installation, or terminal prototype was created. Next resolve process lifetime and the minimum trace behavior before moving to the agent board and automations.
