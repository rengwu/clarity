---
title: 1 October 2026 — Cursor Desktop design spike
section: Journal
status: Current
updated: 2026-10-01
order: 2026100105
summary: An external browser prototype translates Cursor Desktop's visual language to Clarity's personal workspace.
---
# 1 October 2026 — Cursor Desktop design spike

The user requested a working visual spike based on Cursor Desktop and a browser preview. [D116](../decisions/index.md#d116-cursor-desktop-design-spike-1-october-2026) records that authorization. The [technical-spike topic](../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026) owns its design observations, behavior, source location, restart instructions and boundaries.

The running Cursor Agents window and installed dark/light themes supplied the reference. Automated native exploration was gated by macOS Accessibility, so no complete Cursor interaction audit is claimed. The spike adapts compact navigation, subdued surfaces, document tabs, a source panel and the bottom composer to Clarity's shared modules. It provides real local UI interactions and deliberately labelled scripted chat responses.

All source and fixture data live outside the Clarity workspace. No package files or dependencies were introduced. The production implementation was not edited by this task. The [browser run](../verification/runs/2026-10-01T060000Z-cursor-spike.md) covers task proposals and item links, date/completion/cancel/delete flows, note editing, reload persistence, Wiki context handoff, palette/keyboard controls and both themes at desktop/minimum sizes. Screenshots and source fingerprints are retained in the wiki. The preview was restored to its sample chat for handoff.

The first wiki check found pre-existing links to a missing task-date journal and run report. Their existing topic requirements and retained logs were inspected; the missing pages were reconstructed with explicit provenance. The [reconstructed report](../verification/runs/2026-10-01T035738Z-task-dates.md) preserves the two passing task-date test results and passing UI regression log, while marking the final-build/package audit Untested. No task-date production tests were rerun as part of this visual spike, and missing evidence was not presented as a fresh pass.

The browser prototype is ready to review. Adopting this design in the full app, reconnecting production services, and validating the full module surface remain separate work.

## Preview server recovery

The user reported that the URL was unavailable after handoff. There was no listener on port 4318 and a direct request failed. The original foreground tool process was therefore insufficient for ongoing access. Started the same server through a temporary macOS `launchctl submit` job, independently of the tool session, and reopened the browser. A subsequent tool invocation verified the live job, HTTP 200 for all five browser assets and exact source hashes against the original manifest. Browser inspection confirmed that the UI loaded visibly. [Recovery evidence](../evidence/2026-10-01T060000Z-cursor-spike/server-recovery.json) records this correction. Source and sample data were unchanged; the job lasts for the login session, with no login-startup installation.
