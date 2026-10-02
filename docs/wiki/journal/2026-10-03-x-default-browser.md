---
title: 3 October 2026 — Open X in the default browser
section: Journal
status: Implemented
updated: 2026-10-03
order: 2026100301
summary: OS default-browser launch with explicit separation from the existing bookmark importer.
---
# 3 October 2026 — Open X in the default browser

The user asked whether X could use their default browser, then clarified to launch whatever installed browser is the default. Source inspection showed that the previous sign-in control launched a separate Chrome/Chromium profile required by the current importer. Opening the same URL externally cannot give that collector access to the browser's session.

[D128](../decisions/index.md#d128-open-x-in-the-default-browser-3-october-2026) records the requested opening behavior. Settings now offers Open X through the existing external-link IPC and OS handler. A separately labelled Sign in for import preserves the old flow with explicit guidance about its separate login. Both controls disable during a pending request and show failures locally. There is no browser detection, new dependency or data migration.

The [Bookmarks topic](../features/bookmarks.md#default-browser-import-boundary-3-october-2026) owns the remaining session-access limitation and primary-source research into extensions, Chrome's permission-based connection and official OAuth. None is selected or implemented. The [focused verification run](../verification/runs/2026-10-02T160132Z-x-default-browser.md) records actual build-specific checks and their limits. No real X login or bookmark collection was performed.
