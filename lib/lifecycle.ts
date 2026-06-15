// Lifecycle / conversion email templates, keyed to where a user is in the
// reverse trial. Plain inline-styled HTML so it renders in any client.

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

export type LifecycleKind =
  | "welcome"
  | "mid_trial"
  | "trial_ending"
  | "trial_ended"
  | "card_expiring"
  | "payment_failed";

function shell(
  heading: string,
  paragraphs: string[],
  ctaText: string,
  ctaHref: string
): string {
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:8px 4px;color:#0A2540">
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    ${paragraphs
      .map(
        (p) =>
          `<p style="font-size:15px;line-height:1.6;color:#425466;margin:0 0 14px">${p}</p>`
      )
      .join("")}
    <p style="margin:20px 0 8px">
      <a href="${ctaHref}" style="display:inline-block;background:#2587DE;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${ctaText}</a>
    </p>
    <p style="font-size:12px;color:#8792A2;margin-top:24px">TRAXXR</p>
  </div>`;
}

export function lifecycleEmail(
  kind: LifecycleKind,
  opts?: {
    daysLeft?: number;
    cardLabel?: string;
    expLabel?: string;
  }
): { subject: string; html: string } {
  const daysLeft = Math.max(1, opts?.daysLeft ?? 3);
  const cardLabel = opts?.cardLabel || "the card on file";
  const expLabel = opts?.expLabel || "soon";
  switch (kind) {
    case "welcome":
      return {
        subject: "Welcome to TRAXXR",
        html: shell(
          "Welcome to TRAXXR",
          [
            "You are on a 14-day Growth trial, no card needed. Editable codes, full analytics, and lead capture are all unlocked.",
            "Print a code, point it anywhere, and watch the scans roll in.",
          ],
          "Create your first code",
          `${APP_URL}/dashboard/codes`
        ),
      };
    case "mid_trial":
      return {
        subject: "You are halfway through your Growth trial",
        html: shell(
          "Halfway through your trial",
          [
            "You still have full Growth access. Now is the moment to capture leads and see where your scans actually come from.",
            "Everything you build keeps working, and editing a printed code is one click.",
          ],
          "Open your dashboard",
          `${APP_URL}/dashboard`
        ),
      };
    case "trial_ending":
      return {
        subject: `${daysLeft} day${daysLeft === 1 ? "" : "s"} of Growth left`,
        html: shell(
          `${daysLeft} day${daysLeft === 1 ? "" : "s"} of Growth left`,
          [
            "When your trial ends, editing printed codes, full analytics, and lead capture lock. Your codes keep redirecting, you just cannot change them anymore.",
            "Keep everything you have built for less than a coffee a week.",
          ],
          "Upgrade and keep your features",
          `${APP_URL}/dashboard/settings`
        ),
      };
    case "trial_ended":
      return {
        subject: "Your trial ended, and your codes still work",
        html: shell(
          "Your trial ended",
          [
            "Your printed codes still redirect, nothing broke. Editing, full analytics, and lead capture are paused.",
            "Re-unlock them anytime and pick up exactly where you left off.",
          ],
          "Re-unlock TRAXXR",
          `${APP_URL}/dashboard/settings`
        ),
      };
    case "card_expiring":
      return {
        subject: "Your card on file is about to expire",
        html: shell(
          "Time to update your card",
          [
            `${cardLabel} expires ${expLabel}. Once it does, your next TRAXXR renewal will fail and your plan will pause.`,
            "Update it now and nothing changes, your codes, analytics, and pages keep running without a hitch.",
          ],
          "Update your card",
          `${APP_URL}/dashboard/settings`
        ),
      };
    case "payment_failed":
      return {
        subject: "We could not process your TRAXXR payment",
        html: shell(
          "Your payment did not go through",
          [
            `We tried to charge ${cardLabel} for your renewal and it was declined. Your plan is still active for now while we retry.`,
            "Update your card to avoid losing access. It takes less than a minute, and we will pick the charge back up automatically.",
          ],
          "Update your card",
          `${APP_URL}/dashboard/settings`
        ),
      };
  }
}
