# Project state

- Current phase: Phase 3 - shared conformance
- Phase status: not started; local Phase 2 complete
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, and tests implemented; no package released
- Conformance status: all 12 core fixtures pass in the Phase 2 integration tests; a dedicated Phase 3 runner/report remains
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Next action: formalize the TypeScript shared-conformance runner and record fixture/tool results
