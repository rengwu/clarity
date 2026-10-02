---
title: 2 October 2026 — Navidrome connection diagnosis
section: Journal
status: Current
updated: 2026-10-02
order: 2026100207
summary: Separate valid server credentials from installed-app network access, add macOS usage text and actionable connection failures.
---
# 2 October 2026 — Navidrome connection diagnosis

The user reported `fetch failed` in Navidrome Settings and supplied credentials for diagnosis. Direct salted-auth requests successfully reached the server and authenticated `ping`, music-folder and playlist reads. An isolated launch of the installed executable also reached it. In contrast, a normal installed-app launch failed before authentication with Node `EHOSTUNREACH` and Chromium `ERR_ADDRESS_UNREACHABLE`. Restarting through the normal Quit path did not remove the failure. These observations point to app-specific local-network access, not an invalid password; they do not establish which macOS setting was selected.

The bundle lacked `NSLocalNetworkUsageDescription`. Packaging now declares connections to chosen Navidrome and Linkding servers. The shared Navidrome request path translates transport failures into useful reachability, refusal, name-lookup and timeout guidance. On macOS, unreachable/permission errors include the Local Network settings path. Provider authentication and HTTP errors retain their details; failed connection attempts do not overwrite saved credentials. No alternate network process or OS-permission modification is used to bypass consent.

[Music's connection contract](../features/music.md#navidrome-connection-and-local-network-access-2-october-2026) owns behavior and the reproducible recipe. [The run](../verification/runs/2026-10-01T182630Z-navidrome-connection.md) records exact builds, the live diagnosis, controlled retries, package checks and remaining installed-account validation. The first packaged fixture hit a real Keychain prompt; its corrected disposable driver uses Chromium's mock keychain only for fake credentials. Production encryption is unchanged, and this test does not certify real Keychain authorization.

The user was asked to check Clarity under macOS Privacy & Security → Local Network. A successful terminal/test launch cannot certify normal installed-app permission or real-server audio. Passwords, authentication tokens and user-specific server/account details are excluded from repository evidence.
