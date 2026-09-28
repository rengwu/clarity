---
title: 27 September 2026 — Background app, one folder, and agent board
section: Journal
status: Exploring
updated: 2026-09-27
order: 510
summary: Accept close-to-background and one data root; investigate agent-board call efficiency.
---
# 27 September 2026 — Background app, one folder, and agent board

The user wants Clarity to remain alive in the taskbar/menu bar after its window closes and exit only on explicit Quit. Recorded D63. This keeps ordinary app work independent of main-window visibility; it does not add a service or launch-at-login behavior and cannot guarantee execution during sleep/shutdown.

The user accepted dropping the second development folder: all Clarity state belongs in one chosen root. Recorded D64, superseding D03. Notes/wiki remain actual Markdown files. Internal layout and non-Markdown state representation remain open. Updated AGENTS.md and current topic pages; preserved historical decisions/journals.

For the agent board, the user asks whether it should match slopchan and whether REST, CLI, or direct files optimize tool calls and speed. Recorded the optimization objective as D65, not acceptance of an interface. Inspected local slopchan HEAD 07b6c06, including its API, compact onboarding, full-thread retrieval, backend abstraction, and store definitions. Rechecked platform agent methods, gadget environment, Cap’n Web, and Electron Tray documentation.

Assistant assessment: retain useful topic/thread shared context if the user agrees; no exact clone is needed. Recommend the existing platform method/RPC path for internal agents, with bounded relevant reads, change cursors, and batched detail reads. CLI/REST may serve external agents but do not inherently reduce model/tool round trips. Direct files still need tooling, bounds, and write coordination. No timing measurements or fastest-method claim was made.

Asked whether external agents need access initially. No response yet. Threads versus a summary-only feed, posting behavior, and edit/delete semantics remain open. Proposed append-only posts as a simple option, not an accepted rule. No board implementation, account call, local service, or package installation occurred.
