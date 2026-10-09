# ReproPack TypeScript roadmap

This roadmap tracks work owned by the native TypeScript repository. Canonical phase definitions live in [repropack-core](https://github.com/ReproPack/repropack-core/blob/main/ROADMAP.md).

## Status legend

**Complete** means all acceptance criteria have evidence. **In progress** means work has started but exit criteria remain. **Not started** means dependencies are unmet. **Blocked** means a specific blocker is recorded in `PROJECT_STATE.md`. **Deferred** means intentionally postponed.

Current status: **Phase 0 complete; Phase 1 in progress**.

| Local phase | Status | Dependencies | Deliverables | Acceptance / exit criteria |
|---|---|---|---|---|
| 0 — Repository foundation | **Complete** | None | Independent repository, policies, context, roadmap, CI scaffold | Required docs exist, no SDK claims, pushed commit verified |
| 1 — Specification adoption | **In progress** | Core Phase 1 | Pin reviewed core revision; map manifest, errors, paths, limits, timestamps; add `docs/SPECIFICATION_MAPPING.md` | Every normative rule has a TypeScript mapping and review notes |
| 2 — Native manifest and bundle operations | **Not started** | Local Phase 1 | Native models, JSON validation, archive create/read, inspect, validate, verify, extract | Type checks and tests pass without Rust |
| 3 — Shared conformance | **Not started** | Core Phase 5, Local Phase 2 | Fixture runner and semantic assertions | All applicable canonical fixtures pass with expected failures |
| 4 — Interoperability and security | **Not started** | Core Phases 6–9, Local Phase 3 | Cross-language paths and malformed-input tests | Semantics agree; security evidence is recorded |
| 5 — Usability, CI, and release | **Not started** | Local Phase 4, Core Phases 10–14 | SDK docs, optional CLI, CI, package build, audit inputs | Clean examples, package validation, and checklist pass |

## Detailed phase plans

### Phase 0 — Repository foundation

**Status:** Complete. The repository is independent, MIT-licensed, documented as an unimplemented native TypeScript project, and has a verified remote commit. No SDK, CLI, package, or conformance claim is permitted from this phase.

### Phase 1 — Specification adoption

**Status:** In progress. The core v0.1 draft, schema, semantic fixtures, and `docs/SPECIFICATION_MAPPING.md` now exist. Pin the reviewed core revision and complete independent review. **Exit:** two reviewers confirm implementation is possible without Rust.

### Phase 2 — Native manifest and bundle operations

**Status:** Not started. Implement construction, serialization, archive I/O, validation, SHA-256 verification, safe extraction, and errors using native TypeScript. Test round trips, malformed JSON, duplicate/unsafe paths, limits, altered content, and no execution. **Exit:** typecheck, lint, unit, and integration tests pass.

### Phase 3 — Shared conformance

**Status:** Not started. Consume canonical fixtures and compare normalized metadata, evidence bytes, hashes, redaction state, and error categories. Record fixture IDs and tool versions. **Exit:** all applicable valid and invalid fixtures pass.

### Phase 4 — Interoperability and security

**Status:** Not started. Exchange bundles with Rust and Python; test traversal, duplicates, symlinks/special files, decompression limits, oversized input, malicious metadata, malformed text, wrong hashes, unsupported versions, and secret-like values. **Exit:** semantic and security results are recorded.

### Phase 5 — Usability, CI, and release

**Status:** Not started. Stabilize SDK APIs and errors, add justified CLI commands, document clean workflows, run real format/lint/type/test/conformance/build/package CI, and validate package contents. **Exit:** canonical final audit has evidence and no unfinished feature is represented as complete.

## Status-update rules

When changing status, update `PROJECT_STATE.md`, link command or CI evidence, and record decisions for scope or compatibility changes. Compilation alone never closes a phase.
