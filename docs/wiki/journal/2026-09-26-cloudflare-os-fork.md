---
title: 26 September 2026 — Cloudflare OS fork tradeoffs
section: Journal
status: Exploring
updated: 2026-09-26
order: 460
summary: Compare extending Cloudflare OS, rewriting its core, and selective reuse for a local Clarity app.
---
# 26 September 2026 — Cloudflare OS fork tradeoffs

The user asks whether to build Clarity from Cloudflare OS, either following its extension model and accepting tradeoffs or extensively changing it. This is a planning question, not authorization to fork or begin implementation.

Expanded the [desktop stack page](../foundations/desktop-stack.md#building-on-cloudflare-os-26-september-2026) using upstream revision `004ab773fad6d4fb7fe67be920a3ef37e46dc58a`. The gadget/blueprint/Gatekeeper model offers substantial reuse if retained. Runtime configuration and source show deeper coupling to Durable Objects, dynamic Workers, storage services, RPC, and a Pi-based agent loop. LangChain remains our accepted direction and cannot be silently replaced.

Clarified that Cloudflare OS can run locally with workerd; Cloudflare hosting is not mandatory. Its documented local setup is for development, with standalone self-host deployment tooling still coming. A packaged local desktop with folder access, PTYs, backups, and upgrades remains engineering work. Blueprint exports exclude application data, and existing gadget instances do not automatically receive blueprint updates.

Assistant assessment: a platform-aligned fork is worth considering if the product tradeoffs are accepted. Replacing the runtime, storage, agent, and permissions together is a poor default under the lean rule. Selective reuse in a smaller local app is preferable if existing local desktop and LangChain requirements remain central. No time estimate or prototype result was claimed.

Q32 records the product-level choice. Existing decisions, including D50, remain unchanged. A bounded future evaluation was proposed, not started. No clone, package installation, account connection, deployment, or app implementation occurred.
