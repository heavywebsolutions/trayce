// Minimal transactional email via the Resend HTTP API (no SDK needed).
// No-ops cleanly if RESEND_API_KEY is not set, so the app never breaks when
// email is not configured.

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const sender = from || process.env.EMAIL_FROM || "Traxxr <hello@traxxr.com>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function adminRecipients(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}
