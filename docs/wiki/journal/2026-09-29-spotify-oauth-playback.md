---
title: 29 September 2026 — Direct Spotify OAuth playback
section: Journal
status: Current
updated: 2026-09-29
order: 2026092911
summary: Existing streaming OAuth plays successfully without login5; renewal remains owned by Electron.
---
# 29 September 2026 — Direct Spotify OAuth playback

The user asked to keep working until Spotify playback is resolved. The previous [endpoint diagnosis](2026-09-29-spotify-endpoint.md) and Spotifast comparison isolated a 503 but stopped short of testing whether the existing streaming OAuth grant could supply the playback HTTP client directly.

A disposable helper seeded librespot's playback token cache with the already authorized streaming access token. The reported song loaded and playback position advanced, without a new login or login5 exchange. This is the first successful experiment against the observed failure. It shows that the additional exchange was avoidable; it does not establish the origin or geographic scope of the login5 503. System DNS and Google's public DNS returned the same Spotify edge address, so no DNS override was applied.

The implementation keeps Electron responsible for storing and renewing OAuth. The native helper receives an access token and absolute expiry, uses them for playback HTTP requests, and accepts replacements over its existing JSON-line pipe. Electron schedules renewal before expiry, updates the existing audio process, cancels timers on shutdown, and ignores late results belonging to an old helper. Expired host-supplied tokens raise an authentication error rather than returning to login5. Temporary refresh failures retain the saved account and follow the bounded recovery path.

The dependency change is a small extension to exactly librespot-core 0.8.0. The build locates the published crate through Cargo metadata, copies it into the external build directory, checks two source anchors, and includes `src/player/login5_oauth.rs`. No complete fork, new credential store, additional package, or shared Cargo-registry modification is introduced. The build signature includes the extension and build script. Packaged notices identify the modification and retain the upstream license.

Five targeted music/core tests, all four connector tests, application/Worker type checks, and package relocation/signature/persistence checks pass. The native expiry test exposed a same-timestamp edge case when accepting a zero-lifetime token; an explicit minimum-lifetime check fixes it. That test now proves valid-token replacement, rejection of empty/expired replacements, expiry without a network fallback, and recovery with a renewed token. The active-helper fixture proves token renewal without a process restart and cancellation after close.

The updated signed bundle is installed at `~/Applications/Clarity.app`, with the preceding bundle retained as a local backup. The initial installed-app test waited inside macOS Keychain while reading saved credentials. Normal application launch displayed the actual “Clarity Safe Storage” dialog; the user was asked to approve it. The goal paused after repeated checks confirmed the same pending OS input. This locally signed update required macOS permission to access existing credentials, not another Spotify sign-in.

The Music topic owns the current token, process, expiry, and build contracts. The earlier diagnosis remains historical; it must not be used to claim a global Spotify outage, a confirmed rate limit, or that changing networks is required for this solution.

## Installed-app verification

After the user resumed the goal, the installed app had Keychain access. Both saved Spotify access tokens were expired before the first live run. Search and playback succeeded without an authorization browser or sign-in; the next launch showed later expiry values and retained refresh tokens in encrypted storage. This verifies renewal of real expired access tokens, distinct from refresh-token expiry or revocation.

The installed app played “Don't Stop ’Til You Get Enough,” advanced its position, paused, accepted a seek to approximately 2:00 while paused, and resumed past that position. The seek bar was visible and enabled, and Songs used list view. The test paused playback before quitting. After Quit/reopen, playback worked again; the saved expiry values were unchanged and the instrumented OAuth endpoint received no extra renewal requests. No playback errors occurred.

One disposable test-controller attempt waited for its own debugger connection to close, which held up the process-exit check. Disconnecting the test debugger after requesting Quit corrected the controller; no application change was needed. The complete installed-app playback/seek/restart check then passed. Its safe report and screenshot are retained in the external build cache as `spotify-fixed-live-report.json` and `spotify-fixed-live.png`; no plaintext credentials were written to the report.

Listener-confirmed audibility, other output devices, fresh browser OAuth, and actual refresh-token expiry/revocation remain unverified. The user was asked whether the test music was audible. The control and renewal evidence above does not substitute for that answer.

The final macOS volume check reported output volume 0 and output muted. Earlier diagnosis had observed an unmuted output at 31; neither observation changes the reproduced login5 failure or the successful playback fix. No system volume setting was changed during this validation. Clarity was reopened normally, without test debugger ports, and its installed main/UI/helper files matched the tested bundle.
