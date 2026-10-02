---
title: 29 September 2026 — Spotify playback endpoint diagnosis
section: Journal
status: Current
updated: 2026-09-29
order: 2026092910
summary: Isolated the 503 to login5 and reproduced it with Spotifast's patched engine; outage scope and rate limiting remain unproven.
---
# 29 September 2026 — Spotify playback endpoint diagnosis

The user challenged the earlier interpretation of a playback 503 as Spotify being unavailable and asked whether Clarity was rate limited. That earlier explanation was too broad. A failure on one client route does not establish a Spotify-wide outage.

An isolated helper instrumented in the external cache established this sequence: catalogue search succeeds, native session authentication succeeds, the client-token exchange succeeds, and the login5 playback-token request fails. The exact failing endpoint is `POST https://login5.spotify.com/v3/login`. Its response is 503 with `server: envoy`, `content-type: text/plain`, and no `Retry-After`.

A separate HTTPS request with no account credentials also returned 503 and the body `no healthy upstream`. The adjacent client-token endpoint returned the expected method-not-allowed response for a GET. These observations point to a gateway/backend failure on the login5 route. They do not establish whether the cause is regional routing, endpoint compatibility, another service problem, or undocumented throttling. The Web API's [documented rate limit](https://developer.spotify.com/documentation/web-api/concepts/rate-limits) uses 429, normally with `Retry-After`; it is not a guarantee for every internal Spotify endpoint. The [current librespot source](https://github.com/librespot-org/librespot/blob/dev/core/src/login5.rs) still uses the same login5 URL, with no obvious endpoint migration to apply.

The remote web-fetch tool could not access login5, so it supplied no independent-network comparison. The next discriminating check is the same unauthenticated endpoint request from another network, followed by playback if that path responds normally. Repeated sign-in, unlimited retries, or replacing the music engine would be speculative fixes at this point.

Account tokens stayed in memory within the local diagnostic process. Output contained stage names, status and selected response headers, not secrets. No production source behavior or account state changed in this follow-up. Restored the external native build to the workspace source after the disposable diagnostic patch. The Music specification, follow-up list, implementation summary and onboarding pointer now reflect this narrower evidence; the Markdown reader was rebuilt and checked.

## Follow-up: Spotifast comparison

The user directed the investigation to [Spotifast](https://github.com/crmne/spotifast). Inspected source revision `70d42a560c4204278abfbc28646376792749e869`, including its player, authentication, credential storage, recovery code, and dependency patches. Fetched its pinned librespot fork `23fc42cff37848e51f0d8eaefad1a93941b71e59` into the external cache.

The useful difference is native credential persistence. Spotifast's playback engine keeps the reusable credential returned by Spotify's access point in memory, then sends it to protected storage. Reopening restores that credential rather than requiring another playback OAuth exchange. It uses a stable device identity and bounds reconnects. These are useful implementation references for persistent playback, but the restored session still calls login5. That request implementation is byte-for-byte identical to Clarity's stock librespot 0.8.0 source. The fork's desktop ARM signature fix is Windows-specific; it does not change this Mac's authentication signature.

Built a disposable version of Clarity's helper against all six used librespot crates from the pinned fork, kept the existing native TLS and Rodio 0.22.2 output, enabled the fork's in-memory credential cache, and acquired the client token before session authentication as Spotifast does. The observed sequence was:

1. Client-token exchange succeeds.
2. Native session authenticates and obtains a reusable credential.
3. Playback-token acquisition fails with HTTP 503, as in the stock helper.

This was an engine comparison, not a run of Spotifast's full app or a test of native credential restoration across restarts. A separate unauthenticated HTTP/2 request also returned 503 with an upstream connection-timeout message and no `Retry-After`. Protocol negotiation alone did not fix the unauthenticated check. The same-machine evidence still cannot establish the outage's scope or rule out undocumented throttling.

No real credentials were refreshed, cleared, copied to another application, or written to a plaintext cache. No production behavior changed. Restored the active helper build to the workspace source after the experiment; retained only the diagnostic source outside the repository. Updated the existing Music topic and current validation summaries. Native credential caching remains a potential hardening improvement, not a claimed solution to the present 503. Another network comparison remains the next useful discriminator; repeated sign-in is not supported by these results.
