import { describe, it, expect, beforeAll } from "vitest";

// The crypto module derives its key from this env var at call time.
beforeAll(() => {
  process.env.ENCRYPTION_KEY = "unit-test-encryption-key-please-ignore";
});

describe("integration secret encryption", () => {
  it("round-trips a secret and never stores it in the clear", async () => {
    const { encryptSecret, decryptSecret, encryptionConfigured } = await import(
      "@/lib/crypto"
    );
    expect(encryptionConfigured()).toBe(true);
    const enc = encryptSecret("sk_live_supersecret");
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain("supersecret");
    expect(decryptSecret(enc)).toBe("sk_live_supersecret");
  });

  it("rejects tampered ciphertext", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/crypto");
    const enc = encryptSecret("token-123");
    const tampered = enc.slice(0, -2) + (enc.endsWith("A") ? "BB" : "AA");
    expect(decryptSecret(tampered)).toBeNull();
  });
});
