---
title: 2 October 2026 — Settings desktop design correction
section: Journal
status: Current
updated: 2026-10-02
order: 2026100210
summary: Bring Settings back to the Cursor reference with grouped rows, aligned controls and complete native behavior.
---
# 2 October 2026 — Settings desktop design correction

The user rejected the Settings UI and asked to refer to Cursor Desktop, the earlier Cursor-based spike and optionally Codex Desktop. The running Cursor 3.23.12 General and Appearance screens were inspected through native accessibility and screenshots, alongside the spike’s rendered Modules screen and Settings source. The reference study establishes grouped rows, subdued headings, compact section navigation and controls aligned to the right. It does not import Cursor’s settings capabilities or claim a fresh Codex Desktop inspection.

[D125](../decisions/index.md#d125-settings-desktop-design-correction-2-october-2026) records the request and delegated choices. [Settings](../foundations/integrations.md#settings-visual-system-2-october-2026) owns the rebuild contract: four section groups, Appearance on first entry, compact module switches, consistent connection forms/statuses, theme keyboard navigation, grouped location/website controls and the complete approval checklist organized by module. The existing persistence, connection grants, section targets, partial Select all and reduced-motion behavior remain. Failed module/preference saves restore the prior state with local errors. Module state also follows refreshed settings instead of retaining a stale initial copy.

The [focused run](../verification/runs/2026-10-01T184717Z-settings-redesign.md) records real Electron workflows, both themes and window sizes, safe screenshots, exact source/package identity and delivery. Initial visual inspection found a shared checkbox mask overriding switch knobs; the scoped switch rule was corrected before the final build. The retained driver distinguishes failed-save rollback from successful checkbox changes and waits for the actual Google section to appear after navigation. Earlier failed harness attempts remain linked rather than being presented as product regressions or deleted.

The concurrent adversarial audit identified Settings label clipping as QA15. Its original four-case driver passes against this correction: at 850×600 the label wraps and the navigation column has equal 167px client/scroll widths. The audit’s separate isolated follow-up verifies the same source hash. The other fourteen audit findings remain outside this focused Settings change.

No dependency, schema, real account or data-folder change is required. The package and installation details, including the preserved previous bundle and runtime hash comparison, are recorded in the run. Normal Quit/reopen activates an installed update; live provider/OS authorization and exhaustive accessibility validation remain separate.
