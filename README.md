# Clarity

A local personal harness built with Electron and TypeScript. Chat, notes, todos, and wiki are enabled initially. Settings enables calendar, expenses, mail, news, bookmarks, music, agent board, and automations. See [implementation and validation](IMPLEMENTATION.md).

The macOS build is `~/Applications/Clarity.app`. Open it, choose a data folder, then use **Settings → Codex → Use installed Codex sign-in**. The packaged app needs neither Node nor Rust. Closing its window keeps it running; use **Quit Clarity** to exit.

Clarity requests device location when first opening your data folder. **Settings → Permissions** lets you refresh or disable it, enter a manual city/country, open macOS Location Settings, and revoke website access for individual chats. Disabling device location clears its saved reading. The agent receives your device timezone and fresh local time automatically; location readings are approximate and dated, not continuous tracking. Location is shared with the selected AI provider in chats and automations.

Clarity selectively reuses Cloudflare OS's scheduler and approval contracts with local workerd/SQLite and Pi. It does not contain the full upstream Cloudflare OS application.

## Run the app

Node.js 22+ with npm is required for development. From this folder:

```sh
node tooling/clarity.mjs dev
```

The launcher installs pinned application dependencies and builds into `~/Library/Caches/Clarity/build` on macOS (`~/.cache/Clarity/build` on Linux). Set `CLARITY_BUILD_CACHE` to change that location. No package manifest, lockfile, or dependency directory is created in this repository. The initial download needs internet access.

Choose a data folder on first launch. Notes and wiki pages are actual Markdown files there. Connect the installed Codex sign-in or sign in with ChatGPT in Settings. Closing the window hides Clarity; use Quit to stop it.

Spotify's native audio helper needs Rust/Cargo to build. Packaged users do not need Rust:

```sh
node tooling/clarity.mjs player
node tooling/clarity.mjs package
```

The macOS bundle is written to the external cache as `Clarity.app`. It has been launched after relocation with only system commands on PATH, including persistence and immediate-Quit note saving. It is locally signed, not notarized for distribution. Interactive browsing and X imports require an installed Chrome or Chromium; ordinary page fetching and hosted Codex search do not.

```sh
node tooling/clarity.mjs check
node tooling/clarity.mjs test
```

Tests use disposable data folders and local connector fixtures. They do not sign into your external accounts. Spotify, Google, Navidrome, and Linkding are optional connections; their setup appears only when their modules are enabled.

Run `CLARITY_LIVE_CODEX=1 node --test tests/live-chat.mjs` explicitly to test with the installed Codex subscription. Run `node --test tests/package.mjs` after packaging to check a relocated bundle. Both use separate test data; the live test makes real model requests.

## Data and connections

All app data lives in the chosen folder: `Notes/`, `Wiki/`, `Attachments/`, `Trash/`, and `.clarity/`. The latter holds local structured state, encrypted credentials, and browser profiles. A small machine-local pointer remembers the selected folder. Back up the entire folder while Clarity is quit. There is no device-sync service; encrypted credentials and browser logins may need reconnecting on another machine.

