---
title: 3 October 2026 — Shared feedback with Radix Toast
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-03
order: 202610021733
summary: Shared contextual notices and global Radix toasts with retained timing, keyboard, modal and package evidence.
---
# 3 October 2026 — Shared feedback with Radix Toast

## Scope

**FEAT-shared-ui**, **FEAT-bookmarks**, **FEAT-news**, **FEAT-agent-board** and **FEAT-music**, under [D130](../../decisions/index.md#d130-shared-feedback-with-radix-toast-3-october-2026). The [shared contract](../../foundations/desktop-stack.md#global-feedback-standard-3-october-2026) defines placement, timing, queue and native-modal behavior. Selected checks exercise real renderer controls and local storage with controlled failures/delays; they do not claim new live-account compatibility or an independent review.

## Build and environment

macOS arm64, Node v22.19.0, Electron 44.4.5, React 19.2.0 and Radix Toast 1.2.23. The [final source fingerprint](../../evidence/2026-10-02T173355Z-global-feedback/build.json) records dirty revision `8efb338bc1b585d7d6bd768182962152b36ea83b`, application SHA-256 `df72111881b917ff0d0e1b119daa7aa5a24b1dbabb8755fd44077da6866a1867` and verification SHA-256 `e5ef2e2a599b707f6aa0229bd1258bbdd498cb396a8cd9f7ad722e9cd1ff87cc`. Dependencies, manifests, fixture data and packages remain in the external cache. Evidence retained here contains disposable fixture content only. Terminal logs have color escapes and trailing whitespace removed; outcomes are unchanged.

Executed commands: `node tooling/clarity.mjs check`, `node tooling/clarity.mjs build`, then `node --test --test-concurrency=1 tests/feedback.mjs tests/adversarial-state.mjs tests/adversarial-renderer.mjs tests/music-cache.mjs tests/connectors.mjs tests/usability.mjs`. The feedback evidence path is selected with `CLARITY_FEEDBACK_EVIDENCE`. Package verification uses `node tooling/clarity.mjs package`, `node --test tests/package.mjs`, and `tests/feedback.mjs` with `CLARITY_TEST_EXECUTABLE` and `CLARITY_TEST_MAIN` pointing inside the rebuilt bundle.

## Results

Both application/Worker typechecks and the renderer/main/Worker build passed. The [final regression log](../../evidence/2026-10-02T173355Z-global-feedback/verified-regressions.log) records **24 passed, 0 failed, 0 skipped**. [Package relocation](../../evidence/2026-10-02T173355Z-global-feedback/package.log) and both [packaged feedback tests](../../evidence/2026-10-02T173355Z-global-feedback/package-feedback.log) passed.

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Error queue and repetition | Preserve distinct failures; limit visible messages without losing the rest | Five failed bookmark opens produced four unique notices; three visible, with the fourth appearing after dismissal. Errors survived 15 seconds. [Queue observations](../../evidence/2026-10-02T173355Z-global-feedback/queue-layout.json) | Passed |
| Keyboard and focus | Arrival does not steal focus; F8/Tab access; focused dismissal restores context | Escape outside the region retained messages; F8/Tab/Escape dismissed within it, and dismissing the final focused notice restored the bookmark button | Passed |
| Reading time | Info gets six seconds of visible, unpaused time | Polite Radix announcement observed; hover/focus retained the toast through 10-second advances, and the remaining unpaused interval dismissed it. Native hide retained the window/web contents and paused the deferred success. [Timing observations](../../evidence/2026-10-02T173355Z-global-feedback/timing-modal.json) | Passed |
| Modal failure and recovery | Draft/error/retry remain reachable; unrelated success waits | Failed task submission kept the draft and one local error. Workspace retry appeared inside the native dialog and recovered. Successful correction saved exactly one task; queued completion appeared after closing | Passed |
| Refresh and connection lifecycle | Failed/partial outcomes stay local; stale completion cannot return | Bookmark retry cleared its error; partial results stayed a warning; an auth change discarded the held old refresh completion. News refresh produced one info toast | Passed |
| Shared UI regression | Preserve modal/navigation, field correction, Music error ownership and context controls | Board invalid/described-by wiring, single saved correction, modal shortcuts, Ask in chat, Mail/account behavior, Music cache/retry and event/reply error ordering all passed | Passed |
| Themes, size and motion | Long content and dismissal remain usable at both sizes/themes | 1200×800 and 850×600 light/dark checks found no horizontal overflow, with the close control visible and the toast below the header; reduced motion removed animation. Screenshots inspected by the implementer | Passed |
| Packaged execution | Rebuilt bytes retain behavior and standalone delivery | Locally signed relocated bundle started with system-only PATH, launched its helper and passed persistence checks. Both feedback drivers also passed against packaged main/renderer bytes | Passed |

Retained visual evidence: [light minimum window](../../evidence/2026-10-02T173355Z-global-feedback/toast-light-850.png), [dark minimum window](../../evidence/2026-10-02T173355Z-global-feedback/toast-dark-850.png), [light desktop](../../evidence/2026-10-02T173355Z-global-feedback/toast-light-1200.png), [dark desktop](../../evidence/2026-10-02T173355Z-global-feedback/toast-dark-1200.png), and [local dialog failure](../../evidence/2026-10-02T173355Z-global-feedback/dialog-local-error.png). The packaged repeat retains [queue/layout](../../evidence/2026-10-02T173355Z-global-feedback/package/queue-layout.json) and [timing/modal](../../evidence/2026-10-02T173355Z-global-feedback/package/timing-modal.json) observations.

The [package fingerprint](../../evidence/2026-10-02T173355Z-global-feedback/package-before.json) records runtime SHA-256 `746e39d87875b779bad792a08116fa6b264dba9b49b63ffa9a7a20744bd91853` after rebuilding. Its [build log](../../evidence/2026-10-02T173355Z-global-feedback/package-build.log) records 145 bundled runtime dependencies and local signing. The [post-run fingerprint](../../evidence/2026-10-02T173355Z-global-feedback/build-after.json) and [comparison](../../evidence/2026-10-02T173355Z-global-feedback/identity-check.json) confirm that application, verification and packaged runtime hashes stayed unchanged across final checks. The source fingerprint's older cached-package fields are not the identity of the tested package; use the package fingerprint for that.

### Earlier checks and corrections

The [first regression log](../../evidence/2026-10-02T173355Z-global-feedback/regressions.log) is retained against its [earlier fingerprint](../../evidence/2026-10-02T173355Z-global-feedback/build-before.json), including failed outcomes. Its empty toast viewport intercepted Ask in chat clicks; an empty region now allows clicks through. The Board driver read an intermediate navigation state; it now waits for the destination heading before asserting no stale error, and additionally checks the reply field's invalid/described-by relationship. The [Board rerun](../../evidence/2026-10-02T173355Z-global-feedback/board-rerun.log) passed.

One OAuth fixture timed out during native window creation. A [native sample](../../evidence/2026-10-02T173355Z-global-feedback/native-launch-sample.txt) showed the Electron main thread waiting in macOS FrontBoard/dispatch window creation; its inspector was unresponsive. Only that isolated test process was terminated. The [next complete regression run](../../evidence/2026-10-02T173355Z-global-feedback/regressions-final.log) passed all 24 checks, including OAuth. This does not establish a general remedy for native launch hangs.

The [timing rerun](../../evidence/2026-10-02T173355Z-global-feedback/feedback-rerun.log) records a closed-page failure while checking native hide. The driver now verifies that the native window and web contents remain alive and hidden before checking the renderer. The [subsequent focused attempt](../../evidence/2026-10-02T173355Z-global-feedback/feedback-final.log) exposed an unpaused hover; the [following attempt](../../evidence/2026-10-02T173355Z-global-feedback/regressions-complete.log) confirmed that adding pointer movement alone did not solve it. React events from portaled toast content bypass handlers on the viewport. Moving hover/focus handlers to their shared React parent corrected that ownership error; the [focused rerun](../../evidence/2026-10-02T173355Z-global-feedback/portal-events.log) passed. Earlier fixture work also corrected checks that looked for Radix's brief announcement after it had already cleared, and ensured native focus/React pause state had arrived before advancing the simulated clock. Passing DOM checks remain distinct from a real assistive-technology walkthrough.

## Limits and follow-up

No VoiceOver walkthrough, exhaustive accessibility review, live provider account, unexpected whole-renderer crash recovery, separate machine, Linux package or notarization was selected. Native-window behavior is tested on this Mac and Electron version. One-off native test launch hangs are recorded above, not claimed fixed by this UI work. The final package is built in the external cache; no installed application is replaced.
