import { inflateRawSync } from "node:zlib";
import { mkdir, lstat, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, join } from "node:path";
import { manifestJson, sha256, validateManifest, type Manifest, type ReadLimits, defaultLimits, ReproPackError } from "./model.js";

export const MANIFEST_PATH = "manifest.json";
export const EVIDENCE_PREFIX = "evidence/";
export interface Bundle { manifest: Manifest; evidence: Map<string, Buffer>; }
interface ZipRecord { name: string; method: number; flags: number; compressed: number; size: number; offset: number; }

function u16(value: number): Buffer { const out = Buffer.alloc(2); out.writeUInt16LE(value); return out; }
function u32(value: number): Buffer { const out = Buffer.alloc(4); out.writeUInt32LE(value); return out; }
function crc32(bytes: Uint8Array): number { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function safePath(name: string, limits: ReadLimits): boolean { return name.length <= limits.maxPathBytes && (name === MANIFEST_PATH || /^evidence\/[A-Za-z0-9._~-]+(?:\/[A-Za-z0-9._~-]+)*$/.test(name)) && !name.includes("..") && !name.includes("\\"); }

export function createBundle(manifest: Manifest, evidence: Map<string, Uint8Array>): Buffer {
  validateManifest(manifest); for (const entry of manifest.evidence) if (!evidence.has(entry.path)) throw new ReproPackError("missing-entry", entry.path);
  for (const path of evidence.keys()) if (!manifest.evidence.some((entry) => entry.path === path)) throw new ReproPackError("unexpected-entry", path);
  const files: Array<{ name: string; data: Buffer }> = [{ name: MANIFEST_PATH, data: manifestJson(manifest) }, ...[...evidence.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, data]) => ({ name, data: Buffer.from(data) }))];
  const locals: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const file of files) {
    if (!safePath(file.name, defaultLimits())) throw new ReproPackError("unsafe-path", file.name);
    const name = Buffer.from(file.name); const crc = crc32(file.data); const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), name, file.data]);
    locals.push(local); central.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(file.data.length), u32(file.data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name])); offset += local.length;
  }
  const centralBytes = Buffer.concat(central); const body = Buffer.concat(locals); const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(centralBytes.length), u32(body.length), u16(0)]);
  return Buffer.concat([body, centralBytes, end]);
}

