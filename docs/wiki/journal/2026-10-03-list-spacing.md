---
title: 3 October 2026 — Search and list spacing
section: Journal
status: Implemented
updated: 2026-10-03
order: 2026100302
summary: Consistent search and feedback spacing after an app-wide layout sweep.
---
# 3 October 2026 — Search and list spacing

The user supplied the Agent board's crowded search/empty message and asked to find similar cases throughout the app. Native inspection reproduced a zero-pixel gap on Board and below Notes' root-folder control. News, Bookmarks, Todos, Music and Automations already supplied space through surrounding controls.

The [shared contract](../foundations/desktop-stack.md#search-and-list-spacing-3-october-2026) now gives standalone page searches a 12px bottom margin and shared loading/empty/no-match paragraphs 12px vertical margins. Board's status precedes its list to avoid double spacing through an empty flex container; its populated rows also retain a 12px search gap. Existing toolbars keep their layout. There are no data, dependency, provider or global-feedback policy changes.

The [verification run](../verification/runs/2026-10-02T163455Z-list-spacing.md) owns the actual dirty-build identity, app-wide sweep, selected regression and delivery evidence. This is focused spacing verification, not an exhaustive visual/accessibility or live-account certification. Earlier reports retain their original build-specific meaning.
