---
title: 19 October 2026 — Pi Durable spike
section: Journal
status: Documented
updated: 2026-10-19
order: 2026101902
summary: Test manual recovery and approval continuation in an external Pi Durable 1.3.0 prototype.
---
# 19 October 2026 — Pi Durable spike

The user asked whether pi-ai, Pi Durable or LangChain would benefit Clarity. Source inspection established that Clarity already uses pi-ai and pi-agent-core 0.87.1. Pi Durable offered a relevant experiment in recovering task execution; LangChain/LangGraph were comparison options rather than selected dependencies. The user authorized the spike and requested grill-form for useful choices.

The [submitted round](2026-10-19-grill-abb54c06-04d6-4fca-9873-7072407fca23.md) selected explicit Resume after restart, continuing the task after approval, and deferring summaries. [D133](../decisions/index.md#d133-pi-durable-recovery-and-approval-spike-19-october-2026) records those choices for the experiment. The [execution topic](../foundations/harnesses.md#pi-durable-experiment-19-october-2026) keeps this distinct from production behavior.

An external prototype pins Pi Durable/Pi AI/Chord 1.3.0. Scripted provider responses drive the real runtime and Clarity's unchanged chat/module/approval/storage services with synthetic data. The [run](../verification/runs/2026-10-19T072255Z-pi-durable.md) records 15 passing scenarios: the current-app baseline, recovery and continuation checks, and two negative controls. Apply resumes the recovered task and a dependent tool sees the actual new Todo. Rejection, stale revisions, duplicate approval, interrupted effects, Stop and Close retain explicit outcomes.

The negative controls materially affect an adoption plan. Progress calls activate all conversations in one harness, so a new chat can accidentally resume interrupted work. Separate harnesses avoid that in the prototype. Also, declaring a write replay-safe does not make its effect idempotent: an intentionally unsafe declaration produced two writes. The review wrapper therefore only reattaches to persisted actions; it does not repeat their execution. Task-specific owner IDs are a fixture convenience, not the production schema.

**Assessment:** this establishes a useful benefit for recovery and approvals, while keeping application-level permissions and uncertain-effect handling necessary. A later integration needs a per-chat Resume gate, stable operation IDs, saved-history/event mapping, Close/Stop handling and current Codex/Electron validation. It does not justify a direct dependency swap or establish lower maintenance cost. Live accounts, renderer/package behavior and migrations were not tested; summaries remain deferred. The [technical record](../references/technical-spikes.md#pi-durable-recovery-and-approval-spike-19-october-2026) owns commands and retained evidence.

Application source, production dependency pins, installed Clarity and user data were not changed. Disposable source, dependencies and fixtures remain in the external cache; this repository retains documentation, build identities and synthetic verification evidence.

## Validation

The external runtime driver passed all 15 selected scenarios. `node --test tests/wiki-reader.mjs tests/wiki-reports.mjs` passed 13 tests; `node tooling/check-reports.mjs docs/wiki` validated 31 reports. The wiki rebuilt to 179 pages and passed its freshness/link/metadata/attachment check; `git diff --check` passed. These documentation checks are separate from the prototype evidence and do not certify a production app build.
