// Central registry for every automated email TRAXXR sends. Copy is editable in
// the admin (stored in email_templates); the values here are the defaults used
// when no override exists. Plain inline-styled HTML so it renders anywhere.

import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

// Lifecycle subset (these are gated by the campaign on/off flags + cron logic).
export type LifecycleKind =
  | "welcome"
  | "mid_trial"
  | "trial_ending"
  | "trial_ended"
  | "card_expiring"
  | "payment_failed";

// All automated emails.
export type EmailKind = LifecycleKind | "proof_ready" | "shipped" | "new_signup";

export type EmailTemplate = {
  subject: string;
  heading: string;
  body: string; // paragraphs separated by a blank line
  ctaText: string;
};

type EmailMeta = {
  label: string;
  group: "Lifecycle" | "Orders" | "System";
  hasCta: boolean;
  vars: string[]; // placeholders available, shown in the editor
  defaults: EmailTemplate;
};

export const EMAILS: Record<EmailKind, EmailMeta> = {
  welcome: {
    label: "Welcome",
    group: "Lifecycle",
    hasCta: true,
    vars: [],
    defaults: {
      subject: "Welcome to TRAXXR",
      heading: "Welcome to TRAXXR",
      body: "You are on a 14-day Growth trial, no card needed. Editable codes, full analytics, and lead capture are all unlocked.\n\nPrint a code, point it anywhere, and watch the scans roll in.",
      ctaText: "Create your first code",
    },
  },
  mid_trial: {
    label: "Mid-trial",
    group: "Lifecycle",
    hasCta: true,
    vars: [],
    defaults: {
      subject: "You are halfway through your Growth trial",
      heading: "Halfway through your trial",
      body: "You still have full Growth access. Now is the moment to capture leads and see where your scans actually come from.\n\nEverything you build keeps working, and editing a printed code is one click.",
      ctaText: "Open your dashboard",
    },
  },
  trial_ending: {
    label: "Trial ending",
    group: "Lifecycle",
    hasCta: true,
    vars: ["{daysLeft}"],
    defaults: {
      subject: "{daysLeft} of Growth left",
      heading: "{daysLeft} of Growth left",
      body: "When your trial ends, editing printed codes, full analytics, and lead capture lock. Your codes keep redirecting, you just cannot change them anymore.\n\nKeep everything you have built for less than a coffee a week.",
      ctaText: "Upgrade and keep your features",
    },
  },
  trial_ended: {
    label: "Trial ended",
    group: "Lifecycle",
    hasCta: true,
    vars: [],
    defaults: {
      subject: "Your trial ended, and your codes still work",
      heading: "Your trial ended",
      body: "Your printed codes still redirect, nothing broke. Editing, full analytics, and lead capture are paused.\n\nRe-unlock them anytime and pick up exactly where you left off.",
      ctaText: "Re-unlock TRAXXR",
    },
  },
  card_expiring: {
    label: "Card expiring",
    group: "Lifecycle",
    hasCta: true,
    vars: ["{cardLabel}", "{expLabel}"],
    defaults: {
      subject: "Your card on file is about to expire",
      heading: "Time to update your card",
      body: "{cardLabel} expires {expLabel}. Once it does, your next TRAXXR renewal will fail and your plan will pause.\n\nUpdate it now and nothing changes, your codes, analytics, and pages keep running without a hitch.",
      ctaText: "Update your card",
    },
  },
  payment_failed: {
    label: "Payment failed",
    group: "Lifecycle",
    hasCta: true,
    vars: ["{cardLabel}"],
    defaults: {
      subject: "We could not process your TRAXXR payment",
      heading: "Your payment did not go through",
      body: "We tried to charge {cardLabel} for your renewal and it was declined. Your plan is still active for now while we retry.\n\nUpdate your card to avoid losing access. It takes less than a minute, and we will pick the charge back up automatically.",
      ctaText: "Update your card",
    },
  },
  proof_ready: {
    label: "Proof ready",
    group: "Orders",
    hasCta: true,
    vars: ["{productName}"],
    defaults: {
      subject: "Your {productName} proof is ready to review",
      heading: "Your proof is ready",
      body: "Thanks for your order. We have prepared a digital proof of your {productName}.\n\nReview and approve it so we can start production. Nothing prints until you approve, so take a close look at the code, logo, and text.",
      ctaText: "Review your proof",
    },
  },
  shipped: {
    label: "Order shipped",
    group: "Orders",
    hasCta: true,
    vars: ["{productName}", "{tracking}"],
    defaults: {
      subject: "Your {productName} has shipped",
      heading: "Your order shipped",
      body: "Good news, your {productName} is on the way.\n\n{tracking}",
      ctaText: "View your order",
    },
  },
  new_signup: {
    label: "New signup alert (to you)",
    group: "System",
    hasCta: false,
    vars: ["{email}"],
    defaults: {
      subject: "New TRAXXR signup: {email}",
      heading: "New signup",
      body: "A new account was just created on TRAXXR.\n\n{email}",
      ctaText: "",
    },
  },
};

