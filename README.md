# Clarity wiki

Open [docs/wiki/index.html](docs/wiki/index.html) directly in a browser. The file contains the complete reader and content snapshot. No server, account, network connection, or folder picker is needed.

Markdown under `docs/wiki/` is the single source of content. Clarity remains in the planning phase; the application has not been started.

## Build

Node.js 22 or newer is the only prerequisite:

```sh
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```

Run the build after changing Markdown, then refresh the browser. `--check` validates metadata, Markdown links and heading anchors, and verifies that the HTML matches its sources. It fails if the reader is missing or stale. Builds are deterministic and need no network access or npm installation.

Never introduce `node_modules`, `package.json`, or package-manager lockfiles. Package-manager installs are prohibited for this wiki, including temporary build and test setups. Maintain and verify the builder using Node built-ins and its already-bundled libraries.

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

Optional metadata uses plain `key: value` lines between `---` delimiters (not nested YAML): `title`, `section`, `order`, `status`, `updated` (YYYY-MM-DD), and `summary`. When both are present, `title` must match the first H1. Existing Clarity metadata is preserved. Summaries are not repeated as subtitles; state and update dates are shown only when supplied and relevant.

Use relative `.md` links, with optional heading anchors, for wiki pages. URL-encode spaces and special characters in links. External links must use HTTP(S). Markdown tables, lists, and code fences are supported; raw HTML is sanitized. This reader remains text-only: image syntax is rejected. `search.md` is reserved for the reader's search route.

## Reuse

Copy only `_build.mjs` into another project's `docs/wiki/`, add an `index.md` and any topic pages, and run it with Node. The script includes its parser, sanitizer, and third-party license information. No package manifest, lockfile, `node_modules`, separate asset directory, or installed skill is required. Copy the generated HTML alone to share a snapshot; copy the Markdown and builder to continue editing elsewhere.

The planning workflow is packaged in [planning-wiki](../planning-wiki/SKILL.md), alongside this project. It contains the skill instructions and the portable builder asset. Point an agent at that `SKILL.md` to use it in another project; it has not been installed globally. The workflow focuses on planning, decisions, open questions, and discussion history, while the reader still supports arbitrary topics.

Earlier wiki-tooling discussions and journals are preserved in [the tooling archive](docs/archive/wiki-tooling/discussions/reusable-planning-workflow.md), with [decisions D11–D15](docs/archive/wiki-tooling/decisions/index.md). They are excluded from Clarity's reader so its navigation and search focus on the product. The local `_build.mjs` remains necessary to rebuild this wiki independently of the skill folder.
