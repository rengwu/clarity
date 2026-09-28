# Clarity implementation

The first complete local build is implemented. User authorization on 28 September 2026 covered the agreed modules and delegated safe, lean defaults. The macOS app is packaged separately from this repository; setup is in [README.md](README.md).

## What is included

Chat with Pi/Codex subscription access, hosted search and interactive browser tools; file-backed GFM notes and an AI-edited wiki; todos; week/month calendar; daily expenses; read-only Gmail; RSS/Atom news; bookmarks with Linkding/X import; Spotify/Navidrome playback; opt-in agent board; and scheduled wiki automations. Chat, Notes, Todos, and Wiki start enabled.

Electron owns the local runtime lifecycle. Workerd/Miniflare persists structured records in SQLite under the chosen data folder. Markdown and assets remain ordinary files. Shared maintained module methods serve both the screens and the agent. Cloudflare OS's scheduler and public approval contracts are reused selectively, not its full hosted application or app-generation system.

Source responsibilities:

- `src/main/`: files, credentials, integrations, modules, approvals, chat, browser, music, automation and Electron lifecycle.
- `src/worker/state.ts`: local structured-record persistence and revision checks.
- `src/renderer/`: module screens, Markdown editing and player UI.
- `src/player/main.rs`: native Spotify audio helper using librespot.
- `tooling/`: externally cached build, typecheck, formatting and macOS packaging.
- `tests/`: core checks, Electron workflows, controlled connectors, optional live Codex and relocated-package tests.

## Validation

The default suite passes ten tests, including Electron workflows, Markdown lists/tables/formatting round trips, conflict recovery, attachment expiry and embedding, approvals, browser origin grants, OAuth/refresh fixtures, Navidrome audio, source switching, and automation failure handling. The separately enabled live Codex test passes tool approval, persisted history after restart, and a model/effort change in the same thread. Hosted search also succeeded with the existing subscription.

The packaged app runs after relocation with a system-only PATH and its own dependencies. Checks cover signatures, internal symlinks, native-helper startup, local persistence, and saving a note when Quit follows immediately after typing. Type checking covers both the main application and Worker. The planning wiki is rebuilt and checked separately.

## Practical limits

- Live Gmail, Spotify, X, Linkding, and a real Navidrome server still need the user's account/server configuration. Fixtures establish our control flow, not compatibility with every live service. Spotify's helper builds and starts; real audio/sign-in remains unverified.
- Existing Codex credentials work. Fresh ChatGPT OAuth is implemented but has not been exercised against a fresh live account; account-expiry behavior also remains a live validation item.
- Interactive browsing uses installed Chrome/Chromium. Exact-origin grants last for the thread. Consequential-action classification relies on the agent; it is not a universal read-only browser sandbox. Codex-level latency has not been established by comparative measurement.
- macOS arm64 is validated. Linux development remains possible but unverified; there is no Linux package or notarized public distribution.
- No external-agent board adapter, background service, launch-at-login, device sync, terminal module, or local-file music library.

Details, implementation defaults, and historical evidence remain in the [wiki report](docs/wiki/references/implementation.md).
