---
title: 28 September 2026 — Browser speed and lightweight approaches
section: Journal
status: Exploring
updated: 2026-09-28
order: 640
summary: Codex speed target, recent browser research, and deferred attachment discussion.
---
# 28 September 2026 — Browser speed and lightweight approaches

The user expressed concern that agent browsing would feel slow, asked for at least Codex-level speed with a lean implementation, and requested recent X/Hacker News research. They deferred arbitrary attachments. Recorded the target and sequencing in D91; no library or permission change was accepted.

Refreshed the public Codex manual using the OpenAI docs skill. It distinguishes hosted/indexed web search from interactive browser use. OpenAI attributes a June browser speed improvement to reduced CDP round trips and optimized DOM snapshots; its private implementation and equivalent performance in Clarity remain unestablished.

Inspected current browser projects and September HN discussions, verifying the HN dates through the official API. X direct retrieval was unreliable; relevant indexed posts were older and are labelled accordingly. Checked capabilities against primary repositories. Vendor benchmarks use different workloads and contain limitations; they were not run locally.

The assistant's recommendation is refined from defaulting to Playwright MCP toward comparing Playwright-backed bounded batches with agent-browser. Reuse persistent sessions, focused observations, and the existing Pi/module execution path. Keep public search/retrieval separate from interactive browsing. Do not add a second agent loop or a second browser engine by implication. Upstream approvals still present a mismatch; CLI or batching is not permission to bypass them.

See the [research follow-up](../references/web-and-attachments.md#browser-performance-follow-up). No app implementation, dependency installation, live account connection, or runtime benchmark occurred. Updated wiki memory and rebuilt the offline reader.
