import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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
  for (const entry of manifest.evidence) evidence.set(entry.path, await readFile(join(root, entry.path.replaceAll("/", "\\"))));
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
