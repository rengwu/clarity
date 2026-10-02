---
title: 1 October 2026 — Compact Cursor prototype and controls
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-01
order: 2026100106
summary: Browser-verified compact lists, flat tabs, connected dividers, aligned glyphs, separated interaction states and responsive controls.
---
# 1 October 2026 — Compact Cursor prototype and controls

## Scope

Verify the compactness and interaction corrections to **FEAT-shared-ui** in the external [Cursor Desktop spike](../../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026), under D117. The user explicitly returned browser control. Selected checks cover populated module layouts, tabs/dividers, focus, separators, amount alignment, checkbox/select geometry, adjacent Music states, navigation, motion and responsive controls. All selected checks passed after the fixes below. This is disposable browser UI verification, not production acceptance.

## Build and environment

Node 22.19.0 on macOS arm64; dependency-free source at `~/Desktop/Projects/clarity-spikes/2026-10-01-cursor`; Synara's shared browser at `http://127.0.0.1:4318`. The temporary login-session job `local.clarity.cursor-spike` remained live as PID 67521. The [final source manifest](../../evidence/2026-10-01T083600Z-cursor-density/build.json) records eleven executable/browser files, aggregate SHA-256 `82b857186417e8824f483b198d5bf0882cd45036a3157e754b3fd534b61ec0e4`. The [workspace fingerprint](../../evidence/2026-10-01T083600Z-cursor-density/workspace-build.json) separately identifies the dirty production checkout; this run did not build or test that application.

Real named controls, keyboard input, select operations and hover drove the checks; DOM and localStorage reads observed effects. The [browser observations](../../evidence/2026-10-01T083600Z-cursor-density/observations.json) include the sequence and harness notes. This pass found and fixed Calendar's nested scrolling, form glyph alignment, touching list states and the hidden narrow Music close control. Affected entry points were checked again after each fix; final retained screenshots and served hashes match the manifest. Earlier CRUD coverage remains in the [expanded-module report](2026-10-01T071700Z-cursor-all-modules.md) and [original core report](2026-10-01T060000Z-cursor-spike.md); it was not all rerun on this final source.

## Results

| Selected check | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Source and preview | Syntax valid; intended assets served from current source | Eight JS/server modules passed `node --check`; all ten assets returned 200, matching SHA-256 and no-store; reference path returned 404; independent job live | Passed |
| Compact populated modules | Dense, readable views with useful samples | Chat and all eleven modules populated; Todos/News 36px, Expenses/Songs 44px, Bookmarks 56px, Mail 76px, Automations 77px; header 44px | Passed |
| News visibility and filters | More headlines without desktop scrolling; usable source/search controls | All 14 headlines fit at 1440×900 with 36px rows and 2px gaps; WebKit filter yielded five, keyboard search one, clearing restored 14 | Passed |
| Expense alignment | Item amounts and day totals share the same right edge | All eight amounts and four totals ended at x=1416 in the 1440px viewport | Passed |
| Notes tabs and pane boundary | Flat compact tabs; divider joins header; switch/close/empty states work | Tabs 35px, radius 0; active background matches document; file tree begins at header bottom y=44 and reaches y=900; 20px close controls; closing all left the empty editor and stored empty tab list; reopening worked | Passed |
| Pointer and keyboard focus | Pointer actions have no ring; keyboard has one deliberate indicator | Cancel restored Todo title focus with outline style none; keyboard focus gave the row one solid 1px outline, no inner title outline; icon-button keyboard indicator also 1px | Passed |
| Straight separators | Hide both boundaries touching hover/selection; no curved or trailing border | Bookmark, News, Mail, Song and tab states matched the adjacency rule; row border-bottom width 0; active/hover backgrounds remained distinct | Passed |
| Form glyphs and cancellation | Centered check and chevron, consistent field heights, working native input behavior | 15px checkboxes with 11px SVG marks; selects use centered SVG chevrons; five text/select/time controls measured 34px; Calendar checkbox and Daily selection changed the form; Cancel preserved the automation | Passed |
| Music gaps and transport | Adjacent active/hover surfaces separated; player usable at both widths | Songs 44px with a measured 2px gap, distinct selected/hover backgrounds and hidden adjoining lines; play used a same-source queue of 12, active equalizer, pause worked; close removed/stopped the player at desktop and 390px; collection Play restored it | Passed |
| Calendar density and entry | Full internally scrolling day; no nested page scroll; date/time entry retained | 24×44px hours, body 1056px; outer page height equals scroll height 856px; inner grid 641px with saved scroll 352; Month 42 cells; date entry opened Oct 1, week double-click opened 09:00; both cancelled | Passed |
| Navigation, themes and motion | Palette/sidebar work; compact views support both themes and reduced motion | Cmd+K opened Reading list; Cmd+B animated 220ms and made hidden sidebar inert; dialog entrance 160ms; Light palette inspected; Reduced set transitions to 0s; restored Dark and full motion | Passed |
| Responsive layouts | Useful content at 960×680 and 390×844 without page overflow | All eleven modules plus Settings had nonempty main content, widths 750px and 390px respectively, no root overflow; mobile navigation closed its overlay; intentional Calendar grid scrolling retained; mobile News had 48px rows, 2px gaps, 13 fully visible | Passed |
| Runtime and handoff | No application errors; reviewable live preview | Captured console had 59 browser-helper deprecation warnings, no errors, dropped entries or truncation; final view News, Dark/full motion, no open dialog or playing audio | Passed |

[Source/server checks](../../evidence/2026-10-01T083600Z-cursor-density/source-checks.json) and [screenshot capture metadata](../../evidence/2026-10-01T083600Z-cursor-density/screenshots.json) accompany the observations. Retained, inspected fixture-only images show [desktop News](../../evidence/2026-10-01T083600Z-cursor-density/news.png), [automation glyphs](../../evidence/2026-10-01T083600Z-cursor-density/glyphs.png), [adjacent Song states](../../evidence/2026-10-01T083600Z-cursor-density/songs.png), and [mobile News in Light](../../evidence/2026-10-01T083600Z-cursor-density/mobile-news.png).

## Limits and follow-up

Some immediate captures showed the preceding frame. They were excluded from retained proof; fresh reads and subsequent captures confirmed the final state. A default computed outline width of 3px with style `none` was not treated as a visible ring. One browser result could not be serialized; a fresh state read preceded the successful retry. The driver's `clickCount` option did not open a Calendar form, while two successive real clicks did; the separate date-button entry also worked. No duplicate event was submitted.

This is self-verification of selected scenarios, not an exhaustive Cursor design audit or independent review. No real provider, model, filesystem, scheduler, production action catalog, full GFM editor, assistive-technology acceptance or synthesized-audio quality certification is claimed. The preview remains local and temporary; logout/reboot needs a restart. Production adoption is a separate decision. Wiki/report checks establish document integrity only.
