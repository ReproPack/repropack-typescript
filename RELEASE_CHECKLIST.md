# Release checklist

Do not publish before the canonical specification is frozen, native tests and conformance pass, security cases are evidenced, package validation succeeds, and the core `FINAL_AUDIT.md` is complete.

Target release: `0.1.1`. Pre-audit readiness evidence: local typecheck, build, seven baseline tests, npm audit with zero vulnerabilities, and `npm pack --dry-run` pass. The audit branch adds five focused security/schema regressions; its local 12-test suite passes. Hosted run [37925435775](https://github.com/ReproPack/repropack-typescript/actions/runs/37925435775) passed before the full audit branch. The package remains `private: true`; public npm publication and entry-point/export metadata require explicit owner approval. Hosted CI for `audit/full-repropack-2026-10-09` remains pending.

Post-CI correction: hosted run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion. Both were corrected and verified by run `37919726963`.

## Coordinated publication prerequisites

- [ ] Owner chooses the coordinated version/tag strategy.
- [ ] If publishing npm, owner approves making the package public and finalizes `main`, `types`, `exports`, and included build files.
- [ ] Approved release tag exists on the exact corrected commit.
- [ ] GitHub Release links the approved notes, artifacts, checksums, and core specification.
- [ ] npm publication is performed only after the package decision is approved.
