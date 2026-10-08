# Architecture

TypeScript is an independent implementation of the canonical ReproPack format. It may consume shared fixtures from core but must not import or execute Rust. Planned layers are manifest types/validation, archive transport, integrity verification, safe extraction, and SDK/CLI presentation. Every layer treats metadata and evidence as untrusted.
