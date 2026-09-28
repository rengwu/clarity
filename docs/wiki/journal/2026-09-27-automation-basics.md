---
title: 27 September 2026 — Automation basics
section: Journal
status: Exploring
updated: 2026-09-27
order: 550
summary: Proposed upstream scheduling with skipped missed runs; awaiting a decision.
---
# 27 September 2026 — Automation basics

After settling project-defined board participation, the user asked what to resolve next. Moved the discussion to automations, starting with missed recurring runs while the Mac sleeps or Clarity is explicitly quit.

Rechecked the upstream Scheduler documentation: missed occurrences are skipped, its management app is read-only, and Connections controls enablement. Recommended retaining that behavior for simplicity instead of adding catch-up. One catch-up run when execution becomes available remains an alternative, not an accepted requirement. Earlier suggestions of a richer automation UI are also not accepted scope.

Proposed that a wiki updater retain input progress from its last successful check, so skipping a scheduled time would not itself skip unprocessed information. Eligible app state, pending approvals, and local runtime recovery still need resolution or validation. No new decision was recorded and no application code was built.

See [Automations](../features/automations.md#next-discussion-missed-runs-27-september-2026).
