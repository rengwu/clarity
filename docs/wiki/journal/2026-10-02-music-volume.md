---
title: 2 October 2026 — Investigate source volume differences
section: Journal
status: Current
updated: 2026-10-02
order: 2026100204
summary: Distinguish the shared slider's mismatched gain curves from optional loudness normalization.
---
# 2 October 2026 — Investigate source volume differences

The user reports different Spotify/Navidrome levels and asks whether normalization would help or harm. Source inspection found a concrete curve mismatch: the Spotify helper inherits librespot 0.8.0's logarithmic software volume, while Navidrome uses linear HTML audio volume. Calculating the gains at 70% gives a 14.90 dB difference for identical input. No output was recorded or listening comparison performed.

The [Music topic](../features/music.md#source-volume-and-normalization-2-october-2026) owns the observation, primary-source research and recommendation: align the shared control first, then consider optional fixed metadata gain with peak protection and album/track handling. Spotify normalization is currently disabled; Clarity does not apply Navidrome ReplayGain metadata. Metadata coverage and actual output matching remain unknown. The question does not accept a new normalization feature, so no behavior, settings, music files or installed app changed. The known defect is tracked in current follow-up and implementation summaries.

Validation for this documentation-only investigation is the report checker, wiki rebuild and generated-snapshot check. Earlier playback and playlist reports retain their original scope; they do not certify audio levels.
