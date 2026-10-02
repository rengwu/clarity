---
title: 1 October 2026 — Optional task dates
section: Journal
status: Recorded
updated: 2026-10-01
order: 2026100104
summary: Reconstructed record of the accepted task-date work and the limits of its retained verification evidence.
---
# 1 October 2026 — Optional task dates

**Reconstructed on 1 October during wiki integrity maintenance.** This page was already linked from onboarding and D115 but was absent from the checkout. It summarizes existing specifications and retained evidence, not a newly performed implementation or test session.

[D115](../decisions/index.md#d115-optional-task-dates-in-calendar-1-october-2026) accepts optional Todo dates and their appearance in Calendar. [Todos](../features/todos.md) owns storage, date editing, validation and completion behavior; [Calendar](../features/calendar.md#dated-tasks) owns the Week/Month projection and navigation to the same task. Dates do not add recurrence, reminders, priorities or another task list.

The existing evidence folder contains before/after source fingerprints, a log with two passing task-date tests, a passing UI regression log and package-build output. The [reconstructed report](../verification/runs/2026-10-01T035738Z-task-dates.md) links these artifacts without claiming a new run or complete final-package verification. The build association and final package checks require follow-up before treating this work as a completed validation handoff.
