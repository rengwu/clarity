---
title: Automations
section: Features
status: Current
updated: 2026-10-02
order: 120
summary: Local workflow automation using Lucia as a reference.
---
# Automations

Stable ID: **FEAT-automations**.

## Current specification · 1 October 2026

The current automation is scheduled maintenance of a selected wiki topic from new relevant app state. Configure a title, plain-language source instruction, topic path, daily/weekly time, optional weekdays, and enabled state. Show latest status/result/errors, any pending approvals, and Run now on Automations. Scheduled output must never create or populate chats (D76).

The user-approved rule starts with new input from enablement; historical backfill requires a request. Preserve conflicting evidence while weighting newer evidence more strongly. Missed runs are skipped (D69). Scheduling works only while Clarity is running, including with its window hidden; there is no independent daemon.

### Redesign adoption scope · accepted

Q11 accepts preserving the current automatic input set for the first redesign port ([D122](../decisions/index.md#d122-preserve-automation-inputs-for-the-first-redesign-port-1-october-2026)). Keep Notes, chats, Todos, Calendar, Expenses, News and Bookmarks as the candidate sources, subject to the existing enablement, incremental-input and relevance rules below. Omit the spike's per-automation source checklist from the port. Mail, board, Wiki and automation output are not added as automatic inputs. This settles the earlier unanswered Q2 without expanding the scheduler.

Carry the current plain-language instruction, target topic, schedule, status/history and approval behavior into the compact UI. Port verification must confirm the source checklist is absent, existing jobs retain their configuration/cursor, and eligible changes still reach the configured topic under the existing write policy. The production port preserves this runtime behavior and omits the checklist. The dated run separates source/fixture coverage from live execution.

### Selected runtime defaults

Persist configuration, normalized schedule, next run, last run, `since` cursor, and outcome in `automations`. The schedule captures the device IANA timezone when created/updated. A roughly 15-second tick runs due work; occurrences more than 60 seconds late are skipped. Advance past missed occurrences on startup. Do not overlap two runs of the same automation. No catch-up queue, general trigger engine, or workflow builder is included.

Start the cursor at creation and advance after successful processing. Candidate inputs are changed records from enabled chats, bookmarks, news, todos, calendar, and expenses, plus Notes file modification times. Wiki, board, mail, and automation output are not automatically gathered. The plain-language instruction filters relevant supplied changes; it is not a separate search index or an external-news crawler. Preserve this actual source boundary rather than promising every module is automatically scanned.

Group changes chronologically by update time before applying the working limits (100 changes / 120,000 characters). Advance only through the last processed group; never skip omitted newer input. If one same-time group cannot fit, report an error and leave the cursor unchanged. The existing topic has a 100,000-character working limit and an agent run has a three-minute timeout. No-new-input runs can advance the checked-through time. Failed runs preserve the cursor.

### Writes and failure behavior

Writes to the configured wiki topic remain preauthorized for that run. Other mutations follow the shared [action approval checklist](../foundations/chat.md#automatic-approval-checklist): checked methods execute immediately and keep a result/error record; unchecked methods enter review. Records remain owned by `automation:<id>` and appear in Automations. Schedule add, update (including enable/disable), and remove are also separately selectable agent actions. Interactive browser access remains chat-only. Read the current page/version before writing; stale writes fail rather than merge blindly. Different jobs targeting one page rely on this conflict check, not a collaborative editor. Source deletions are not automatically interpreted as factual retractions.

Module methods are `list`, `add {title,instruction,topicPath,hour,minute,frequency,weekdays?}`, `update {id,...fields,revision}`, and `remove {id,revision}`. Run now is a direct UI action. Validation covers missed runs, empty input, failure cursor preservation, chronological batching, and output isolation. General-purpose automations, terminal workflows, and extra trigger types are not implemented. Linkding refresh uses its own simple interval in the connector service, as specified in [Bookmarks](bookmarks.md#linkding); it does not create a wiki automation.

### Usability fixes · 1 October 2026

Every action status is visible inside its owning job: Needs approval, Applying, Completed, Dismissed, or Failed, with the recorded error and readable changes. Apply/Dismiss updates the existing card; action history does not disappear after review. The job's own last result/error remains separate. Action reads refresh after job-list or action changes, and failures are visible. Lists fetch all pages, item links reveal a job, saves guard overlapping submissions, and permanent job deletion requires confirmation.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

The production screen uses the compact shared controls and action-card presentation. No per-job source checklist was added. Job configuration, incremental cursor, scheduling and existing input/approval boundaries remain governed by the current service. All saved action statuses stay with their owning automation.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The overview uses a small automation icon, title/instruction/topic-status stack, compact enable switch, Edit icon and Run now action. Forms keep the current title, instruction, topic and schedule controls; no source checklist is introduced. Hover/focus, centered checkbox/select SVGs, tooltips and dialogs use the shared compact system. Stored jobs, incremental cursors, run history and approval behavior remain unchanged.

### Revision enforcement · 2 October 2026

Existing-record update/remove methods require a positive safe-integer revision at execution. Missing and malformed guards cannot bypass conflict checking in human, queued or automatic calls (QA07). A failed action retains its error and does not alter the target job. The [adversarial remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records direct-service and approval checks.

### Verification recipe and coverage

**Revision recipe:** Run `tests/adversarial-services.mjs` after an isolated build. Check missing/malformed/stale revisions, newer human edits, failed action records and current-revision success across all mutable collections, including automation configuration.

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Automations → owning job → action history. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Seed all four terminal/pending action statuses on one paused job; observe owner grouping, readable fields and errors. Scheduler execution is exercised by the existing core tests, not inferred from cards. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — required revision enforcement across direct, queued and automatic mutations.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — failed Run now without Codex preserves the input cursor and creates no Chat; controlled recovery passes.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Cloudflare OS reassessment · 27 September 2026

The backend now runs locally. Automations require the computer and runtime to be available; closing the window keeps Clarity running, while explicit Quit exits (D63). Reuse the upstream Scheduler and approvals first. Under [D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026), missed runs are skipped and recurring work resumes at the next scheduled time. No catch-up run or replay is added.

Incremental input, overlapping wiki writes, and pending approval outcomes still need lean behavior definitions. The custom saved-thread permission design is set aside for now.

### Stated intent

Include automations similar to Lucia. State belongs under the single Clarity root (D64); the separate development folder is dropped.

### Scheduled wiki maintenance

**Accepted from the user:** the Automations page lets users schedule automatic updates to selected wiki content. Runs explore only new app state and update when new relevant information is found. [D31](../decisions/index.md#d31-one-topic-organized-html-knowledge-base-25-september-2026) clarifies that there is one knowledge base organized by topic; the earlier selected-wiki target is therefore a topic within it. See [D28](../decisions/index.md#d28-scheduled-wiki-updates-from-new-app-state-25-september-2026) and [wiki maintenance](wiki.md#scheduled-maintenance).

The target topic and schedule are required parts of this flow. Freshness is relative to available app information; the request does not add independent web research to each run. Scheduled maintenance uses upstream access and approval behavior; custom chat-thread grants are set aside for now.

**Assistant proposal:** when enabling a schedule, clearly authorize its recurring wiki edits, show the chosen provider/model and target, and allow pause/disable. Record the last successful check and a concise outcome: updated, no relevant changes, or failed. The user has requested autonomous scheduled updates; the exact recurring-permission UI and mapping to upstream approvals remain to be defined.

#### Reliable execution — assistant assessment

Track processed source revisions per wiki/automation rather than rescanning everything on every run. Treat created and modified records as candidate new state; determine how corrections and deletions should affect existing claims. Read the existing wiki as the comparison baseline. Reuse no-change progress on the next run, retry failed work without duplicated edits, and prevent the updater's output from feeding itself.

Serialize or reconcile overlapping updates to one wiki. A relevant source link without accessible content may not be enough evidence to update a factual claim; define what source material is available to the run.

A local schedule also needs explicit behavior when Clarity is closed, the Mac sleeps, or the configured assistant/model is unavailable. Apple's archived [timed jobs guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/ScheduledJobs.html) documents different missed-job behavior for sleep and shutdown; it is evidence that catch-up must be designed, not a choice of scheduler. **Earlier assistant proposal, rejected in favor of [D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026):** coalesce missed intervals into one check of unprocessed changes when execution becomes available, instead of replaying every missed interval.

### Other automation scope

**Lean by default ([D30](../decisions/index.md#d30-lean-by-default-25-september-2026)):** keep the implementation intentionally simple. The reliability considerations above are not an accepted requirement for a general job engine. Raise difficult tradeoffs, including closed-app execution and overlapping wiki writes, with a simple alternative before committing to a complex solution.

Beyond scheduled wiki updates, define other triggers, actions, and execution records after reviewing the reference. Cloudflare OS supplies a scheduler to assess first; missed-run behavior is settled by D69; other run outcomes remain open.

### Open questions

- Which automation types beyond scheduled wiki maintenance are useful initially?
- If device sync is revisited later, how would two machines avoid executing the same automation twice? This is deferred under [D24](../decisions/index.md#d24-local-state-with-sync-deferred-25-september-2026).
- How do unattended automations interact with upstream approvals, and what happens if an action is waiting for review?
- What internal storage layout should hold automation state under the single Clarity root?

### Reference notes

The user identified Lucia as `~/Desktop/Projects/john-harness`. Its README describes scheduled prompts with cron/timezone, pause and run-now controls, results in new chats, and one catch-up run for missed periods. These are reference observations, not accepted Clarity scope. Automation implementation has not been audited in this planning session.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)

### Lifecycle proposal · 27 September 2026

**Accepted and refined by [D63](../decisions/index.md#d63-stay-running-until-explicit-quit-27-september-2026):** closing the last window keeps Clarity alive and accessible through the Dock/menu bar. Explicit Quit stops the app and its backend, playback, refreshes, and scheduled work. Reopening the window returns to the existing app. No independent always-running service or launch-at-login feature is requested.

Missed runs after sleep or explicit Quit are skipped (D69); resume at the next scheduled time. Failed execution and offline retry behavior remain separate. Approval-pending runs must remain distinguishable from completed edits; use the existing permissions system rather than creating a new one.

### Next discussion: missed runs · 27 September 2026

**Discussion resolved for missed runs by D69:** reuse upstream scheduling and approvals. Describe a requested automation in plain language with its target and schedule; do not introduce a workflow builder or a separate job engine.

The upstream [Scheduler documentation](https://github.com/cloudflare/cloudflare-os/blob/main/packages/gatekeeper-scheduler/README.md), checked on 27 September 2026, explicitly skips missed occurrences instead of replaying or catching them up. Its management app is read-only; enabling/disabling happens through Connections. A richer automation editor or run-history screen would be additional work, not existing behavior to assume.

**Accepted by the user ([D69](../decisions/index.md#d69-skip-missed-automation-runs-27-september-2026)):** skip missed times and resume recurring Clarity automations at the next scheduled time. Example: a daily 9 am wiki update missed while the Mac sleeps waits until the next day's 9 am run. The alternative is one catch-up check when execution becomes available, which requires adapting the upstream behavior. The user chose skipping to keep things lean. The catch-up alternative is not part of the agreed scope.

For incremental wiki maintenance, propose tracking progress from the last successful check so a skipped execution does not discard unprocessed app changes. This input-progress behavior is separate from replaying missed schedule times; its implementation and eligible source records remain open. Local runtime behavior across sleep and restart still needs validation.

### Accepted scope and results · 27 September 2026

**D74:** keep source instructions plain-language and simple, initially naming relevant chats, notes, and bookmarks as available. Start with changes from enablement; use the existing wiki as context. Historical backfill is only on request. No source-selector UI or broad indexing system is implied.

**D75:** retain conflicting evidence and favor newer evidence without silently treating it as fact. Mark unresolved disagreement within the wiki.

**D76:** results stay in Automations. Show a concise latest outcome there, including changed/nothing relevant/failed/awaiting review as applicable. Do not create chats or inject run summaries into chats. Preserve upstream approval semantics; fitting review into Automations requires validation and may need a small UI adaptation. Raise that mismatch before changing the platform's permission behavior. The earlier Lucia reference's new-chat output is not selected.

Automations are part of the broader product; D71 prioritizes chat, notes, todo, and wiki for the first useful version without requiring scheduled updates to ship in that initial scope.
