---
title: 25 September 2026 — Navidrome integration
section: Journal
status: Captured
updated: 2026-09-25
order: 340
summary: Explore Navidrome as an optional music source without selecting it.
---
# 25 September 2026 — Navidrome integration

The user asked about connecting Music to a Navidrome server. This introduces an option for discussion, not a decision to add it or replace Spotify.

Reviewed Navidrome's official overview and client API compatibility documentation, Subsonic authentication, and OpenSubsonic streaming documentation. The APIs expose browsing, searching, and streaming from the user's music collection. Sources and findings are recorded together on the [Music page](../features/music.md#navidrome-candidate-25-september-2026).

The assistant assesses this as a simpler candidate for embedded playback than Spotify, particularly for users who already run Navidrome. Proposed scope is one existing server, library browsing/search, and basic playback including chat control. Server availability, runtime codec/seek compatibility, and authentication still need validation. Server administration and offline downloading would add scope and are not proposed.

Still open: whether Navidrome supplements the original sources or changes Spotify's priority. No application implementation, account connection, or playback test was performed.
