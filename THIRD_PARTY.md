# Third-party components

Clarity selectively adapts Cloudflare OS's scheduler and public approval contracts from commit `32ce152654e8a205b54e094e31be932c620dbc52`. Source notices and the Apache-2.0 license are in `src/vendor/cloudflare-os/`. Clarity does not contain the full Cloudflare OS application.

The Spotify audio helper uses librespot 0.8.0 under the MIT license; its license is in `src/vendor/librespot/LICENSE`. [Spotifast](https://github.com/crmne/spotifast) informed the separation of Spotify library authorization and native audio playback. Clarity's player bridge is independently written.

The application uses Electron, Pi, Miniflare/workerd, Playwright, React, Milkdown, marked, sanitize-html, fast-xml-parser, temporal-polyfill, and PDF.js. Versions are pinned in `tooling/dependencies.mjs`. Runtime npm dependencies retain their individual licenses in the packaged application's `Contents/Resources/app/node_modules`. Electron's notices remain in the bundle.

Build dependencies are installed into the external Clarity build cache. No third-party package installation is stored in this repository.
