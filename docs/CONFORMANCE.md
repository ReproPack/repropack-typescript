# Conformance

The TypeScript implementation consumes the canonical fixtures from `repropack-core` and compares manifest meaning, evidence bytes, hashes, redaction markers, and error categories. Its current test suite covers all applicable semantic catalog cases, and the recorded interoperability matrix covers both directions with Rust and Python for the minimal and redacted fixtures.

These results apply to the current implementation and recorded fixtures. They do not certify future integrations, all possible malformed archives, or every possible implementation.
