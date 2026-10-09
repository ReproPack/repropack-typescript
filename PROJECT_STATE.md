# Project state

- Current phase: v0.1.0 release-readiness correction (local)
- Phase status: in progress; implementation checks are locally available but external synchronization is pending
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, and tests implemented; no package released
- Conformance status: all 12 core fixtures pass in the local implementation tests; cross-language Linux/Windows evidence depends on corrected core CI
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Release baseline: local `main` is `9295d1fd37e98a7fbaa1e1c2c33053166a05a79d`, local `v0.1.0` points to it, and `main` is 5 commits ahead of `origin/main`
- Registry decision: `private: true` remains unchanged; public npm publication requires explicit owner approval plus package entry-point/export decisions
- Next action: keep the package private until the owner decides whether a public npm artifact is part of v0.1.0
