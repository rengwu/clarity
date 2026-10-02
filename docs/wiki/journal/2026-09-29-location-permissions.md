---
title: 29 September 2026 — Location and permissions
section: Journal
status: Implemented
updated: 2026-09-29
order: 2026092902
summary: Immediate device-location request, permission controls, and fresh agent time context.
---
# 29 September 2026 — Location and permissions

The user showed a chat response giving UTC/U.S. conversions and guessing a U.S. location. They asked for device-supplied location, an immediate request, and a Settings section for Clarity's permissions. These are recorded in [D104](../decisions/index.md#d104-device-location-and-permissions-29-september-2026).

The assistant implemented fresh local time and IANA timezone on each model request. Location stays unknown until supplied by the device or user. The installed Electron version includes Apple's native location provider; Clarity selects it directly and packages the OS usage descriptions, with no extra dependency or Google API key.

Lean defaults are one initial request when the data folder opens, approximate coordinates with timestamp/accuracy, launch refresh after a successful grant, explicit retry after an unsuccessful first request, and no continuous tracking. Settings → Permissions lets the user refresh or disable device use, enter a manual place, open macOS Location Settings, and revoke existing browser grants by chat. Disabling clears the saved device reading; already sent information is not retractable.

Core checks cover timezone date rollover, DST and fractional offsets, unknown location, coordinate rounding, invalid readings, and startup retry eligibility. Electron fixtures cover granted/denied/unavailable readings, renderer permission gating, clearing, per-chat website revocation, and persistence across restart. A live Codex thread receives the actual device timezone/current clock, uses a saved manual location, and returns unknown after that location is cleared. Native device positioning and the user's actual OS permission response remain unvalidated; fixtures never request the real location.

See [current implementation evidence](../references/implementation.md). Earlier planning and first-build entries are preserved.
