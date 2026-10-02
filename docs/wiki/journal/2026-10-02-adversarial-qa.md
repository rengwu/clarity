---
title: 2 October 2026 — Adversarial application audit
section: Journal
status: Current
updated: 2026-10-02
order: 2026100209
summary: Fifteen reproduced defects, fourteen still open, with isolated whole-app evidence and a passing concurrent Settings follow-up.
---
# 2 October 2026 — Adversarial application audit

The user requested adversarial testing of the entire app for bugs, failure states and UI/UX inconsistencies. The audit exercised all twelve modules, Settings and shared navigation; captured 52 combinations of screen, theme and window size; and added malformed-content, concurrent-edit, delayed-response, cancellation, account-state and recovery scenarios beyond the existing regression suite.

[The run report](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) records **15 reproduced defects: three P1, ten P2 and two P3**. The highest-priority findings are a malformed Markdown preview blanking the renderer, missing revisions letting approved actions overwrite/delete newer edits, and a late Chat send reply clearing a newer unsent draft. Other findings cover hidden modals, shortcut collisions, lost bookmark drafts, hidden renamed notes, dropped Wiki anchors, invalid dates, orphan board replies, stale Mail account contents, duplicate persistent errors and text/overflow defects.

Source changed concurrently during the audit, so numbered findings were reproduced against a copied source tree and independently built external cache. All 91 snapshot files match the retained fingerprint. The initial standard suite passed 37 tests with two live checks skipped. The later frozen suite passed 40, failed one connector driver and skipped two. The connector failure was traced to first-page timing and an undrained delayed fixture event; an external driver repair preserved all outcome assertions and passed on unchanged app bytes. The original failed log remains. Notes write-failure recovery and disconnected automation cursor/chat isolation passed additional controls.

A handoff source comparison caught concurrent Settings changes to the QA15 layout. A second isolated build and the same four-case driver verify that the label now wraps without overflow and its section still opens. QA15 is resolved on that explicitly recorded later build, leaving fourteen findings open. The original failing evidence remains.

No application source was changed, fixed or installed by this audit. Existing dirty work and concurrent Music/Navidrome changes were preserved. Existing feature topics now distinguish the new known gaps from earlier passing scenarios and include the new reproduction expectations; the follow-up list and both implementation summaries point to the report. No design decision was reopened.

Evidence uses temporary local data, safe fixture screenshots and controlled provider/latency responses. It does not certify live accounts, installed packages, a clean machine, audible output, OS permissions, VoiceOver or Linux. The report identifies these boundaries per finding. Further fixes need their own exact-build rerun; successful wiki validation only establishes document integrity.

Documentation validation passes: all 13 reader/report tests, report metadata checking, wiki generation and generated-snapshot checking. Logs are retained with the run evidence. Markdown remains authoritative and the HTML reader is generated from it.
