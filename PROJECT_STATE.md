# Project state

- Current phase: v0.1.1 GitHub and npm releases complete
- Phase status: technically validated; publication decisions remain owner-controlled
- Specification implemented: native 0.1 model and bundle operations; canonical version is 0.1 approved for implementation
- Implementation status: native TypeScript library, validation, stored ZIP I/O, redaction, verification, safe extraction, tests, public package entry point, and declaration output implemented; GitHub Release and public npm package published
- Conformance status: all 12 core fixtures pass in local implementation tests; hosted interoperability passed on the corrected synchronized commits
- Hosted CI correction: run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion; both were corrected and verified by run [37919726963](https://github.com/ReproPack/repropack-typescript/actions/runs/37919726963)
- Known environment issue: npm/pnpm PowerShell shims are blocked by execution policy; `npm.cmd` works
- Release baseline: synchronized `main` is `611775e93815ee087dfdb5d47249163f6bf00f76`; remote `v0.1.1` tag and GitHub Release exist; local annotated `v0.1.0` still targets `9295d1fd37e98a7fbaa1e1c2c33053166a05a79d`
- Registry decision: public npm publication is complete for `repropack-typescript@0.1.1`; package entry points, declarations, and included files were validated with a clean consumer install
- Owner decisions: preserve the old local tag and release 0.1.1, or explicitly confirm no external consumption and recreate v0.1.0
- Full organization audit: branch `audit/full-repropack-2026-10-09` contains security, schema-validation, CRLF-redaction, and CI revision-selection corrections. The corrected v0.1.1 snapshot is released on GitHub and npm.
