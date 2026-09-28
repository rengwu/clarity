---
title: Modules and connections
section: Foundations
status: Exploring
updated: 2026-09-27
order: 30
summary: Enable the tools you want and authenticate only the services you choose.
---
# Modules and connections

**Current direction:** local backend, real Markdown notes/wiki, stable modules, Pi, and upstream approvals. Reuse Cloudflare OS connections, adding limited Electron capabilities only for actual file and integration needs.

## Stated requirement

Users choose which features to enable and which accounts to authenticate. Mail only works with a connected Google account. Music combines optional Spotify and Navidrome connections with source-labelled views; direct local files are out of scope. Music playlists belong to their source service, while Clarity maintains a simple local recent-play history. Bookmarks are saved locally and may also be sourced from X or a linkding instance.

Chat can act across all modules; see [chat and module actions](chat.md). Existing connection requirements still apply, including Google for mail and Spotify authentication for Spotify music. Chat does not establish new provider capabilities or select an authentication mechanism.

Every conversation accesses the same enabled module instances. Keep the upstream Pi agent; see [assistant execution](harnesses.md). Provider/access setup and exact local state directories remain open.

## Dependency map

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

## Proposed behavior

Module enablement and service authentication can remain separate. Reuse the platform's connectors where they meet the agreed behavior, and narrow exposed actions: for example, Mail remains read-only even if a Google connector supports sending. Offline behavior depends on backend location and must not be promised merely because the UI uses Electron. These are implementation proposals.

## Open questions

- Where do credentials live, and must each machine reconnect?
- What does disconnecting do to locally saved or cached information?
- Which integrations import snapshots versus continuously synchronize?
- Are multiple Google or Spotify accounts useful initially?
- Does disabling a feature retain its data and scheduled work?
- Does calendar eventually connect to Google, or remain local initially?

Service access, API restrictions, and playback capabilities need research before a promise is made. See [references](../references/index.md).