export const EMAIL_KINDS = Object.keys(EMAILS) as EmailKind[];
export const LIFECYCLE_KINDS = EMAIL_KINDS.filter(
  (k) => EMAILS[k].group === "Lifecycle"
) as LifecycleKind[];

// Where each email's button goes. NOT user-editable, so links can't break.
// Order emails point at the specific order, so they read opts.orderId.
export function ctaHrefFor(
  kind: EmailKind,
  opts?: { orderId?: string }
): string | null {
  switch (kind) {
    case "welcome":
      return `${APP_URL}/dashboard/codes`;
    case "mid_trial":
      return `${APP_URL}/dashboard`;
    case "trial_ending":
    case "trial_ended":
    case "card_expiring":
    case "payment_failed":
      return `${APP_URL}/dashboard/settings`;
    case "proof_ready":
    case "shipped":
      return `${APP_URL}/dashboard/orders/${opts?.orderId ?? "{orderId}"}`;
    case "new_signup":
      return null;
  }
}

type Opts = {
  daysLeft?: number;
  cardLabel?: string;
  expLabel?: string;
  productName?: string;
  orderId?: string;
  email?: string;
  tracking?: string | null;
  trackingUrl?: string | null;
};

function trackingLine(opts?: Opts): string {
  if (!opts?.tracking) return "";
  return opts.trackingUrl
    ? `Tracking number: <a href="${opts.trackingUrl}" style="color:#2587DE">${opts.tracking}</a>`
    : `Tracking number: <strong>${opts.tracking}</strong>`;
}

function fill(s: string, opts?: Opts): string {
  const daysLeft = Math.max(1, opts?.daysLeft ?? 3);
  const dl = `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  return s
    .split("{daysLeft}").join(dl)
    .split("{cardLabel}").join(opts?.cardLabel || "the card on file")
    .split("{expLabel}").join(opts?.expLabel || "soon")
    .split("{productName}").join(opts?.productName || "order")
    .split("{email}").join(opts?.email || "")
    .split("{tracking}").join(trackingLine(opts));
}

function shell(
  kind: EmailKind,
  heading: string,
  paragraphs: string[],
  button: string
): string {
  const footer = EMAILS[kind].group === "Orders" ? "TRAXXR · Print &amp; Ship" : "TRAXXR";
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:8px 4px;color:#0A2540">
    <h1 style="font-size:20px;margin:0 0 12px">${heading}</h1>
    ${paragraphs
      .map(
        (p) =>
          `<p style="font-size:15px;line-height:1.6;color:#425466;margin:0 0 14px">${p}</p>`
      )
      .join("")}
    ${button}
    <p style="font-size:12px;color:#8792A2;margin-top:24px">${footer}</p>
  </div>`;
}

function render(
  kind: EmailKind,
  tpl: EmailTemplate,
  opts?: Opts
): { subject: string; html: string } {
  const paragraphs = fill(tpl.body, opts)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const href = ctaHrefFor(kind, opts);
  const ctaText = fill(tpl.ctaText, opts);
  const button =
    EMAILS[kind].hasCta && href && ctaText
      ? `<p style="margin:20px 0 8px"><a href="${href}" style="display:inline-block;background:#2587DE;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${ctaText}</a></p>`
      : "";
  return {
    subject: fill(tpl.subject, opts),
    html: shell(kind, fill(tpl.heading, opts), paragraphs, button),
  };
}

// Synchronous default renderer (no DB). Used as the fallback and in tests.
export function lifecycleEmail(
  kind: EmailKind,
  opts?: Opts
): { subject: string; html: string } {
  return render(kind, EMAILS[kind].defaults, opts);
}

// DB-aware renderer: applies the admin's saved override if present, otherwise
// the default. Never throws on a read failure, it falls back to default.
export async function renderEmail(
  admin: Admin,
  kind: EmailKind,
  opts?: Opts
): Promise<{ subject: string; html: string }> {
  let tpl = EMAILS[kind].defaults;
  try {
    const { data } = await admin
      .from("email_templates")
      .select("subject, heading, body, cta_text")
      .eq("kind", kind)
      .maybeSingle();
    if (data) {
      tpl = {
        subject: data.subject as string,
        heading: data.heading as string,
        body: data.body as string,
        ctaText: (data.cta_text as string) ?? "",
      };
    }
  } catch {
    /* fall back to default */
  }
  return render(kind, tpl, opts);
}
