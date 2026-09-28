---
title: 26 September 2026 — LangChain and readable code
section: Journal
status: Accepted direction
updated: 2026-09-26
order: 420
summary: Select LangChain for assistant execution and make beginner-friendly implementation a lasting rule.
---
# 26 September 2026 — LangChain and readable code

After a plain-language explanation of models, tools, and the agent loop, the user accepted having LangChain run Clarity's assistant directly: “that sounds great. lets make that our plan.” Recorded [D50](../decisions/index.md#d50-langchain-runs-the-assistant-26-september-2026), partially superseding D22's installed-harness chat execution. Model/effort selection and existing module/permission behavior remain; separate developer terminal sessions are not removed.

The user also requires code understandable to beginner/intermediate programmers, clear abstractions, readable code, and no excessive inline comments. They want to learn as we build and explicitly asked future sessions to treat them as a LangChain beginner. Recorded [D51](../decisions/index.md#d51-readable-code-and-learning-as-we-build-26-september-2026) and added persistent instructions to project `AGENTS.md` and [working principles](../vision/principles.md).

Updated the overview, product vision, assistant execution, chat, integrations, automation wording, and open questions to agree with the new execution plan. Preserved the earlier exploratory journal and historical decision text with supersession links.

This is a planning decision. No application code or dependencies were added. Language, provider/model, credential setup, desktop framework, storage, and first-release module scope remain open. The earlier notes/todos learning sequence remains a proposal.
