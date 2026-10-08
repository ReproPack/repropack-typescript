# Project context

This repository will provide an idiomatic, native TypeScript SDK and optional CLI for ReproPack. It implements the canonical language-neutral specification owned by [repropack-core](https://github.com/ReproPack/repropack-core), currently proposed as `0.1-draft`. It must operate without Rust.

The v0.1 boundary is explicit evidence construction, reading, validation, integrity verification, and safe extraction; no execution or replay. Future agents must inspect Git status, read the applicable core phase, run real checks, and never claim conformance from compilation alone.
