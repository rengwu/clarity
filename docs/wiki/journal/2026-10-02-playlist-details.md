---
title: 2 October 2026 — Restore Spotify playlist details
section: Journal
status: Current
updated: 2026-10-02
order: 2026100203
summary: Fix the boolean track flag being mistaken for a nested song and supply the playlist's own heading metadata.
---
# 2 October 2026 — Restore Spotify playlist details

The user reported that opening a Spotify playlist showed no results. Their screenshot actually showed eight empty track rows and a generic Collection heading. A read-only query of an owned playlist reproduced eight complete songs carrying the additional boolean `track: true`. The shared mapper used `item.track || item`, so each valid song became the boolean true and lost its ID, title, artist, artwork, duration and URI. The generic heading had a separate cause: playlist reads returned tracks only, while navigation retained only the collection identity.

The mapper now reads a raw Spotify object. Endpoint-specific code unwraps current playlist `item`, legacy/saved-song track objects and saved-album envelopes explicitly, preserving boolean fields on direct songs. Null/unavailable songs, podcasts and both wrapper/song local flags are excluded. Playlist reads also retrieve the name and cover once; Liked Songs supplies its known display name. The existing session cache retains the entire result, so revisiting adds no requests. This repairs existing Music requirements without a new product decision, storage format or dependency.

The expanded native regression failed before the source fix at the missing song label, then passed with current and legacy wrappers, pagination, album tracks, Liked Songs and cache reuse. The corrected native UI also rendered all eight songs from the live playlist with names, artists, durations and artwork plus its own heading. The live check ran in an isolated data root, kept the saved library token in main-process memory and issued read-only provider calls; it did not persist real credentials or start playback. [The dated run](../verification/runs/2026-10-01T164530Z-playlist-details.md) owns build hashes, safe counts, fixture screenshots, packaged checks and installation evidence. These are the implementation author's checks; audio, other accounts and the complete playlist surface remain separate evidence.
