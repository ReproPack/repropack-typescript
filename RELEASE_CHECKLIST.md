# Release checklist

Do not publish before the canonical specification is frozen, native tests and conformance pass, security cases are evidenced, package validation succeeds, and the core `FINAL_AUDIT.md` is complete.

Current readiness evidence: local typecheck, build, seven tests, npm audit with zero vulnerabilities, and `npm pack --dry-run` pass. The package remains `private: true`; public npm publication and entry-point/export metadata require explicit owner approval. GitHub synchronization and hosted CI for the corrected core release snapshot remain pending.

Post-CI correction: hosted run `37918766424` exposed missing `REPROPACK_CORE` configuration and OS-specific fixture-path conversion. Both are corrected locally; the hosted rerun remains an open release gate.
