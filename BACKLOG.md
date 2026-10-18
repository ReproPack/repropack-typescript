# Contributor backlog

These items are scoped implementation work that can be completed from public repository context.

## Stable public package exports

Define `exports`, `types`, `files`, and a documented installable entry point if npm publication is approved. Until then, preserve `private: true` and describe this repository as an unpublished reference implementation.

**Acceptance:** package dry-run contains only intended files; a clean Node.js project can import the documented entry point; type declarations and runtime exports agree; no publication occurs without owner approval.

**Difficulty:** Medium.

## Node.js CI failure-capture example

Adapt the Core CI integration example for a Node.js application using explicit evidence selection and post-capture validation.

**Acceptance:** synthetic failure evidence produces a valid bundle; tests cover missing, unsafe, and redacted inputs; the example documents artifact retention and secret boundaries.

**Difficulty:** Small.

## Cross-platform large-bundle coverage

Add bounded-read and large-input regression coverage for Windows and Linux without changing the v0.1 wire format.

**Acceptance:** declared limits are enforced before materialization; tests record platform behavior; documentation states the remaining non-streaming boundary.

**Difficulty:** Medium.

## Shared-fixture contribution check

Add a contributor-facing check that reports fixture paths, hashes, expected error categories, and unsafe-path cases clearly.

**Acceptance:** a synthetic fixture fails with an actionable message when its manifest or expected result is inconsistent.

**Difficulty:** Medium.

## Scope boundary

Replay, environment reconstruction, implicit execution, credential capture, and hosted debugging remain outside this implementation backlog.
