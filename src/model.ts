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
const URI = /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]+$/;
const KINDS = new Set<EvidenceKind>(["log", "text", "structured", "source", "environment", "test-output", "file"]);
const SELECTIONS = new Set<Selection>(["explicit", "generated", "derived"]);
const REDACTION_REASONS = new Set<RedactionReason>(["secret", "personal-data", "user-requested", "policy"]);

export function sha256(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }

function timestamp(value: unknown): boolean {
  if (typeof value !== "string" || !TIMESTAMP.test(value)) return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?Z$/.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText);
  const hour = Number(hourText); const minute = Number(minuteText); const second = Number(secondText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month] && hour < 24 && minute < 60 && second < 60;
}

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
  if (!timestamp(root.created_at)) throw new ReproPackError("invalid-manifest", "invalid created_at");
  const capture = object(root.capture, "capture");
  exact(capture, ["mode", "tool", "actor", "source"], "capture");
  required(capture, ["mode", "tool"], "capture");
  if (capture.mode !== "explicit" && capture.mode !== "generated") throw new ReproPackError("invalid-manifest", "invalid capture mode");
  const tool = object(capture.tool, "capture.tool");
  exact(tool, ["name", "version"], "capture.tool");
  if (typeof tool.name !== "string" || !tool.name || tool.name.length > 128 || typeof tool.version !== "string" || !tool.version || tool.version.length > 64) throw new ReproPackError("invalid-manifest", "invalid capture tool");
  if (capture.actor !== undefined && (typeof capture.actor !== "string" || capture.actor.length > 256)) throw new ReproPackError("invalid-manifest", "invalid capture actor");
  if (capture.source !== undefined && (typeof capture.source !== "string" || capture.source.length > 512)) throw new ReproPackError("invalid-manifest", "invalid capture source");
  if (root.incident !== undefined) {
    const incident = object(root.incident, "incident");
    exact(incident, ["title", "summary", "category", "reported_at"], "incident");
    if (incident.title !== undefined && (typeof incident.title !== "string" || incident.title.length > 256)) throw new ReproPackError("invalid-manifest", "invalid incident title");
    if (incident.summary !== undefined && (typeof incident.summary !== "string" || incident.summary.length > 8192)) throw new ReproPackError("invalid-manifest", "invalid incident summary");
    if (incident.category !== undefined && (typeof incident.category !== "string" || incident.category.length > 128)) throw new ReproPackError("invalid-manifest", "invalid incident category");
    if (incident.reported_at !== undefined && !timestamp(incident.reported_at)) throw new ReproPackError("invalid-manifest", "invalid incident timestamp");
  }
  if (root.extensions !== undefined) {
    const extensions = object(root.extensions, "extensions");
    for (const key of Object.keys(extensions)) if (!URI.test(key)) throw new ReproPackError("invalid-manifest", `invalid extension ${key}`);
  }
  if (!Array.isArray(root.evidence) || root.evidence.length === 0) throw new ReproPackError("invalid-manifest", "evidence must not be empty");
  let previous = "";
  const paths = new Set<string>();
  for (const [index, raw] of root.evidence.entries()) {
    const entry = object(raw, `evidence[${index}]`);
    exact(entry, ["path", "kind", "media_type", "size", "sha256", "selection", "redaction"], `evidence[${index}]`);
    required(entry, ["path", "kind", "media_type", "size", "sha256", "selection", "redaction"], `evidence[${index}]`);
    const components = typeof entry.path === "string" ? entry.path.split("/") : [];
    const traversal = components.some((component) => component === "." || component === "..");
    if (typeof entry.path !== "string" || Buffer.byteLength(entry.path, "utf8") > limits.maxPathBytes || !PATH.test(entry.path) || traversal || paths.has(entry.path) || entry.path <= previous) throw new ReproPackError(traversal ? "unsafe-path" : "invalid-manifest", `invalid evidence path at ${index}`);
    paths.add(entry.path); previous = entry.path;
    if (typeof entry.kind !== "string" || !KINDS.has(entry.kind as EvidenceKind) || typeof entry.media_type !== "string" || entry.media_type.length > 255 || !MEDIA.test(entry.media_type)) throw new ReproPackError("invalid-manifest", `invalid evidence metadata at ${index}`);
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
