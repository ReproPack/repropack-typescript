# Release checklist

Do not publish before the canonical specification is frozen, native tests and conformance pass, security cases are evidenced, package validation succeeds, and the core `FINAL_AUDIT.md` is complete.

Target release: `0.1.1`. Local typecheck, build, security regressions, npm audit, and package creation pass. The v0.1.1 GitHub Release is published with a checksum-verified tarball. The package remains `private: true`; public npm publication and entry-point/export metadata require explicit owner approval and remain deferred.

Post-CI correction: hosted run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion. Both were corrected and verified by run `37919726963`.

## Coordinated publication prerequisites

- [ ] Owner chooses the coordinated version/tag strategy.
- [ ] If publishing npm, owner approves making the package public and finalizes `main`, `types`, `exports`, and included build files.
- [x] Approved release tag exists on the exact corrected commit.
- [x] GitHub Release links the approved notes, tarball, and checksum file.
- [ ] npm publication is performed only after the package decision is approved; until then `private: true` and unpublished-reference status remain intentional.
