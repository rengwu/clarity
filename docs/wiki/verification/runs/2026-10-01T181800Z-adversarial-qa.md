---
title: 2 October 2026 — Adversarial application audit
section: Verification runs
status: Recorded
result: Failed
updated: 2026-10-02
order: 2026100209
summary: Fifteen reproduced defects across native workflows, shared module validation, failure recovery and minimum-window layouts.
---
# 2 October 2026 — Adversarial application audit

## Scope

The user requested adversarial QA of the entire app. This audit exercised all twelve modules, Settings and shared navigation, with extra attention to malformed content, concurrent edits, delayed responses, account changes, cancellation, keyboard shortcuts and recovery. It found **15 reproducible product issues: 3 P1, 10 P2 and 2 P3**. A focused handoff check confirmed that concurrent Settings work resolves QA15 on a later build, leaving **14 open findings**. P1 denotes a crash or loss/overwrite of work; P2 denotes a broken workflow or materially misleading state; P3 denotes a lower-impact presentation defect. These priorities are audit assessments.

The [feature map](../../features/index.md#verification-map) and existing topic contracts define expected behavior. This is a separate QA pass, with no application-source fixes, deployment or live-account changes performed by the audit. Earlier reports remain evidence for their selected scenarios; their passes do not cover the new adversarial cases.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5; light/dark at 850×600 and 1200×800. Each driver owned a temporary data root and Electron process. News used a local HTTP fixture; Mail/auth transitions and delayed Chat/bookmark replies used controlled IPC. Other record/file operations went through real shared services and persistent storage. No model calls or real user accounts were needed.

The working checkout was already dirty and changed concurrently during the audit. The [initial manifest](../../evidence/2026-10-01T181800Z-adversarial-qa/build-before.json) identifies application SHA-256 `1d0b6918e37356a494399193414bd0526fbfb81c922e64b5108d8065d59ca205`. All numbered findings were then reproduced against an isolated source snapshot with application SHA-256 **`ffc4ead306180de8ed888b044724178e90c9131cba66c017c703166b8a1941ac`**, verification SHA-256 `eb222a36fd1670d5389525374756ed804428cc407bace277c5ca3014c2481c5c`, and underlying Git revision `7dda8e3a28b1f897245ae3295246bc03b3eddb28` plus the recorded dirty files.

[The frozen manifest](../../evidence/2026-10-01T181800Z-adversarial-qa/build-freeze.json) records exact source hashes. [Runtime identity](../../evidence/2026-10-01T181800Z-adversarial-qa/frozen-runtime.json) records all 12 development-output files and confirms all 91 snapshot files still match. Source and output are isolated under `~/Library/Caches/Clarity/build/adversarial-qa-20261002/{frozen-source,frozen-cache}`; only dependencies are shared from the external cache. Package hashes embedded in the original fingerprint describe another concurrent cached bundle and are **not** claimed as this audit's tested runtime. Findings below apply to this frozen development build, not an unverified later checkout or installed bundle.

The separate QA15 follow-up uses application SHA-256 `75ce6962fa7669b9ee5f0e487b56e1e0b873738b3cb6540cd41972b02ca9fc55`, with [93 matching snapshot files](../../evidence/2026-10-01T181800Z-adversarial-qa/checkout-after.json) and [runtime hashes](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-followup/runtime.json). It is built in separate `settings-followup-source` / `settings-followup-cache` directories under the audit cache. Only QA15 was rechecked on these later bytes; this is not a second whole-app certification.

## Results

| Check | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Initial standard suite | Existing controlled scenarios pass | 37 passed, 2 gated live checks skipped | Passed |
| Frozen standard suite | Existing controlled scenarios pass | 40 passed, 1 Spotify driver failure, 2 gated live checks skipped; the failure was diagnosed below | Failed |
| Repaired Spotify driver on unchanged frozen app | Wait for complete fixture rows and consume each delayed fixture event | Same collection/cache/error/player assertions pass | Passed |
| Application and Worker types | Type checks succeed | Exit 0 on the frozen source | Passed |
| QA01–QA14 adversarial scenarios | Preserve work, reject invalid writes and retain usable navigation | All fourteen incorrect behaviors reproduced; none left as a harness unknown | Failed |
| QA15 Settings navigation | Labels fit at the supported minimum size | Both themes overflow at 850×600; both fit at 1200×800 | Failed |
| QA15 after concurrent Settings rewrite | Same four layout expectations | Both sizes/themes now fit and the section opens; QA15 closed for the follow-up build | Passed |
| Notes write failure recovery | Failed flush prevents disabling Notes; recovery copy preserves draft | Checkbox remains enabled; recovery Markdown equals the unsaved draft | Passed |
| Disconnected automation | Failed run retains input cursor and stays outside chats | Visible connection error, unchanged cursor, unchanged chat count | Passed |
| Cross-module appearance capture | Every surface opens in both themes and sizes | 52 screenshots and shell geometry records captured; inner Bookmark/Settings overflow is tracked in QA13/QA15 | Passed |

Logs: [initial suite](../../evidence/2026-10-01T181800Z-adversarial-qa/baseline-tests.log), [frozen suite](../../evidence/2026-10-01T181800Z-adversarial-qa/frozen-baseline-tests.log), [types](../../evidence/2026-10-01T181800Z-adversarial-qa/frozen-typecheck.log), [adversarial reproduction](../../evidence/2026-10-01T181800Z-adversarial-qa/reproductions.log), [Settings navigation](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-navigation.log). [Structured results](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/results.json) retain expected/actual outcomes, saved values and errors; [layout observations](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/layouts.json) cover all 52 captures.

### QA01

**P1 · Malformed Markdown link blanks the entire app.** FEAT-chat, FEAT-notes, FEAT-shared-ui.

Reproduce: save a note containing `[Broken link](broken%ZZ.md)`. From Chat, open Search and commands, find that note and select its source preview. Expected: render the note safely or show a local link/preview error. Actual: `URI malformed` escapes render; `#root` has zero children and the whole window is blank. Reload recovers; the separate Chat draft survives in this fixture.

Source: `src/renderer/markdown.tsx:61` decodes the relative link without handling malformed escapes; the render path has no boundary containing this error. [Blank screen](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA01-blank-renderer.png). Recovery by reload does not make ordinary document content safe to preview.

### QA02

**P2 · A global shortcut hides an open modal but leaves the workspace inert.** FEAT-shared-ui, FEAT-todos, FEAT-chat.

Reproduce: Todos → New task, type a draft, press ⌘L, then try to click the visible Chat composer. Expected: navigation either stays in the dialog or leaves a usable destination with an explicit draft policy. Actual: Chat appears, while the native modal remains inside the now-hidden Todos host. Pointer events hit the document backdrop; the visible composer cannot be clicked. Escape restores interaction.

Source: the global key handler in `src/renderer/main.tsx` changes modules while mounted hidden hosts retain their modal dialogs. The result record captures `dialog:modal`, `hiddenHost: true`, zero visible dialog geometry and the actual pointer-interception failure after motion settles. [Invisible-modal state](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA02-hidden-modal.png).

### QA03

**P2 · Notes Bold also collapses the application sidebar.** FEAT-notes, FEAT-shared-ui.

Reproduce: open a note in the rich editor, select text and press ⌘B. Expected: apply bold within the focused editor. Actual: bold nodes are created and the global sidebar simultaneously collapses.

Source: `src/renderer/main.tsx` handles the shortcut without respecting the editor's consumed event/focus context. [Both effects](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA03-bold-sidebar.png). This is distinct from the intentional sidebar shortcut outside an editor.

### QA04

**P2 · A late bookmark save closes and discards a newer draft.** FEAT-bookmarks.

Reproduce with a held `bookmarks.add` reply: fill the first Add bookmark form and Save; while pending, Cancel remains usable. Open Add bookmark again and fill a different title/URL; release the first response. Expected: completion belongs to the first submission and preserves the second draft. Actual: the second dialog closes, its text disappears and only the first bookmark is saved.

Source: `src/renderer/views/bookmarks.tsx` unconditionally clears `editing` when the earlier asynchronous submission completes; Cancel also clears that shared state during submission. [New draft before](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA04-before-ack.png) and [after completion](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA04-after-ack.png). Controlled latency reproduces real renderer/save behavior; no claim is made about its frequency on a fast disk.

### QA05

**P2 · Renaming a note with a leading dot makes it disappear from browsing and search.** FEAT-notes.

Reproduce: rename an existing note to `.hidden-draft`; close its active tab and search for `hidden-draft`. Expected: keep a successfully renamed note discoverable, or reject the unsupported name before moving it. Actual: rename succeeds, but the tree and global search cannot find it. The Markdown still exists on disk with its saved content; this is an in-app discovery failure, not file deletion.

Source: naming/moving accepts the leading dot while listing in `src/main/files.ts` excludes dot-prefixed entries. [Hidden note](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA05-hidden-note.png), [empty search](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA05-hidden-note-search.png).

### QA06

**P2 · Wiki links to another page's heading lose the heading destination.** FEAT-wiki.

Reproduce: create `Deep.md` with enough text before `## Details` to require scrolling; click `[Jump to details](Deep.md#details)` from another page. Expected: open Details in view. Actual: the final frame hash is `#Deep.md`, scroll is zero and Details sits at y=2681 in a 521px viewport.

Source: `src/main/wiki.ts` reports only the page path; `src/renderer/views/wiki.tsx` turns that into a new frame destination without the fragment. [Wrong destination after click](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA06-wiki-anchor.png). The page loads successfully, which conceals the lost heading navigation.

### QA07

**P1 · Omitting a revision lets a queued agent action overwrite or delete a newer human edit.** FEAT-chat, FEAT-todos; shared mutation boundary.

Reproduce using the real shared service: create a task; call `Modules.agent(chat, 'todos', 'update', {id, title})` without `revision`; edit that task through `Modules.invoke` using its proper current revision; approve the earlier queued action. Repeat with `remove {id}`, editing before approval. Expected: missing/stale revisions are rejected before changing existing records. Actual: the newer title is overwritten without conflict; the later queued deletion also removes the newly edited task.

Source: `src/main/modules.ts` forwards an absent `args.revision` to the optional store guard. The method catalog describes the revision requirement, but the generic agent argument object does not enforce it. This reproduction exercises the real agent queue, approval and SQLite services; it does not depend on a live model making the mistake. Normal UI edits supply a revision, so the older stale-revision test still passes. [Structured before/after and deletion evidence](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/results.json).

### QA08

**P2 · Expenses and Calendar accept impossible calendar dates through shared methods.** FEAT-expenses, FEAT-calendar.

Reproduce through the agent/UI-shared `module` boundary: add expenses with `2026-02-30`, `2026-13-40` and `0000-00-00`; add an event starting `2026-02-30T09:00:00+08:00` and ending one hour later. Expected: reject impossible dates before persistence. Actual: all are stored. Expenses displays `Invalid Date` for two rows; JavaScript normalizes the February event to March 2 while the invalid original value remains stored.

Source: the expense check in `src/main/modules.ts` validates shape only; Calendar accepts any finite `Date.parse` value. [Expense display](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA08-invalid-dates.png). Native date pickers ordinarily constrain human input; this finding concerns the equally supported shared method path.

### QA09

**P2 · Board accepts a reply to a missing parent and then cannot read its thread.** FEAT-agent-board.

Reproduce: call `board.post` with valid text/topic and `threadId: 'nonexistent-parent'`, then `board.read` with the returned post ID and search with `threads: true`. Expected: reject the invalid parent. Actual: posting reports success and persists a record; reading returns `thread: null, replies: []`, and thread search cannot expose it.

Source: `src/main/modules.ts` writes the reply without resolving its parent. This is a service-validation case; normal UI replies start from an existing thread. [Persisted post and empty read/search](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/results.json).

### QA10

**P3 · News headlines show XML entities as literal text.** FEAT-news.

Reproduce: News → Sources → add an RSS feed whose title is `QA Research &amp; Development`, then Refresh. Expected display: `QA Research & Development`. Actual: the saved/headline text visibly retains `&amp;`.

Source: `src/main/integrations.ts` parses with entity processing disabled and the resulting encoded string reaches the text renderer. [Rendered headline](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA10-news-entities.png). The real HTTP/import path was used. An accompanying HTTP 503 source is correctly reported while the successful source remains visible.

### QA11

**P2 · Mail shows a prior account's message after reconnecting into a failed read.** FEAT-mail.

Reproduce with controlled auth events/read-only Mail responses: read a message; disconnect Google; reconnect with failing inbox/message responses. Expected: prior-account selected content is invalidated and the connection error stands on its own. Actual: the new error appears above the old subject, sender and private fixture body.

Source: `src/renderer/api.tsx` retains resource data on read errors, and `src/renderer/views/reading.tsx` retains selected message state across the account transition. [Stale account content beside the error](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA11-old-mail-content.png). This demonstrates local account-state contamination, not remote disclosure or a verified live Gmail account switch.

### QA12

**P1 · A delayed Chat send acknowledgement erases a newly typed unsent draft.** FEAT-chat.

Reproduce: hold the reply to `chats.send`; send the original text, then replace the still-editable composer with `QA NEW UNSENT DRAFT` before releasing the reply. Expected: completion clears only the submitted draft or otherwise preserves newer edits. Actual: both the composer and persisted draft become empty. The captured outgoing request contains only the original text, so the newer draft was neither sent nor retained.

Source: `src/renderer/views/chat.tsx:165` awaits send preparation and then unconditionally calls `setText('')`. Real preparation may include asynchronous work, but this audit used a controlled acknowledgement and no model call. [Before reply](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA12-before-ack.png), [after reply](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA12-after-ack.png).

### QA13

**P2 · Many supported bookmark tags reduce its title to zero width.** FEAT-bookmarks.

Reproduce: add a bookmark with 40 short tags through the supported module method and view it at 850×600. Expected: tags remain bounded/wrap/truncate while preserving an accessible title/open action. Actual: title width is 0px; the 596px row has 2513px of content, with 2467px occupied by tags. The title is visually unavailable and the page horizontally scrolls.

Source: `.bookmark-first-line` and `.bookmark-tags` in `src/renderer/workspace.css` do not bound the combined tag row. [Collapsed title and overflow](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA13-bookmark-tags.png). This is accepted input, not an unsupported injected DOM state.

### QA14

**P2 · Board reply errors appear twice and remain after the corrected reply succeeds.** FEAT-agent-board.

Reproduce: open a thread, enter whitespace in Reply and Post; replace it with valid text and Post again. Expected: one local error while invalid, cleared after success. Actual: the same validation error appears above the thread and below the reply form, and both remain after the valid reply visibly appears and is persisted.

Source: `src/renderer/views/agents.tsx` renders the same error in two places and does not clear it on the corrected reply path. [Saved reply with both stale errors](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA14-board-stale-errors.png).

### QA15

**Subsequent correction:** the [Settings redesign run](2026-10-01T184717Z-settings-redesign.md) resolves this finding and reruns the original four theme/size cases on the new build. The observations below and this report’s Failed result remain the original frozen-build evidence.

**P3 · Settings navigation clips a standard label at the supported minimum width.** FEAT-settings, FEAT-shared-ui.

Reproduce: resize to 850×600, open Settings and inspect Search and commands. Expected: the standard section label fits the navigation column without horizontal scrolling. Actual in both themes: the 159px inner column has a 167px scroll width; the label extends 7px past its right edge and a horizontal scrollbar appears. The section remains clickable. At 1200×800, both themes fit.

Source: the 160px responsive `.settings-nav` rule in `src/renderer/workspace.css` is narrower than the label/icon/padding combination. [Light minimum](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA15-settings-light-850.png), [dark minimum](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/QA15-settings-dark-850.png), [four measured cases](../../evidence/2026-10-01T181800Z-adversarial-qa/confirmed/settings-navigation.json).

**Resolved in the later concurrent Settings build.** The new `src/renderer/settings.css` gives this label room to wrap. The same driver passes all four cases: the minimum column has equal 167px client/scroll widths, and the desktop column has equal 195px widths. The section opens in each case. [Follow-up observations](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-followup/settings-navigation.json), [log](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-followup.log), [visually inspected minimum layout](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-followup/QA15-settings-light-850.png). This audit verified the concurrent change; it did not implement it.

## Coverage and harness diagnosis

The standard suite exercised ordinary local CRUD, files/conflicts, persistence/restart/window lifecycle, approval claims/checklists, browser permission boundaries, task dates, command interpretation/cancellation, source preview/history, provider connection/error fixtures, Music playback state/cache/pagination/normalization, Linkding reconciliation and automation failure handling. The new cases probe combinations and invalid states beyond that baseline.

| Surface | Additional audit coverage | Findings |
| --- | --- | --- |
| Chat and shared shell | Malformed source preview, draft replacement during send, modal navigation, rich-editor shortcut | QA01, QA02, QA03, QA12 |
| Notes | Dot rename, search, failed saves, disable prevention, recovery copy | QA05; recovery passed |
| Todos and approvals | Revision omission before pending approval, later update/delete, modal shortcut | QA02, QA07 |
| Wiki | Cross-page heading navigation, both themes | QA06 |
| Calendar and Expenses | Impossible dates through shared methods and their displayed values | QA08 |
| Bookmarks | Cancel/reopen during pending save, supported long tag row | QA04, QA13 |
| News | Real feed add/refresh, entity title, mixed good/503 sources | QA10 |
| Mail | Disconnect/reconnect, failed replacement reads, old selected content | QA11 |
| Music | Disconnected layout plus standard controlled cache/connector/page/player checks | No additional confirmed product finding |
| Agent board | Orphan parent, whitespace error, successful correction | QA09, QA14 |
| Automations | Run now without Codex, retained cursor and no extra chat | Passed recovery control |
| Settings | Module-disable flush protection, themes, section labels at both sizes | QA15 |

The original frozen Spotify test failed waiting for Pause; a [focused retry](../../evidence/2026-10-01T181800Z-adversarial-qa/spotify-recheck.log) also exposed an immediate two-row count made before page two appeared. The test subsequently scheduled a 100ms playback error and advanced after seeing an already-present error element; that delayed event could invalidate its later synthetic playing state. An **external driver copy** now waits for the second song and consumes the final injected error before the next phase. All existing outcome assertions are retained and [the repaired focused check passes](../../evidence/2026-10-01T181800Z-adversarial-qa/spotify-driver-repaired.log) on unchanged application bytes. [Exact harness-only diff](../../evidence/2026-10-01T181800Z-adversarial-qa/spotify-driver-repair.patch.txt). This is harness drift/timing, not a sixteenth product defect; the original failed suite log is preserved and is not relabelled as a single green run.

The first isolated Settings measurement used an ambiguous Search and commands selector shared by the global header. [That attempt](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-navigation-first-attempt.log) is retained; scoping it to Settings sections fixed the driver, with no app or expectation change.

## Reproduction recipe

Use [Verification setup](../setup.md), an external build cache and the recorded source snapshot. The retained [adversarial driver](../../evidence/2026-10-01T181800Z-adversarial-qa/reproduce-driver.txt) contains QA01–QA14, the two recovery controls and the 52 captures. The [Settings driver](../../evidence/2026-10-01T181800Z-adversarial-qa/settings-navigation-driver.txt) adds QA15. Copy these text artifacts to `.mjs` files outside the workspace before execution. They use disposable roots and close their own apps/servers. `QA_SOURCE`, `QA_CACHE` and `QA_EVIDENCE` override source, build and output paths; use a new evidence destination for retesting so this record remains immutable.

Executed baseline commands from the frozen source, with `CLARITY_BUILD_CACHE` set to the frozen external cache:

```sh
node tooling/clarity.mjs check
node tooling/clarity.mjs test
```

The driver builds its small direct-service adapter externally, then launches the existing Electron output. After a fix, rebuild the intended application first and run it with matching source/cache paths; verify both the UI result and saved data. These scripts reproduce the failing snapshot: waits for the observed broken state may need adapting after a repair, while their expected outcomes must remain unchanged. A timeout is recorded as Untested, not a product pass. The external [repaired connector driver](../../evidence/2026-10-01T181800Z-adversarial-qa/connectors-driver-repaired.txt) can be selected with `node --test --test-name-pattern='Spotify search/playlist' <external-driver.mjs>`. It does not replace the repository's test file.

## Limits and follow-up

QA01–QA14 remain open from the tested snapshot; QA15 is verified resolved on the later Settings snapshot above. Prioritize QA01, QA07 and QA12, then the account-state, hidden-modal, draft/discovery and invalid-record failures. Repair specifications/recipes on the existing topic pages and record a new build-specific run when fixes land. No accepted requirement was removed to accommodate a defect.

This was development Electron QA, not a new installed-package, clean-machine or live-account certification. Live Codex/Gmail/Spotify/Navidrome/X/Linkding, listener-confirmed audio, OS permission prompts, VoiceOver, Linux, full accessibility conformance and exhaustive long-running/load coverage were not selected. Fixture account/latency scenarios prove the observed renderer/service failures, not provider behavior or real-world incidence. The 52 captures are screen/geometry coverage with selected visual inspection, not an assertion that every state of every screen is correct. The successful top-level overflow measurements did not detect overflowing nested Bookmark/Settings containers, which were measured separately.

Concurrent Music/Navidrome/Settings work was preserved. This audit does not install a build; later-source verification is limited to the explicit QA15 follow-up. [Current follow-up](../../discussions/open-questions.md) and [the journal](../../journal/2026-10-02-adversarial-qa.md) track the open findings and documentation validation.

Documentation checks pass: [13 reader/report tests](../../evidence/2026-10-01T181800Z-adversarial-qa/wiki-tests.log), [report metadata validation](../../evidence/2026-10-01T181800Z-adversarial-qa/report-check.log), wiki generation and generated-snapshot checking. These structural results do not change this run's Failed product outcome.
