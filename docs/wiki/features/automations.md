---
title: Automations
section: Features
status: Exploring
updated: 2026-09-27
order: 120
summary: Local workflow automation using Lucia as a reference.
---
# Automations

## Cloudflare OS reassessment · 27 September 2026

The backend now runs locally. Automations require the computer and runtime to be available; closing the window keeps Clarity running, while explicit Quit exits (D63). Reuse the upstream Scheduler and approvals first. Under [D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026), missed runs are skipped and recurring work resumes at the next scheduled time. No catch-up run or replay is added.

Incremental input, overlapping wiki writes, and pending approval outcomes still need lean behavior definitions. The custom saved-thread permission design is set aside for now.

## Stated intent

Include automations similar to Lucia. State belongs under the single Clarity root (D64); the separate development folder is dropped.

## Scheduled wiki maintenance

**Accepted from the user:** the Automations page lets users schedule automatic updates to selected wiki content. Runs explore only new app state and update when new relevant information is found. [D31](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026) clarifies that there is one knowledge base organized by topic; the earlier selected-wiki target is therefore a topic within it. See [D28](../decisions/index.md#d28-scheduled-wiki-updates-from-new-app-state-25-september-2026) and [wiki maintenance](wiki.md#scheduled-maintenance).

The target topic and schedule are required parts of this flow. Freshness is relative to available app information; the request does not add independent web research to each run. Scheduled maintenance uses upstream access and approval behavior; custom chat-thread grants are set aside for now.

**Assistant proposal:** when enabling a schedule, clearly authorize its recurring wiki edits, show the chosen provider/model and target, and allow pause/disable. Record the last successful check and a concise outcome: updated, no relevant changes, or failed. The user has requested autonomous scheduled updates; the exact recurring-permission UI and mapping to upstream approvals remain to be defined.

### Reliable execution — assistant assessment

Track processed source revisions per wiki/automation rather than rescanning everything on every run. Treat created and modified records as candidate new state; determine how corrections and deletions should affect existing claims. Read the existing wiki as the comparison baseline. Reuse no-change progress on the next run, retry failed work without duplicated edits, and prevent the updater's output from feeding itself.

Serialize or reconcile overlapping updates to one wiki. A relevant source link without accessible content may not be enough evidence to update a factual claim; define what source material is available to the run.

A local schedule also needs explicit behavior when Clarity is closed, the Mac sleeps, or the configured assistant/model is unavailable. Apple's archived [timed jobs guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html) documents different missed-job behavior for sleep and shutdown; it is evidence that catch-up must be designed, not a choice of scheduler. **Earlier assistant proposal, rejected in favor of [D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026):** coalesce missed intervals into one check of unprocessed changes when execution becomes available, instead of replaying every missed interval.

## Other automation scope

**Lean by default ([D30](../decisions/index.md#d30-lean-by-default-25-september-2026)):** keep the implementation intentionally simple. The reliability considerations above are not an accepted requirement for a general job engine. Raise difficult tradeoffs, including closed-app execution and overlapping wiki writes, with a simple alternative before committing to a complex solution.

Beyond scheduled wiki updates, define other triggers, actions, and execution records after reviewing the reference. Cloudflare OS supplies a scheduler to assess first; missed-run behavior is settled by D69; other run outcomes remain open.

## Open questions

- Which automation types beyond scheduled wiki maintenance are useful initially?
- If device sync is revisited later, how would two machines avoid executing the same automation twice? This is deferred under [D24](../decisions/index.md#d24-local-state-with-sync-deferred-25-september-2026).
- How do unattended automations interact with upstream approvals, and what happens if an action is waiting for review?
- What internal storage layout should hold automation state under the single Clarity root?

## Reference notes

The user identified Lucia as `~/Desktop/Projects/john-harness`. Its README describes scheduled prompts with cron/timezone, pause and run-now controls, results in new chats, and one catch-up run for missed periods. These are reference observations, not accepted Clarity scope. Automation implementation has not been audited in this planning session.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

## Lifecycle proposal · 27 September 2026

**Accepted and refined by [D63](../decisions/index.md#d63-stay-running-until-explicit-quit-27-september-2026):** closing the last window keeps Clarity alive and accessible through the Dock/menu bar. Explicit Quit stops the app and its backend, playback, refreshes, and scheduled work. Reopening the window returns to the existing app. No independent always-running service or launch-at-login feature is requested.

Missed runs after sleep or explicit Quit are skipped (D69); resume at the next scheduled time. Failed execution and offline retry behavior remain separate. Approval-pending runs must remain distinguishable from completed edits; use the existing permissions system rather than creating a new one.

## Next discussion: missed runs · 27 September 2026

**Discussion resolved for missed runs by D69:** reuse upstream scheduling and approvals. Describe a requested automation in plain language with its target and schedule; do not introduce a workflow builder or a separate job engine.

The upstream [Scheduler documentation](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md), checked on 27 September 2026, explicitly skips missed occurrences instead of replaying or catching them up. Its management app is read-only; enabling/disabling happens through Connections. A richer automation editor or run-history screen would be additional work, not existing behavior to assume.

**Accepted by the user ([D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026)):** skip missed times and resume recurring Clarity automations at the next scheduled time. Example: a daily 9 am wiki update missed while the Mac sleeps waits until the next day's 9 am run. The alternative is one catch-up check when execution becomes available, which requires adapting the upstream behavior. The user chose skipping to keep things lean. The catch-up alternative is not part of the agreed scope.

For incremental wiki maintenance, propose tracking progress from the last successful check so a skipped execution does not discard unprocessed app changes. This input-progress behavior is separate from replaying missed schedule times; its implementation and eligible source records remain open. Local runtime behavior across sleep and restart still needs validation.

## Accepted scope and results · 27 September 2026

**D74:** keep source instructions plain-language and simple, initially naming relevant chats, notes, and bookmarks as available. Start with changes from enablement; use the existing wiki as context. Historical backfill is only on request. No source-selector UI or broad indexing system is implied.

**D75:** retain conflicting evidence and favor newer evidence without silently treating it as fact. Mark unresolved disagreement within the wiki.

**D76:** results stay in Automations. Show a concise latest outcome there, including changed/nothing relevant/failed/awaiting review as applicable. Do not create chats or inject run summaries into chats. Preserve upstream approval semantics; fitting review into Automations requires validation and may need a small UI adaptation. Raise that mismatch before changing the platform's permission behavior. The earlier Lucia reference's new-chat output is not selected.

Automations are part of the broader product; D71 prioritizes chat, notes, todo, and wiki for the first useful version without requiring scheduled updates to ship in that initial scope.
