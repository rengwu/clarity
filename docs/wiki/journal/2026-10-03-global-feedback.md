---
title: 3 October 2026 — Shared feedback with Radix Toast
section: Journal
status: Implemented
updated: 2026-10-03
order: 2026100304
summary: User-selected Radix Toast with shared contextual notices, accessible controls and native-window-aware timing.
---
# 3 October 2026 — Shared feedback with Radix Toast

Following the requested research, the user selected Radix Toast. [D130](../decisions/index.md#d130-shared-feedback-with-radix-toast-3-october-2026) records that choice; the [desktop specification](../foundations/desktop-stack.md#global-feedback-standard-3-october-2026) owns the delegated placement, timing and queue defaults.

One provider now serves global feedback. Existing local ErrorText consumers use a common Notice, Board reply errors connect to their field, and Music retains its local source/retry presentation. News and Bookmarks emit completion toasts for explicit refreshes. Required correction stays in the relevant form or persistent notice, including a recoverable workspace banner inside an active native modal.

The native check found that Electron could keep document visibility/focus unchanged after its window hid. A read-only window-status bridge therefore pauses and suspends feedback using actual native events. Toast reading time also pauses on hover/focus and through native dialogs. Long descriptions scroll within a bounded area so dismissal stays reachable at the minimum window size.

The [focused run](../verification/runs/2026-10-02T173355Z-global-feedback.md) records exact source/package identity, 24 passing selected regressions, two passing packaged feedback tests, relocation/persistence checks and retained evidence. The regression work also corrected an empty viewport intercepting clicks and moved hover/focus handlers above the React portals. DOM announcements and keyboard checks do not establish VoiceOver compatibility; live-provider behavior and unexpected whole-renderer crash recovery are outside this run. The package remains in the external cache; no installed application was replaced.
