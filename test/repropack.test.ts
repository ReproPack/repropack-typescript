import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, symlink, rm, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { deflateRawSync } from "node:zlib";
import { createBundle, readBundle, verifyBundle, extractBundle } from "../src/bundle.js";
import { redactBytes, redactManifestEntry } from "../src/redaction.js";
import { defaultLimits, ReproPackError, sha256, validateManifest, type Manifest } from "../src/model.js";

const core = resolve(process.env.REPROPACK_CORE ?? join(process.cwd(), "..", "repropack-core"));
const fixtureRoot = join(core, "conformance", "fixtures");
const catalog = JSON.parse(await readFile(join(core, "conformance", "catalog.json"), "utf8")) as { cases: Array<{ id: string; valid: boolean; expected: string }> };

async function fixture(id: string): Promise<{ manifest: Manifest; evidence: Map<string, Buffer> }> {
  const root = join(fixtureRoot, id);
  const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8")) as Manifest;
  const evidence = new Map<string, Buffer>();
  for (const entry of manifest.evidence) evidence.set(entry.path, await readFile(join(root, ...entry.path.split("/"))));
  return { manifest, evidence };
}

test("round trips and verifies the minimal fixture", async () => {
  const input = await fixture("minimal-valid");
  const archive = createBundle(input.manifest, input.evidence);
  const bundle = readBundle(archive);
  verifyBundle(bundle);
  assert.deepEqual([...bundle.evidence.values()][0], [...input.evidence.values()][0]);
});

test("consumes every valid canonical fixture", async () => {
  for (const item of catalog.cases.filter((item) => item.valid)) {
    const input = await fixture(item.id);
    const bundle = readBundle(createBundle(input.manifest, input.evidence));
    verifyBundle(bundle);
  }
});

test("rejects every invalid canonical fixture with the expected category", async () => {
  const expected: Record<string, string> = {
    "missing-required-field": "invalid-manifest", "invalid-metadata": "invalid-manifest", "corrupted-content": "hash-mismatch", "incorrect-hash": "hash-mismatch", "unsupported-future-version": "unsupported-version", "unsafe-path": "unsafe-path", "oversized-input": "limit-exceeded"
  };
  for (const item of catalog.cases.filter((item) => !item.valid)) {
    let error: unknown;
    try {
      if (item.id === "corrupted-content" || item.id === "incorrect-hash") {
        const input = await fixture(item.id);
        verifyBundle(readBundle(createBundle(input.manifest, input.evidence)));
      } else {
        const manifest = JSON.parse(await readFile(join(fixtureRoot, item.id, "manifest.json"), "utf8")) as Manifest;
        validateManifest(manifest);
      }
    } catch (caught) { error = caught; }
    const code = (error as ReproPackError)?.code === "size-mismatch" ? "hash-mismatch" : (error as ReproPackError)?.code;
    assert.equal(code, expected[item.id], item.id);
  }
});

test("redacts text and updates post-redaction metadata", async () => {
  const result = redactBytes(Buffer.from("password=super-secret\n"));
  assert.equal(result.redacted, true);
  assert.equal(result.bytes.toString(), "password=[REDACTED]\n");
  assert.equal(result.bytes.includes("super-secret"), false);
  const input = await fixture("minimal-valid");
  const redacted = redactManifestEntry(input.manifest, "evidence/message.txt", Buffer.from("api_key=secret-value\n"), "secret");
  assert.equal(input.manifest.evidence[0].size, redacted.bytes.length);
  assert.equal(input.manifest.evidence[0].sha256, sha256(redacted.bytes));
  validateManifest(input.manifest);
});

test("redacts CRLF private-key blocks without retaining key material", () => {
  const result = redactBytes(Buffer.from("-----BEGIN PRIVATE KEY-----\r\nsecret-body\r\n-----END PRIVATE KEY-----\r\n"));
  assert.equal(result.redacted, true);
  assert.equal(result.bytes.toString(), "[REDACTED]\n[REDACTED]\n[REDACTED]\n");
  assert.equal(result.bytes.includes("secret-body"), false);
});

test("preserves binary input with an explicit warning", () => {
  const input = Buffer.from([0, 255, 1]);
  const result = redactBytes(input);
  assert.deepEqual(result.bytes, input);
  assert.equal(result.warnings[0].kind, "binary-input-not-scanned");
});

test("rejects altered content and extracts below the destination", async () => {
  const input = await fixture("minimal-valid");
  const bundle = readBundle(createBundle(input.manifest, input.evidence));
  bundle.evidence.set("evidence/message.txt", Buffer.from("changed content of same-ish size"));
  assert.throws(() => verifyBundle(bundle), (error: ReproPackError) => ["size-mismatch", "hash-mismatch"].includes(error.code));
  const verified = readBundle(createBundle(input.manifest, input.evidence));
  const destination = join(process.cwd(), ".test-extract");
  await extractBundle(verified, destination);
  assert.equal(await readFile(join(destination, "message.txt"), "utf8"), "ReproPack minimal evidence.\n");
  await import("node:fs/promises").then(({ rm }) => rm(destination, { recursive: true, force: true }));
  assert.equal(defaultLimits().maxEntryBytes, 256 * 1024 * 1024);
});

