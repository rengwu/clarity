---
title: 2 October 2026 — Verify installed playback after Keychain unlock
section: Journal
status: Current
updated: 2026-10-02
order: 2026100202
summary: Restore Spotify playback through its native entry point and remove a live-discovered duplicate-error race.
---
# 2 October 2026 — Verify installed playback after Keychain unlock

After the user reported “unlocked,” the installed repaired app opened with its existing data and library connection. Playback still lacked its separate grant. Music's Connect playback action opened the correct Settings section, and Enable Spotify playback completed browser authorization. Live search, advancing playback, pause, seeking while paused and resume then succeeded. Playback was left paused; automated position/control checks do not establish listener-confirmed audibility.

The live walkthrough caught a duplicate failure toast which the previous controlled check missed. Matching a playback event against a rejected request depended on message order. Both paths now update one shared player error state, with a compact footer when failure occurs before a queue exists. Regressions exercise both event/reply orders and that early failure. An inherited flex rule initially made the footer cover Music; the final rule keeps it content-sized. Twelve selected connector/redesign/usability tests pass serially, as do type and package checks.

The final locally signed correction is installed with the preceding bundle retained. macOS requested Keychain access again for that updated bundle. After access was allowed, both grants persisted, final installed playback/control checks passed, and a further Quit/reopen retained the connections. The [follow-up run](../verification/runs/2026-10-01T163500Z-installed-playback.md) owns exact build identities, live versus controlled evidence, installation/content audits and the current outcome. This is a correction within settled scope, with no new product decision or data migration.
