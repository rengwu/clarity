---
title: Mail
section: Features
status: Current
updated: 2026-10-03
order: 50
summary: Google-connected inbox and message reader with chat summaries.
---
# Mail

Stable ID: **FEAT-mail**.

## Current specification · 1 October 2026

A Google-connected inbox and message reader, with chat reading and summaries. No compose, reply, mutation, or Gmail browser deep-link action: the user explicitly dropped that link requirement (D39).

Connect a desktop Google OAuth client with Gmail API enabled using read-only Gmail authorization. The screen lists/searches messages and opens the selected message. Current defaults fetch pages of 30, with at most five metadata requests concurrently. Prefer plain-text bodies; fall back to text extracted from HTML. Preserve useful sender/subject/date information without running email HTML.

Module operations are `list {query?,pageToken?}` and `read {id}`. Reads return live API results. The selected lean implementation does not create a durable offline mailbox/archive; displayed content is temporary UI state, although text requested in a chat may become part of that chat's stored history. Authentication errors must remain visible rather than appear as an empty inbox.

Controlled fixtures verify OAuth/refresh and read-only Gmail requests. A real Google account remains unvalidated. Connection storage and disconnect behavior are defined in [Modules and connections](../foundations/integrations.md).

### Usability fixes · 1 October 2026

Remember search input, submitted query, current page token, the token history, and selected message while switching modules in the running renderer. Older messages pushes the current token; Previous page pops one level; First page resets history. A new search resets paging and selection. Controls wait for the current page request. This is temporary view state, not a saved mailbox or restart-persistent cache.

Connect Google opens Settings at Google. Links to message IDs open that message; API errors are visible. Distinguish loading, no search matches, and an empty inbox. Controlled connected-screen fixtures verify leaving/returning and one-page back navigation; live Gmail validation remains outstanding.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Production redesign · 1 October 2026

The inbox uses compact message rows and a continuous divider. Message selections enter shared history; switching modules retains the selected message and inbox query/page. Mail remains read-only. Connected omni-search runs only after Search Mail; previewing a chosen message is an explicit read, and leaving Chat requires Open in Mail.

Shared tokens and navigation are specified in the [desktop contract](../foundations/desktop-stack.md#compact-shared-design). Reproduce the selected changes with `node --test tests/redesign.mjs` and this topic’s existing regression recipe; the [port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) records exact scope and limitations.

### Spike fidelity repair · 1 October 2026

The inbox uses the shared compact search field and an icon-only Refresh button with an accessible name/tooltip. Message rows retain subject, sender and date in a compact stack. Reader metadata places sender and a formatted local date/time on one wrapping line above the message body. Connected-state changes refresh the visible resource without requiring an app restart; search submission and the read-only provider boundary remain unchanged.

### Adversarial fixes · 2 October 2026

Google auth changes clear the inbox, selected reader, paging/search state and local errors, and invalidate pending Mail requests (QA11). Late list/read replies from the old account cannot repopulate the view. Successful module navigation within one account retains its place; a same-account refresh failure can retain that account’s existing content with an error. Mail remains read-only and account fixtures do not establish live Gmail compatibility. The [remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) records the checked build; the original failed audit remains historical evidence.

### List feedback spacing · 3 October 2026

Inbox loading/empty/no-match text uses the shared 12px separation below search (previously 8px). Populated message rows retain their existing search gap. Follow the [shared spacing recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage); the [spacing run](../verification/runs/2026-10-02T163455Z-list-spacing.md) verifies controlled inbox layouts in both themes and window sizes.

### Verification recipe and coverage

**Adversarial recipe:** Run `tests/adversarial-state.mjs`: select a fixture message, hold old inbox and reader replies, disconnect/reconnect into failed new reads, then release the old replies. Require the old subject/body/list to remain absent. Check successful same-account navigation and failed same-account refresh retention separately. Build with an external cache and use a fresh evidence directory as described in [Verification setup](../verification/setup.md#adversarial-regression-suite).

**Repair checks:** follow the [shared motion/density recipe](../foundations/desktop-stack.md#verification-recipe-and-coverage), then exercise this module’s existing save/cancel/navigation and error workflows through the native UI. Inspect settled frames as well as active transitions; a still screenshot alone does not prove motion.

**Entry points and prerequisites:** Mail → Older messages → select message → leave/return → Older → Previous page. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='Mail and Music' tests/usability.mjs`. Controlled Mail responses isolate navigation; selection/page return and one-page history must survive module switching. Authentication/provider behavior belongs to the separate connector checks. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — remediation, negative controls, retained Settings guard and combined-build checks.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — original failures on its frozen build; subsequent remediation is recorded above.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — compact presentation, real motion, preserved entry points and explicit provider limits.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — shared presentation and selected native module regressions.

- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

### Cloudflare OS reassessment · 27 September 2026

The inbox, reader, and chat summaries remain read-only. Reusing a Google connector does not authorize its compose/send/modify functions. Backend execution is local; offline cache behavior remains to be defined, and no new Gmail browser-link work is requested.

These are adaptation notes, not acceptance of new features or removal of the retained behavior below.

### Stated intent

Include mail similar to Lucia. It only works if a Google account is connected.

### Accepted scope

**Accepted from the user ([D37](../decisions/index.md#d37-inbox-and-message-reader-25-september-2026)):** just an inbox and message reader. No composing or replying. Chat can read and summarize mail, as already established under D17.

The user dropped the proposed browser link ([D39](../decisions/index.md#d39-drop-the-gmail-browser-link-25-september-2026)). Exact layout remains undecided; no additional mailbox-management features are selected.

### Browser link feasibility

**Historical research; feature dropped:** Google describes individual email URLs in its [Gmail blog](https://gmail.googleblog.com/2007/11/5-little-known-gmail-features-you-may.html). The documented [Gmail API Message resource](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages) supplies message/thread IDs, not a browser permalink field. Reliable link generation had not been verified when the user chose to drop the feature.

No browser-link implementation or validation work remains in scope.

### Open questions

- Which message data is stored locally?
- What remains available after disconnecting or going offline?

### Reference notes

The user identified Lucia as `~/Desktop/Projects/john-harness`. Its README describes read-only Google connections and a retained local mail archive. Mail implementation has not been audited in this planning session; those reference details do not expand Clarity's agreed inbox/reader scope.

### Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
