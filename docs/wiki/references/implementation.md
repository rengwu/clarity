---
title: Implementation and validation
section: References
status: Implemented
updated: 2026-09-29
order: 100
summary: The local application, selected defaults, validation evidence, and account limitations.
---
# Implementation and validation

The user authorized building the complete agreed Clarity app under [D102](../decisions/index.md#d102-build-clarity-with-lean-defaults-28-september-2026). The first complete local build now includes all agreed modules. Account-dependent behavior is explicitly separated from verified local behavior below.

## Architecture in the working app

- Electron and TypeScript, with a React interface. Cloudflare workerd/Miniflare provides persistent local SQLite state; Node handles actual Markdown files and account connections.
- Pi runs Codex using the existing ChatGPT subscription. The current implementation has one maintained module instance per enabled module, shared by chats.
- Cloudflare OS's scheduler and public approval contracts are vendored from commit `32ce152654e8a205b54e094e31be932c620dbc52`. Clarity selectively adapts these contracts and the queued-approval behavior. It does not run the complete upstream application, app-generation subsystem, or multi-user hosting machinery. This is a material implementation distinction from simply packaging the upstream app unchanged.
- Data is under the chosen root: `Notes/`, `Wiki/`, `Attachments/`, `Trash/`, and `.clarity/`. A machine-local bootstrap pointer remembers the root. Credentials use OS-backed encryption.
- Dependency installation and builds use an external Clarity cache. No package.json, lockfile, or node_modules is added to this repository. The standalone planning wiki's Node-only workflow stays unchanged.

## Defaults selected during implementation

| Area | Lean default |
| --- | --- |
| Browser permission | Exact-origin grants persisted on the chat; consequential or ambiguous actions enter the action review queue. This relies on agent classification, not universal read-only enforcement. |
| Browser implementation | Installed Chrome/Chromium with a separate persistent profile, batched Playwright actions, focused main-content reads. Broad research uses hosted Codex web search when available. |
| Conflicts | Preserve the external note and write the human draft to a separately named conflict copy; stale agent writes fail. |
| Interrupted work | Preserve history and mark interrupted runs; no automatic action replay. |
| Calendar | Double-click a time/day or use Event; edit an event by clicking it. Week and continuously scrollable month views. |
| Expenses | Integer minor units with two decimal places, optional display symbol, daily entries with edit/delete. |
| News | RSS and Atom sources, explicit refresh, headlines opening externally. |
| Music | Source pills, flat libraries, combined search tab plus four type tabs; artist detail lists source albums. Spotify uses a bundled librespot audio helper; Navidrome uses the local player. |
| Attachments | Strictly below 30,000,000 bytes; 90 days from attachment time. Trash working retention is 30 days. |
| Automations | Daily/weekly local schedules, one run per automation, missed runs skipped. Changes are processed in bounded chronological batches; the cursor must not skip unprocessed input. |

## Validation · 29 September 2026

- **Default suite: ten passing tests.** Core behavior, controlled connectors, and Electron end-to-end workflows pass; the live Codex test is opt-in and skipped by default.
- **Live Codex:** the actual application used the installed subscription, proposed a todo through its tool, applied it once after approval, quit/restarted, and recalled earlier thread content after changing from gpt-5.5 to gpt-5.6-luna with a different effort. A separate native hosted-search request succeeded with an official Electron release reference. This establishes working paths, not comparative latency.
- **Notes:** real-file autosave, rich/source round trips for task lists, nested bullets, numbered lists starting after 1, tables, strike/bold, links and code. The final pass found and fixed Milkdown 7.19's list-attribute validation mismatch and delayed serialization after editor destruction. Immediate typing followed by Quit preserves the new text. External-edit conflicts preserve both versions.
- **Files and approvals:** path/symlink rejection, strictly-below-30-MB enforcement, 90-day chat-copy cleanup, separate 30-day Trash cleanup, permanent module copies of embedded attachments, sanitized wiki output, revision conflicts, and duplicate-effect prevention pass.
- **Other screens:** todos, week/continuous-month calendar with no repeated dates, expense digit input, bookmark creation, configurable feeds, board threads/replies, automation creation, and wiki page/heading navigation pass in Electron. Window close hides; explicit Quit and restart preserve local state.
- **Controlled connections:** OAuth state/PKCE, encrypted credentials, recovery from unreadable credentials, refresh, Gmail read-only requests, Linkding local-edit preservation, and RSS/Atom parsing pass. An HTTP Navidrome fixture plays an actual audio stream inside Electron, supports pause/resume, and stops after a single song. Source handoff stops the previous engine first.
- **Automations:** missed-run skipping, no-new-input behavior, failed-run cursor preservation and output isolation from chats pass. Changes are processed in bounded chronological groups without advancing past omitted records.
- **Package:** the macOS arm64 bundle passes code-signature and self-contained-symlink checks, launches after relocation with a system-only PATH, starts its bundled native Spotify helper, and persists tasks/notes across restart. A duplicate workerd executable is replaced by an internal symlink. End users need neither Node nor Rust.
- **Static checks:** TypeScript checks the application and Worker separately; the planning reader is rebuilt and checked against its Markdown sources.

Tests live in the repository's `tests/` directory, use external disposable data folders, and are distinct from the earlier [technical spikes](technical-spikes.md). Fixtures do not establish live account compatibility.

## Connections and limits

- Spotify library authorization and native-playback authorization are separate, following the separation studied in [Spotifast](https://github.com/crmne/spotifast). The bundled librespot 0.8.0 helper compiles and starts; real Spotify login/audio still requires account validation. Rust/Cargo is needed to build the helper, not to run the packaged app.
- Gmail, X, Linkding, and a real Navidrome instance require user credentials/server details. Gmail's client ID and Spotify's library client ID are supplied in Settings. No external account was silently connected.
- X imports are read-only and run headlessly after the visible sign-in browser is closed. Refresh is explicit from Bookmarks. Imported local records are retained; upstream absence does not prove deletion. The unofficial interface may change, and live X has not been exercised.
- Installed Codex subscription access is live-tested. Fresh ChatGPT sign-in and real expiry/refresh remain unverified; installed CLI credentials are read without rewriting its token file.
- Interactive browsing requires installed Chrome/Chromium. Exact-origin grants persist on the chat. Consequential-action classification depends on the agent and is not universal side-effect prevention. No measured Codex performance parity is claimed.
- Scheduled maintenance runs while Clarity is alive, including with its window closed. There is no independent service or login launch. Deleted source records are not inferred as authoritative retractions; existing wiki content and conflicting evidence are preserved unless a change is requested.
- Local secrets use OS-backed encryption. Moving files to another machine may require reconnecting accounts; no device sync or cross-machine credential portability is promised.
- The packaged target validated here is macOS arm64. Linux remains an unverified development route. The bundle is locally signed, not notarized for public distribution.
- The board's maintained module methods are available to opted-in app agents. An external-agent CLI/REST adapter remains outside the selected scope.

## Running and maintaining the app

Use the repository README for setup and build commands. Application dependencies and generated manifests remain in the external build cache; the repository contains no package manifest, lockfile, or installed dependency directory. The in-app Wiki folder and this planning wiki are separate systems.
