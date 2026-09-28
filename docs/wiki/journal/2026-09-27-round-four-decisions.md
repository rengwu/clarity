---
title: 27 September 2026 — Web, attachments, and file lifecycle
section: Journal
status: Exploring
updated: 2026-09-27
order: 620
summary: Broad web and attachment intent, accepted local images and search, and recoverable Trash with automatic cleanup.
---
# 27 September 2026 — Web, attachments, and file lifecycle

The user answered the fourth round. Recorded D86–D90: full web capabilities; preferably any attachment type if simple; local note-image copies and relative links; title/content text search in Notes and Wiki; and recoverable Markdown deletion with automatic cleanup. Thirty days was suggested as a retention duration and is recorded as the working default, not a finalized timing implementation.

Inspected upstream revision 004ab773fad6d4fb7fe67be920a3ef37e46dc58a. The built-in web-fetch tool performs HTTPS GETs without forwarded credentials and uses Workers AI for conversion. Attachment validation restricts types and sizes; provider-specific PDF bridges do not prove Codex-subscription support. This was source inspection only, with no service calls or runtime tests.

The follow-up round distinguishes interactive/authenticated web use from reading pages, and accepting file attachments from understanding arbitrary content. Proposed storing originals and explicitly reporting unsupported reading rather than silently dropping files or claiming universal analysis. That fallback is not yet accepted.

Proposed Trash age from time of deletion and cleanup while Clarity runs, including startup, without a separate service. No active file, shared image, or live Trash was removed. No application implementation occurred.

See [chat findings](../foundations/chat.md#web-and-attachments-27-september-2026) and [follow-up questions](../discussions/open-questions.md#fifth-question-round-27-september-2026).
