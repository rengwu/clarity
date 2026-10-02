---
title: Modules and connections
section: Foundations
status: Current
updated: 2026-10-03
order: 30
summary: Enable the tools you want and authenticate only the services you choose.
---
# Modules and connections

Stable ID: **FEAT-settings**.

## Current specification · 2 October 2026

Settings enables optional modules and connects accounts independently. Chat, Notes, Todos, and Wiki start enabled. Each enabled module is one maintained instance shared across chats. Disabling it hides access without deleting its data. This is not Cloudflare OS's runtime-generated gadget system.

| Capability | Current connection contract |
| --- | --- |
| Chat | Pi with installed Codex subscription credentials, or the provided ChatGPT OAuth flow; model and effort apply to the next message in the same thread. |
| Mail | Google desktop OAuth client with Gmail API enabled; read-only Gmail scope; no compose/reply. |
| Music | Optional Spotify library OAuth plus separate native-playback OAuth; optional Navidrome HTTP/HTTPS address and username/password. |
| Bookmarks | Optional Linkding address/API token; Open X launches the OS default browser. A separate Sign in for import action retains the persistent profile needed for explicit headless import; the default browser's login is not shared. |
| News | User-provided RSS/Atom HTTP(S) URLs; no account required. |
| Interactive browsing | Installed Chrome/Chromium, saved login profile, separate exact-origin authorization for each chat. |
| Local modules | No external account required for notes, wiki, todos, calendar, expenses, board, or automation configuration. Running AI work requires Codex. |

Settings keeps one connection per provider initially; no multi-account management is implemented. Accept supplied HTTP or HTTPS server addresses and attempt connection rather than classify networks. Disconnect removes saved connection secrets; imported local bookmarks remain. Credentials are encrypted through Electron safeStorage in `.clarity/credentials.bin`, written atomically, and never included in wiki examples. If old encrypted data cannot be decrypted, preserve it as a recovery file before replacement.

