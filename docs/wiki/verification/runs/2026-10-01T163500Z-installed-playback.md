---
title: 2 October 2026 — Installed Spotify playback and error feedback
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-02
order: 2026100202
summary: Live authorization, playback controls and installed restart pass alongside error-order regressions and package checks.
---
# 2 October 2026 — Installed Spotify playback and error feedback

## Scope

Continue the [redesign repair](2026-10-01T154700Z-redesign-repair.md) after the user unlocks macOS Keychain. Selected scenarios cover **FEAT-music, FEAT-settings and FEAT-shared-ui**: actual saved-credential access, explicit playback authorization, live search/playback controls, one persistent playback failure regardless of event ordering, retained navigation/motion, final packaging and installed restart. Expected behavior is defined in [Music](../../features/music.md#connection-clarity-and-independence-1-october-2026) and its updated verification recipe.

## Build and environment

macOS arm64, Electron 44.4.5, Node 22.19.0. The run ID is UTC; the journal date is 2 October in Asia/Kuala_Lumpur. Native UI tests use isolated temporary roots and external dependencies. The installed-app walkthrough uses the existing data root and actual Spotify connection through named UI controls; it adds no sample local content. OAuth credentials are never included in evidence.

The first live checks use the earlier installed repair, application SHA-256 `c6ed222baa40a053f5f8cc415f0525f6a0f54fa2af8b041931771f69acbbacdc`. They establish that user's Keychain unlock, fresh playback authorization and live controls on that build. They also expose a duplicate failure toast that the earlier controlled test missed.

The final correction has application SHA-256 `d9bc5cb4a7a635b021fd1d93b97e19ac45997b2049e9f8e4e8e32b7051def8e3`, verification SHA-256 `a2a41499334036b0b2a7f2e8751557525ce3a55b196687d63e7ddd949bb70fe7` and package runtime SHA-256 `a5ba27f2dee37b19753b505c6e5061aca4b1e8c534c4a27ee5ecf26daf097036`. Application/verification hashes match between [tested source](../../evidence/2026-10-01T163500Z-installed-playback/tested-build.json) and [final package](../../evidence/2026-10-01T163500Z-installed-playback/final-build.json). The pre-package fingerprint still describes the older cached bundle's runtime files; only the final package manifest identifies this installation. HEAD alone is insufficient for this dirty checkout.

Executed: `node tooling/clarity.mjs check`, `node tooling/clarity.mjs build`, `node --test --test-concurrency=1 tests/connectors.mjs tests/redesign.mjs tests/usability.mjs`, `node tooling/clarity.mjs package`, and `node --test tests/package.mjs`. Logs: [types](../../evidence/2026-10-01T163500Z-installed-playback/typecheck.log), [12 selected regressions](../../evidence/2026-10-01T163500Z-installed-playback/regressions.log), [package](../../evidence/2026-10-01T163500Z-installed-playback/package.log), [relocation check](../../evidence/2026-10-01T163500Z-installed-playback/package-check.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Original installed unlock | Open with existing root and decrypt saved connections | Sidebar opens; library grant true, playback grant false, no credential warning | Passed |
| Real search and motion | Live results and actual repaired animation | Ten song rows; sidebar transitions observed at 220ms/160ms; no renderer errors | Passed |
| Playback authorization | Distinct Settings action restores missing playback grant | Connect playback opens Settings; Enable Spotify playback completes browser OAuth; both grants become true | Passed |
| Live controls before final feedback fix | Advancing playback, stable pause, seek, resume | Position 61 seconds remains 61 while paused, seeks to 87 and resumes to 89; no player error; left paused | Passed |
| Error delivery order | One error for event-first and rejection-first responses | Controlled missing-grant and delayed-event cases produce one player error and zero toasts | Passed |
| Failure before queue | Error stays visible without blocking Music | Compact footer remains visible; subsequent search/navigation succeeds | Passed |
| Retained UI behavior | Preserve commands, source/history, compact geometry and actual/reduced motion | All 12 selected connector/redesign/usability tests pass serially | Passed |
| Package | Self-contained signed app with working persistence | Relocated bundle passes signature/dependency/helper and save/reopen checks | Passed |
| Installation/data | Install tested runtime files and preserve owned content | Seven runtime hashes match; signature passes; Markdown and structured content counts unchanged | Passed |
| Final installed controls | Play, pause, seek and resume without error | Position 62 stays at 62 while paused, seeks to 87 and resumes to 89; left paused with no error | Passed |
| Final installed restart and playback | Reopen final bundle, retain both grants, play again | After Keychain access, both grants persist with no credential warning; further Quit/reopen plays again without sign-in | Passed |

Aggregate is **Passed** for these selected scenarios. Live playback/control evidence is recorded separately for the earlier repair and the final installed runtime; this is not certification of all providers or audio output devices.

Evidence: [actual duplicate notice before correction](../../evidence/2026-10-01T163500Z-installed-playback/live-before-fix.json), [live controls on the earlier repair](../../evidence/2026-10-01T163500Z-installed-playback/live-controls-before-final-fix.json), [final installation audit](../../evidence/2026-10-01T163500Z-installed-playback/installation.json) and [content audit](../../evidence/2026-10-01T163500Z-installed-playback/data-audit.json). The content audit deliberately excludes settings, recent playback and connection-state records; Spotify credentials changed through the authorized sign-in flow. Final installed evidence: [controls](../../evidence/2026-10-01T163500Z-installed-playback/final-installed-controls.json), [grants after Quit/reopen](../../evidence/2026-10-01T163500Z-installed-playback/reopened-auth.json) and [playback after Quit/reopen](../../evidence/2026-10-01T163500Z-installed-playback/reopened-playback.json).

## Limits and follow-up

Concurrent Music-cache work reformatted renderer sources and updated its test/tooling manifest after this run’s test fingerprint. Its [separate verification](2026-10-01T163445Z-music-cache.md) records that source identity. Both package manifests contain identical seven runtime hashes; recompiling the current renderer with the package’s minification settings also produces [identical installed JavaScript and CSS](../../evidence/2026-10-01T163500Z-installed-playback/current-source-runtime.json). The live checks here therefore apply to the same delivered runtime bytes. This does not transfer source-test claims between reports.

The app is installed at `~/Applications/Clarity.app`; the preceding repair is retained at `~/Library/Caches/Clarity/build/Clarity-before-playback-feedback-20261001T163500Z.app`, in addition to earlier backups. The updated bundle requested macOS access to “Clarity Safe Storage” again. After that access was allowed, the installed app opened, retained both grants and passed live controls; a further Quit/reopen played again without another Spotify sign-in. No password was requested in chat or entered by the agent.

The [initial regression attempt](../../evidence/2026-10-01T163500Z-installed-playback/first-attempt.log) recorded ten passes and two failures. The new pre-queue error inherited the player's full flex basis and covered Music's controls; a compact standalone-footer rule corrected that product defect. A simultaneous native-driver run also observed an extra space in a draft. The expected draft was preserved, native tests were rerun serially with no live-app driving, and all twelve passed. The latter observation does not establish its cause. No assertion was weakened.

One exploratory live attempt returned an invalid-track error before its requested item was captured. A subsequent observed public-song request played and passed controls; the uncaptured attempt is not presented as a diagnosed provider defect. Speaker audibility, other output devices, refresh-token revocation/expiry, real non-Spotify providers, live model inference, VoiceOver, notarization and other machines remain outside this follow-up. No independent reviewer participated.

The final handoff uses an [ordinary LaunchServices launch](../../evidence/2026-10-01T163500Z-installed-playback/ordinary-launch.json), leaving one visible Clarity window open on Music without starting playback. All 13 [wiki reader/report tests](../../evidence/2026-10-01T163500Z-installed-playback/wiki-tests.log) pass; report validation finds 13 reports without metadata errors, and the 138-page reader rebuild/internal-link/current-snapshot checks pass. These documentation checks do not broaden the selected product claims.
