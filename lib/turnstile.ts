// Cloudflare Turnstile (free, privacy-friendly CAPTCHA) server verification.
//
// Designed to stay INERT until TURNSTILE_SECRET_KEY is set: with no key, verify
// returns true so signup keeps working exactly as before. The moment the key is
// present, a missing or invalid token is rejected — so you can ship this now and
// flip it on later just by adding the env vars in Vercel.

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY);
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string | null
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured yet — don't block anyone
  if (!token) return false;

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      }
    );
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    // Configured but the check failed to run — fail closed (bot protection is
    // the whole point). Cloudflare's verify endpoint is highly available.
    return false;
  }
}
