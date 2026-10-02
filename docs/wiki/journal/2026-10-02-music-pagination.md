---
title: 2 October 2026 — Large Spotify collections
section: Journal
status: Current
updated: 2026-10-02
order: 2026100208
summary: Show Spotify collections page by page, remove the 100-page cutoff and share fetched songs with playback.
---
# 2 October 2026 — Large Spotify collections

The user reported that Liked Songs remained loading, then clarified that it succeeded after about 30 seconds but stopped at 4,999 songs without loading more on scroll. The implementation collected up to 100 sequential 50-entry pages before returning. Filtering unavailable entries can explain a displayed count below 5,000; this investigation did not inspect the particular excluded song in the user's account.

Spotify album and playlist browsing now returns one page at a time. Liked Songs has its title immediately; the first songs appear when their page completes. Scrolling near the bottom fetches the next page, with a Load more fallback and a count. Failure preserves the existing rows and offers retry beside the continuation controls. There is no local page-count cutoff. Row components retain unchanged content as pages append.

A main-process cache retains successful/pending pages and playlist metadata by collection, with bounded collection retention and account/refresh invalidation. The existing complete playback queue reuses these pages. Starting playback before the remaining collection has been fetched can still wait for those pages; progressive queue construction is outside this browsing fix. No persistent music database or new dependency is introduced.

[Music's current specification](../features/music.md#large-spotify-collections-2-october-2026) owns the loading and cache contracts. [The focused run](../verification/runs/2026-10-01T182000Z-music-pagination.md) records real scrolling through a 5,055-song controlled library, failure/retry and account boundaries, source fingerprints, packaged checks and delivery. Concurrent Navidrome connection and stale audio-event changes were preserved, with a separate external build cache preventing output mixing. Fixtures do not establish this user's actual Spotify latency or listener-confirmed audio.
