# Cloudflare OS source

Vendored from https://github.com/cloudflare/cloudflare-os at 32ce152654e8a205b54e094e31be932c620dbc52 (Apache-2.0).

- scheduler-core.ts, schedule-types.ts, types.d.ts: unmodified schedule normalization and next-occurrence calculation.
- gatekeeper.d.ts: upstream gatekeeper.ts public module/approval contracts, unchanged apart from the declaration-file extension; used as type contracts.

Clarity adapts these contracts to a local Electron host and workerd persistence. It maintains explicit modules instead of shipping upstream runtime app-generation, multi-user hosting, and deployment tooling. This is a selective adaptation, not the entire upstream application.
