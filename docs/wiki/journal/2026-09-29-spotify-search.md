---
title: 29 September 2026 — Spotify search fix
section: Journal
status: Verified
updated: 2026-09-29
order: 2026092904
summary: Fix a rejected Spotify search, update playlist reads, and expose provider error details.
---
# 29 September 2026 — Spotify search fix

The user reported `Spotify request failed (400)` when searching Music for “michael,” then supplied the Spotify developer configuration. Its library callback matched Clarity. The fault was in Clarity's request: it asked for 20 results per kind while the current Development Mode maximum is 10. The generic error handler discarded the useful provider explanation.

A read-only diagnostic using the connected account confirmed the cause: 20 returned `400 Invalid limit`; 10 returned 200 with tracks, albums, artists, and playlists. It did not alter the account, refresh credentials, or start playback. The request now uses 10. Related inspection found the obsolete playlist `/tracks` route; collection loading now uses `/items` and accepts its nested item shape, retaining saved-track and album compatibility. Null/non-music/local-file entries are excluded from the music queue.

API errors now retain Spotify's explanation when present and fall back to the HTTP status for non-JSON responses. This fixes diagnosis without adding UI controls or connection policies. There is no scope change or new product decision. Current contracts and attributable API references are on [Music](../features/music.md#spotify-api-compatibility-29-september-2026).

Validation: three connector tests pass, including the new Electron search/playlist/error regression, plus the existing music source-switch test and application/Worker type checks. The live query validates catalogue access with the existing connection; native Spotify playback and the complete OAuth/library surface remain distinct validation items.

The rebuilt macOS package passed signature, relocation, system-only PATH, persistence, and immediate-Quit note-saving checks. It replaced `~/Applications/Clarity.app` after staged signature/content verification, with the previous bundle retained outside the repository. The running user instance was left open; explicit Quit and reopening loads the fix. The planning reader was rebuilt and checked at 98 pages. No dependency was added.