- **Notes:** real `.md` files, rich GFM editing or Markdown source, folders/tabs, autosave, local image assets, and preserved copies on external-edit conflicts.
- **Wiki:** ask Chat to create or change topic pages. Read them in-app or open `Wiki/index.html` directly in a browser. The HTML rebuilds from Markdown while Clarity runs.
- **Codex:** use the installed sign-in or the provided ChatGPT sign-in flow. Installed credentials are read without rewriting the CLI's tokens; if they expire, sign in again through Codex.
- **Gmail:** provide a desktop Google OAuth client with Gmail API enabled. Inbox and message reading only. Setup shows the redirect address.
- **Spotify:** provide a Spotify client ID for library access, then enable native playback with its separate sign-in. Premium is required for playback. Audio uses the bundled librespot helper; saved OAuth tokens renew automatically and are passed directly to the running helper. Current live validation and limitations are recorded on [Music](docs/wiki/features/music.md#persistent-sign-in).
- **Navidrome:** enter an HTTP/HTTPS server address, username, and password. **Linkding:** enter the instance address and API token. **X:** Open X uses your default browser. Sign in for import uses a separate browser profile; close it after signing in and refresh from Bookmarks. The headless importer cannot reuse the default browser's login, and X's unofficial interface remains account-dependent and can change.
- **Automations:** daily/weekly wiki updates inspect new local state while Clarity runs. Missed runs are skipped; output and approval requests stay in Automations.
- **Agent board:** opt-in topic threads through the maintained module API. Put standing instructions in `AGENTS.md` at the data-root level, or instruct Chat directly. External CLI/REST adapters are not included.

Chat attachments must be below 30 MB and expire after 90 days. Deliberately embedding one in Notes/Wiki makes a separate persistent asset copy. Markdown Trash expires after 30 days. Text/code, supported images, and text-bearing PDFs can be analyzed; other attachments are stored with an unsupported-analysis notice.

External-account checks and browser performance limits are recorded in the [validation report](docs/wiki/references/implementation.md). No terminal sessions, local-file music library, or device sync is included.

## Planning wiki

Open [docs/wiki/index.html](docs/wiki/index.html) directly in a browser. The file contains the complete reader and content snapshot. No server, account, network connection, or folder picker is needed.

Markdown under `docs/wiki/` is the project specification, including current behavior, implementation contracts, decisions, and known gaps. It must be sufficient to guide a rebuild without relying on this conversation. New agents must start with [agent onboarding](docs/wiki/index.md#agent-onboarding); use the rebuild reading order for broader work. It remains separate from the app's user-owned Wiki folder.

The wiki owns the detailed [working rules and completion workflow](docs/wiki/vision/principles.md). AGENTS.md is a short entry point; keep product and implementation details on their wiki topics.

## Build

Node.js 22 or newer is the only prerequisite:

```sh
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```

Run the build after changing Markdown, then refresh the browser. `--check` validates metadata, Markdown links and heading anchors, and verifies that the HTML matches its sources. It fails if the reader is missing or stale. Builds are deterministic and need no network access or npm installation.

Never introduce `node_modules`, `package.json`, or package-manager lockfiles in this repository. Application dependencies use the external cache described above. Package-manager installs are prohibited for wiki work, including temporary wiki build and test setups. Maintain and verify the builder using Node built-ins and its already-bundled libraries.

The script always reads from its own directory, regardless of your terminal's working directory. It scans nested Markdown folders, skipping hidden entries, `node_modules`, and symlinks.

## Files

```text
docs/wiki/
  _build.mjs       Self-contained builder, renderer, styles, and bundled libraries
  index.html       Generated offline reader
  index.md         Wiki home; its title names the wiki
  ...              Markdown pages in any folder structure
```

Edit Markdown rather than `index.html`. The reader is a snapshot, not a filesystem watcher or editor. Its source view identifies the page's path relative to the wiki root. Styles and reader logic are embedded in the named `template`, `css`, and `js` constants in `_build.mjs`.

## Pages

Plain Markdown works without configuration or front matter:

```markdown
# Installation

## Requirements

See the [overview](../index.md).
```

Titles default to the first H1 or filename. Sections default to the top-level folder name; root pages use Overview. Pages sort by section, then optional order, then path. `index.md` appears first in its section. All sections are allowed; no planning-specific folders are required.

Optional metadata uses plain `key: value` lines between `---` delimiters (not nested YAML): `title`, `section`, `order`, `status`, `updated` (YYYY-MM-DD), and `summary`. When both are present, `title` must match the first H1. Existing Clarity metadata is preserved. Summaries are not repeated as subtitles. Additional flat metadata, including verification result, is rendered as escaped labels; its meaning belongs to the owning workflow.

Use relative `.md` links, with optional heading anchors, for wiki pages. URL-encode spaces and special characters in links. External links must use HTTP(S). Markdown tables, lists, and code fences are supported; raw HTML is sanitized. Inline image syntax is rejected; ordinary links to PNG/JPEG/GIF/WebP, MP4/WebM, PDF, TXT/LOG, JSON and CSV under `attachments/` or `evidence/` open separate files. The builder checks paths and hashes file contents; changed evidence requires rebuilding. `search.md` is reserved for the reader's search route.

## Reuse

Copy only `_build.mjs` into another project's `docs/wiki/`, add an `index.md` and any topic pages, and run it with Node. The script includes its parser, sanitizer, and third-party license information. No package manifest, lockfile, `node_modules`, separate asset directory, or installed skill is required. Copy the generated HTML plus linked attachment/evidence directories to share a complete snapshot; copy the Markdown and builder to continue editing elsewhere.

The reader is adopted from local [jstack](../jstack/README.md) revision `cdda753adc7ed81d3eb3abf0283b29e7c226670c`, v1.2.0. [Clarity verification setup](docs/wiki/verification/setup.md) records project-local commands, stable feature IDs, evidence and maintenance rules. The repo works without the sibling jstack checkout or a global plugin installation. Planning/interview guidance is used when relevant; it does not add a mandatory interview to routine changes.

```sh
node tooling/fingerprint.mjs
node --test tests/wiki-reader.mjs tests/wiki-reports.mjs
node tooling/check-reports.mjs docs/wiki
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```

Earlier wiki-tooling discussions and journals are preserved in [the tooling archive](docs/archive/wiki-tooling/discussions/reusable-planning-workflow.md), with [decisions D11–D15](docs/archive/wiki-tooling/decisions/index.md). They are excluded from Clarity's reader so its navigation and search focus on the product. The local `_build.mjs` remains necessary to rebuild this wiki independently of the skill folder.
