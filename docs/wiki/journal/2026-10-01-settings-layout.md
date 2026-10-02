---
title: 1 October 2026 — Settings layout polish
section: Journal
status: Current
updated: 2026-10-01
order: 2026100103
summary: Separate Settings navigation from scrolling, pad focused sections, and align form-control widths.
---
# 1 October 2026 — Settings layout polish

The user reported an intrusive scrollbar, an overlapping sticky selector, a highlighted section without padding, and inconsistent input widths. [D114](../decisions/index.md#d114-settings-layout-polish-1-october-2026) records the requested corrections and delegated layout details; [Settings](../foundations/integrations.md#usability-fixes-1-october-2026) owns the current rebuild contract.

The title and Go to selector now occupy a stationary header above the scrolling body. The body fills the workspace, putting a thin scrollbar at the outer edge while retaining a centered readable column. Every section, including the wrapped Permissions and Agent approvals components, gets padding and consistent separation. Section focus uses the theme accent inside the padded boundary, and the next keyboard Tab reaches its controls. Labelled inputs and selectors share the same responsive maximum width regardless of form nesting.

The [dated run](../verification/runs/2026-10-01T035337Z-settings-layout.md) records sixteen layout scenarios in each of the development and packaged apps: four sections, two themes, and normal/minimum window sizes. It also covers Mail's Google entry point, real wheel scrolling, Tab focus, saved Linkding refresh choice after reload, the approval checklist, existing UI regressions, type checks, and package relocation. The package driver needed an exact task-field selector because its broad match also found the newly available task-date input; that harness failure and the passing rerun are retained separately.

Existing work and concurrent unrelated task/calendar changes were preserved. Evidence distinguishes the tested package from later source snapshots. The verified signed bundle is installed with its preceding bundle backed up; normal Quit/reopen loads it. No new live-provider or VoiceOver validation is claimed.
