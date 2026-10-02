---
title: 2 October 2026 — Music volume consistency and normalization
section: Journal
status: Current
updated: 2026-10-02
order: 2026100205
summary: Apply the accepted shared volume curve, optional fixed normalization and automatic album/track mode.
---
# 2 October 2026 — Music volume consistency and normalization

The user accepted all three recommendations from the source-volume investigation: fix the slider mismatch, add optional metadata normalization and preserve album dynamics with automatic album/track selection. [D124](../decisions/index.md#d124-music-volume-consistency-and-normalization-2-october-2026) records acceptance separately from delegated choices. The current [Music topic](../features/music.md#source-volume-and-normalization-3-october-2026) owns the rebuild contract.

Navidrome now shares Spotify's explicit 60 dB logarithmic volume curve. Native load applies the current volume before starting audio. A saved Settings → Music → Normalize volume checkbox defaults on, changes at the next track, and controls conservative fixed attenuation in both engines. Album contexts use album gain while shuffle/playlists/single songs use track gain. Navidrome retains validated ReplayGain metadata and accounts for its conventional reference level; Spotify uses the existing engine's Basic normalization. Quiet/untagged tracks remain unadjusted. No continuous compressor, audio-file rewrite, provider setting or new runtime dependency is added.

Verification separates concerns: captured native PCM establishes the slider curve and untagged pass-through; the actual pinned Spotify header reader and gain calculation establish known metadata factors; native HTTP/UI fixtures establish album/shuffle selection, settings timing/persistence and Navidrome gain. An initial FLAC fixture could not test Spotify's custom Ogg metadata path because the pinned local decoder ignores string ReplayGain tags; the corrected dedicated header check preserves the expected normalization factors without changing the shipped engine. The external check also needed the same TLS/vergen prerequisites as the helper. A host-fixture observation race was corrected by waiting for the child's load acknowledgment before closing it. Earlier failed attempts are retained in [the run](../verification/runs/2026-10-01T171500Z-music-normalization.md).

Provider metadata is not a promise that different masters, nonstandard ReplayGain references or untagged libraries will sound identical. Actual account tag coverage, speaker output and integrated loudness comparison remain separate live checks. The run owns final build fingerprints, checks and installation evidence; earlier playlist/cache/playback reports retain their own build scope.