Navidrome validates its credentials before saving; failed replacements preserve the previous connection. Transport errors distinguish reachability, refusal, name lookup and timeout; macOS unreachable/permission errors include the Local Network settings path. The bundle declares its use of chosen local Navidrome/Linkding servers. OS permission remains separate from provider authentication. [Music's connection contract](../features/music.md#navidrome-connection-and-local-network-access-2-october-2026) owns exact boundaries and the live-versus-fixture verification recipe.

OAuth uses state and PKCE with loopback callbacks: Spotify library `http://127.0.0.1:43827/callback`, Google `http://127.0.0.1:43828/callback`, native Spotify playback `http://127.0.0.1:8898/login`. Settings displays setup values. Installed Codex credentials are read without modifying the CLI's tokens; expiry can require signing into Codex again. Full live account validation remains listed in [current follow-up](../discussions/open-questions.md).

Electron owns Spotify token renewal, including sending replacement access tokens to the running native player before expiry. Playback uses the streaming OAuth token directly; it does not require a second login5 exchange or a separate native credential store. See [Music's token contract](../features/music.md#playback-oauth-token-ownership).

Device location and website grants are managed in [Settings → Permissions](chat.md#time-location-and-permissions); these controls do not replace account connections or action approvals. The separate [Agent approvals checklist](chat.md#automatic-approval-checklist) controls which agent actions run immediately, including explicit website authorization and consequential browser batches. It never connects accounts or enables disabled modules. Avoid silently treating browser sign-in as permission to operate a site.

Spotify sign-in must persist through restarts and normal access-token expiry under [D110](../decisions/index.md#d110-long-lived-spotify-sign-in-29-september-2026). The shared Google/Spotify token path saves `access_token`, `refresh_token`, and absolute expiry with each provider's client configuration. Renewal retains an existing refresh token when none is returned, persists rotations, and shares concurrent requests. Temporary failures preserve credentials; reconnect guidance is for rejected/missing renewal credentials, not every failed HTTP response. Spotify also retries a rejected API/native token once. The [Music contract](../features/music.md#persistent-sign-in) owns playback recovery and validation limits. Installed Codex still follows the separate CLI credential contract above.

### Redesign Settings navigation

Settings → Music contains **Normalize volume**, a saved boolean enabled by default when the field is absent. Show the section only when Music is enabled; retain the saved preference when the module is disabled. Checkbox changes take effect on the next track and do not change connection grants or agent approvals. [Music](../features/music.md#source-volume-and-normalization-3-october-2026) owns gain, album/track selection and missing-metadata behavior.

**Accepted direction ([D120](../decisions/index.md#d120-section-based-settings-in-the-redesign-1-october-2026)), implemented:** adopt the spike's section navigation with one selected Settings section visible at a time. This replaces the former long page/Go to layout. Carry all current data-folder, module, appearance, account, Permissions and Agent approvals controls into the appropriate sections; the screenshot-sized sample Settings is not a reduced feature contract.

Existing connection guidance and item targets must activate the appropriate section and expose its relevant controls/errors. Preserve the complete approval checklist, partial-selection behavior, guarded submissions and local failure feedback. The [production port run](../verification/runs/2026-10-01T142628Z-redesign-port.md) exercises the new section entry points and existing approvals/permissions workflows. The older long-page layout run remains historical.

**Implemented Q9 follow-up:** **Automatically interpret commands**, off by default, for the omni-input's existing-agent interpretation path. Explicit Interpret remains available by default. Save this preference with the current data-folder settings; it affects command interpretation only and does not grant action approvals. Both paths stop at an editable form with explicit Add/Save. The [omni-input contract](desktop-stack.md#redesign-omni-input-and-search) owns parsing, cancellation and failure behavior. Verification must cover the default, setting/reload, disconnected agent, and no mutation before submission. The setting is persisted per data folder; it is independent of the action-approval checklist.

The fidelity repair uses shared SVG section icons and selectable System/Light/Dark appearance previews. Spotify library and playback controls appear together, with their separate states and disconnect actions; removing either connection preserves the other grant. Authentication events refresh mounted Mail/Music resources and the shell bootstrap. Existing old `spotify-playback` targets still land on the Spotify section. Check this using the isolated OAuth connector recipe, then verify a missing playback login exposes Connect playback without claiming the library is disconnected.

### Settings visual system · 2 October 2026

**User requirement ([D125](../decisions/index.md#d125-settings-desktop-design-correction-2-october-2026)):** improve the production Settings UI using Cursor Desktop and the earlier Cursor-based prototype; Codex Desktop is permitted as another reference. The implementation study used Cursor 3.23.12’s running General and Appearance screens and the external prototype’s Settings source and rendered Modules screen. No new Codex Desktop inspection is claimed.

**Delegated presentation defaults:** retain one selected section below the shared workspace header. Group the section list into Workspace (Appearance, Modules, Data folder, Search and commands), Agent (Permissions, Agent approvals), Connections (Codex and enabled-module providers), and Preferences (enabled Music/Expenses). Hide empty groups. First entry defaults to Appearance; later visits retain the selection, and existing connection targets still select their section. The section rail is 196px wide, or 168px at window widths up to 1050px, and scrolls independently.

Center the content in an 808px outer column with 32px horizontal padding. Use a 20px medium-weight section title, muted 12px group headings, subdued 7px-radius groups and straight internal dividers. Modules use one row per module with an existing module icon and a right-aligned 30 × 18px switch; rows have a 42px minimum height. Boolean preferences and device location use the same switch, retaining native checkbox semantics, explicit accessible names and Space activation. No module descriptions are invented. The one introductory sentence explains that disabled modules retain data.

Connection forms align labels left and equally sized controls right (300px maximum). At content widths up to 540px, labels stack above full-width inputs, and the outer padding reduces to 20px; tighter content uses 14px. Submit actions align right, errors remain in their section, and connected providers use matching status/action rows. Spotify’s library and playback remain separate groups with independent controls. System/Light/Dark preview buttons retain one keyboard Tab stop; arrows and Home/End select and focus a theme. Shared reduced-motion rules suppress switch and section transitions.

Permissions uses Location and Websites groups, preserving device status, refresh, manual fallback and per-chat revocation. Agent approvals keeps all 37 actions and the native indeterminate Select all checkbox, grouped under module headings with shorter visible action text, full accessible names and a selected-count summary. These are presentation changes to the existing approval contract, not new grants or defaults. Module saves disable the module switches while pending, refresh the saved state, and restore the previous selection with a local error on failure. Form values remain mounted across section changes; credentials are not saved as drafts.

The [focused run](../verification/runs/2026-10-01T184717Z-settings-redesign.md) records native layout and workflow checks, actual dirty-build identity, inspected screenshots and package/delivery evidence. Earlier Settings passes remain tied to their own builds.

### Usability fixes · 1 October 2026

Settings uses a compact left section list and shows one section at a time below the shared stationary workspace header. The content body owns its thin scrollbar. Connection guidance activates its matching section. Section changes focus the heading container without a decorative ring; Tab reaches its controls. All controls remain mounted, preserving in-progress connection forms while switching sections. Labels use explicit accessible names even for prefilled multiline fields.

The current dimensions and grouping are specified in the [Settings visual system](#settings-visual-system-2-october-2026). Action rows wrap as needed. Modules, Permissions and the complete 37-row Agent approvals checklist keep their existing behavior. Appearance adds Reduce motion; Search and commands adds Automatically interpret commands. These two preferences update immediately, persist through settings, and restore the old value if saving fails.

Connection failures appear inside their section rather than at the top of the long page; modal failures stay inside the modal. Connection submissions are guarded while pending. The complete 37-row approval checklist remains present.

Settings → Linkding adds Manual (default), hourly, and daily refresh choices; [Bookmarks](../features/bookmarks.md#linkding) owns scheduling and local-edit reconciliation. No credentials are included in draft storage or new UI evidence.

These changes resolve the relevant findings in the [UI audit](../references/ui-audit.md), under the user’s instruction to fix all findings. Details not individually chosen by the user are delegated lean defaults ([D112](../decisions/index.md#d112-ui-audit-remediation-1-october-2026)).

### Audit follow-up · 2 October 2026

The [adversarial run](../verification/runs/2026-10-01T181800Z-adversarial-qa.md#qa15) reproduced Search and commands clipped in Settings navigation at 850×600 (QA15). Its later isolated follow-up verifies the concurrent Settings rewrite resolves this in both themes and sizes: the label wraps, the navigation column no longer horizontally scrolls and the section opens. QA15 is closed for that recorded later build. The [adversarial remediation run](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) retains the four size/theme label and navigation checks on the combined corrected build. Account-content invalidation remains separately tracked on [Mail](../features/mail.md).

### Verification recipe and coverage

**Adversarial recipe:** Measure the Settings sections column and its standard labels at 850×600 and 1200×800 in both themes. Require visible labels without horizontal navigation scrolling, and keep named section controls operable. Run `tests/adversarial-state.mjs` after an isolated build, following [Verification setup](../verification/setup.md#adversarial-regression-suite), with a fresh evidence directory.

**Entry points and prerequisites:** Mail → Connect Google; Settings → Linkding. Use the isolated fixtures and build/readiness steps in [Verification setup](../verification/setup.md). Intent and expected outcomes are the current specification above, linked to its accepted decisions and delegated defaults; code observations alone do not replace those requirements.

**Executed recipe:** after building, run `node --test --test-name-pattern='UI audit regressions' tests/usability.mjs`. Verify direct section landing and locally visible connection failure; test named controls and the complete approval checklist through the existing permissions driver. Inspect visible outcomes and the underlying persisted effect together. The run owns and closes its temporary app/server; retained screenshots are safe fixtures. Real-account and exhaustive accessibility/conformance limits remain explicitly listed in the run.

For layout changes, build, copy the retained [Settings driver](../evidence/2026-10-01T184717Z-settings-redesign/verify-settings.txt) to an external `.mjs` file, and run it from the repository root with `CLARITY_SETTINGS_EVIDENCE` pointing to a fresh external directory; repeat with `CLARITY_SETTINGS_PACKAGE=1` after packaging. It owns isolated app/data instances and tests all 14 sections with every module enabled, at 1440 × 1000 and 850 × 600 in Light and Dark. Check single-section visibility, stationary header, real wheel scrolling, no horizontal overflow, equal input widths and aligned switch geometry. Visually inspect the screenshots too. Exercise module hide/show and data retention, failed-save rollback, theme keyboard controls, section-to-input Tab, connection form retention/local failure, Mail → Connect Google, and preference persistence after reload. Connection status/error injection verifies presentation, not live accounts.

Run `node --test tests/permissions.mjs` for the full approval checklist, Select all keyboard/partial states, location outcomes and website revocation. The existing native-redesign, omni-interpretation, Music-settings, Navidrome-connection and UI-audit recipes cover retained workflows. Run application/Worker type checks and package relocation checks. The older [long-page layout run](../verification/runs/2026-10-01T035337Z-settings-layout.md) remains historical and its selectors/layout expectations are superseded by D120/D125.

### Verification history

- [2 October 2026: adversarial fixes](../verification/runs/2026-10-02T101600Z-adversarial-fixes.md) — retained QA15 checks on the combined remediation build.

- [2 October 2026: Settings desktop design correction](../verification/runs/2026-10-01T184717Z-settings-redesign.md) — grouped navigation/rows, responsive forms, switches, keyboard access, rollback/persistence and package evidence.

- [2 October 2026: adversarial application audit](../verification/runs/2026-10-01T181800Z-adversarial-qa.md) — QA15 reproduced on the frozen build and verified resolved in the concurrent Settings follow-up.

- [2 October 2026: Navidrome connection diagnosis](../verification/runs/2026-10-01T182630Z-navidrome-connection.md) — Settings retries, saved-account preservation and local-network guidance.

- [1 October 2026: spike fidelity and connection repair](../verification/runs/2026-10-01T154700Z-redesign-repair.md) — appearance/motion, independent Spotify disconnects and connection-state feedback.

- [1 October 2026: production redesign port](../verification/runs/2026-10-01T142628Z-redesign-port.md) — one-section navigation, settings persistence and the maintained approval/permission recipes.

- [1 October 2026: Settings layout polish](../verification/runs/2026-10-01T035337Z-settings-layout.md) — both themes/sizes, actual scrolling/focus, aligned fields, persisted refresh choice, and package evidence.
- [1 October 2026: UI fixes and jstack adoption](../verification/runs/2026-09-30T165735Z-ui-fixes-jstack.md) — dirty-build fingerprint, selected scenarios and evidence. This dated pass does not certify later revisions.

## Earlier discussion and research

The material below records earlier states of the discussion. Its proposals and open questions are historical unless explicitly carried into the current specification above or the [current follow-up list](../discussions/open-questions.md).

**Current direction:** local backend, real Markdown notes/wiki, stable modules, Pi, and upstream approvals. Reuse Cloudflare OS connections, adding limited Electron capabilities only for actual file and integration needs.

### Stated requirement

Users choose which features to enable and which accounts to authenticate. Mail only works with a connected Google account. Music combines optional Spotify and Navidrome connections with source-labelled views; direct local files are out of scope. Music playlists belong to their source service, while Clarity maintains a simple local recent-play history. Bookmarks are saved locally and may also be sourced from X or a linkding instance.

Chat can act across all modules; see [chat and module actions](chat.md). Existing connection requirements still apply, including Google for mail and Spotify authentication for Spotify music. Chat does not establish new provider capabilities or select an authentication mechanism.

Every conversation accesses the same enabled module instances. Keep the upstream Pi agent; see [assistant execution](harnesses.md). Provider/access setup and exact local state directories remain open.

### Dependency map

| Capability | Stated connection requirement |
| --- | --- |
| Local notes, tasks, events, expenses, bookmarks | No external account specified |
| Mail | Connected Google account |
| Spotify music | Spotify authentication |
| Navidrome music | Any supplied HTTP/HTTPS server address and account sign-in; attempt connection |
| X bookmarks | Source requested; access method unverified |
| linkding bookmarks | Token-authenticated, read-only import with manual/scheduled refresh following Lucia |
| News | Customizable sources; source formats undecided |
| Automations | Depends on actions; behavior still to explore |

### Proposed behavior

Module enablement and service authentication can remain separate. Reuse the platform's connectors where they meet the agreed behavior, and narrow exposed actions: for example, Mail remains read-only even if a Google connector supports sending. Offline behavior depends on backend location and must not be promised merely because the UI uses Electron. These are implementation proposals.

### Open questions

- Where do credentials live, and must each machine reconnect?
- What does disconnecting do to locally saved or cached information?
- Which integrations import snapshots versus continuously synchronize?
- Are multiple Google or Spotify accounts useful initially?
- Does disabling a feature retain its data and scheduled work?
- Does calendar eventually connect to Google, or remain local initially?

Service access, API restrictions, and playback capabilities need research before a promise is made. See [references](../references/index.md).
