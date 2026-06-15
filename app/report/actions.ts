"use server";

import { redirect } from "next/navigation";
import { sendEmail, adminRecipients } from "@/lib/email";

const REASONS = new Set([
  "spam",
  "abuse",
  "impersonation",
  "illegal",
  "other",
]);

// Public abuse report for a bio page. Emails the TRAXXR admins. Never throws at
// the reporter, always lands them on a thank-you state.
export async function submitReport(formData: FormData): Promise<void> {
  const handle = String(formData.get("handle") || "").slice(0, 60);
  const reasonRaw = String(formData.get("reason") || "other");
  const reason = REASONS.has(reasonRaw) ? reasonRaw : "other";
  const details = String(formData.get("details") || "").slice(0, 1000);
  const reporter = String(formData.get("reporter") || "").slice(0, 120);

  const recipients = adminRecipients();
  if (recipients.length) {
    await sendEmail({
      to: recipients,
      subject: `Bio page reported: @${handle || "unknown"}`,
      html: `<p>A bio page was reported on TRAXXR.</p>
        <p><strong>Page:</strong> @${handle || "unknown"}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Details:</strong> ${details || "(none)"}</p>
        <p><strong>Reporter:</strong> ${reporter || "(anonymous)"}</p>`,
    }).catch(() => {});
  }

  redirect("/report?sent=1");
}
