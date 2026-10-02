---
title: 1 October 2026 — Spike fidelity and Spotify connection repair
section: Verification runs
status: Recorded
result: Untested
updated: 2026-10-01
order: 2026100111
summary: Native motion and compact UI repairs pass isolated checks; installed startup awaits macOS Keychain unlock and live playback needs sign-in.
---
# 1 October 2026 — Spike fidelity and Spotify connection repair

**Later follow-up:** the user completed this run’s Keychain unlock. The [2 October installed-playback run](2026-10-01T163500Z-installed-playback.md) records actual playback authorization/controls, a newly exposed duplicate-error race and its final correction. This report’s original outcome and build-specific observations remain historical.

## Scope

Correct the user's rejected port against the accepted Cursor-inspired browser spike. Selected scenarios cover **FEAT-shared-ui, FEAT-chat, FEAT-settings, FEAT-notes, FEAT-todos, FEAT-calendar, FEAT-expenses, FEAT-news, FEAT-bookmarks, FEAT-mail, FEAT-music, FEAT-wiki, FEAT-agent-board, FEAT-automations**. The [shared design and motion contract](../../foundations/desktop-stack.md#compact-shared-design), existing module specifications and [Music connection contract](../../features/music.md#connection-clarity-and-independence-1-october-2026) define the expected behavior.

The earlier native port run is historical: its passing workflows and geometry did not establish complete spike fidelity or actual animation. This repair explicitly observes motion and populated screens. It does not reopen D118–D122 or insert sample content into the user's root.

## Build and environment

macOS arm64, Node 22.19.0, Electron 44.4.5. Application/Worker checks, native Electron tests, provider fixtures and package relocation use the external dependency cache and isolated temporary roots. The visual fixture populates all lists; Mail/Music responses are controlled and establish presentation/navigation, not provider authentication or audio. The existing installed Spotify library was separately queried read-only.

Application SHA-256: `c6ed222baa40a053f5f8cc415f0525f6a0f54fa2af8b041931771f69acbbacdc`. Verification SHA-256: `081c0c1bc52be26e431055aaed7cefb7dadfca7d5abff9c380c846d3be92ff2e`. The [test-entry fingerprint](../../evidence/2026-10-01T154700Z-redesign-repair/test-build.json) and [final/package fingerprint](../../evidence/2026-10-01T154700Z-redesign-repair/final-build.json) match for both. The latter records seven runtime hashes. This was a dirty checkout; HEAD alone is not a reproduction identity.

Executed: `node tooling/clarity.mjs check`, `node tooling/clarity.mjs test`, `node tooling/clarity.mjs package`, `node --test tests/package.mjs`. Evidence includes [typecheck](../../evidence/2026-10-01T154700Z-redesign-repair/final-check.log), [final app suite](../../evidence/2026-10-01T154700Z-redesign-repair/final-tests-3.log), [package build](../../evidence/2026-10-01T154700Z-redesign-repair/package-build.log) and [package check](../../evidence/2026-10-01T154700Z-redesign-repair/package-tests.log).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Types and retained workflows | Preserve local storage, rich editing, revisions, approvals, dates, navigation and lifecycle | Both typechecks pass; 32 app tests pass, zero fail; two unselected live-Codex cases skipped | Passed |
| Actual motion | Animate sidebar, views, task reorder and controls; respect reduced motion | Observed 220ms sidebar grid transition and task position animations, 160ms checkbox feedback; reduced motion produces zero animations and 0s sidebar transition | Passed |
| Compact rows and boundaries | 36px tasks/news, 2px gaps, flat Notes tabs, continuous divider, straight neighbour-aware separators | 36px task/news rows; 56px bookmarks; Notes tabs 35px with zero corner radius; divider fills the 806px view; hover hides both adjacent separators | Passed |
| Native Notes scrolling | Long documents scroll below toolbar despite animated shell | Regression driver restores and verifies note reading position; grid minimum-height repair passes | Passed |
| Source and history preservation | Preview/resizing stays in Chat; explicit module opening preserves drafts/history | Existing native source/history, per-chat draft, Wiki and Board navigation cases pass; source-pane fade leaves resize handle stationary | Passed |
| Commands/settings | Preserve explicit command saves, provider boundaries, approvals and keyboard controls | Five real local form saves, cancellation/duplicate guards, controlled interpretation and explicit provider request counts pass; theme previews, reduced motion and all 37 approvals remain | Passed |
| Populated visual review | Apply compact controls and shared palette across modules | Native screens inspected in dark and light at normal and minimum widths; aligned Mail search centers both 108px after removing inherited margin; no renderer errors | Passed |
| Spotify connection independence | Disconnect library without deleting playback; refresh mounted state | Controlled OAuth workflow verifies playback remains connected after library disconnect, then disconnects it explicitly | Passed |
| Playback failure presentation | One persistent error, no duplicate toast | Real renderer-to-main missing-playback attempt produces one player error and zero toasts in controlled connector test | Passed |
| Installed-account diagnosis | Distinguish browsing from playback login failure | Live library search returns 40 items; library grant present, playback grant absent; old UI showed duplicate notices | Passed |
| Package | Locally signed, relocatable, complete dependencies and preserved saves | Relocated package passes system-only PATH, signature/symlinks/helper, draft/date/Markdown persistence and immediate-Quit checks | Passed |
| Installation bytes/data | Preserve old bundle and user content; install tested bytes | Previous app retained; all seven installed runtime files match package; two Markdown files and structured record counts unchanged | Passed |
| Installed reopen with saved credentials | Open corrected UI with existing root/accounts | macOS blocks startup on “Clarity Safe Storage” password prompt; surfaced to user, awaiting their system-dialog unlock | Untested |
| Fresh Spotify playback | Sign in and confirm audio/control behavior on this repaired build | Playback grant was absent before replacement; fresh playback sign-in and live audio have not been completed | Untested |

