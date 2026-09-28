---
title: 28 September 2026 — Web and attachment feasibility
section: Journal
status: Exploring
updated: 2026-09-28
order: 630
summary: Research before deciding browser scope and unsupported-file behavior.
---
# 28 September 2026 — Web and attachment feasibility

The user asked to research and report before continuing the question round. Inspected upstream source/documentation and local Synara code; findings are in [web browsing and attachment research](../references/web-and-attachments.md).

Interactive browsing has reusable candidates. Playwright MCP is the proposed first candidate to validate; an embedded Electron view requires more application integration. The main discovered mismatch is that Cloudflare OS's generic MCP connector queues non-read-only tools, including Playwright navigation/clicks, for approval. Adopting smoother behavior would need an explicit discussion rather than silently changing upstream approvals.

Broad attachment storage is feasible without universal conversion. Proposed preserving originals locally, reading bounded text and supported images, extracting PDF text locally, and reporting unsupported or partially read content explicitly. Synara's file-path prompt pattern still requires actual reading tools. Existing provider-specific PDF bridges do not prove compatibility through Clarity's selected Codex subscription connection.

These are researched observations and assistant proposals, not accepted decisions. D86/D87 and the two fifth-round questions remain unchanged. No dependencies were installed, accounts connected, runtime tests conducted, or Clarity application code built. Updated the relevant wiki links and generated reader only.
