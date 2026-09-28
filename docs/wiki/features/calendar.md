---
title: Calendar
section: Features
status: Exploring
updated: 2026-09-25
order: 10
summary: macOS-style week and month views, with seamless month scrolling.
---
# Calendar

## Stated intent

Local calendar events in the personal folder. Keep the module lean, using macOS Calendar as the main visual/interaction reference and Notion Calendar as an additional reference.

## Views

**Accepted from the user ([D35](../decisions/index.md#d35-week-and-month-calendar-25-september-2026)):** switch between exactly two views:

- **Week:** like macOS Calendar, with day columns and a vertical time grid containing event blocks.
- **Month:** like macOS Calendar, with a month grid and seamless scrolling across month boundaries. Continuous month scrolling is required; discrete previous/next month navigation alone does not satisfy it.

The earlier agenda proposal is replaced by these selected views. Event creation through chat remains accepted under D17.

## Event fields

**Accepted from the user ([D36](../decisions/index.md#d36-minimal-calendar-event-fields-25-september-2026)):** title, start date and time, and end date and time are sufficient for initial event creation.

The supplied screenshots show an event popover anchored to the selected event. The exact form presentation and direct grid interactions remain open; the screenshots' extra controls are not automatically requirements.

## Lean scope rule

Resist adding features; ask whether each is necessary. Consult the user when in doubt. Match the requested two views and scrolling experience without importing the reference apps' entire feature sets. No extra views or advanced event-management features are selected by resemblance alone. If seamless scrolling or event interactions require unexpected complexity, raise the tradeoff before adopting an implementation.

## Open questions

- How should users create, edit, and remove events directly in the grid?

## Reference notes

The user supplied macOS Calendar week and month screenshots on 25 September 2026. They show the week time grid, a month date grid, event blocks/bars, today highlighting, and event popovers. Seamless month scrolling is an explicit user requirement; a static screenshot alone does not verify scroll behavior.

The images also contain extra views and event controls, including reminders, repeat, travel time, invitees, and provider selection. These are reference observations, not accepted Clarity scope. Notion Calendar remains an additional named reference; its implementation has not been inspected. No calendar library or app framework has been selected.

## Related pages

[Feature map](index.md) · [Two folders](../foundations/folders.md) · [Modules and connections](../foundations/integrations.md) · [Reference register](../references/index.md)
