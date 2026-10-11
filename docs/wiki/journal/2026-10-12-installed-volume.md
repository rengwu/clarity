---
title: 12 October 2026 — Install the linear volume fix
section: Journal
status: Installed; startup pending
updated: 2026-10-12
order: 2026101201
summary: Repeated quiet-midpoint report traced to an older installed app; tested update installed with backup.
---
# 12 October 2026 — Install the linear volume fix

The user again reported that 50% volume felt closer to 15%. The running app was the installed bundle, whose source map and runtime hashes still identified the logarithmic build. Its midpoint applied approximately 0.0316 amplitude gain. The earlier [linear-volume run](../verification/runs/2026-10-02T165716Z-linear-volume.md) had explicitly left its corrected package in the external cache.

No new curve was introduced. Rebuilt the current source with the existing [D129 direct gain](../features/music.md#source-volume-and-normalization-3-october-2026), verified packaged Music fixtures, native PCM, types and package relocation/restart, then quit the old app normally and installed the tested bytes. The old app remains at `~/Library/Caches/Clarity/build/Clarity-before-volume-20261011T182500Z.app`; user data and saved connections were preserved.

The [delivery run](../verification/runs/2026-10-11T182500Z-installed-volume.md) records matching installed/package hashes and the combined-test timeout limitations. Normal reopening is waiting inside a macOS Keychain read; Computer Use blocks SecurityAgent access, so the user was asked to complete that OS step. Normal startup and listener confirmation remain pending; numerical gain verification is not a listening measurement.
