---
title: UI design system
section: Foundations
status: Current
updated: 2026-10-16
order: 65
summary: Portable specification of Clarity's compact desktop UI, with exact values, interaction rules, examples and reproduction checks.
---
# UI design system

## Purpose and authority

Use this topic to reproduce Clarity's UI language in another project without needing Clarity's source code or conversation history. The defining combination is a compact desktop workspace, neutral layered surfaces, small system typography, continuous pane dividers, restrained controls and motion, and preservation of the user's working context.

**User requirement, 16 October 2026 ([D132](../decisions/index.md#d132-portable-ui-design-system-reference-16-october-2026)):** document what Clarity has now so agents in other projects can emulate it. This is an extraction of the current system, not a redesign or a new component-library dependency. This topic owns shared visual rules and portable presentation patterns. [Desktop stack](desktop-stack.md) retains runtime architecture, command services, feedback interfaces and shared verification recipes; feature topics retain their product behavior.

**Evidence basis:** source inspection at revision `27b83eb469f745968d3e0ce311a1f45952cba542`, plus the dated fixture screenshots and runs linked below. The extraction changes documentation only. It does not claim a new live-app test, screenshot capture or accessibility certification. Exact values below are source-observed current defaults, including earlier delegated design choices; they are not all individually chosen by the user. Sections labelled **Adaptation guidance** are instructions for applying the reference elsewhere, not new Clarity behavior.

All dimensions are **CSS pixels** at the application's normal zoom. Retained screenshots can contain multiple image pixels per CSS pixel. Read the dimensions here rather than measuring a screenshot without its scale. The offline wiki reader has its own styling: its appearance is not the application design system.

## Start here for another project

**Adaptation guidance:** an agent can use this page alone for a first implementation. The source map, product links and screenshots provide additional detail when available.

1. Establish the receiving project's platform, existing UI framework and required features. Reuse its tooling; reproducing the appearance does not require Electron, React, Pi, SQLite, music services or Clarity's modules.
2. Implement the [palette](#color-and-theme), [type and dimensions](#typography-and-density), and [shell](#application-shell) first. Compare a populated list in light and dark before adding specialised screens.
3. Build shared controls and their states, then compose the relevant layout patterns. Preserve keyboard access, scroll boundaries and drafts as deliberately as spacing and colors.
4. Use the [visual references](#visual-reference-guide) to inspect proportions and the [reproduction checklist](#reproduction-checklist) to assess the result. Record adaptations explicitly; a mobile layout or branded accent is a variation on this baseline.

Copyable task brief for a receiving agent:

```text
Use the Clarity UI design system topic as the visual and interaction reference.
Apply its light/dark semantic colors, system typography, compact control sizes,
pane geometry, row states, focus treatment, feedback placement and motion.
Use this project's existing framework, navigation labels and product behavior.
Implement only the patterns needed by this project. Preserve the distinction
between source-observed Clarity defaults and your adaptations. Check populated,
empty, loading and failed states, both themes, keyboard use, reduced motion and
constrained desktop widths. Report any deviations and verification limits.
```

## Design principles

| Principle | What it means when building a screen |
| --- | --- |
| Content carries the visual emphasis | Keep surrounding chrome neutral. Use artwork or semantic color where the content or state calls for it. |
| Compact controls, readable content | Navigation and actions are small; reading areas have more line height and a constrained measure. Density varies by purpose. |
| Structure comes from alignment and boundaries | Use persistent panes, shared baselines, subtle surface changes and straight 1px dividers. Ordinary list rows do not need individual cards or shadows. |
| Text has a job | Labels identify navigation, actions, guidance or state. Avoid slogans, redundant subtitles, ornamental logos and invented descriptions. |
| Preserve the user's place | Keep drafts, selections and reading position through navigation. Preview related material alongside the work; require an explicit action to change destination. |
| Feedback belongs near its cause | Field errors, form errors and content failures have local owners. Toasts cover actions without a suitable local owner. |
| Motion explains a change | Short fades, pane resizing and position changes show what moved. Reduced motion disables those effects. |

These principles describe the implemented direction and the [working principles](../vision/principles.md). The Cursor-derived workspace and Raycast/Alfred/Spotlight-style command entry are historical influences; their names do not substitute for the specifications here or import their features.

## Color and theme

Clarity supports explicit Light, explicit Dark, and System following the OS. Explicit selection wins over the system preference. Set the matching browser `color-scheme` as well as the CSS variables so native controls agree with the surrounding surface.

These are the **existing CSS variable names and values**. Eight-digit hex colors include alpha; composite them over the actual surface rather than replacing them with opaque gray.

| Variable | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#fcfcfc` | `#181818` | Main content canvas; inverse text on primary buttons |
| `--panel` | `#f3f3f3` | `#222222` | Main sidebar, composer, player and selected content blocks |
| `--field` | `#ffffff` | `#181818` | Form fields and source-preview surface |
| `--raised` | `#ffffff` | `#232323` | Dialogs, notices and tooltips |
| `--tab-strip` | `#f3f3f3` | `#141414` | Notes file pane and inactive tab strip |
| `--text` | `#242424` | `#e7e7e7` | Primary text |
| `--muted` | `#636363` | `#a0a0a0` | Supporting text and ordinary icons |
| `--faint` | `#707070` | `#858585` | Tertiary metadata and small section labels |
| `--line` | `#14141412` | `#ffffff0f` | Pane dividers and list separators |
| `--line-strong` | `#14141425` | `#ffffff20` | Control outlines and stronger boundaries |
| `--focus` | `#506f80` | `#adbec8` | Keyboard focus |
| `--accent` | `#4f4f4f` | `#d6d6d6` | Neutral primary action, checked controls and links |
| `--selected` | `#14141410` | `#ffffff12` | Selected navigation, rows and filters |
| `--hover` | `#14141408` | `#ffffff0b` | Hovered controls and subdued Settings groups |
| `--danger` | `#a33632` | `#f49c92` | Destructive actions and error indicators |

The accent is intentionally neutral. Primary buttons pair `--accent` with `--bg`; their hover keeps that pair and applies `brightness(0.92)`. Do not turn every selected control into a filled primary action. Selection is usually the lighter `--selected` overlay.

Notice warning icons use the literal `#b78021` in both themes; info uses `--muted`, success uses `--accent`, and error uses `--danger`. Status includes text and/or an identifying icon, not color alone. Source badges also have local exceptions (`#388757` for Spotify and `#6689c1` for Navidrome). These literals are current implementation details, not a complete semantic status palette or a contrast certification.

**Adaptation guidance:** preserve the role relationships when renaming tokens. A destination that needs a brand color should record that as a deliberate variation; changing `--accent` changes primary controls, checkboxes and links together.

## Typography and density

The application uses `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`, with a 13px root size. On macOS this gives the system UI face without a downloaded font. Code uses `ui-monospace, SFMono-Regular, monospace`. Font rendering and fallback metrics vary by platform.

| Role | Current treatment |
| --- | --- |
| Module page title | 20px, weight 600; normally 16px bottom margin |
| Settings section title | 20px, weight 550, letter spacing −0.4px, 24px bottom margin |
| General subheading | 16px, weight 600; module-specific headings can be 13–15px |
| List title / primary UI text | Usually 13px, weight 400 or 500 |
| Sidebar items, shell title, ordinary buttons, field labels | 12px; selected sidebar item weight 500 |
| Supporting metadata | 11px; tertiary dates/counts/badges sometimes 10px |
| Chat message | 14px, line height 1.65 |
| Notes rich text | 14px, line height 1.6; paragraphs use 22px line height |
| Notes document headings | H1 26px/1.3; H2 20px/1.4; H3 16px/1.4 |
| Source-preview text | 13px; H1 19px; paths 11px |
| Code block | 12px/1.5 monospace, 12px padding, 5px radius |

General paragraphs use 1.6 line height. Dates, durations and money use tabular numerals where alignment matters. Long navigation labels and compact row titles often ellipsize; Settings navigation wraps. Failure descriptions and important form guidance wrap rather than disappearing behind ellipsis.

### Geometry and spacing

Color, motion, sidebar width and the base radius are tokenized. Most other dimensions are still CSS literals. This table records the conventions that exist; it does not imply a universal spacing-token scale or a strict 4px grid. The application applies `box-sizing: border-box` globally, removes the body margin, and makes native controls inherit the font and text color before applying their specific sizes.

| Element | Current dimensions |
| --- | --- |
| Main header | 44px height; 12px horizontal padding and gap |
| Main sidebar | 232px default; 210px at viewport width ≤1150px; 248px at ≥1550px |
| Sidebar navigation | 28px rows, 2px gaps, 8px horizontal row padding |
| Standard page | Padding `20px 24px 28px`; content owns vertical scrolling |
| Toolbar | 10px gap, 16px bottom margin, wrapping allowed |
| Ordinary button / icon button | Minimum 26px high; icon button 26 × 26px |
| Ordinary field / module search | Minimum 28px / exactly 28px high |
| Labelled form input/select | 34px high; 6px vertical and 10px horizontal padding |
| File rows / Notes tabs | 26px / 35px high |
| Task / News row | 36px minimum / 36px single-line layout |
| Expense / Music track row | At least 44px / 44px cells with 2px row spacing |
| Bookmark / Mail row | Minimum 56px / 68px for multiple lines of metadata |
| Adjacent compact list rows | 2px gap |
| Search-to-content gap | 12px for a standalone page search |
| Loading / empty / no-match paragraph | 12px vertical margins |
| Field label-to-control / field-to-field | 4px gap / 12px bottom margin |
| Form action row | Right-aligned, 10px gap, 16px top margin |

Toolbar-contained searches inherit the toolbar's separation. Avoid adding two full gaps where a search, toolbar and list-state message meet; adjacent paragraph margins can collapse. Notes feedback also needs separation from its root-folder control. Board puts feedback before its thread list so an empty list container cannot add a second gap. Meaningful multi-line content is allowed to increase row height in appropriate reading lists.

### Corners, lines and elevation

Base `--radius` is 5px. Ordinary buttons/fields use 5px; list rows commonly 4px; native dialogs 6px; Settings groups/model popover 7px; command dialog 8px; chat composer 10px. Notes tabs are flat with zero corner radius. Switches, avatars and playback controls have their own rounded geometry.

Use continuous 1px pane boundaries in `--line`. Rounded row backgrounds and straight separators are separate elements: draw a separator between rows with a pseudo-element, inset 8px, omit it after the last row, and hide the separators on both sides of a hovered, selected or focused row. Tasks use hover backgrounds without adopting every other list's separator treatment.

Elevation belongs to overlays: model popover `0 10px 40px #0004`, command dialog `0 24px 80px #0005`, tooltip `0 4px 18px #0004`, toast `0 4px 18px #0002`. The native dialog backdrop is `#0005` with 2px blur. Do not give ordinary panels floating-card shadows when reproducing this baseline.

## Application shell

The shell fills `100dvh`. Its two columns are the main sidebar and a workspace that can shrink. The sidebar has a fixed-height top area, a scrolling middle, and Settings anchored at the bottom. In Clarity, New chat/Search precede enabled modules and Recent chats. The main workspace has a stationary header, a flexible body and an optional player footer.

The core layout constraint is that **the intended pane scrolls, not the entire shell**. The source uses grid `minmax(0, 1fr)` and `min-width: 0; min-height: 0` through flex/grid children. Missing any of these can push a footer offscreen or prevent an editor from scrolling.

The following is a minimal structural translation, not a complete exported stylesheet. Supply the palette variables above and the controls below in the receiving project's stylesheet.

```css
.shell {
  height: 100dvh;
  display: grid;
  grid-template-columns: var(--sidebar-width, 232px) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  overflow: hidden;
}
.workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.workspace-header {
  flex: 0 0 44px;
  border-bottom: 1px solid var(--line);
}
.workspace-body {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
.scroll-pane {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}
```

Collapsed sidebar width becomes zero; its controls become inert and inaccessible to pointer interaction. Keep the underlying view state. Thin scrollbars use `--line` on a transparent track. Some reading panes reserve scrollbar space to prevent horizontal shifts.

Clarity reserves macOS window-control space in its draggable header: 80px left padding in the brand area and 82px in the workspace header when the sidebar is collapsed. Interactive controls are excluded from the drag region. **Adaptation guidance:** these offsets and Electron drag regions belong only in a comparable native title-bar layout; ordinary web pages do not need fake traffic lights or this reserved space.

## Components and states

### Buttons, icons and focus

Ordinary buttons have a transparent background, `1px solid var(--line-strong)`, 5px radius, `3px 9px` padding, 12px text and a 26px minimum height. Inline-flex aligns icon and text with a 6px gap. Use a filled neutral primary for the principal submit/create action, a bordered button for ordinary actions, and borderless controls in navigation, tabs and toolbars where specified. Destructive actions use `--danger`; destructive primary buttons pair it with `--bg`.

The shared SVG icon geometry is `viewBox="0 0 24 24"`, rendered at 16 × 16px by default, `fill="none"`, `stroke="currentColor"`, stroke width 1.6, round caps and joins. Existing paths are local SVGs, not an installed icon library. Decorative SVGs are hidden from accessibility APIs; their button or adjacent text supplies the name. Use explicit names such as “Close source preview” for icon-only controls.

| State | Treatment and behavior |
| --- | --- |
| Default | Neutral text/icon and border; no elevation |
| Hover | `--hover` background; selected navigation retains its selection and brighter text |
| Selected / current | `--selected`, primary text, sometimes medium weight; expose the appropriate current/selected/checked semantic state |
| Keyboard focus | 1px `--focus` outline; general inputs use 1px outer offset, tracked keyboard button/link focus uses −2px inset |
| Pointer focus | Suppress decorative button/link focus rings after pointer interaction; retain keyboard visibility |
| Pressed | Most enabled buttons scale to 0.98; file, tab and primary row-target controls omit this displacement |
| Disabled | Buttons use opacity 0.5 and default cursor; disabled Settings switches also use opacity 0.5 |
| Pending submit | Lock immediately before awaiting work, prevent duplicate submits, expose a busy label/state; preserve input on failure |

Task-title keyboard focus outlines the containing row. A custom search wrapper indicates focus through its stronger border rather than a second ring inside it. Hover-revealed row actions must also appear on keyboard focus within the row.

### Fields, search and boolean controls

Use native inputs, textareas, selects and checkbox semantics. A labelled field places a 12px label above its control with 4px separation. Textareas start at 90px generally and 120px in labelled forms, with 1.55 line height. Field errors are local text in `--danger` and connect through `aria-invalid` and `aria-describedby`. Placeholders supplement an accessible label; they do not replace it.

Module search is a 28px-high bordered wrapper, width `min(280px, 100%)`, minimum width 100px, 8px icon/text gap and horizontal padding. The inner input has no independent border/background/ring, 12px text and a flexible shrinking width. Focus changes the wrapper border to `--faint`.

Checkboxes are 15 × 15px with a 3px radius, 1px muted border, and a centered SVG check or an indeterminate dash. Checked/indeterminate backgrounds use `--accent` with an inverse mark. Selects use a centered 12px SVG chevron positioned 8px from the right and reserve 28px right padding; avoid text-character arrows with inconsistent baselines.

Settings switches are 30 × 18px with a 12px thumb and 12px checked translation. Their unchecked track is `--line-strong`; checked track is `--accent` and thumb becomes `--bg`. Automations currently uses a separate 28 × 16px switch with a 10px thumb. This is an existing variation, not evidence of one universal switch component.

### Lists, filters and tabs

Compose a row from an optional leading icon/control, a flexible text column, secondary metadata, and trailing actions. Put `min-width: 0` on the flexible text container so long text cannot force horizontal overflow. Dates and amounts align right when useful. Use the density table for the row's purpose; a single-line headline and a three-line message preview should not share a forced height.

List states distinguish initial loading, empty collection, no search matches, failure, partial results and retry. A failed read must not masquerade as an empty collection. Retain usable same-account content during a refresh failure where supported. Empty states use short guidance in muted text and a relevant action when needed; no illustration or slogan is required.

Filter rows use borderless 26px-minimum buttons with `4px 9px` padding, 4px gaps, muted labels and optional faint 11px counts. Active filters use the shared selected background. Notes tabs have a 35px strip, zero gap, flat edges, an active `--bg` surface and vertical separators that disappear beside hovered/active/focused tabs. Their 20px close buttons appear on hover, active selection or keyboard focus within the tab. Tab labels are 13px with a 220px maximum width.

### Dialogs, popovers and tooltips

Native dialogs use `--raised`, a strong 1px border, 6px radius, 18px padding, width `min(500px, 90vw)` and maximum height `88vh` with internal scrolling. A visible heading names the dialog through `aria-labelledby`; its row has a compact close button. Actions align right, with destructive actions separated when appropriate. Destructive confirmation initially focuses Cancel and names the affected item. Keep native modal focus behavior and keep errors/drafts inside the dialog.

The model picker is an example of a compact popover: 300px wide, capped at 60vw, 7px radius, search above a scrollable 260px-max options region and secondary settings below a divider. This layout can be used for other searchable option lists; model/effort selection itself is Clarity-specific.

Tooltips appear after 450ms, fit within the viewport, and close on input or scrolling. They use 11px text at 1.5 line height, `5px 8px` padding, 5px radius, maximum width 300px and the raised surface. The current helper is pointer-triggered; accessible control names carry the meaning independently. Do not make essential instructions available only in a tooltip.

## Layout patterns

### List and detail workspace

Use a full-width page for task/news/bookmark-style collections. Place the title and primary action in a toolbar, then local search/filters, then the list. For file/editor and inbox/reader workflows, use a permanent secondary pane with a continuous divider and independently scrolling content.

Notes uses a 220px file sidebar (190px minimum), a 35px file header aligned with the tab strip, 26px file rows and a separate editor control row. Its rich-text area has `16px 32px 64px` padding and a 900px maximum width. Mail uses a 310px list pane with 12px/10px padding and a reader padded 24px. These are purpose-specific widths, not a rule that every secondary pane must match.

### Chat and source inspection

Chat has a centered 780px-max content column with `24px 28px 16px` padding. Assistant text sits directly on the canvas; user messages have a subdued `--panel` background, 6px radius and `9px 12px` padding. The composer is a separate persistent bottom area, maximum width 770px, ordinarily `calc(100% - 64px)` wide, with 18px bottom margin, `--panel`, a subtle border, 10px radius and `9px 11px 7px` padding. Its textarea is 14px, 40px minimum and 240px maximum height; controls sit below it.

A source preview has a 35px header, scrolling body with 18px padding, and a footer with an explicit compact “Open in <module>” action aligned right. Initial width is 344px; resizing clamps to at least 260px and at most the smaller of 640px or the available workspace width minus 360px, subject to that minimum. The 8px-wide divider hit area supports pointer drag and keyboard resizing (16px steps; Shift 40px; Home/End to bounds). At viewport widths ≤1050px the pane overlays the workspace's right edge with a shadow and a maximum width of `calc(100% - 80px)`.

The portable rule is to preserve the task while inspecting related content. Clarity's preview does not navigate away from Chat; explicit module opening does. Actual conversation/module/item visits enter Back/Forward history and restore reading offsets; filters and preview changes do not, and Back never undoes data changes. [Chat](chat.md#source-inspection-and-navigation) owns item routing and persistence details.

### Settings

Place a grouped section rail beside one visible content section, below the shared header. The rail is 196px wide, 168px at viewport widths ≤1050px, and scrolls independently. Labels wrap where needed. Center an 808px-max outer content column with `28px 32px 48px` padding.

Groups use `--hover`, a 1px `--line` border, 7px radius and 14px horizontal padding. General setting rows have a 48px minimum height, `13px 0` padding and a 16px gap, with straight dividers between rows. Put the label/optional description on the left and controls on the right. Module-toggle rows use a 42px minimum. Descriptions use 12px muted text; group headings use 12px medium muted text.

Connection-style forms align labels with equally sized right-hand controls up to 300px wide. At content-container widths ≤540px labels stack over fields and horizontal content padding becomes 20px; at ≤380px it becomes 14px and setting controls can wrap beneath their label. These are **container** thresholds, distinct from viewport breakpoints. System/Light/Dark preview choices form a three-column group with a single Tab stop; arrows and Home/End move selection and focus. Section changes focus the heading container without an ornamental ring, then Tab reaches its controls. Preserve forms across section switches.

The [Settings topic](integrations.md#settings-visual-system-2-october-2026) owns the actual group names, connection targets, save/rollback rules, permissions and verification. Another project should supply its own section inventory.

### Command launcher

The launcher is a native dialog, 660px wide, capped at `calc(100vw - 48px)`, 8px radius, with a top margin of `max(50px, 12vh)`. Its search row has `10px 12px` padding and 14px text; results have 6px outer padding, 2px gaps, a 420px maximum scrolling height and 42px-minimum rows. Each result combines an icon, 13px medium title, 11px muted context and selected-row background. A divided footer holds secondary actions/hints.

Quick entry opens an editable compact form in the launcher; the first field spans the form and remaining fields can use two columns with a 12px gap. Typing or choosing a proposed command does not perform the mutation: the named Add/Save action submits. Clarity searches its own content locally and calls connected providers only through an explicit search action; its interpretation policy and supported commands remain in the [omni-input contract](desktop-stack.md#redesign-omni-input-and-search).

### Media and specialised content

Music uses the shared shell with artwork providing color. Its grid uses `repeat(auto-fill, minmax(135px, 1fr))`, 16px gaps and cards capped at 190px. Track tables use compact 44px cells, 2px row gaps, subtle adjacent separators and a selected playing row. A persistent player uses `--panel`, minimum 64px height, a track summary, centered transport/progress and a trailing volume area. At viewport widths ≤1050px the player uses two columns and hides that volume area. Treat this as the current desktop adaptation, not a universal media-control requirement.

Calendar, expenses and other specialised views retain the same surfaces, type and controls while expressing their own data. Reuse the shared language without forcing every data structure into cards or identical rows.

## Feedback and recovery

This section owns the shared presentation policy previously described under Desktop stack. Clarity implements it using the user-selected Radix Toast under [D130](../decisions/index.md#d130-shared-feedback-with-radix-toast-3-october-2026); its runtime interfaces remain in the [desktop feedback contract](desktop-stack.md#interfaces-and-ownership). Other projects can implement the same behavior with their existing accessible primitives.

| Situation | Presentation |
| --- | --- |
| Invalid field | Local field error connected to the input |
| Failed form submission | Error inside the form/dialog; preserve the draft |
| Failed module/provider read | Notice next to affected content with source and a safe retry; preserve valid partial results |
| Ongoing workspace failure | Persistent recovery banner below navigation, or inside the active modal so retry stays reachable |
| Action with no suitable visible local owner | Toast naming the failed operation/source |
| Routine visible state change | Let the updated UI communicate it; autosaves and ordinary task toggles do not need success toasts |

`Notice` has a leading severity icon, flexible text and optional trailing actions. Use 12px text/1.5 line height, `10px 12px` padding, 10px gap, a strong 1px border, the base radius and `--raised`. Long text wraps. The title is weight 500; a following description uses muted text. Never present the same failure locally and in a toast. Music browse errors keep 16px before artwork, and playback errors have one persistent owner with a connection action.

Toasts sit at the upper right, with the viewport at top 56px and right 12px, below the 44px shell header. Width is `min(380px, calc(100vw - 24px))`; messages have 8px gaps, a visible close control and a description area capped at 126px with scrolling. The host does not intercept underlying clicks when empty. Show up to three messages; retain further messages in arrival order.

Repeated identical operation IDs coalesce; changed content replaces that operation's message. Legacy messages without IDs deduplicate by severity, title and description. Error/warning toasts and any toast with an action persist until dismissed, replaced or resolved. Info/success toasts without actions get six seconds of **visible, unpaused reading time**, starting when displayed. Optional toast actions must be safe to ignore; required work belongs in a persistent contextual flow.

Pause timing while the notification region is hovered or focused and while the app is inactive. Hidden/minimized windows and open native modals suspend the host and preserve remaining time; queued notifications resume after the modal closes. Native-modal errors remain in that modal. Desktop implementations need native window state if document visibility/focus does not reflect it reliably.

Toasts never steal focus on arrival. F8 focuses the notification region; Tab reaches its controls; Escape dismisses a focused toast, and Escape elsewhere leaves notifications alone. Dismissing the last focused toast restores the previous connected focus target. Info, success and warning announcements are polite; errors use Radix's foreground announcement. Timing, queue and keyboard behavior are part of the system, not optional decoration.

## Motion and keyboard behavior

| Token or behavior | Current value |
| --- | --- |
| `--ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--fast` | 120ms: hover, border, icon visibility and tooltip transitions |
| `--normal` | 160ms: views, menus, dialogs, check feedback and switches |
| `--slow` | 220ms: sidebar width and task reordering |
| View entry | Opacity 0.45 → 1 and translateY 4px → 0 over 160ms |
| Dialog/menu entry | Opacity 0 → 1, translateY 4px and scale 0.99 → settled state |
| Task reorder | Animate measured old-to-new row positions over 220ms |

CSS transitions and Web Animations both honor either the OS reduced-motion preference or Clarity's Reduce motion setting. Cancel animations already running when the preference changes; disable animated scrolling too. The system also has a running-dot pulse and playing equalizer, which become static under reduced motion. Toast entry currently uses its own 160ms ease-out fade/translation.

Clarity shortcuts are ⌘K commands/search, ⌘B sidebar, ⌘[ / ⌘] Back/Forward, ⌘L composer and ⇧⌘L new chat. Global handlers respect already-handled events. ⌘B remains an editor shortcut when an input/rich editor owns it; a native modal keeps its active module and draft until it closes. **Adaptation guidance:** adopt only relevant actions, use appropriate platform modifiers, and resolve shortcut conflicts with the host application and browser.

## Visual reference guide

These are retained fixture images, visually reviewed for this extraction, not newly captured screens or current live user data. The callouts identify what to emulate. Their original reports establish the build and limits. Some show historical Recent chats entries or older Music metadata; use them for the named visual pattern, not as today's complete feature specification.

| Reference | What to inspect |
| --- | --- |
| [Light task list](../evidence/2026-10-01T154700Z-redesign-repair/compact-light-verified.png) | Pale sidebar versus almost-white canvas; compact primary action and filters; consistent checkbox/title alignment; content-driven empty space. |
| [Dark News at the minimum window](../evidence/2026-10-01T154700Z-redesign-repair/news-minimum-final.png) | Search/filters above dense rows; source/date columns; faint straight separators; stationary shell. |
| [Dark Notes shell](../evidence/2026-10-01T154700Z-redesign-repair/notes-final.png) | Three adjacent surfaces; file/header alignment; continuous dividers; quiet empty editor. |
| [Source-preview detail](../evidence/2026-10-01T154700Z-redesign-repair/preview-verified.png) | Compact header, scrollable document and divided footer with a small module-open action. The image is a pane crop, not the full Chat layout. |
| [Dark Settings desktop](../evidence/2026-10-01T184717Z-settings-redesign/package-dark-1440-settings-appearance.png) and [Light Settings at 850 × 600](../evidence/2026-10-01T184717Z-settings-redesign/package-light-850-settings-appearance.png) | Grouped navigation, centered content, theme previews, aligned switch, wrapping rail label and independent scrolling at constrained width. |
| [Populated Board spacing](../evidence/2026-10-02T163455Z-list-spacing/board-populated.png) | Search-to-first-row separation and title/body/date hierarchy. Its empty New chat entry predates the later eligibility correction. |
| [Dark form dialog](../evidence/2026-10-01T154700Z-redesign-repair/automation-dialog-final.png) | Raised panel, restrained backdrop, labelled fields, compact right-aligned Cancel/Save and separated destructive action. |
| [Light toast over a list](../evidence/2026-10-02T173355Z-global-feedback/package/toast-light-1200.png) | Upper-right placement, icon/title/body structure, subtle shadow and reachable close button with an overflowing description. Repeated text is a stress-test fixture. |
| [Dark Music artwork grid](../evidence/2026-10-01T154700Z-redesign-repair/music-final.png) | Artwork supplies color inside the neutral shell; aligned metadata beneath open, unboxed cards. Later search type-label behavior is specified on Music. |

The [fidelity/motion run](../verification/runs/2026-10-01T154700Z-redesign-repair.md), [Settings run](../verification/runs/2026-10-01T184717Z-settings-redesign.md), [spacing run](../verification/runs/2026-10-02T163455Z-list-spacing.md) and [feedback run](../verification/runs/2026-10-02T173355Z-global-feedback.md) contain the build-specific observations. Screenshots show appearance; timing, focus and persistence need interaction evidence.

## Reproduction checklist

**Adaptation guidance:** use this as a receiving project's acceptance recipe. Run against that project's real entry points and record its build identity and exceptions. Clarity's historical passes do not transfer to a new implementation.

| Check | Expected result |
| --- | --- |
| Themes | Explicit Light/Dark and System work; text, fields, hover, selected and primary states retain their intended pairs. |
| Desktop geometry | At 1200 × 800 and 850 × 600, the header stays visible, intended panes scroll, long labels do not force page-wide horizontal overflow, and controls remain reachable. |
| Content stress | Populate a long list, long title, multiline error and long document; inspect truncation, wrapping, row alignment, scroll and footer visibility. |
| List states | Loading, empty, no-match, failure and retry are distinct and separated from search; retry retains valid data where supported. |
| Keyboard | Every action has a name and usable focus treatment; hidden row actions reveal on focus; tabs/options use appropriate keyboard navigation. |
| Forms | Invalid input is associated with its field; double submit creates one result; errors preserve input; Cancel does not apply a mutation. |
| Dialogs | Visible heading supplies the name; focus stays in the modal; Cancel is the initial destructive-confirmation target; global shortcuts do not switch its underlying task. |
| Context | Switching views preserves the relevant draft/selection/reading position; source preview does not implicitly navigate. |
| Feedback | One visible owner per failure; queued toasts retain errors, pause reading time correctly, dismiss accessibly and do not steal focus. |
| Motion | Entry/resize/reorder actually animate at the specified durations; reduced motion removes CSS and script-driven motion, including active animations. |

Clarity's existing shared recipes remain under [Desktop stack verification](desktop-stack.md#verification-recipe-and-coverage), with [Settings-specific checks](integrations.md#verification-recipe-and-coverage) and [verification setup](../verification/setup.md). This topic does not add an app dependency, fixture, new test suite or a new claim of runtime coverage.

## Implementation map and known limits

The renderer is custom React/CSS with native control semantics, shared local SVGs and selected primitives such as Radix Toast. It is not a published reusable component package. Styles are loaded in this order: `style.css`, `workspace.css`, `settings.css`, `feedback.css`. Later rules override earlier ones, including Notes tabs, composer and list geometry. Copying only the first matching declaration from the base sheet will reproduce an older appearance.

| Repository-relative path | Responsibility |
| --- | --- |
| `src/renderer/style.css` | Theme variables, native controls, basic typography, forms and base module layout |
| `src/renderer/workspace.css` | Current compact shell, specialised controls, lists/tabs, density, motion and responsive overrides |
| `src/renderer/settings.css` | Section rail, groups, switches, aligned forms and container breakpoints |
| `src/renderer/feedback.css` / `feedback.tsx` | Shared notices, banners, toast appearance, queue and reading-time behavior |
| `src/renderer/icons.tsx` / `motion.ts` | SVG geometry, view/reorder animation, input-modality feedback and pointer tooltips |
| `src/renderer/main.tsx` | Shell composition, mounted module state, preview width, global navigation and stylesheet order |
| `src/renderer/api.tsx` | Shared field, dialog, confirmation and list-state helpers |
| `src/renderer/omni-input.tsx` / `model-picker.tsx` / `source-preview.tsx` | Launcher, searchable model/effort control and resizable inspection pane |
| `src/renderer/views/settings-controls.tsx` | Shared Settings presentation helpers |

Known limits matter when reusing this reference:

- The documented baseline is a desktop UI with an 850 × 600 native minimum. It is not a specified mobile/touch design or an exhaustive zoom/localisation contract. Smaller targets in this baseline need deliberate adaptation for other input modes.
- Color and motion tokens exist, but spacing, type sizes and component dimensions are partly hardcoded. The switch variations and specialised radii are real; a unified token/component package has not been implemented.
- Keyboard/DOM checks and selected native fixtures exist; a full VoiceOver walkthrough and exhaustive accessibility/contrast certification remain unperformed. Pointer tooltips are not a substitute for accessible names.
- There is no claim of pixel equivalence across operating systems, browser engines or font fallback. Preserve proportions and behavior, and verify on the receiving platform.
- Historical images are representative rather than a complete state catalog. The current source/specification governs later changes; do not carry old sample content or product defects into another project.

## Sharing and maintenance

For a text reference, share this Markdown topic; its exact values, rules and recipe are self-contained. For a visual reference, also copy the image files linked in the visual guide while preserving their relative paths, or rewrite those links to the receiving project's asset locations. Source-file paths are optional implementation pointers, not dependencies required to read the specification. Product/history links provide provenance and remain Clarity-specific.

For the complete browsable snapshot, share the generated `docs/wiki/index.html` with its linked evidence/attachment directories. The HTML embeds the text but linked images remain separate files. This documents the app; it does not export the app or turn the wiki reader's CSS into a component library.

When shared UI behavior changes, update this topic and the affected feature contract together, retain old evidence, add a dated journal entry and run the documented wiki/report checks. Keep the compatibility headings in Desktop stack as links so existing reports still resolve. Receiving projects should record the reference date/revision and their deviations rather than presenting a modified copy as an automatically synchronised upstream system.
