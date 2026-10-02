---
title: 1 October 2026 — All-module Cursor browser spike
section: Verification runs
status: Recorded
result: Untested
updated: 2026-10-01
order: 2026100105
summary: Expanded-module interaction evidence; the latest compactness, tab and focus pass awaits browser handoff.
---
# 1 October 2026 — All-module Cursor browser spike

## Scope

Verify **FEAT-shared-ui** in the external [Cursor Desktop design spike](../../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026), expanded under D117 to every module with synthetic content and animations. This report separates observed intermediate interactions from the latest compact layout. The aggregate is **Untested** until the final visual and interaction checks below run. This is not production acceptance.

## Build and environment

Node 22.19.0 on macOS arm64; dependency-free external source under `~/Desktop/Projects/clarity-spikes/2026-10-01-cursor`; Synara's shared browser; loopback preview `http://127.0.0.1:4318` under the temporary login-session job `local.clarity.cursor-spike`. The [source manifest](../../evidence/2026-10-01T071700Z-cursor-all-modules/build.json) identifies eleven executable/browser source files, with aggregate SHA-256 `a1032f509c0a372bd92e1c21c12d4569ac0dfe9c76c1bfc36405bddc751b1c27`. The [workspace snapshot](../../evidence/2026-10-01T071700Z-cursor-all-modules/workspace-build.json) records the separately dirty production checkout, which was not built or tested by this spike run.

Real named controls and keyboard entry performed browser mutations. DOM/localStorage reads observed effects. The [interaction observations](../../evidence/2026-10-01T071700Z-cursor-all-modules/observations.json) were collected on successive intermediate expanded builds before the final tab/focus/density edits; no exact final-source certification is inferred from them. The [source checks](../../evidence/2026-10-01T071700Z-cursor-all-modules/source-checks.json) refer to the manifest above. Reference screenshots containing native account context remain outside the wiki.

## Results

| Selected check | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Source syntax and server | Valid source; all intended assets served, reference files private | All JS modules/server parsed; ten browser assets returned 200 with matching SHA-256 and no-store; reference path returned 404; independent job PID 67521 remained live | Passed |
| Compact fixture migration | Add News samples once, preserve existing edits and module choices | Fresh seed has 14 headlines; simulated earlier state retained edited note/enabled modules, converted Calendar scroll 448→352; repeated upgrade did not restore a removed headline | Passed |
| Latest compact layout | 36px desktop News/Todo rows, aligned expense amount/total edge, useful compact layouts across modules | Implemented in current source; browser geometry and inspected screenshots pending handoff | Untested |
| Latest tabs and dividers | Flat tabs, continuous header/pane boundary, close controls and empty editor work | Native IDE reference and source inspected; changed browser behavior not yet exercised | Untested |
| Latest hover/selection/focus | Straight independent separators hide on both sides; pointer actions have no ring; keyboard retains a deliberate indicator | Shared rules implemented; pointer/focus restoration and keyboard checks pending | Untested |
| Latest responsive appearance and motion | All modules usable at 1440×900, 960×680 and 390×844; Light/Dark and reduced motion | Prior responsive issue fixed and observed; repeat inspection of compact layout pending | Untested |

### Intermediate browser observations

These are completed observations of the evolving expanded spike, not outcomes for the final manifest:

- All expanded modules were reached through navigation with populated content. Calendar Week/Month included timed events; Month had 42 cells; overlap lanes shared a day column. Event create/edit, cancellation and confirmed deletion changed the underlying records as expected.
- Integer-digit expense input `12370` displayed `123.70` and stored 12370 minor units. Create-and-add-another cleared the amount while retaining the dialog; the temporary expense was deleted. Bookmark creation/search/tag storage and deletion worked. Mail search selected the intended fixture message and retained its ID.
- News source filtering, adding and removing a sample source worked. A new Agent board topic and a reply were stored. Music collection navigation, preview play/shuffle/next/pause, source-consistent queue, elapsed position and player dismissal were observed. WebAudio output was not independently measured for audible quality.
- Notes create/source-edit/rename/preview and Trash/restore worked. Todo completion changed the shared count. Cmd+B and Cmd+K performed sidebar and palette actions. Module toggles, workspace menu, shortcut list, Light/Dark and reduced motion were exercised. Computed reduced-motion transitions were zero; normal dialog and sidebar durations matched the intended values.
- A simulated automation run produced a review; Apply marked the run complete and appended the displayed reflection to the selected Wiki page. This proves only the deterministic local demonstration.
- Reload retained created records, note text, thread reply and selected message, while audio resumed paused. Temporary event/expense/bookmark records were cleaned through their UI; the board topic remained because no delete action is in that module's agreed scope.
- At 960×680 all eleven module layouts had no page overflow. An initial 390×844 run found zero-width main content caused by a fixed sidebar/scrim taking a grid slot. Explicit workspace grid placement fixed it; the repeated module run observed 390px main widths without page overflow. The compact follow-up still requires its own inspection.

## Limits and follow-up

**Later follow-up:** the user explicitly returned browser control. The [compactness and controls run](2026-10-01T083600Z-cursor-density.md) records the completed visual/interaction checks, additional fixes and final manifest. This report retains its original Untested aggregate and intermediate build boundary.

The browser reported `BrowserInterruptedByHuman` while the user was reviewing the preview. Navigation checks were paused and a handoff requested. Source, serving, migration, documentation and reference work continued. The final compactness/tab/focus checks are intentionally Untested rather than inferred from CSS or earlier screenshots. Once control is handed back, reload, exercise the changed controls, measure actual geometry, inspect desktop/narrow screenshots, and record any fixes with an updated manifest.

No live provider, model, filesystem, scheduler, production action catalog, rich GFM editor, clean-machine package or assistive-technology acceptance is claimed. Samples and localStorage are disposable. Chat and integration responses are scripted; Music uses original synthesized preview audio. This is self-verification, not independent review. Wiki build/report checks validate documentation integrity only.
