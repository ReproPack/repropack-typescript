import { createHash } from "node:crypto";

export const FORMAT = "repropack" as const;
export const SPEC_VERSION = "0.1" as const;

export type CaptureMode = "explicit" | "generated";
export type EvidenceKind = "log" | "text" | "structured" | "source" | "environment" | "test-output" | "file";
export type Selection = "explicit" | "generated" | "derived";
export type RedactionReason = "secret" | "personal-data" | "user-requested" | "policy";
export type Redaction = { status: "none" } | { status: "redacted"; reason: RedactionReason };

export interface Manifest {
  format: "repropack";
  spec_version: "0.1";
  bundle_id: string;
  created_at: string;
  capture: { mode: CaptureMode; tool: { name: string; version: string }; actor?: string; source?: string };
  incident?: { title?: string; summary?: string; category?: string; reported_at?: string };
  evidence: EvidenceEntry[];
  extensions?: Record<string, unknown>;
}

export interface EvidenceEntry {
  path: string;
  kind: EvidenceKind;
  media_type: string;
  size: number;
  sha256: string;
  selection: Selection;
  redaction: Redaction;
}

export class ReproPackError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "ReproPackError"; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const PATH = /^evidence\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/;
const MEDIA = /^[a-z0-9!#$%&'*+.^_`|~-]+\/[a-z0-9!#$%&'*+.^_`|~-]+$/;
const DIGEST = /^[0-9a-f]{64}$/;
const KINDS = new Set<EvidenceKind>(["log", "text", "structured", "source", "environment", "test-output", "file"]);
const SELECTIONS = new Set<Selection>(["explicit", "generated", "derived"]);
const REDACTION_REASONS = new Set<RedactionReason>(["secret", "personal-data", "user-requested", "policy"]);

export function sha256(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ReproPackError("invalid-manifest", `${label} must be an object`);
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new ReproPackError("invalid-manifest", `${label} has unknown field ${key}`);
}
function required(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  for (const key of keys) if (!(key in value)) throw new ReproPackError("invalid-manifest", `${label} missing ${key}`);
}

export function validateManifest(input: unknown, limits: ReadLimits = defaultLimits()): Manifest {
  const root = object(input, "manifest");
  exact(root, ["format", "spec_version", "bundle_id", "created_at", "capture", "incident", "evidence", "extensions"], "manifest");
  required(root, ["format", "spec_version", "bundle_id", "created_at", "capture", "evidence"], "manifest");
  if (root.format !== FORMAT) throw new ReproPackError("invalid-manifest", "invalid format");
  if (root.spec_version !== SPEC_VERSION) throw new ReproPackError("unsupported-version", String(root.spec_version));
  if (typeof root.bundle_id !== "string" || !UUID.test(root.bundle_id)) throw new ReproPackError("invalid-manifest", "invalid bundle_id");
  if (typeof root.created_at !== "string" || !TIMESTAMP.test(root.created_at) || Number.isNaN(Date.parse(root.created_at))) throw new ReproPackError("invalid-manifest", "invalid created_at");
  const capture = object(root.capture, "capture");
  exact(capture, ["mode", "tool", "actor", "source"], "capture");
  required(capture, ["mode", "tool"], "capture");
  if (capture.mode !== "explicit" && capture.mode !== "generated") throw new ReproPackError("invalid-manifest", "invalid capture mode");
  const tool = object(capture.tool, "capture.tool");
  exact(tool, ["name", "version"], "capture.tool");
  if (typeof tool.name !== "string" || !tool.name || typeof tool.version !== "string" || !tool.version) throw new ReproPackError("invalid-manifest", "invalid capture tool");
  if (root.extensions !== undefined) {
    const extensions = object(root.extensions, "extensions");
    for (const key of Object.keys(extensions)) if (!key.includes(":") || /\s/.test(key)) throw new ReproPackError("invalid-manifest", `invalid extension ${key}`);
  }
  if (!Array.isArray(root.evidence) || root.evidence.length === 0) throw new ReproPackError("invalid-manifest", "evidence must not be empty");
  let previous = "";
  const paths = new Set<string>();
  for (const [index, raw] of root.evidence.entries()) {
    const entry = object(raw, `evidence[${index}]`);
    exact(entry, ["path", "kind", "media_type", "size", "sha256", "selection", "redaction"], `evidence[${index}]`);
    required(entry, ["path", "kind", "media_type", "size", "sha256", "selection", "redaction"], `evidence[${index}]`);
    if (typeof entry.path !== "string" || !PATH.test(entry.path) || entry.path.includes("..") || paths.has(entry.path) || entry.path <= previous) throw new ReproPackError(entry.path?.toString().includes("..") ? "unsafe-path" : "invalid-manifest", `invalid evidence path at ${index}`);
    paths.add(entry.path); previous = entry.path;
    if (typeof entry.kind !== "string" || !KINDS.has(entry.kind as EvidenceKind) || typeof entry.media_type !== "string" || !MEDIA.test(entry.media_type)) throw new ReproPackError("invalid-manifest", `invalid evidence metadata at ${index}`);
    if (typeof entry.size !== "number" || !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > limits.maxEntryBytes) throw new ReproPackError("limit-exceeded", `evidence size at ${index}`);
    if (typeof entry.sha256 !== "string" || !DIGEST.test(entry.sha256)) throw new ReproPackError("invalid-manifest", `invalid digest at ${index}`);
    if (typeof entry.selection !== "string" || !SELECTIONS.has(entry.selection as Selection)) throw new ReproPackError("invalid-manifest", `invalid selection at ${index}`);
    const redaction = object(entry.redaction, `evidence[${index}].redaction`);
    exact(redaction, ["status", "reason"], `evidence[${index}].redaction`);
    if (redaction.status === "none" && "reason" in redaction || redaction.status === "redacted" && (typeof redaction.reason !== "string" || !REDACTION_REASONS.has(redaction.reason as RedactionReason)) || redaction.status !== "none" && redaction.status !== "redacted") throw new ReproPackError("invalid-manifest", `invalid redaction at ${index}`);
  }
  return input as Manifest;
}

export interface ReadLimits { maxManifestBytes: number; maxEntries: number; maxEntryBytes: number; maxTotalBytes: number; maxPathBytes: number; }
export function defaultLimits(): ReadLimits { return { maxManifestBytes: 1024 * 1024, maxEntries: 10_000, maxEntryBytes: 256 * 1024 * 1024, maxTotalBytes: 1024 * 1024 * 1024, maxPathBytes: 4096 }; }

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export function manifestJson(manifest: Manifest): Buffer { validateManifest(manifest); return Buffer.from(JSON.stringify(canonical(manifest))); }
