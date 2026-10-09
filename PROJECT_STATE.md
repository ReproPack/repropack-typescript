# Project state

- Current phase: v0.1.0 release-readiness correction (local)
- Phase status: in progress; implementation checks are locally available but external synchronization is pending
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, and tests implemented; no package released
- Conformance status: all 12 core fixtures pass in the local implementation tests; cross-language Linux/Windows evidence depends on corrected core CI
- Hosted CI correction: run `37918766424` failed because the test workflow did not set `REPROPACK_CORE` to its canonical-fixture checkout and the test converted canonical `/` paths to Windows separators; the workflow and test path handling are corrected locally, with hosted rerun still pending
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Release baseline: local `v0.1.0` still points to `9295d1fd37e98a7fbaa1e1c2c33053166a05a79d`; readiness documentation commit `51ffe1e` is now after that tag on local `main` and remains unpushed
- Registry decision: `private: true` remains unchanged; public npm publication requires explicit owner approval plus package entry-point/export decisions
- Next action: synchronize the focused correction commit only after local review, then verify the hosted Linux test and core interoperability matrix before release publication
