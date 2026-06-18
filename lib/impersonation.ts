import { createHmac, timingSafeEqual } from "crypto";

// Admin "log in as" support. The impersonator's admin email is stored in a
// signed cookie so the "exit" flow can restore the right admin session. The
// HMAC signature makes the cookie tamper-proof: a forged cookie can't pass
// verification, so it can never be used to log in as an arbitrary admin.

export const IMP_COOKIE = "traxxr_imp";

function secret(): string {
  return (
    process.env.ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "traxxr-impersonation-dev-secret"
  );
}

export function signImpersonator(email: string): string {
  const sig = createHmac("sha256", secret()).update(email).digest("hex");
  return `${Buffer.from(email).toString("base64url")}.${sig}`;
}

export function verifyImpersonator(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;
  let email: string;
  try {
    email = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expect = createHmac("sha256", secret()).update(email).digest("hex");
  if (sig.length !== expect.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  return email;
}
