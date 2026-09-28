---
title: 27 September 2026 — Music playback and server address
section: Journal
status: Accepted
updated: 2026-09-27
order: 490
summary: Spotify plays inside Clarity; Navidrome accepts an HTTP/HTTPS address and tries connecting.
---
# 27 September 2026 — Music playback and server address

The user resolved the two remaining music-experience questions. Spotify music plays inside Clarity; controlling a separate Spotify app/device is not the selected route. Recorded D61, resolving D45's earlier comparison. The engine remains an implementation choice and still needs validation in the packaged Electron app.

For Navidrome, the user asked to keep it simple: take any HTTP or HTTPS address and attempt the connection. Recorded D62. Retain existing account sign-in, and handle connection failures as ordinary outcomes rather than asking whether the server is local/home/public. No discovery or network setup flow is requested.

Updated Music, architecture, connection requirements, overview, product open items, and the decision/question registers. Earlier journals are preserved. No app code, account connection, or playback testing was performed. Public-product policy remains deferred; no implementation engine or extra feature was adopted.
