---
title: 25 September 2026 — Read-only bookmark integrations
section: Journal
status: Captured
updated: 2026-09-25
order: 300
summary: Accept Lucia-style Linkding imports and investigate read-only X access.
---
# 25 September 2026 — Read-only bookmark integrations

The user accepted following Lucia for Linkding and requested investigating X with read-only behavior and no like/unlike actions. Recorded D41 and D42 in the [decision register](../decisions/index.md).

Read X's current official bookmark, OAuth PKCE, endpoint, and pricing documentation. Read-only bookmark access is documented; developer setup and usage charges are the main product tradeoff. The discounted owned-read rate requires the authenticating user to own the developer app. Bookmark-save timestamps and complete historical coverage are not established by the inspected response schema.

Reviewed Lucia's earlier Twikit investigation: synthetic pagination/request-gate tests passed, but authenticated testing was deferred at a reported login limit. That does not validate a live connector. No credentials were read, account connected, packages installed, or paid requests made in this investigation.

The assistant recommends the official API if setup and cost are acceptable, initially with user-triggered refresh. This remains a proposal. Sources, tradeoffs, field-mapping suggestions, and outstanding choices are kept together on the [Bookmarks page](../features/bookmarks.md#x-feasibility-research-25-september-2026). No application implementation occurred.
