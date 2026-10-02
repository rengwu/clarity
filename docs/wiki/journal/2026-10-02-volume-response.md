---
title: 2 October 2026 — Live volume response
section: Journal
status: Implemented
updated: 2026-10-02
order: 2026100215
summary: Send slider movement immediately and apply Spotify gain after its decoded queue.
---
# 2 October 2026 — Live volume response

The user reports slow volume changes and asks for immediate adjustment while dragging. Source inspection found two causes: the renderer sent Spotify's control only on pointer/key release, and librespot applied slider gain before audio entered the roughly half-second Rodio queue. [D127](../decisions/index.md#d127-adjust-volume-while-dragging-2-october-2026) records the requirement; [Music](../features/music.md#live-volume-response-2-october-2026) owns the implementation contract.

Every changed input now sends the existing control immediately, while local Navidrome audio and the slider update synchronously. Pending local volume calls suppress older echoed volume values. Spotify keeps the same quantized 60 dB curve but applies it through Rodio's final output volume; librespot retains fixed normalization and gets a unity slider multiplier. This lets already queued audio follow the newest level, including mute, without reducing the queue needed for reliable playback. No dependency, saved setting or schema changes.

[The focused run](../verification/runs/2026-10-02T142157Z-volume-response.md) records held pointer/key delivery, stale feedback, command errors, queued PCM response within 5 ms of rendered audio, shared-curve/normalization regression checks and signed installed delivery. A controlled negative mutation proves the drag assertion detects missing continuous dispatch. A packaged fake-account test initially stalled; adding the mock-keychain flag used by neighboring fixtures makes both final runs pass, with the original timeout retained. Final package checks use a frozen external copy because another Music task shares the build cache.

The installed bundle already matched the frozen tested package at final delivery, so this run needed no further replacement. Normal Quit/reopen activates it. Speaker latency, Bluetooth and real-account playback were not measured; the output-engine timing does not promise literal zero end-to-end delay.
