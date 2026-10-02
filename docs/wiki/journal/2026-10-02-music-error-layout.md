---
title: 2 October 2026 — Music browse error layout
section: Journal
status: Current
updated: 2026-10-02
order: 2026100206
summary: Group Music failures and retry, identify the source and retain loaded playlists during retry.
---
# 2 October 2026 — Music browse error layout

The user reported a screenshot with available Spotify playlists beneath a bare `fetch failed` message and a retry button touching the artwork. Source review found two presentation gaps: aggregated reads discarded the failed source's identity, and the renderer placed its error paragraph and button directly before the grid. Explicit retry also discarded active partial results because failed reads are correctly excluded from the session cache.

The correction uses one compact notice with a wrapped message, native retry action and space above results. Library/search errors name their source; generic fetch failures have readable connection guidance while specific provider details remain. Partial results and their error remain visible during retry, with disabled actions and a Retrying label. This is an active-view retention change, not a disk cache or a change to account invalidation. [Music's contract](../features/music.md#browse-failure-presentation-2-october-2026) owns these delegated presentation details.

[The focused run](../verification/runs/2026-10-01T180000Z-music-error-layout.md) records controlled native screenshots in both themes/window sizes, retry/request observations, cache regressions, type checks and package delivery. No actual account connection or audio is changed, and this UI correction does not diagnose the underlying live fetch failure.
