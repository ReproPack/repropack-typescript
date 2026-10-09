# Contributing

Read `PROJECT_CONTEXT.md`, the applicable phase in `ROADMAP.md`, and the canonical core specification before changing behavior. The implementation must remain native TypeScript and must not invoke Rust. Format, validation, security, and conformance changes require tests and truthful status updates.

For cross-repository changes, follow the core [contributor guide](https://github.com/ReproPack/repropack-core/blob/main/CONTRIBUTING.md), [compatibility policy](https://github.com/ReproPack/repropack-core/blob/main/docs/COMPATIBILITY.md), and [fixture contribution guide](https://github.com/ReproPack/repropack-core/blob/main/docs/FIXTURE_CONTRIBUTION.md). Run `npm ci`, `npm run typecheck`, and `npm test` for implementation changes.
