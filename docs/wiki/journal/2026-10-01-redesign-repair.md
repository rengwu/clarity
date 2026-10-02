---
title: 1 October 2026 — Repair spike fidelity and Spotify connection feedback
section: Journal
status: Current
updated: 2026-10-01
order: 2026100113
summary: Correct the rejected native port against the spike, verify real motion and distinguish library access from missing playback login.
---
# 1 October 2026 — Repair spike fidelity and Spotify connection feedback

The user reported missing animations, design-system drift, Spotify connection failures and wider quality problems after the first port. This is corrective implementation within the accepted scope; it does not reopen the adoption interview or expand automation inputs.

The repair compares the running browser spike and its source with native Electron screens. Shared motion now covers view entry, sidebar width, task reordering, controls, tooltips and reduced motion. Compact list, document tab, pane, search-field, Music/player and Settings presentation follows the spike measurements. The in-app Wiki reader uses the same palette and density. A scrolling regression from the animated shell was caught and corrected by constraining its grid row and workspace minimum height. Source-pane entry no longer moves its drag handle during initial resizing. Existing data, rich Notes, navigation history, approvals and module services remain required.

The installed Spotify library connection returned 40 live search results, but native playback had no saved grant. The investigation also found that library disconnect erased the independent playback grant; isolated OAuth checks reproduce and verify that fix. This does not establish the cause of the user's missing grant. Settings now groups the separate connections clearly and refreshes mounted views on auth changes. Playback failure messages appear once in the player. Fresh playback sign-in and actual audio remain a stated follow-up, not a claimed fix from provider mocks.

The [repair run](../verification/runs/2026-10-01T154700Z-redesign-repair.md) owns build-specific checks, visual evidence, installation results and limitations. Existing tests needed updated entry points for the New task dialog and SVG-labelled actions, plus the corrected Wiki palette expectation. The new motion check observes real Web Animations/CSS transitions and reduced-motion cancellation instead of inferring motion from screenshots. These are the implementation author's checks, not independent review. Earlier reports remain unchanged as historical evidence.
