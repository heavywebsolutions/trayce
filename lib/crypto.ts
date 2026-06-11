import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

// Envelope encryption for integration secrets.
//
// Secrets are encrypted with AES-256-GCM using ENCRYPTION_KEY, which lives ONLY
// in the server environment (Vercel env var) — never in the database and never
// in the repo. So a database dump yields ciphertext that is useless without the
// separate server-side key. Decryption only ever happens in server memory, at
// the moment of an outbound API call.

const PREFIX = "enc:v1:";

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) return null;
  // Accept a 32-byte base64 key, otherwise derive 32 bytes deterministically.
  if (/^[A-Za-z0-9+/]{43}=$/.test(raw)) {
    try {
      const b = Buffer.from(raw, "base64");
      if (b.length === 32) return b;
    } catch {
      /* fall through */
    }
  }
  return scryptSync(raw, "trayce-integration-secrets-v1", 32);
}

export function encryptionConfigured(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) return plain; // not configured — stored as-is (UI warns)
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string | null): string | null {
  if (!stored) return stored;
  if (!stored.startsWith(PREFIX)) return stored; // legacy/plaintext value
  const key = getKey();
  if (!key) return null; // ciphertext but no key — refuse rather than guess
  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}
