# TypeScript mapping for ReproPack 0.1

This document maps the implemented native TypeScript SDK to ReproPack 0.1.

| Specification concept | TypeScript mapping | Required behavior |
|---|---|---|
| Manifest | `ReproPackManifest` interface/type | Reject unknown ordinary fields; preserve URI-keyed extensions |
| Evidence | `EvidenceEntry` interface/type | Use `number` only after safe-integer and configured-limit checks |
| SHA-256 | lowercase `string` branded by validation | Recompute bytes; never trust the manifest digest alone |
| Timestamp | UTC RFC 3339 `string` validated at the boundary | Require `Z` suffix; do not normalize silently |
| Redaction | discriminated union `{ status: "none" }` or `{ status: "redacted"; reason: ... }` | Hash replacement bytes and never retain removed bytes |
| Error categories | discriminated `ReproPackError` with stable `code` | Details must be safe to log and must not echo evidence secrets |
| Limits | `ReadLimits` object with explicit byte/count fields | Enforce before extraction and during streaming reads |
| Unknown version | `unsupported-version` error | Reject before using evidence |
| Safe extraction | destination-root checked path operation | Reject links and special files; never execute entries |

The implementation uses native TypeScript and does not invoke or link to Rust. Current fixture and interoperability evidence covers this implementation; it does not certify future integrations or every possible input.
