---
title: 29 September 2026 — Songs list default
section: Journal
status: Current
updated: 2026-09-29
order: 2026092907
summary: Default Songs search results to a list while retaining the grid toggle.
---
# 29 September 2026 — Songs list default

The user requested a list default for Songs search results, with grid still available. The existing List/Grid button now controls a separate Songs layout choice, initialized to list. The other views retain their existing layout behavior. The choice lasts for the current Music visit, so changing result tabs or submitting another search does not undo an explicit selection; it is not a new persisted setting.

The current contract is on [Music](../features/music.md#screens-and-playback), with the requirement recorded in [D108](../decisions/index.md#d108-songs-default-to-list-view-29-september-2026).

Application and Worker type checks pass. A disposable walkthrough of the packaged app, using controlled music results, verifies the initial Songs list, both toggle directions, independent layouts across result tabs, retention across searches, and reset after leaving and returning to Music. This is a layout-only change; it adds no dependencies or stored settings.

The rebuilt bundle passed code-signature verification and replaced `~/Applications/Clarity.app`. The running user instance was left alone; explicit Quit and reopening loads the update.
