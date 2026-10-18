# Security

Treat bundles as hostile input. The current reader rejects traversal, duplicate paths, unsafe entry types, oversized inputs, malformed metadata, and hash mismatches without executing contents. Streaming decompression, broader archive fuzzing, and an external security review remain future work. Do not publish secrets in public reports. See the canonical [security model](https://github.com/ReproPack/repropack-core/blob/main/docs/SECURITY.md).
