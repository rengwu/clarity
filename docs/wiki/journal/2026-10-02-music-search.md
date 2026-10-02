---
title: 2 October 2026 — Music search categories
section: Journal
status: Implemented
updated: 2026-10-02
order: 2026100214
summary: Group All search into song, artist, album and playlist previews with explicit result types.
---
# 2 October 2026 — Music search categories

The user reported that Music's uniform cards made songs, playlists, albums and artists difficult to distinguish, and supplied Spotify's grouped search as a reference. [D126](../decisions/index.md#d126-identify-and-group-music-search-results-2-october-2026) records the direction. The selected lean presentation combines explicit type/source labels with nonempty sections in All, using the existing MusicItem type rather than extra provider calls.

[The current contract](../features/music.md#search-result-categories-2-october-2026) defines Songs → Artists → Albums → Playlists, six-result previews, Show all through the existing filter, and preserved source identity and grid/list behavior. Cards identify their kind alongside the provider; browse rows identify their kind before the artist. Same-title songs and albums remain separate. There is no new ranking, recommendation mechanism, persistent setting or dependency.

The existing native cache driver now covers grouped search, duplicate-title labels, keyboard Show all, complete filtered results, source/layout changes, collection/Back, visit-local Songs defaults and empty categories. Safe fixture screenshots cover both themes at normal/minimum widths. [The focused run](../verification/runs/2026-10-02T141800Z-music-search.md) owns exact development/package outcomes, adjacent regression evidence, delivery and harness selector/timing fixes and the isolated-keychain setup used during validation. Provider completeness, fresh accounts and audio output are outside this renderer change.

The final development and packaged search/cache workflows, two adjacent navigation/playlist regressions, both typechecks and standalone package relocation pass. The signed update is installed with seven matching runtime hashes and its predecessor backed up; normal Quit/reopen loads it.
