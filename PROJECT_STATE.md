# Project state

- Current phase: v0.1.1 release preparation
- Phase status: technically validated; publication decisions remain owner-controlled
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, and tests implemented; no package released
- Conformance status: all 12 core fixtures pass in local implementation tests; hosted interoperability passed on the corrected synchronized commits
- Hosted CI correction: run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion; both were corrected and verified by run [37919726963](https://github.com/ReproPack/repropack-typescript/actions/runs/37919726963)
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Release baseline: synchronized `main` is `8a9e1f3bb4433252c3d43406ce79695a4223da19`; target is local `v0.1.1`; local annotated `v0.1.0` still targets `9295d1fd37e98a7fbaa1e1c2c33053166a05a79d`; no remote tag or GitHub Release exists
- Registry decision: `private: true` remains unchanged; public npm publication requires explicit owner approval plus package entry-point/export decisions
- Owner decisions: preserve the old local tag and release 0.1.1, or explicitly confirm no external consumption and recreate v0.1.0; public npm publication also requires approval to change private: true and finalize entry points
