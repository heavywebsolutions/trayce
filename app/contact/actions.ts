"use server";

import { sendEmail } from "@/lib/email";

export type ContactState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_TO = "hello@traxxr.com";

const escapeHtml = (s: string) =>
  s.replace(
    /[<>&"]/g,
    (c) => (({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c] as string)
  );

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  // Honeypot: a hidden field real users never see. If it's filled, it's a bot.
  // Pretend success so the bot doesn't learn it was caught.
  if (String(formData.get("company_url") || "").trim() !== "") {
    return { ok: true };
  }

  // Timing trap: a real person takes more than a couple seconds to fill this in.
  const ts = parseInt(String(formData.get("ts") || "0"), 10);
  const elapsed = Date.now() - ts;
  if (!ts || elapsed < 2500 || elapsed > 1000 * 60 * 60) {
    return { ok: true };
  }

  const name = String(formData.get("name") || "").trim().slice(0, 120);
  const email = String(formData.get("email") || "").trim().slice(0, 160);
  const message = String(formData.get("message") || "").trim().slice(0, 4000);

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { error: "Please add a little more detail to your message." };
  }

  const ok = await sendEmail({
    to: CONTACT_TO,
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  });

  if (!ok) {
    return {
      error:
        "We could not send your message right now. Please email hello@traxxr.com directly.",
    };
  }
  return { ok: true };
}
