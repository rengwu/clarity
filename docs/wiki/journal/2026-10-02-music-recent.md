---
title: 2 October 2026 — Restore Recently played cards
section: Journal
status: Current
updated: 2026-10-02
order: 2026100211
summary: Preserve collection metadata and provider IDs, and repair older blank history cards without changing their playback order.
---
# 2 October 2026 — Restore Recently played cards

The user reported empty Home cards with only Spotify/Navidrome labels and then requested a fix. Collection navigation retains source/type/ID, but playback previously saved those arguments directly as history instead of the fetched collection metadata. The record store also replaces `id` with its storage key; returning those records directly to the renderer made a Home card use the prefixed key as a provider ID. Spotify album reads additionally lacked the album's own heading metadata.

Main now saves the resolved collection name/artist/cover, a separate `itemId` and `playedAt`. Artist history retains the original artist even when playback chooses its first album. Track indices stay out of history, so revisiting a collection starts at its beginning. Spotify album metadata uses the existing collection cache. No dependency or broader library capability is added.

The [Music contract](../features/music.md#recently-played-metadata-and-repair-2-october-2026) records delegated compatibility defaults: recover legacy IDs, restore missing titles from connected providers on Home reads, preserve original play dates and protect repairs with record revisions/account generation. Complete entries need no metadata fetch. Unreachable/deleted entries keep their references, show a labelled fallback and can retry; this does not resolve the separate real Navidrome permission issue.

The [focused run](../verification/runs/2026-10-02T041300Z-music-recent.md) owns build-specific persistence, provider-failure/concurrency and native UI evidence, plus package/delivery status. Its first driver attempt exposed an inconsistent optional-field shape between newly repaired and reread results; recent results now return only collection-display fields consistently. The reload driver was also corrected to reopen Music because renderer reload intentionally resets navigation. Existing playlist assertions needed to wait for their second incremental page before counting rows; the expected two songs were retained. These implementation-author checks use isolated stores, fake credentials, controlled providers and safe artwork; they do not certify the user's live-account repair or audibility.
