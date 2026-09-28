---
title: Reusable wiki
section: Discussion
status: Exploring
updated: 2026-09-24
order: 10
summary: A general-purpose Markdown wiki with one Node-only builder and an offline reader.
---
# Reusable wiki

## Accepted direction

Use a Markdown folder as the single source of content, with an HTML reader alongside it. The reusable workflow now focuses mainly on planning and is named `planning-wiki`; see [D15](../decisions/index.md#d15-planning-wiki-skill-folder-24-september-2026). The reader still supports other subjects. Keep files and setup minimal; no folder picker. The user has accepted a build script with Node as the only prerequisite. See [D13](../decisions/index.md#d13-node-only-build-24-september-2026).

## Current implementation

```text
docs/wiki/
  _build.mjs
  index.html
  index.md
  topics/
    example.md
```

The builder reads Markdown recursively from its own directory and generates `index.html` there. Run it from any terminal directory by supplying its path:

```sh
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```

Node.js 22+ is the only prerequisite. The build script includes its Markdown parser, HTML sanitizer, reader JavaScript, template, CSS, and dependency license information. It needs no npm installation, package manifest, lockfile, external assets, configuration file, or network access.

The user has explicitly prohibited `node_modules` and `package.json`. Keep package manifests, lockfiles, and package-manager installs out of this workflow, including temporary build and test setups; use Node built-ins and the existing bundled libraries. This is a permanent constraint for reuse and maintenance. See [D14](../decisions/index.md#d14-no-package-files-or-installs-24-september-2026).

The reader opens directly in a browser without a server. It embeds a snapshot of the Markdown for navigation, search, source view, backlinks, and printing. Rebuild after changing content, then refresh the reader. Markdown remains authoritative; the HTML is disposable output.

## Reuse in another project

Copy `_build.mjs` into the other project's `docs/wiki`, add `index.md` and any topic folders, and run it. The home page's title names the wiki. Titles and navigation sections are inferred when metadata is absent. No planning-specific folders or statuses are mandatory.

Discussion journals, open questions, and decision registers remain useful for Clarity. A different wiki can contain only tutorials, research, reference pages, or other content. The functional UI rule remains: labels and captions must serve a concrete task.

## Skill packaging

Created `~/Desktop/Projects/planning-wiki`, alongside Clarity:

```text
planning-wiki/
  SKILL.md
  assets/_build.mjs
```

The skill supplies planning instructions and the portable builder as an asset. It initializes relevant content, preserves existing project instructions, and maintains topics, decisions, open questions, and dated discussion history. Each project retains its own wiki under `docs/wiki`. To use the workflow, point an agent at the sibling folder's `SKILL.md` and name the target project. Global skill installation has not been performed.

The builder is already independent of any installed skill. Upgrades must preserve Markdown and account for local edits to the embedded reader code. Keep the tool version and third-party license information with the script.

The [packaging journal](../journal/2026-09-24-planning-wiki-skill.md) records the return to a planning focus and creation of the skill folder. Broader publication or distribution remains undecided.

## Confirmed target and unresolved file access

This heading preserves links to the earlier investigation. The constraint is now resolved by the accepted build step: Node enumerates files; the browser reads the embedded snapshot. No browser filesystem permission or folder picker is required.

The earlier demand for live recursive discovery from a directly opened HTML file was not portable. Synara's [preview implementation](https://github.com/Emanuele-web04/synara/blob/main/apps/desktop/src/localHtmlPreviewProtocol.ts) serves scoped file requests but rejects directory targets. Merely fixing the root to `./` could not provide a file list. D13 replaces the no-build requirement while keeping Markdown ownership and the fixed root.

## Earlier folder-picker proposal — rejected

An Open folder control would have granted the browser access to Markdown through a directory picker or file input. The user rejected that extra interaction. This approach was never implemented.

The investigated APIs were the [directory picker](https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker), which requires user interaction and has limited support, and [directory file inputs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory). They are no longer dependencies of the selected design.

## What TiddlyWiki does

TiddlyWiki's single-file edition [embeds content in the HTML](https://tiddlywiki.com/dev/static/Data%2520Storage%2520in%2520Single%2520File%2520TiddlyWiki.html) and renders it in the browser. Its default [Download Saver](https://tiddlywiki.com/static/Saving%2520with%2520the%2520HTML5%2520saver.html) saves an updated HTML copy. Its [Node.js edition](https://tiddlywiki.com/static/TiddlyWiki%2520on%2520Node.js.html) supports separate content files.

Our reader similarly embeds content for offline browsing, while the separate Markdown tree is authoritative. The build step transfers that content into the portable reader. No switch to HTML-authoritative storage was made.

## Discussion history

The [initial packaging discussion](../journal/2026-09-24-workflow-packaging.md) proposed a planning-specific skill with separate reader assets and per-project package manifests. The [general-purpose revision](../journal/2026-09-24-general-purpose-wiki.md) broadened its scope and proposed a single builder. Later discussions explored [browser rendering](../journal/2026-09-24-browser-rendering.md), [TiddlyWiki](../journal/2026-09-24-tiddlywiki-storage.md), and the [automatic root requirement](../journal/2026-09-24-reader-root.md). The [Node-only build](../journal/2026-09-24-node-only-build.md) records the implemented resolution.
