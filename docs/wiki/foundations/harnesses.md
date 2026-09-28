---
title: Assistant execution
section: Foundations
status: Exploring
updated: 2026-09-28
order: 50
summary: Retain Cloudflare OS’s Pi agent and explain its behavior as we build.
---
# Assistant execution

## Accepted direction

**Retain Cloudflare OS's existing Pi-based agent ([D58](../decisions/index.md#d58-retain-the-pi-agent-27-september-2026)).** This supersedes the LangChain implementation plan. Pi here is the embedded agent machinery already used by Cloudflare OS, not a separately launched CLI harness.

In plain language, the model requests an action, the runtime applies the platform's access/approval behavior and invokes the function, and the result returns to the model so it can continue. Use upstream execution, conversations, and approvals rather than duplicating those systems.

Model/effort controls and access to the same enabled modules across chats remain intended. Use the existing 20× Codex subscription (D77); validate that subscription path without substituting separate API billing. Teach unfamiliar concepts incrementally, retaining beginner/intermediate code readability. The LangChain research below is historical.

## Pi and Codex runtime evidence · 28 September 2026

A [disposable live test](../references/technical-spikes.md#codex-and-pi) used Pi 0.87.1's Codex provider with the existing ChatGPT sign-in. Streaming, one fixture tool call, and saved-history restoration with a different model/high effort succeeded. This was not a fresh login or a run through Cloudflare OS itself. Its current model router still needs the Codex provider route; token refresh and the full integration remain open. No replacement agent loop was introduced.

## Screenshot observations

The user supplied a Synara model-picker screenshot on 25 September 2026. It shows provider/favorites tabs, model search, a model list with favorite controls and keyboard hints, and an effort section with a named level and discrete slider positions. The picker appears above the chat composer.

The requirement is to closely follow this model/effort experience. The screenshot's individual model names, exact number of effort levels, shortcuts, and additional controls are reference observations, not independently accepted requirements or proof of current provider availability.

## Earlier installed-harness reference inspection

Read Synara's `apps/marketing/content/docs/getting-started/providers.mdx` and the model-discovery descriptors in `packages/contracts/src/providerDiscovery.ts` under `~/Desktop/Projects/synara` on 25 September 2026.

Synara's documentation describes connecting installed, authenticated runtimes; discovery can depend on runtime version, account, and configuration. Its shared model descriptors represent supported effort choices as optional per-model metadata. The documentation's listed providers include Codex, Claude Code, and Pi; this inspection did not establish Kimi support in Synara. Kimi was a requested example under the earlier D22 direction.

**Earlier assistant proposal:** populate model and effort choices from the connected harness's capabilities. D50 supersedes that execution path. For direct model access, the analogous proposal is to expose only capabilities supported by the chosen provider/model; discovery and picker behavior still need validation.

## LangChain learning fit · 26 September 2026

**Historical review, before D50 was accepted:** while looking for an existing project idea to rebuild in order to learn LangChain, the user identified Clarity as the similar-to-Lucia project currently being planned and requested a review. At that point this was exploration. The subsequent [D50 decision](../decisions/index.md#d50-langchain-runs-the-assistant-26-september-2026) accepts LangChain; it does not begin app implementation.

**Research observation:** [LangChain agents](https://docs.langchain.com/oss/python/langchain/overview) compose a model, tools, prompts, and middleware. Its [model integrations](https://docs.langchain.com/oss/python/langchain/models) provide model calls; that alone does not establish integration with the installed agent runtimes required by D22. [Human-in-the-loop middleware](https://docs.langchain.com/oss/python/langchain/human-in-the-loop) can interrupt tool execution for review, but Clarity must still define and enforce its action modes and persistent topic/thread grants.

**Assistant assessment:** Clarity's chat and knowledge workflows make a strong learning project. A proposed learning sequence is note search with source references, todo tools, saved conversations and action confirmation, then topic-wiki maintenance. Ordinary module storage, UI, permissions, and scheduling remain application responsibilities. This sequence does not select first-release scope.

The review raised who owns the agent loop and the risk of duplicating conversation state, tool routing, and approvals by nesting full agents. At that point D50 resolved this: LangChain owns the assistant loop and calls the model directly. Provider, billing/access method, language, desktop framework, and storage remain open.

See the [review journal](../journal/2026-09-26-langchain-learning-fit.md).

## To resolve

- Validate Codex subscription sign-in, token refresh, and supported model/effort controls in the local runtime.
- Connect every chat to the same stable enabled module instances, including existing chats when modules are enabled later.
- Validate approved file operations against the actual notes/wiki files.

Use upstream approvals. No second agent loop or installed-harness adapter is needed. No app implementation has begun.

## Codex access · 27 September 2026

**Accepted (D72):** Codex first. Pi remains the agent loop; this answer does not request launching the Codex CLI or choose a specific model. D77 subsequently confirms the existing 20× Codex subscription; separate API billing is not the chosen route.

**Research observation:** [OpenAI authentication documentation](https://learn.chatgpt.com/docs/auth) distinguishes ChatGPT subscription sign-in from API-key usage-based access. This describes Codex clients; it does not certify Clarity compatibility.

Pi's current [Codex provider](https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/providers/openai-codex.ts) and [OAuth implementation](https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/auth/oauth/openai-codex.ts), inspected on 27 September 2026, include a ChatGPT sign-in path. The latter uses Node crypto and an HTTP callback and identifies itself as intended for CLI rather than browser use. The upstream [Cloudflare OS agent](https://github.com/cloudflare/cloudflare-os/blob/main/packages/workshop-backend/src/agent.ts) imports Pi packages, but this inspection does not establish that its pinned version or local model connection exposes this authentication path.

**Assistant assessment:** a Pi-based Codex route is plausible; credential refresh, model connection, and packaged local runtime compatibility remain to validate. No account was connected, credentials inspected, or runtime implemented. The user has now confirmed their existing 20× Codex subscription (D77). Access intent is settled; integration remains to validate.
