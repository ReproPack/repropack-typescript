# Project state

- Current phase: v0.1.1 GitHub release complete; npm publication deferred
- Phase status: technically validated; publication decisions remain owner-controlled
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, and tests implemented; GitHub Release asset published, npm package remains private
- Conformance status: all 12 core fixtures pass in local implementation tests; hosted interoperability passed on the corrected synchronized commits
- Hosted CI correction: run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion; both were corrected and verified by run [37919726963](https://github.com/ReproPack/repropack-typescript/actions/runs/37919726963)
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Release baseline: synchronized `main` is `611775e93815ee087dfdb5d47249163f6bf00f76`; remote `v0.1.1` tag and GitHub Release exist; local annotated `v0.1.0` still targets `9295d1fd37e98a7fbaa1e1c2c33053166a05a79d`
- Registry decision: `private: true` remains unchanged; public npm publication requires explicit owner approval plus package entry-point/export decisions
- Owner decisions: preserve the old local tag and release 0.1.1, or explicitly confirm no external consumption and recreate v0.1.0; public npm publication also requires approval to change private: true and finalize entry points
- Full organization audit: branch `audit/full-repropack-2026-10-09` contains security, schema-validation, CRLF-redaction, and CI revision-selection corrections. The corrected v0.1.1 snapshot is released on GitHub; npm publication remains intentionally deferred because `private: true` is unchanged.
