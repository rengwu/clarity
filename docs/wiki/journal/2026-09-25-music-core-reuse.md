---
title: 25 September 2026 — Music core reuse
section: Journal
status: Captured
updated: 2026-09-25
order: 360
summary: Prioritize robust playback and integration internals when evaluating music references.
---
# 25 September 2026 — Music core reuse

The user clarified that the goal is to copy or emulate the most robust core implementation from the music references, rather than their complete UI. Recorded [D46](../decisions/index.md#d46-music-core-implementation-references-25-september-2026) and corrected the current research direction on the [Music page](../features/music.md#core-implementation-evaluation).

The assistant proposes evaluating authentication/session handling, streaming/seeking, stale-request cancellation, connection recovery, resource cleanup, meaningful tests, and integration size. These are evaluation criteria, not newly accepted features. No project has been shown to be the most robust by the documentation survey.

Still open: which core to reuse, direct copying versus emulation or library reuse, and which music sources come first. No application code was copied or built; source inspection and runtime validation remain future work.
