# ReproPack TypeScript roadmap

This roadmap tracks work owned by the native TypeScript repository. Canonical phase definitions live in [repropack-core](https://github.com/ReproPack/repropack-core/blob/main/ROADMAP.md).

## Status legend

**Complete** means all acceptance criteria have evidence. **In progress** means work has started but exit criteria remain. **Not started** means dependencies are unmet. **Blocked** means a specific blocker is recorded in `PROJECT_STATE.md`. **Deferred** means intentionally postponed.

Current status: **Local Phases 0–4 complete; local Phase 5 in progress for v0.1.1 release preparation**.

| Local phase | Status | Dependencies | Deliverables | Acceptance / exit criteria |
|---|---|---|---|---|
| 0 — Repository foundation | **Complete** | None | Independent repository, policies, context, roadmap, CI scaffold | Required docs exist, no SDK claims, pushed commit verified |
| 1 — Specification adoption | **Complete** | Core Phase 1 | Pin reviewed core revision; map manifest, errors, paths, limits, timestamps; add `docs/SPECIFICATION_MAPPING.md` | Mapping exists and owner approval is recorded |
| 2 — Native manifest and bundle operations | **Complete** | Local Phase 1 | Native models, JSON validation, archive create/read, inspect, validate, verify, extract | Type checks and tests pass without Rust |
| 3 — Shared conformance | **Complete** | Core Phase 5, Local Phase 2 | Fixture runner and semantic assertions | All applicable canonical fixtures pass with expected failures |
| 4 — Interoperability and security | **Complete** | Core Phases 6–9, Local Phase 3 | Cross-language paths and malformed-input tests | Semantics agree; security evidence is recorded |
| 5 — Usability, CI, and release | **In progress** | Local Phase 4, Core Phases 10–14 | SDK docs, optional CLI, CI, package build, audit inputs | Clean examples, package validation, and checklist pass |

## Detailed phase plans

### Phase 0 — Repository foundation

**Status:** Complete. The repository is independent, MIT-licensed, documented as an unimplemented native TypeScript project, and has a verified remote commit. No SDK, CLI, package, or conformance claim is permitted from this phase.

### Phase 1 — Specification adoption

**Status:** Complete by project-owner approval. The core v0.1 draft, schema, semantic fixtures, and `docs/SPECIFICATION_MAPPING.md` are adopted. **Exit:** native Phase 2 implementation is complete against the frozen contract.

### Phase 2 — Native manifest and bundle operations

**Status:** Complete. Implemented native construction, canonical serialization, stored ZIP archive I/O, validation, SHA-256 verification, safe extraction, redaction, and stable errors without Rust. The package builds and all six integration tests pass. **Exit:** met; shared fixture ownership and cross-language exchange remain later phases.

### Phase 3 — Shared conformance

**Status:** Complete. The seven implementation tests consume all applicable valid and invalid canonical fixtures, checking normalized metadata, evidence bytes, hashes, redaction state, and error categories. Hosted TypeScript run `37919726963` passed the test suite. **Exit:** met for the current implementation and fixture catalog.

### Phase 4 — Interoperability and security

**Status:** Complete for the current implementation. Local tests cover malformed archives, unsafe paths, limits, altered content, redaction, and integrity failures; Core hosted run `37919776037` passed all 12 directed Rust/TypeScript/Python paths on Ubuntu and Windows. Future integrations remain outside this phase.

### Phase 5 — Usability, CI, and release

**Status:** In progress for release preparation. SDK APIs, errors, documentation, CI, package validation, and audit inputs have evidence; npm publication remains blocked by `private: true` and unresolved public entry-point decisions. **Exit:** release checklist and publication decisions are complete without representing unpublished work as released.

## Status-update rules

When changing status, update `PROJECT_STATE.md`, link command or CI evidence, and record decisions for scope or compatibility changes. Compilation alone never closes a phase.
