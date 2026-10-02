---
title: 2 October 2026 — Spotify playlist details
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100203
summary: Reproduce eight blank live playlist rows, restore metadata and verify current/legacy response shapes, cache reuse and the installed package.
---
# 2 October 2026 — Spotify playlist details

## Scope

Resolve the user's Spotify playlist screenshot under **FEAT-music** and the existing [playlist-detail contract](../../features/music.md#spotify-playlist-details-2-october-2026). Selected scenarios cover song/playlist metadata, boolean `track` fields, current/legacy envelopes, pagination and exclusions, album/Liked Songs compatibility, cached revisits, existing connector behavior and packaged delivery. This is a defect in existing behavior, not a new playlist or playback feature.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5. The run ID is UTC; the local journal date is 2 October in Asia/Kuala_Lumpur. Source and dependencies follow the external-cache boundary. Application SHA-256: `7da8cfb559942858c281e629609648c06df9425038c936135b0530e74c8567ca`. Verification SHA-256: `fd039d730b1fd00f7e0d53f5d39a1f914c1206e4efa1bef152f577deaca72ad1`. The [pre-test](../../evidence/2026-10-01T164530Z-playlist-details/build-before.json), [package](../../evidence/2026-10-01T164530Z-playlist-details/build-package.json) and [final](../../evidence/2026-10-01T164530Z-playlist-details/build-final.json) fingerprints match for both. This was an existing dirty checkout; the manifest, rather than HEAD alone, identifies the selected build.

The controlled tests launch isolated Electron roots and intercept HTTP responses, preserving actual Music normalization, UI and playback-error routing. The live check also uses an isolated root: a dummy local OAuth grant enables the connection, while the existing unexpired Spotify library token replaces the Authorization header only inside main-process memory. Only actual read-only provider requests leave the process. The real credential file is neither refreshed nor copied into the fixture root. Evidence records field names, types, presence/counts and HTTP statuses, excluding account names, playlist/song names, IDs and tokens. No live playback is started.

Executed: `node tooling/clarity.mjs build`, `node tooling/clarity.mjs check`, `node --test --test-concurrency=1 tests/connectors.mjs tests/music-cache.mjs`, the isolated live native playlist walkthrough, `node tooling/clarity.mjs package`, the playlist regression with `CLARITY_CONNECTOR_EXECUTABLE` / `CLARITY_CONNECTOR_MAIN` selecting that bundle, and `node --test tests/package.mjs`. Logs: [build](../../evidence/2026-10-01T164530Z-playlist-details/build.log), [types](../../evidence/2026-10-01T164530Z-playlist-details/typecheck.log), [five Music/connector checks](../../evidence/2026-10-01T164530Z-playlist-details/music-checks.log), [live native check](../../evidence/2026-10-01T164530Z-playlist-details/live-ui.log), [package build](../../evidence/2026-10-01T164530Z-playlist-details/package-build.log), [packaged playlist](../../evidence/2026-10-01T164530Z-playlist-details/packaged-playlist.log), [relocation](../../evidence/2026-10-01T164530Z-playlist-details/package-checks.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Reproduce user's blank rows | Establish whether Spotify omitted data or Clarity dropped it | Live owned playlist returns eight complete songs, all with boolean `track: true`; the old mapper retains zero names. The expanded native test fails before the fix waiting for the song label | Passed |
| Correct live native display | Show existing songs and the playlist's own metadata | All eight rows have names, artists, durations and artwork; playlist name/cover present; zero visible errors | Passed |
| Current and legacy wrappers | Preserve metadata after unwrapping an object once | Current `item` and legacy `track` wrappers both contain `track: true` songs; two rows across separate pages show expected titles, artist, artwork and 3:45 duration in development and package | Passed |
| Exclude non-song/unavailable entries | No blank or unsupported queue rows | Null entries, empty names, episodes and local flags at either wrapper or song level are excluded; valid rows retain page order | Passed |
| Liked Songs and album tracks | Preserve direct and saved-track responses | Both normalize to the expected song ID/title/artist/225-second duration/artwork; Liked Songs has its named heading | Passed |
| Cached revisit | No metadata or track refetch on Back/reopen | Controlled and live UI revisits add zero provider requests; existing full cache driver passes | Passed |
| Retained connections and playback errors | Existing auth and player behavior still pass | All five selected Music/connector tests pass, covering OAuth renewal/persistence, independent grants, playlist playback failure feedback, Navidrome fixture streaming/seek and cache/account boundaries | Passed |
| Type/build/package | Valid application and independent signed package | Application/Worker typechecks, packaged playlist scenario and package relocation/signature/helper/persistence check pass | Passed |
| Installation | Install exact tested bytes and retain the preceding app | Signature passes and all seven installed runtime hashes match the package; prior bundle preserved | Passed |

The [live shape diagnosis](../../evidence/2026-10-01T164530Z-playlist-details/live-shape.json) identifies the actual boolean field and raw metadata presence. [The before-fix test](../../evidence/2026-10-01T164530Z-playlist-details/before-fix.log) demonstrates the regression with that shape. [Live UI observations](../../evidence/2026-10-01T164530Z-playlist-details/live-ui.json) verify the corrected data in the native view without retaining personal music metadata. The library's multiple initial requests in that record are pagination; the selected playlist uses one metadata request and one item-page request, and its revisit adds none.

Controlled evidence: [development rows/requests](../../evidence/2026-10-01T164530Z-playlist-details/development/playlist-observations.json), [development screenshot](../../evidence/2026-10-01T164530Z-playlist-details/development/playlist-details.png), [packaged rows/requests](../../evidence/2026-10-01T164530Z-playlist-details/packaged/playlist-observations.json), [packaged screenshot](../../evidence/2026-10-01T164530Z-playlist-details/packaged/playlist-details.png). The screenshots demonstrate the heading and row presentation; assertions/request counts establish behavior. This is the implementation author's verification, not independent review.

Wiki reader/report tests, report metadata validation, rebuild and current-snapshot check pass. [Tooling tests](../../evidence/2026-10-01T164530Z-playlist-details/wiki-tests.log) validate documentation structure rather than live provider behavior.

## Limits and follow-up

[Installation](../../evidence/2026-10-01T164530Z-playlist-details/installation.json) records `~/Applications/Clarity.app` and backup `~/Library/Caches/Clarity/build/Clarity-before-playlist-details-20261001T164530Z.app`. Normal Quit/reopen loads the correction. This run does not launch the newly installed bundle with the user's root or verify live audio; the isolated live walkthrough verifies the playlist display through the rebuilt source, while package tests establish the signed bundle's behavior. Previous installed-playback evidence applies to its recorded earlier build.

One live owned playlist is verified; other playlists/accounts, real Navidrome, provider outages, fresh library authorization, speaker audibility and unrelated modules remain outside this focused run. No full unrelated app suite is claimed. Spotify's [playlist items reference](https://developer.spotify.com/documentation/web-api/reference/get-playlists-items) supports the nested item/pagination contract; the boolean `track` flag is established by the observed live response, not inferred from that documentation. No new dependency, provider data store or credential format was introduced.
