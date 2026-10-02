---
title: 3 October 2026 — Linear Music volume scaling
section: Journal
status: Implemented
updated: 2026-10-03
order: 2026100303
summary: Replace the quiet midpoint of the shared logarithmic slider curve with direct gain.
---
# 3 October 2026 — Linear Music volume scaling

The user reported that the slider felt logarithmic: around 50% was very quiet and the perceived halfway level sat nearer 75%. Inspection confirmed the shared 60 dB curve mapped 50% to approximately 0.0316 amplitude gain.

[D129](../decisions/index.md#d129-linear-music-volume-scaling-3-october-2026) replaces that curve with direct `volume / 100` gain. Spotify's final Rodio output and Navidrome's HTML audio now both produce 0.50 gain at 50%, while preserving fixed normalization, current-track timing, mute/max endpoints and continuous drag/key dispatch. No setting, metadata format, dependency or audio file changes.

[The focused run](../verification/runs/2026-10-02T165716Z-linear-volume.md) records development and packaged UI fixtures, native decoded PCM measurements and relocated-package validation. It does not measure real speaker, Bluetooth or listener-perceived loudness.
