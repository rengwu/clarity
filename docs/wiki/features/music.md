---
title: Music
section: Features
status: Exploring
updated: 2026-09-27
order: 90
summary: One lean Spotify and Navidrome client with source-labelled browsing and playback.
---
# Music

## Cloudflare OS reassessment · 27 September 2026

**Spotify must play audio inside Clarity ([D61](../decisions/index.md#d61-spotify-plays-inside-clarity-27-september-2026)).** Controlling a separate Spotify app/device is not the selected experience. The existing Connect-only integration does not fulfill this requirement by itself. The embedded playback engine and packaged Electron compatibility remain implementation checks; no engine is selected or tested yet.

**Navidrome uses a simple address-and-sign-in flow ([D62](../decisions/index.md#d62-simple-navidrome-address-connection-27-september-2026)).** Accept a user-provided HTTP or HTTPS server address, use the account credentials, and attempt the connection. Do not ask whether the server is local, on a home network, or public. If it cannot connect or sign in, show the resulting failure so the user can correct the address or credentials and retry. No discovery, hosting wizard, or network-classification step is requested.

Keep one active playback source and source-owned playlists as agreed. These decisions settle the user experience, not a new playback implementation or permission to start building.

## Stated intent

Combine Spotify and Navidrome in one simple Music client, with optional source connections, shared views, and clear source identification for every item ([D47](../decisions/index.md#d47-combined-music-client-scope-25-september-2026)). The app is currently for private use shared with friends. [D48](../decisions/index.md#d48-lean-music-scope-and-private-use-25-september-2026) removes direct local-file playback, accepts flat playlists, and resolves recent history and source switching. Public-product policy review is deferred at the user's request.

The earlier comparison under D45 is resolved by [D61](../decisions/index.md#d61-spotify-plays-inside-clarity-27-september-2026): Spotify audio plays inside Clarity. Chat search and play remain accepted under D17.

The references are primarily for **copying or emulating the most robust core implementation**, not reproducing an entire client's UI ([D46](../decisions/index.md#d46-music-core-implementation-references-25-september-2026)). Keep Clarity's own Music interface and scope lean. No project has yet been established as the most robust or selected for reuse.

## Current screen scope

**User-stated requirements:**

| Surface | Required behavior |
| --- | --- |
| Connections | Authenticate Spotify and sign into Navidrome using any supplied HTTP/HTTPS server address and account; attempt connection without a network-type question. Connections remain optional. |
| Player bar | Volume, playback order including shuffle, previous, play/pause, and next. Exact additional order modes remain to be specified. |
| Albums and playlists | Combined-source browsing with list/grid views. Include the user's Spotify-created playlists and treat Liked Songs as a playlist in the UI. Flat playlists are accepted; nested folders are no longer required. |
| Single album or playlist | A simple view of the selected source collection and its tracks. Screenshots are references, not permission to import all controls, metadata, or decoration. |
| Artists | Search artists across the Navidrome library and Spotify's full catalogue, without relying on followed Spotify artists. If an artist occurs in both, show separate source-labelled entries. Artist-detail contents and playback behavior still need definition. |
| Search | Search Spotify's full catalogue and the connected Navidrome library, with four tabs: Playlists, Albums, Artists, Songs. A default combined “smart” tab is tentative. |
| Home | A grid of recently played playlists, albums, or artists, recorded from playback through Clarity. Use this simplest local history; do not reconcile playback from other apps. |

The user's final clarification that **all views include both sources** supersedes the earlier Navidrome-only Albums idea in the same message. Every result/item on every screen needs a clear source indication. Pills, colored borders, and a Source table column are options raised by the user; none is selected. This Home is within Music; Clarity still opens to chat.

Collections faithfully reflect their sources. No playlist may combine Spotify and Navidrome tracks, and Clarity must not invent hybrid playlists or collapse source-specific artist entries. Playlists are stored on Spotify or Navidrome, not as locally owned Clarity playlists. Their storage location does not itself add a playlist-editing UI to the agreed screens.

### Playback and local state

**Accepted under D48:** keep one active playback source. Selecting an item from the other source stops the current source and switches the playback context, in either direction. Next/shuffle stay within the selected source collection. This is not a mixed-source playlist or an automatic cross-source queue.

**Accepted under [D49](../decisions/index.md#d49-music-search-and-single-song-playback-25-september-2026):** playing an individual song from search plays that song and stops at its end. Do not automatically continue through other search results, start radio, or generate recommendations. Playing an album or playlist continues through that selected collection. The user wants simple behavior with no surprises.

The user delegated recently played to the simplest lean method, accepting the proposed Clarity-only history. Record the source and collection reference when playback starts through Clarity, and show most recently played collections first. Merely browsing a collection does not count as playing it. This local history does not make Clarity the owner of the referenced playlists. No provider-history reconciliation or local playlist persistence is required.

### Feasibility findings for the combined scope

Reviewed official sources on 25 September 2026; no account or playback tested.

- **Spotify saved albums exist.** The [saved albums endpoint](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-albums) lists the user's saved collection. Proposed Albums library mapping: these saved albums plus albums accessible on Navidrome. No need to infer saved albums from listening history.
- **Liked Songs needs its own retrieval path.** Spotify exposes [saved tracks](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks); displaying them as a playlist does not require creating an actual playlist or altering the source.
- **Folder limitation resolved by scope.** Spotify's [playlist documentation](https://developer.spotify.com/documentation/web-api/concepts/playlists#folders) excludes folders from the Web API. D48 accepts a flat list, so unofficial folder reconstruction is no longer needed.
- **Policy discussion deferred.** The earlier concern and [Developer Policy source](https://developer.spotify.com/policy) are retained as research history. Under D48, the user wants to proceed with private use shared among friends and revisit this discussion only if a public product is considered. It is not an active planning blocker. This records the user's scope and deferral, not a finding about policy applicability.
- **Playlist visibility and search are distinct.** Spotify's [current-user playlists endpoint](https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists) returns owned or followed playlists; the user's requested library is their created playlists plus Liked Songs. D49 establishes broader catalogue search without changing that library scope. OpenSubsonic provides [search3](https://opensubsonic.netlify.app/docs/endpoints/search3/) for songs/albums/artists and [getPlaylists](https://opensubsonic.netlify.app/docs/endpoints/getplaylists/) for accessible playlists. Proposed lean handling is to match playlist names from that list, rather than introduce a custom search service.

### Lean proposals, not yet accepted

- Use a small text source badge on cards/results and a Source column in tables. Color may reinforce the label, but should not be the only way to identify the source. Border-only styling risks ambiguity with selection/focus.
- Keep the optional combined search tab to simple sections for the four types if adopted; no AI ranking or recommendation system is implied by “smart.” Catalogue-wide Spotify search is accepted under D49.

The main technical concern is coordinating two playback implementations behind a small bar, especially if Spotify controls another device. Authentication, failed source switches, and state updates need validation; do not hide the cost by promising that reusing a client makes this automatic. Spotify access limits from the earlier research still apply.

## Spotify playback tradeoffs · 25 September 2026

Both approaches can keep search, selection, and playback controls in Clarity or chat. The distinction is which process/device produces the audio. The following comparison is an assistant assessment, informed by the sources below; no implementation has been selected or tested.

| Consideration | Play Spotify inside Clarity | Control an existing Spotify player |
| --- | --- | --- |
| Everyday use | A self-contained listening experience; no separate Spotify player needed for this computer. | Clarity acts as the controller; a supported Spotify app, web player, or Connect device must be available. |
| Implementation | Add and maintain a streaming player alongside authentication, search, and controls. | Authentication, API controls, and playback-state updates; the other player handles streaming and audio. |
| Failure handling | Token expiry, player initialization, audio interruptions, and runtime compatibility. | Unavailable/restricted devices, stale playback state, and commands that fail or arrive out of order. |
| Quitting Clarity | Playback hosted in its process stops; keeping a separate player alive would add scope. | The external player can continue independently. |
| Resource use | Audio work runs in Clarity; avoids needing a second player app. | Keeps audio work out of Clarity, but a separate Spotify app still consumes resources. Lower Clarity memory does not imply lower total memory. |
| Lean fit | Worth considering if self-contained playback is important enough to justify the extra integration. | The smaller initial Spotify integration, especially when the user already runs Spotify. |

### Official approaches and their limits

Spotify's [Web Playback SDK](https://developer.spotify.com/documentation/web-playback-sdk) creates a Spotify Connect player inside a browser. Its [reference](https://developer.spotify.com/documentation/web-playback-sdk/reference) documents initialization failures when encrypted-media support is missing and possible autoplay restrictions. **Assessment:** support in normal browsers does not establish support in whichever desktop webview Clarity chooses. Validate that runtime before adopting embedded Spotify playback. This is separate from playing ordinary local audio files.

For external control, the [Player API](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback) can start a track/context on an active or specified device. Clarity can therefore remain the user-facing control surface; control does not mean switching to Spotify for every action. The [device endpoint](https://developer.spotify.com/documentation/web-api/reference/get-a-users-available-devices) notes that some models are not returned and restricted devices reject commands. A lean implementation needs a clear unavailable-player state; a full device-management UI is not automatically required.

Both official playback routes require Spotify Premium: [SDK setup](https://developer.spotify.com/documentation/web-playback-sdk/tutorials/getting-started) and the Player API state this requirement. API-driven control is not a way around it.

**Shared distribution constraint:** current [quota documentation](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) limits new development-mode apps to five allowlisted users and requires the app owner to have Premium. Extended quota access has substantial organizational eligibility requirements. A personal app is a plausible initial setup; neither playback choice guarantees a frictionless shared integration for all future Clarity users. Developer-app ownership/onboarding remains undecided.

### What Spotifast does

[Spotifast](https://github.com/crmne/spotifast) uses a native Rust audio player through [librespot](https://github.com/librespot-org/librespot), and also supports controlling other Connect devices. Its README distinguishes playback, API, and backend modules. This shows another embedded-player route, not a small official desktop playback component we can assume works in Clarity.

**Assessment:** adopting librespot would introduce an unofficial Spotify client library and its audio/session lifecycle. It may avoid a browser playback engine, but still adds integration, packaging, and maintenance work. Copying Spotifast's complete player would conflict with the current lean scope. No librespot adoption is proposed as an automatic consequence of referencing Spotifast.

### Earlier recommendation — not selected

The assistant previously proposed Spotify control of an existing player alongside direct local-file playback. D48 removes the local-file portion from scope; D61 now selects playback inside Clarity. The engine remains undecided. The combined client must support the accepted explicit switch between Spotify and Navidrome, with no speculative plugin infrastructure or requirement to implement both Spotify playback modes.

## Navidrome candidate · 25 September 2026

**Historical inquiry:** consider integrating with a Navidrome server. The later [D47](../decisions/index.md#d47-combined-music-client-scope-25-september-2026) replaces this tentative source status with a desired combined Spotify/Navidrome client, subject to feasibility. Findings below preserve the earlier investigation.

Navidrome's [documented client API](https://www.navidrome.org/docs/developers/subsonic-api/) supports browsing artists/albums, searching tracks, cover art, and streaming. Clarity could act as a small client, playing audio on the user's computer while Navidrome supplies the library. Use the supported Subsonic/OpenSubsonic interface rather than Navidrome's internal web-app API. Extension availability varies; do not assume every OpenSubsonic feature is implemented.

**Assistant proposal:** connect one existing server with its URL and account credentials, browse/search the library, and play with a small set of controls in Clarity. Chat can search and start playback through the same connection. Server setup/administration, offline downloads, playlist editing, and multi-server merging are not proposed for the initial scope.

The standard [Subsonic authentication flow](https://www.subsonic.org/pages/api.jsp) uses a username and password-derived salted token. This avoids Spotify developer-app onboarding. Credential storage remains an app-wide open question; no authentication implementation is selected.

### Fit and tradeoffs

**Assessment:** Navidrome looks simpler than embedded Spotify for in-app playback: its [stream endpoint](https://opensubsonic.netlify.app/docs/endpoints/stream/) supplies ordinary media data rather than requiring Spotify's playback SDK. It still requires an audio player and handling connection failures. Actual codec support, seeking, and authenticated streaming must be validated in the eventual desktop runtime.

Navidrome serves the user's own music collection, not Spotify's catalogue. An existing server must be running and reachable; remote use depends on connectivity. Its [overview](https://www.navidrome.org/docs/overview/) documents server-side transcoding, which can help with incompatible formats but moves processing to the server. Streaming does not automatically provide offline listening. Browsing is based on music tags, not the original folder tree.

This fits the optional-integration direction: Clarity's own state can remain local while music is supplied by an external server. It does not introduce device synchronization. Keeping the library on Navidrome would avoid requiring a full local copy as part of this proposed integration.

**Earlier assistant recommendation:** consider Navidrome for simple playback inside Clarity. The subsequent D47 requests it alongside Spotify; implementation remains undecided. No server was connected and no playback was tested.

## Open-source client survey · 25 September 2026

**User request:** find open-source projects that handle lightweight Spotify or Navidrome playback well, with Spotifast and Yuzic as starting references. Reviewed upstream READMEs, repository/release metadata, and selected dependency manifests. No client was installed, benchmarked, or connected to an account. Rankings below are assistant assessments of relevance, not measured speed or reliability.

### Spotify candidates

| Project | Observed approach | Relevance to Clarity and limits |
| --- | --- | --- |
| [Spotifast](https://github.com/crmne/spotifast) | Rust/egui GUI, librespot playback, external Connect control; macOS/Linux/Windows. Author reports 100–250 MB RAM and startup under a second. | Strongest desktop GUI reference in this survey. Study library/search/player interaction and playback separation. Its current scope includes skins, visualizers, and extensive library controls that Clarity does not need. Resource numbers are unverified author claims. |
| [spotify-player](https://github.com/aome510/spotify-player) | Rust terminal UI with librespot streaming; CLI includes JSON search, playback, device connection, and authentication. | Strongest candidate to investigate for chat controlling an existing player process. CLI uses a client socket and may start a client when absent. This is an integration possibility, not an adopted dependency. Premium required; shared/personal API grants and streaming authentication remain separate concerns. Its documented macOS daemon mode conflicts with media controls. |
| [ncspot](https://github.com/hrkfdn/ncspot) | Rust terminal client using librespot, explicitly focused on low resource usage; exposes an IPC socket. | Useful reference for a restrained interaction model and external control. Supports macOS and Linux; Premium required. IPC capability alone does not establish a complete Clarity integration. |
| [Psst](https://github.com/jpochyla/psst) | Rust native GUI with separate core and GUI components; supports macOS/Linux/Windows. | Worth reading for a small GUI/core split, but upstream explicitly describes incomplete features, stability, and UX. Requires Premium and a personal Spotify Developer Client ID for Web API functionality. Lower priority than Spotifast for a working product reference. |

Spotifast's phrase “local playback” means Spotify audio played on this computer; it is not evidence of support for the user's ordinary local music files. Lightweight Spotify clients still carry authentication, API access, connection recovery, and audio lifecycle work. Existing shared client IDs must not be assumed available for a separately distributed Clarity integration.

### Navidrome candidates

| Project | Observed approach | Relevance to Clarity and limits |
| --- | --- | --- |
| [Supersonic](https://github.com/supersonic-app/supersonic) | Go/Fyne desktop UI with MPV playback; macOS/Linux/Windows; supports Subsonic/OpenSubsonic and Jellyfin. | Strongest lightweight desktop reference in this survey. Delegates audio to an established player library. MPV packaging remains real work; EQ, casting, lyrics, and other features are outside Clarity's current proposal. The older dweymouth repository URL redirects here. |
| [Yuzic](https://github.com/yuzicapp/yuzic) | Current README targets iPhone, iPad, and Android. Manifest uses React Native/Expo and yuzic-engine; supports Navidrome and other sources. | User-supplied reference worth studying for connection, browsing, and player interactions. It is a mobile app, not a verified macOS/Linux desktop foundation. Offline synchronization and its broader feature set should not be inherited. |
| [EKO](https://github.com/reactivepixels/eko) | macOS app using Tauri/React with Rust audio: Symphonia decoding and CPAL output for both local files and Navidrome streams. | Its Navidrome playback remains relevant; direct local files were removed from Clarity's scope by D48. Its macOS-specific device-rate handling and audiophile features exceed the lean requirement; a custom audio engine is not automatically simpler than an existing playback component. Linux support is not established. |
| [Feishin](https://github.com/jeffvli/feishin) | Electron desktop client, with MPV and web playback backends; supports Navidrome/Jellyfin/OpenSubsonic. | Useful broader desktop library/player reference. Less aligned with a minimal standalone client, based on architecture and feature scope, not a measured memory comparison. Don't assume it needs a second Electron runtime if only studying UI patterns. |

[SonicLair](https://github.com/thelinkin3000/SonicLair) also has a deliberately small, album-centered approach with React/Tauri/Capacitor. Its repository metadata shows the latest push in April 2023 and latest listed release in July 2022; treat it as an older design reference rather than the preferred dependency.

### Activity and reuse notes

GitHub's current latest-release records were checked on 25 September 2026: Spotifast v0.10.1 (24 September), spotify-player v0.25.1 (9 September), ncspot v1.4.0 (21 August), Supersonic v0.22.1 (9 August), Yuzic 2.11.0 (25 September), EKO v0.4.38 (17 September), and Feishin v1.17.0 (15 September). Psst uses a rolling release; its release creation date alone is not a reliable freshness measure. Release activity is not proof of quality or macOS reliability.

Repository license metadata identifies Spotifast, spotify-player, and Psst as MIT; ncspot as BSD-2-Clause; Supersonic, Yuzic, and Feishin as GPL-3.0. EKO advertises MIT, but its inspected [LICENSE](https://github.com/reactivepixels/eko/blob/main/LICENSE) also requires retaining NOTICE and includes branding terms; GitHub reports it as unclassified. Record these distinctions before any future code reuse. No code was copied or reuse approach selected.

**Earlier assistant recommendation, reframed by D46:** the survey initially emphasized desktop behavior and interaction references. The user clarified that core implementation robustness is the priority. Spotifast, spotify-player, ncspot, Supersonic, Yuzic, EKO, and Feishin remain candidates for inspecting relevant internals; GUI toolkit or mobile focus alone does not disqualify transferable integration logic. No existing player process or complete app fork has been selected.

### Core implementation evaluation

**Accepted direction:** copy or emulate the strongest relevant core while retaining Clarity's lean scope. The documentation survey is insufficient to name a robustness winner.

**Assistant-proposed evaluation:** inspect authentication/session handling, streaming and seeking, cancellation of stale playback requests, recovery after connection loss, and resource cleanup. Look for implementation evidence, meaningful tests, and fixes for real failures; verify the essential paths on macOS before making a final selection. Judge how small the required dependency and integration surface can remain. These are checks on the agreed playback behavior, not additional product features.

For Spotify, distinguish each client's integration logic from its underlying playback library. For Navidrome, distinguish API/authentication handling from audio output. Reusing an appropriate maintained library may be simpler than extracting an application's whole core. Direct copying versus emulation and applicable source licenses must be resolved for the chosen code; no code has been copied. Raise unavoidable complexity before adopting it.

## Open questions

- What does opening or playing an artist do? Artist search covers both sources without a followed-artists requirement; exact detail-view behavior is still open.
- Should the optional combined search tab be included? Exact source-label styling and additional playback-order modes remain undecided.
- Which embedded Spotify implementation meets the agreed behavior in the packaged Electron app? In-app playback is settled; a separate Spotify player is not the selected route.
- What is the simplest working Spotify account setup for private use shared with friends? Public-product distribution review is deferred.

## Reference notes

The earlier message supplied Spotifast as a reference. Reviewed its current README and Spotify's official SDK, Player API, device, and quota documentation on 25 September 2026. No player, account connection, or desktop runtime was tested. The comparison is a design assessment, not a promise of feature parity or an app-stack choice.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