Aggregate is **Untested**, despite passing selected automated checks, because installed credential unlock and fresh playback remain unresolved. It is not a fully verified live-account delivery.

Evidence: [motion and geometry](../../evidence/2026-10-01T154700Z-redesign-repair/motion-observations.json), [visual observations](../../evidence/2026-10-01T154700Z-redesign-repair/visual-observations.json), [source/history observations](../../evidence/2026-10-01T154700Z-redesign-repair/redesign-observations.json), [request counts](../../evidence/2026-10-01T154700Z-redesign-repair/request-observations.json), [interpreter boundary](../../evidence/2026-10-01T154700Z-redesign-repair/interpretation-observations.json), [live Spotify diagnosis](../../evidence/2026-10-01T154700Z-redesign-repair/live-spotify-diagnosis.json), [installation audit](../../evidence/2026-10-01T154700Z-redesign-repair/installation.json).

Selected inspected fixture images: [News at 850×600](../../evidence/2026-10-01T154700Z-redesign-repair/news-minimum-final.png), [Notes](../../evidence/2026-10-01T154700Z-redesign-repair/notes-final.png), [Expenses](../../evidence/2026-10-01T154700Z-redesign-repair/expenses-final.png), [Music](../../evidence/2026-10-01T154700Z-redesign-repair/music-final.png), [Music light/minimum](../../evidence/2026-10-01T154700Z-redesign-repair/music-light-minimum-final.png), [automation form](../../evidence/2026-10-01T154700Z-redesign-repair/automation-dialog-final.png), [Wiki](../../evidence/2026-10-01T154700Z-redesign-repair/wiki-final.png), [Mail](../../evidence/2026-10-01T154700Z-redesign-repair/mail-final.png), [source preview](../../evidence/2026-10-01T154700Z-redesign-repair/preview-verified.png). Screenshots establish appearance, while motion assertions establish transitions. Fixture images are illustrative of the repaired controls; final source/package identity is recorded above.

## Limits and follow-up

The installed package is `~/Applications/Clarity.app`; the prior bundle is `~/Library/Caches/Clarity/build/Clarity-before-repair-20261001T154700Z.app`. Startup reached saved-credential loading and is blocked by the macOS Keychain password dialog for “Clarity Safe Storage.” The agent did not read/enter a password, bypass Keychain, or replace credentials. Complete the system dialog, verify reopening, then use Settings → Spotify → Playback to restore the absent playback grant. Recheck playback and controls after that sign-in. The disconnect coupling is a demonstrated defect, but no evidence proves it caused the user's missing grant.

Earlier attempts found inherited button/field selectors, obsolete Wiki palette expectations and a newly exposed note-scroll defect. Entry-point drivers now open the New task dialog and use SVG controls' accessible labels. Product corrections retain scrolling and immediate source resizing. An initial error-deduplication approach relied on custom Error metadata crossing contextBridge; the controlled failure test rejected it, and the final approach observes the playback event. The [first broad run](../../evidence/2026-10-01T154700Z-redesign-repair/final-tests.log) records 31 passes and one old-palette expectation failure. The final run above records 32 passes after updating that expectation and verifying the shared color. Visual review additionally removed a stale Mail input margin; the final test/package fingerprints include that fix.

No independent reviewer participated. Live Codex inference, real Gmail/Navidrome/X/Linkding, fresh Spotify authorization/revocation, listener-confirmed audio, VoiceOver, notarization and clean-machine/Linux validation are not inferred from fixtures. Existing limits remain in [current follow-up](../../discussions/open-questions.md#validation-still-needed). No external messages or sample user records were created by this repair.

Documentation checks pass all 13 [reader/report cases](../../evidence/2026-10-01T154700Z-redesign-repair/wiki-tests.log). Report validation finds 11 reports without metadata errors; the reader rebuilds to 134 pages and its generated snapshot/internal links check passes. These checks establish documentation integrity, not installed credential access or live playback.
