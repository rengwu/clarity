---
title: 29 September 2026 — Persistent Spotify sign-in
section: Journal
status: Current
updated: 2026-09-29
order: 2026092909
summary: Silent renewal, bounded playback recovery, and a service failure distinguished from expired login.
---
# 29 September 2026 — Persistent Spotify sign-in

The user objected to repeated sign-in after a player error recommended checking Premium and playback login. [D110](../decisions/index.md#d110-long-lived-spotify-sign-in-29-september-2026) records long-lived login as a requirement. [Music](../features/music.md#persistent-sign-in) owns the current renewal, recovery, and failure contract.

Inspection found both saved Spotify access tokens still valid and both refresh tokens present. The app already encrypted and saved these connections, but any failed OAuth renewal incorrectly recommended reconnecting. The native helper also hid different track-loading failures behind the same sign-in suggestion and could keep a dead session in an apparently live process.

Renewal now preserves omitted refresh tokens, persists rotations, shares concurrent requests, and retries a rejected API/native token once. Temporary service failures retain saved credentials and ask for a later retry. Playback monitors connection health and retries an interrupted track once at its last reported position. Pause, source changes, and completed single-song playback prevent unwanted restarts. Generic track failures no longer blame login.

A disposable live check successfully reached the native session but failed to load audio with an upstream HTTP 503. A diagnostic-only helper in the external cache exposed that response; raw account credentials were neither printed nor stored in plaintext. Preflighting the playback-service token reproduced the service failure before readiness, so the shipping helper now reports that failure directly. Diagnostic logging is not included in the shipped helper. This identifies the live check's failure, not proof of the precise cause of every earlier screenshot. Re-login was not attempted and the user's saved credentials were not modified.

Four targeted music/core tests and all four connector tests pass. These cover encrypted persistence across restart, token expiry and rotation, omitted refresh tokens, concurrent renewal, service outage, credential rejection, bounded retries, helper recovery, playback position, pause/source cancellation and subsequent resume, and end-of-song behavior. Application/Worker type checks, bundle relocation, signature verification, and packaged persistence checks pass. Live playback currently remains subject to Spotify's 503 response; fixtures do not establish real-world token longevity, provider uptime, or listener-confirmed audibility. Earlier successful playback/seek observations remain historical evidence rather than a claim this later outage was fixed locally.

Rebuilt and installed the app in `~/Applications/Clarity.app`, retaining the prior bundle for recovery and leaving the existing instance running. Explicit Quit (Cmd+Q) and reopening loads this update; closing its window does not exit Clarity. Updated topic specifications, the implementation summary, and follow-up gaps, then rebuilt and checked the Markdown wiki reader.
