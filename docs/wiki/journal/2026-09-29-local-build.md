---
title: 29 September 2026 — First local build
section: Journal
status: Implemented
updated: 2026-09-29
order: 2026092901
summary: The agreed modules, standalone macOS build, validation and remaining account checks.
---
# 29 September 2026 — First local build

The user authorized the entire implementation in D102 and delegated safe lean defaults. The resulting local Electron/TypeScript app includes chat, notes, todo, wiki, calendar, expenses, mail, news, bookmarks, music, agent board and automations. Removed terminal/local-music/sync scope stays removed.

The assistant chose selective reuse of Cloudflare OS's scheduler and approval contracts with local workerd/SQLite and Pi. This materially differs from running the entire upstream application and avoids hosted app-generation machinery. The source and build remain understandable modules; dependencies and generated manifests are kept outside this repository. Notes and wiki remain ordinary Markdown files in one chosen root.

The final validation pass caught and fixed lost list content during Markdown parsing and loss of immediate edits on Quit. It also verified source handoff in music, note conflicts, permanent attachment copies, credential recovery, calendar continuity and wiki navigation. Ten default tests, a separately enabled live Codex approval/restart/model-change test, and the relocated macOS package test pass. The package needs neither Node nor Rust to run; its size is approximately 725 MB on this machine after removing a duplicate workerd binary.

Live external accounts are not assumed: Spotify audio/login, Gmail, X, Linkding and a real Navidrome server still need the user's setup. Fresh Codex login/expiry, cross-machine portability, Linux and comparative browser latency remain unvalidated. The app uses installed Chrome/Chromium for interactive browsing and unofficial X imports.

See [D103](../decisions/index.md#d103-lean-local-implementation-defaults-29-september-2026) and [the implementation report](../references/implementation.md) for selected defaults, evidence and limits. The repository README explains startup and connections. Earlier planning and spike entries remain preserved.
