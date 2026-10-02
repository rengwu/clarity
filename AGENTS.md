# Clarity workspace

## Start here

Before brainstorming or implementation, follow the [agent onboarding path](docs/wiki/index.md#agent-onboarding). Read the linked working principles, current follow-up, relevant topic specifications, and latest journal entry before acting. These are required workspace instructions, not optional background reading.

The Markdown wiki is the authoritative product and implementation specification. Keep those details on their existing topic pages; link to them here instead of maintaining a second copy. Current specifications distinguish accepted requirements, delegated defaults, verified behavior, and known gaps. Historical discussion does not reopen settled decisions.

## Working rules

- Follow the wiki's [working principles](docs/wiki/vision/principles.md) for lean scope, readable code, learning explanations, and question rounds.
- Implementation and disposable spikes are authorized within the [recorded scope](docs/wiki/vision/principles.md#scope-and-authorization). Preserve settled decisions and explain material limitations honestly.
- Never create `node_modules`, `package.json`, or package-manager lockfiles in this workspace or reusable wiki copies. Application dependencies/builds stay in the external cache; wiki tooling uses Node.js 22+ only.
- Use the [verification setup and maintenance workflow](docs/wiki/verification/setup.md) for changed behavior: update the relevant feature recipe, exercise the real entry points, and record build-specific outcomes/evidence.
- Complete the [documentation and validation workflow](docs/wiki/vision/principles.md#documentation-and-validation) before handoff. Update affected wiki topics in the same work and keep [IMPLEMENTATION.md](IMPLEMENTATION.md) consistent.
- Automatically commit coherent, verified work at meaningful and safe milestones. Do not commit known-broken, partial, unrelated, or sensitive changes; keep each commit focused and report its ID at handoff.

Edit Markdown, never the generated `docs/wiki/index.html`. After wiki changes, rebuild and verify:

```sh
node tooling/check-reports.mjs docs/wiki
node docs/wiki/_build.mjs
node docs/wiki/_build.mjs --check
```