test("accepts filenames containing consecutive dots but rejects traversal ancestors", async () => {
  const input = await fixture("minimal-valid");
  const entry = input.manifest.evidence[0];
  const bytes = input.evidence.get(entry.path)!;
  input.evidence.delete(entry.path);
  entry.path = "evidence/foo..txt";
  input.evidence.set(entry.path, bytes);
  const bundle = readBundle(createBundle(input.manifest, input.evidence));
  verifyBundle(bundle);
  assert.ok(bundle.evidence.has("evidence/foo..txt"));
});

test("applies nested schema validation and strict timestamp/URI rules", () => {
  const manifest = JSON.parse(JSON.stringify({ format: "repropack", spec_version: "0.1", bundle_id: "11111111-1111-4111-8111-111111111111", created_at: "2026-01-01T00:00:00Z", capture: { mode: "explicit", tool: { name: "tool", version: "1" } }, evidence: [{ path: "evidence/a.txt", kind: "text", media_type: "text/plain", size: 0, sha256: "0".repeat(64), selection: "explicit", redaction: { status: "none" } }] }));
  for (const incident of [null, "wrong", []]) { manifest.incident = incident; assert.throws(() => validateManifest(manifest), (error: ReproPackError) => error.code === "invalid-manifest"); }
  manifest.incident = { title: "ok", unknown: true }; assert.throws(() => validateManifest(manifest));
  delete manifest.incident; manifest.extensions = { "not a URI": true }; assert.throws(() => validateManifest(manifest));
  delete manifest.extensions; manifest.created_at = "2026-02-30T00:00:00Z"; assert.throws(() => validateManifest(manifest));
});

test("refuses extraction through a symlinked ancestor", async (context) => {
  const input = await fixture("minimal-valid");
  const entry = input.manifest.evidence[0];
  const bytes = Buffer.from("outside-sensitive-payload\n");
  entry.path = "evidence/a/b/payload.txt";
  entry.size = bytes.length;
  entry.sha256 = sha256(bytes);
  input.evidence = new Map([[entry.path, bytes]]);
  const bundle = readBundle(createBundle(input.manifest, input.evidence));
  const root = await mkdtemp(join(tmpdir(), "repropack-ts-")).catch(() => "");
  if (!root) throw new Error("unable to create temporary directory");
  const outside = await mkdtemp(join(tmpdir(), "repropack-ts-outside-")).catch(() => "");
  if (!outside) { await rm(root, { recursive: true, force: true }); throw new Error("unable to create outside directory"); }
  const ancestor = join(root, "a");
  try {
    try { await symlink(outside, ancestor, "junction"); } catch (error) {
      if (["EPERM", "EACCES", "EINVAL"].includes((error as NodeJS.ErrnoException).code ?? "")) { context.skip("symlink creation is unavailable on this platform"); return; }
      throw error;
    }
    await assert.rejects(() => extractBundle(bundle, root), (error: ReproPackError) => ["extraction-failed", "unsafe-path"].includes(error.code));
    await assert.rejects(() => access(join(outside, "b", "payload.txt")));
  } finally { await rm(root, { recursive: true, force: true }); await rm(outside, { recursive: true, force: true }); }
});

test("bounds deflate output before materializing it", async () => {
  const input = await fixture("minimal-valid");
  const archive = createBundle(input.manifest, input.evidence);
  const local = archive.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), 1);
  const central = archive.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), 1);
  assert.notEqual(local, -1); assert.notEqual(central, -1);
  const nameLength = archive.readUInt16LE(local + 26);
  const extraLength = archive.readUInt16LE(local + 28);
  const dataStart = local + 30 + nameLength + extraLength;
  const actualSize = archive.readUInt32LE(central + 24);
  const originalEnd = dataStart + archive.readUInt32LE(central + 20);
  const compressed = deflateRawSync(archive.subarray(dataStart, originalEnd));
  assert.ok(compressed.length < actualSize);
  const malformed = Buffer.concat([archive.subarray(0, dataStart), compressed, archive.subarray(originalEnd)]);
  const delta = compressed.length - (originalEnd - dataStart);
  const newCentral = malformed.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]), dataStart);
  const end = malformed.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  malformed.writeUInt16LE(8, local + 8);
  malformed.writeUInt32LE(compressed.length, local + 18);
  malformed.writeUInt16LE(8, newCentral + 10);
  malformed.writeUInt32LE(compressed.length, newCentral + 20);
  malformed.writeUInt32LE(1, newCentral + 24);
  malformed.writeUInt32LE(malformed.readUInt32LE(end + 16) + delta, end + 16);
  assert.throws(() => readBundle(malformed), (error: ReproPackError) => error.code === "malformed-archive");
});

test("normalizes malformed archives and enforces reader limits", async () => {
  assert.throws(() => readBundle(Buffer.from("not a zip")), (error: ReproPackError) => error.code === "malformed-archive");
  const input = await fixture("minimal-valid");
  assert.throws(() => readBundle(createBundle(input.manifest, input.evidence), { ...defaultLimits(), maxManifestBytes: 1 }), (error: ReproPackError) => error.code === "limit-exceeded");
});
