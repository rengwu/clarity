---
title: 28 September 2026 — Disposable technical spikes
section: Journal
status: Reference
updated: 2026-09-28
order: 700
summary: Authorized experiments validate core pieces while surfacing browser approval and packaging limits.
---
# 28 September 2026 — Disposable technical spikes

The user authorized throwaway spikes and explicitly withheld permission to build Clarity. [D101](../decisions/index.md#d101-disposable-spikes-without-starting-clarity-28-september-2026) records that distinction. After an interruption, the user asked whether work remained; the packaging check and documentation were completed.

The [results](../references/technical-spikes.md) cover live Codex subscription requests through Pi, streamed tool use, saved-history restoration with a different model/effort, local Worker persistence, real Markdown access and stale-write detection, Electron close/reopen/Quit, a minimal self-contained app bundle, and browser batching/session persistence. Test dependencies and data stayed outside the Clarity workspace. Reproducible sources and non-secret summaries were preserved in the sibling `clarity-spikes/2026-09-28` folder.

The live test used the existing ChatGPT credential in memory; it did not log, copy, refresh, or overwrite it. Fresh login remains untested. The full Cloudflare OS app was not launched. Its current model router needs a Codex-specific route even though the Pi provider itself worked.

The browser fixture disproved a naive read-only filter: a destructive GET behind an innocuous button bypassed a POST block. This raises a concrete enforcement tradeoff; it does not change the accepted browsing behavior or authorize a new permission subsystem. Basic file hash checks also leave simultaneous-write races unresolved. Minimal Electron tests showed a meaningful memory/bundle baseline, not evidence of a fully optimized application.

No Clarity application scaffolding, package files, module implementation, or replacement stack was introduced. Remaining work concerns full upstream integration, fresh auth/refresh, robust save conflicts, browser guarantees and representative performance, and clean-machine distribution.
