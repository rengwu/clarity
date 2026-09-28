# Wiki tooling decisions

Historical decisions D11–D15, moved from Clarity’s planning wiki when the reusable workflow became a separate skill. IDs and decision text are preserved. Current workflow instructions live in `~/Desktop/Projects/planning-wiki/SKILL.md`.

## D11 — General-purpose reusable wiki · 24 September 2026

**Partially superseded by D15:** the packaged workflow now focuses mainly on planning. The reader remains capable of handling other topics, and the minimal footprint is retained.

**Accepted from user feedback:** the reusable wiki should support any subject, not only planning. Keep its project footprint as lean as possible. Discussion journals and decision registers are conventions for relevant wikis, not mandatory content for every wiki.

The wiki lives under `docs/wiki`. The [reusable wiki](../discussions/reusable-planning-workflow.md) documents the implementation. D12 established the source and root behavior; D13 accepts the Node-only build step.

## D12 — Markdown source and automatic root · 24 September 2026

**Partially superseded by D13:** the no-build/on-open loading requirement is replaced by an accepted build step. Markdown remains authoritative, the wiki root is the directory containing the builder and reader, and no folder picker is used.

**Accepted from user feedback:** Markdown files are the single source of content. `index.html` is the reader, rooted in its own directory. No folder picker. The intended reader parses Markdown when opened, without rebuilding content first.

This ruled out the assistant's folder-picker proposal and HTML-authoritative storage proposal. It refined D09's reader requirement. At that point the file-access and discovery mechanism remained unresolved; the desired behavior alone cannot grant a browser filesystem access. See the [implementation constraint](../discussions/reusable-planning-workflow.md#confirmed-target-and-unresolved-file-access).

## D13 — Node-only build · 24 September 2026

**Accepted from user feedback:** a build script is acceptable, and Node is the only prerequisite. This supersedes D12's no-build requirement while preserving authoritative Markdown, a fixed local root, and no folder selection.

Implementation: `docs/wiki/_build.mjs` recursively reads Markdown beside itself and writes `docs/wiki/index.html`. The parser, sanitizer, styles, and reader code are bundled into the script with license information. No per-project package manifest, lockfile, npm installation, or server is needed. Run the script with `--check` to validate sources and confirm that the HTML is current.

The generated HTML is a read-only snapshot; rebuilding is necessary after Markdown changes. The reusable builder can be copied to another wiki folder independently of Clarity. A skill wrapper is still separate future work.

## D14 — No package files or installs · 24 September 2026

**Accepted from user feedback:** “i don't want ever to have a node_modules or package.json”. This makes D13's minimal setup a permanent constraint, rather than merely an optional convenience.

Never create `node_modules`, `package.json`, or package-manager lockfiles in this workspace or reusable wiki copies. Do not use package-manager installs for wiki maintenance, builds, or tests, including temporary setups. Use Node built-ins and the libraries already bundled in `_build.mjs`.

See the [journal entry](../journal/2026-09-24-no-package-files.md). No application implementation stack is selected by this tooling constraint.

## D15 — Planning-wiki skill folder · 24 September 2026

**Accepted from user feedback:** create `planning-wiki` beside Clarity in `~/Desktop/Projects`, and focus the workflow mainly on planning. This replaces D11's general-purpose emphasis for the workflow, without restricting what the reader can display.

The folder contains `SKILL.md` and `assets/_build.mjs`. The skill carries the discussion, decision, and journal conventions; its asset supplies the complete offline reader and styles. Each target project owns its wiki under `docs/wiki`. D13's Node-only build and D14's prohibition on package files and installs remain in force.

The skill is created at the requested location, without a global installation. See the [packaging journal](../journal/2026-09-24-planning-wiki-skill.md). This does not begin building Clarity.
