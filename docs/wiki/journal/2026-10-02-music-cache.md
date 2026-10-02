---
title: 2 October 2026 — Music result caching
section: Journal
status: Current
updated: 2026-10-02
order: 2026100201
summary: Reuse Music browse results across navigation, share pending reads and refresh only when needed.
---
# 2 October 2026 — Music result caching

The user reported that switching Music tabs repeatedly sent the same requests and showed Loading. Music used the generic resource hook, which clears data and reloads on each dependency change. Both its list and collection hooks also reloaded on every Music mutation, including player controls. Remembering navigation did not retain the fetched results.

[D123](../decisions/index.md#d123-reuse-fetched-music-results-2-october-2026) requires reuse. The focused Music resource now caches successful reads in renderer memory, shares pending requests and loads only the selected list or collection. Refresh explicitly reloads the visible resource. A 50-entry bound, eviction of old settled reads, no timer/disk persistence, retryable errors and root/source/type/query keys are delegated implementation defaults. The always-mounted Player forwards account changes to cache invalidation; Navidrome configuration now emits a connection event after saving. Music mutations invalidate Home history only. Existing source APIs, credentials and playback engines are preserved.

The [verification run](../verification/runs/2026-10-01T163445Z-music-cache.md) records request counts, delayed-response behavior, account boundaries and development/package outcomes. An initial driver attempt found ambiguous Albums/Artists buttons between library and search filters; selectors were scoped to each group and the recipe rerun without changing expected behavior. These are the implementation author's checks. Controlled HTTP responses prove cache/request behavior, not fresh Spotify/Navidrome live-account compatibility or audio. Other existing provider and platform follow-ups remain separate.