function findEnd(buffer: Buffer): number { for (let index = buffer.length - 22; index >= Math.max(0, buffer.length - 22 - 0xffff); index--) if (buffer.readUInt32LE(index) === 0x06054b50) return index; throw new ReproPackError("malformed-archive", "missing end record"); }
function records(buffer: Buffer, limits: ReadLimits): ZipRecord[] {
  const end = findEnd(buffer); const count = buffer.readUInt16LE(end + 10); const size = buffer.readUInt32LE(end + 12); const start = buffer.readUInt32LE(end + 16); if (count > limits.maxEntries || start + size > buffer.length) throw new ReproPackError("limit-exceeded", "archive entries");
  const result: ZipRecord[] = []; let cursor = start; const names = new Set<string>();
  for (let index = 0; index < count; index++) { if (buffer.readUInt32LE(cursor) !== 0x02014b50) throw new ReproPackError("malformed-archive", "invalid central directory"); const flags = buffer.readUInt16LE(cursor + 8); const method = buffer.readUInt16LE(cursor + 10); const compressed = buffer.readUInt32LE(cursor + 20); const uncompressed = buffer.readUInt32LE(cursor + 24); const nameLength = buffer.readUInt16LE(cursor + 28); const extraLength = buffer.readUInt16LE(cursor + 30); const commentLength = buffer.readUInt16LE(cursor + 32); const offset = buffer.readUInt32LE(cursor + 42); const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8"); cursor += 46 + nameLength + extraLength + commentLength; if (!safePath(name, limits)) throw new ReproPackError("unsafe-path", name); if (!names.add(name)) throw new ReproPackError("duplicate-entry", name); if ((flags & 1) !== 0) throw new ReproPackError("encrypted-entry", name); if (method !== 0 && method !== 8) throw new ReproPackError("malformed-archive", `unsupported compression for ${name}`); if (uncompressed > limits.maxEntryBytes) throw new ReproPackError("limit-exceeded", name); result.push({ name, method, flags, compressed, size: uncompressed, offset }); }
  return result;
}

export function readBundle(buffer: Uint8Array, limits: ReadLimits = defaultLimits()): Bundle {
  const bytes = Buffer.from(buffer); const entries = records(bytes, limits); let total = 0; let manifestBytes: Buffer | undefined; const evidence = new Map<string, Buffer>();
  for (const record of entries) { if (record.offset + 30 > bytes.length || bytes.readUInt32LE(record.offset) !== 0x04034b50) throw new ReproPackError("malformed-archive", record.name); const nameLength = bytes.readUInt16LE(record.offset + 26); const extraLength = bytes.readUInt16LE(record.offset + 28); const start = record.offset + 30 + nameLength + extraLength; const end = start + record.compressed; if (end > bytes.length) throw new ReproPackError("malformed-archive", record.name); const packed = bytes.subarray(start, end); const data = record.method === 8 ? inflateRawSync(packed) : Buffer.from(packed); if (data.length !== record.size) throw new ReproPackError("malformed-archive", `size mismatch for ${record.name}`); total += data.length; if (total > limits.maxTotalBytes) throw new ReproPackError("limit-exceeded", "total bytes"); if (record.name === MANIFEST_PATH) { if (data.length > limits.maxManifestBytes) throw new ReproPackError("limit-exceeded", "manifest bytes"); manifestBytes = data; } else evidence.set(record.name, data); }
  if (!manifestBytes) throw new ReproPackError("missing-entry", MANIFEST_PATH);
  let manifest: Manifest; try { manifest = validateManifest(JSON.parse(manifestBytes.toString("utf8")), limits); } catch (error) { throw error; }
  const expected = new Set(manifest.evidence.map((entry) => entry.path)); for (const path of expected) if (!evidence.has(path)) throw new ReproPackError("missing-entry", path); for (const path of evidence.keys()) if (!expected.has(path)) throw new ReproPackError("unexpected-entry", path);
  return { manifest, evidence };
}

export function verifyBundle(bundle: Bundle): void { for (const entry of bundle.manifest.evidence) { const bytes = bundle.evidence.get(entry.path); if (!bytes) throw new ReproPackError("missing-entry", entry.path); if (bytes.length !== entry.size) throw new ReproPackError("size-mismatch", entry.path); if (sha256(bytes) !== entry.sha256) throw new ReproPackError("hash-mismatch", entry.path); } }

async function rejectUnsafe(path: string): Promise<void> { try { const stat = await lstat(path); if (stat.isSymbolicLink() || !stat.isFile() && !stat.isDirectory()) throw new ReproPackError("extraction-failed", path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; } }
async function rejectUnsafeParents(root: string, output: string): Promise<void> { let current = root; for (const part of relative(root, output).split("\\")) { current = join(current, part); await rejectUnsafe(current); } }
export async function extractBundle(bundle: Bundle, destination: string): Promise<void> { verifyBundle(bundle); const root = resolve(destination); await mkdir(root, { recursive: true }); await rejectUnsafe(root); for (const [archivePath, bytes] of bundle.evidence) { const output = resolve(root, archivePath.slice(EVIDENCE_PREFIX.length)); const rel = relative(root, output); if (!rel || rel.startsWith("..") || isAbsolute(rel)) throw new ReproPackError("unsafe-path", archivePath); await mkdir(dirname(output), { recursive: true }); await rejectUnsafeParents(root, dirname(output)); await rejectUnsafe(output); await writeFile(output, bytes, { flag: "w" }); } }

export async function captureMappings(manifest: Manifest, mappings: Array<[string, string]>): Promise<Map<string, Buffer>> { const evidence = new Map<string, Buffer>(); for (const [archivePath, source] of mappings) { if (!manifest.evidence.some((entry) => entry.path === archivePath)) throw new ReproPackError("unexpected-entry", archivePath); evidence.set(archivePath, await readFile(source)); } return evidence; }
