---
title: 25 September 2026 — Spotify playback tradeoffs
section: Journal
status: Captured
updated: 2026-09-25
order: 330
summary: Compare embedded playback and external control without selecting either.
---
# 25 September 2026 — Spotify playback tradeoffs

The user is open to either Spotify playback inside Clarity or controlling an existing player, and requested the pros and cons. Recorded [D45](../decisions/index.md#d45-compare-spotify-playback-options-25-september-2026); this is not a request to implement both.

Reviewed official Spotify playback, device, SDK, and quota documentation plus Spotifast's README and librespot reference. Both choices can keep controls in Clarity. External control avoids hosting the Spotify audio engine but depends on an available player; embedded playback is more self-contained but adds runtime/audio lifecycle work. Both official routes require Premium, and current development-mode user limits complicate eventual shared-app distribution.

The assistant recommends external Spotify control first, alongside local-file playback inside Clarity. This is not an accepted implementation decision. Full comparison, sources, and remaining concerns are on the [Music page](../features/music.md#spotify-playback-tradeoffs-25-september-2026). No application code, account connection, or playback test was performed.
