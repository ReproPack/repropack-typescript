import { sha256, type Manifest, type RedactionReason, type ReadLimits } from "./model.js";

export interface RedactionWarning { kind: string; message: string; }
export interface RedactionResult { bytes: Buffer; redacted: boolean; warnings: RedactionWarning[]; }

export function redactText(input: string): RedactionResult {
  let privateKey = false; let redacted = false; const warnings: RedactionWarning[] = []; const output: string[] = [];
  for (const line of input.split(/(?<=\n)/)) {
    const content = line.endsWith("\n") ? line.slice(0, -1).replace(/\r$/, "") : line; const newline = line.endsWith("\n") ? "\n" : "";
    if (privateKey) { redacted = true; if (content.includes("-----END ") && content.endsWith("PRIVATE KEY-----")) privateKey = false; output.push(`[REDACTED]${newline}`); continue; }
    if (content.startsWith("-----BEGIN ") && content.endsWith("PRIVATE KEY-----")) { privateKey = true; redacted = true; warnings.push({ kind: "private-key-block", message: "a private-key block was replaced" }); output.push(`[REDACTED]${newline}`); continue; }
    const bearer = content.toLowerCase().indexOf("bearer ");
    if (bearer >= 0) { redacted = true; warnings.push({ kind: "bearer-token", message: "a bearer-token value was replaced" }); output.push(`${content.slice(0, bearer + 7)}[REDACTED]${newline}`); continue; }
    const match = /^\s*[-#]?([A-Za-z][A-Za-z0-9_-]*)\s*([:=])/.exec(content);
    const key = match?.[1].toLowerCase().replaceAll("-", "_");
    if (match && key && ["api_key", "apikey", "access_token", "auth_token", "password", "secret", "private_key", "client_secret", "authorization"].includes(key)) { redacted = true; warnings.push({ kind: "secret-assignment", message: "a secret-like assignment value was replaced" }); output.push(`${content.slice(0, match[0].length)}[REDACTED]${newline}`); continue; }
    output.push(line);
  }
  return { bytes: Buffer.from(output.join("")), redacted, warnings };
}

export function redactBytes(input: Uint8Array): RedactionResult {
  const text = Buffer.from(input).toString("utf8");
  if (!Buffer.from(text).equals(Buffer.from(input))) return { bytes: Buffer.from(input), redacted: false, warnings: [{ kind: "binary-input-not-scanned", message: "input is not valid UTF-8; no redaction was attempted" }] };
  return redactText(text);
}

export function redactManifestEntry(manifest: Manifest, path: string, input: Uint8Array, reason: RedactionReason): RedactionResult {
  const entry = manifest.evidence.find((candidate) => candidate.path === path);
  if (!entry) throw new Error(`missing evidence: ${path}`);
  const result = redactBytes(input);
  if (result.redacted) { entry.size = result.bytes.length; entry.sha256 = sha256(result.bytes); entry.redaction = { status: "redacted", reason }; }
  return result;
}
