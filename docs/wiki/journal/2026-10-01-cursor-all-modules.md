---
title: 1 October 2026 — All-module Cursor prototype
section: Journal
status: Current
updated: 2026-10-01
order: 2026100106
summary: Every Clarity module gains populated browser UI, shared interaction states, and reduced-motion-aware animation.
---
# 1 October 2026 — All-module Cursor prototype

The user expanded the active design-spike goal to all agreed modules, populated content, a studied Cursor Desktop visual language, micro-interactions, and animations. [D117](../decisions/index.md#d117-all-module-cursor-prototype-and-interaction-polish-1-october-2026) records this request. The [technical-spike topic](../references/technical-spikes.md#cursor-desktop-design-spike-1-october-2026) owns current behavior and reference details.

The external dependency-free implementation now includes Calendar events/Week/Month, Expenses, read-only Mail, News sources, Bookmarks, Music collections/transport, Agent board discussions and Automations with local reviewed Wiki changes, alongside the original core modules. All use synthetic data. A versioned hydration step adds fixtures while preserving earlier edits. No production source, account, real data folder, or provider credentials were changed.

The user supplied non-exhaustive crops and subsequently rejected rounded tabs, a pane border that stopped below the header, and large Todo focus rectangles. Native Cursor IDE was reopened with two disposable Markdown documents. Its flat adjacent tabs and active document-colored surface replaced the invented rounded treatment. Shared header separators connect pane boundaries. Pointer and keyboard focus are distinguished across the application, and Todo keyboard focus uses one row indicator instead of an inner text rectangle. Prototype explanations moved to About/Settings rather than repeating in working views.

Browser checks exercised local mutations and persistence, review effects, content search, music controls, module toggles, themes and reduced motion. The narrow-layout check found and corrected a grid placement bug when the sidebar became a fixed overlay. The [run report](../verification/runs/2026-10-01T071700Z-cursor-all-modules.md) owns build-specific outcomes and limits. This is self-verification of a browser design spike, not independent review or production integration acceptance.

The preview continues under the temporary macOS login-session job at `http://127.0.0.1:4318`. Its source, startup/stop instructions and lifetime are recorded on the spike topic. Production adoption, rich GFM editing, real accounts, scheduling and complete agent semantics remain separate work.

Subsequent review rejected wasteful spacing across the whole prototype, expense amount misalignment, oversized News entries and curved Bookmark separators. The compact pass reduces shell/control/list dimensions, moves News to a one-line desktop list, aligns monetary columns, flattens Automation cards, and gives related lists independent separators that hide on both sides of an interacted row. Fourteen synthetic News prompts make density inspectable. Installed Cursor source remains the main reference; official VS Code view/webview guidance and ChatGPT partner UI guidance supply secondary principles, with that narrower scope recorded. Source syntax, migration and served-file hashes passed. Browser inspection of the final density/tab/focus pass is pending a handoff after the browser driver detected human input; earlier interaction checks are not represented as a pass for this changed layout.

After the user explicitly returned browser control, the compact layout was inspected across every module. Further screenshots identified misaligned checkbox/dropdown glyphs and touching selected/hovered Music rows. Shared SVG geometry now centers the glyphs; a 2px gap separates list states while preserving density and the requested separator behavior. Browser inspection also corrected nested Calendar scrolling and the Music close control at narrow widths. Fourteen News rows fit the desktop viewport, expense totals and amounts align, and tab closure, keyboard/pointer focus, native form changes/cancellation, music transport, themes and reduced motion passed their selected checks. All eleven module layouts plus Settings were checked at 960×680 and 390×844 without page overflow. The [final run](../verification/runs/2026-10-01T083600Z-cursor-density.md) records current hashes, retained screenshots and the limits of this self-verification; the prior report remains historical. The preview is left on News with audio stopped.
