---
title: Verification
section: Verification
status: Current
updated: 2026-10-03
order: 0
summary: Build-specific reports and reproducible product checks.
---
# Verification

Use [setup and maintenance](setup.md) to choose and run checks, capture build identity and preserve evidence. [Stable feature IDs](../features/index.md#verification-map) point to expected behavior and executed recipes. Reports describe a selected build and scope, never permanent feature certification.

- [Linear Music volume scaling](runs/2026-10-02T165716Z-linear-volume.md): direct shared gain at 0/25/50/70/100, retained normalization/drag response, native PCM and packaged delivery.
- [Search and list spacing](runs/2026-10-02T163455Z-list-spacing.md): Board and Notes feedback, all-module theme/window sweep, loading/error recovery and populated-list controls.
- [Live volume response](runs/2026-10-02T142157Z-volume-response.md): volume during held drag/key input, latest feedback, queued PCM gain, regressions and packaged delivery.
- [Music search categories](runs/2026-10-02T141800Z-music-search.md): grouped previews, result kinds, keyboard Show all, retained cache/layout behavior and packaged delivery.
- [Adversarial fixes](runs/2026-10-02T101600Z-adversarial-fixes.md): all fourteen open findings repaired, prior Settings correction retained, negative controls, frozen full-suite/package checks and installed delivery.
- [Recently played cards](runs/2026-10-02T041300Z-music-recent.md): collection metadata, correct provider IDs, legacy repair, retry, original playback dates and native card navigation.
- [Settings desktop design correction](runs/2026-10-01T184717Z-settings-redesign.md): Cursor/prototype-based rows and forms, complete settings behavior, both themes/sizes, QA15 correction and package evidence.
- [Adversarial application audit](runs/2026-10-01T181800Z-adversarial-qa.md): fifteen reproduced defects on the original frozen build; subsequent fixes are recorded in the remediation run above.
- [Large Spotify collections](runs/2026-10-01T182000Z-music-pagination.md): first-page rendering, scrolling beyond 5,000, continuation retry, shared page caching and packaged delivery.
- [Navidrome connection diagnosis](runs/2026-10-01T182630Z-navidrome-connection.md): direct authentication versus installed-app reachability, transport guidance, retry and permission packaging.
- [Spotify playlist details](runs/2026-10-01T164530Z-playlist-details.md): live blank-row diagnosis, restored song/playlist metadata, current/legacy wrappers, pagination and cache retention.
- [Music result caching](runs/2026-10-01T163445Z-music-cache.md): cached tab/search/collection reads, pending sharing, refresh/error recovery, account changes and packaged checks.
- [Resizable source pane and compact action](runs/2026-10-01T122900Z-preview-controls.md): pointer/keyboard width controls, compact module opening, narrow layout and retained Chat state in the external example.
- [Clickable Music back label](runs/2026-10-01T121353Z-music-back.md): label/arrow clicks, keyboard activation, nested history and desktop/mobile checks in the prototype.
- [Source preview navigation example](runs/2026-10-01T121000Z-source-preview.md): source inspection stays in Chat; explicit module opening and proposed history retain draft/scroll state in a disposable example.
- [Compact Cursor prototype and controls](runs/2026-10-01T083600Z-cursor-density.md): verified compact layouts, tabs/dividers, focus/separators, aligned glyphs, 2px row gaps, responsive controls and motion.
- [All-module Cursor prototype](runs/2026-10-01T071700Z-cursor-all-modules.md): intermediate populated-module mutation/review evidence; pending final visual checks are preserved as dated history.
- [Cursor Desktop browser spike](runs/2026-10-01T060000Z-cursor-spike.md): external sample UI, task review, note/draft persistence, context handoff, palette, themes and layout.
- [Optional task dates](runs/2026-10-01T035738Z-task-dates.md): date editing, Week/Month projection, completion, clearing, deletion and restart persistence.
- [Settings layout polish](runs/2026-10-01T035337Z-settings-layout.md): header/scroll separation, padded focus, uniform controls, both themes and window sizes.
- [UI fixes and jstack adoption](runs/2026-09-30T165735Z-ui-fixes-jstack.md): nineteen audit fixes, controlled connector/navigation checks, packaging, and verification/wiki tooling.

Earlier evidence remains in the [implementation history](../references/implementation.md), [audit](../references/ui-audit.md), and dated journals. It is not retroactively relabelled as a newly fingerprinted run.
