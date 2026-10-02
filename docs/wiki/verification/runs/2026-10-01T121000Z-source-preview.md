---
title: 1 October 2026 — Source preview navigation example
section: Verification runs
status: Recorded
result: Passed
updated: 2026-10-01
order: 2026100107
summary: Fictional source inspection stays in Chat; explicit module navigation and proposed history preserve the draft and reading position.
---
# 1 October 2026 — Source preview navigation example

## Scope

Verify selected **FEAT-shared-ui / FEAT-chat** flows in the external [source-preview example](../../references/technical-spikes.md#source-preview-and-navigation-example-1-october-2026), created for Q8C in the adoption interview. D121's no-implicit-navigation rule is accepted; exact panel and history behavior remain proposals. A passing demonstration is not user approval or production acceptance.

## Build and environment

Node 22.19.0 on macOS arm64, Synara browser at 1100×760 CSS pixels, loopback `http://127.0.0.1:4319`. The temporary login-session job is `local.clarity.navigation-review`. Four external source files are identified by the [manifest](../../evidence/2026-10-01T121000Z-source-preview/build.json), aggregate SHA-256 `dde409b9ce0f84296d1bf48a819c955d3758ef97568ac2b11a31afd74e00048f`. The separate [workspace fingerprint](../../evidence/2026-10-01T121000Z-source-preview/workspace-build.json) records the dirty production checkout without claiming production build/test coverage.

Real named browser controls and typing performed the interactions. DOM reads observed the view, draft, preview and scroll offset. See [observations](../../evidence/2026-10-01T121000Z-source-preview/observations.json), [source/server checks](../../evidence/2026-10-01T121000Z-source-preview/source-checks.json), and the inspected [source-preview screenshot](../../evidence/2026-10-01T121000Z-source-preview/source-preview.png).

## Results

| Selected scenario | Expected | Actual observation | Outcome |
| --- | --- | --- | --- |
| Open note source | Inspect beside Chat without module navigation/history push | Chat visible, module view hidden, preview open, Back still disabled, draft retained | Passed |
| Explicit Open in Notes | Navigate only after named module action | Location became Notes, Chat hidden, expected document title visible, Back enabled | Passed |
| Back and Forward | Restore Chat position/draft; traverse module visit | Back returned to Chat with the same draft and scroll offset 219px; preview retained; Forward returned to Notes | Passed |
| Close preview | Stay in Chat and remove preview from interaction | Chat active, preview closed/inert, draft retained | Passed |
| Todo source | Same preview-first rule and explicit exit | Task preview kept Chat active; Open in Todos switched to Todos; Back returned to Chat | Passed |
| Final presentation | Reviewable source pane with continuous boundary and no page overflow | Inspected 1100×760 screenshot; note preview visible alongside Chat; root horizontal overflow false | Passed |
| Source and serving | Valid source, intended live assets match manifest | Both JS modules passed `node --check`; three assets returned 200 with matching hashes and no-store | Passed |

## Limits and follow-up

The captured console contains four deprecated `navigator.modelContext` warnings and four blocked-inline-style CSP errors, each style error attributed to `invalid:[redacted]` line 2152. They coincide with browser-script calls; the example's own scripts contain no inline style injection, so browser-helper attribution is an inference. This is not a clean-console claim. External CSS loaded, the inspected layout was intact, and the selected interaction checks passed; the restrictive example policy was not relaxed to hide the messages.

The example uses in-memory history and fictional content. No reload persistence, native Electron history, real file editing, model-context provenance, parser or complete module implementation was tested. No independent or exhaustive accessibility review is claimed. The user still needs to judge the proposed interaction; that preference is outside the Passed aggregate. The original 4318 spike and production source were not changed. Documentation checks validate records and links only.
