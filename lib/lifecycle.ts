// Lifecycle / conversion email templates, keyed to where a user is in the
// reverse trial. Copy is editable in the admin (stored in email_templates);
// these are the defaults used when no override exists. Plain inline-styled HTML
// so it renders in any client.

import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

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

export type EmailTemplate = {
  subject: string;
  heading: string;
  body: string; // paragraphs separated by a blank line
  ctaText: string;
};

// Where each email's button goes. NOT user-editable, so links can never break.
const CTA_HREF: Record<LifecycleKind, string> = {
  welcome: `${APP_URL}/dashboard/codes`,
  mid_trial: `${APP_URL}/dashboard`,
  trial_ending: `${APP_URL}/dashboard/settings`,
  trial_ended: `${APP_URL}/dashboard/settings`,
  card_expiring: `${APP_URL}/dashboard/settings`,
  payment_failed: `${APP_URL}/dashboard/settings`,
};

export const LIFECYCLE_LABELS: Record<LifecycleKind, string> = {
  welcome: "Welcome",
  mid_trial: "Mid-trial",
  trial_ending: "Trial ending",
  trial_ended: "Trial ended",
  card_expiring: "Card expiring",
  payment_failed: "Payment failed",
};

// Placeholders available per email (shown in the editor). Filled at send time.
export const LIFECYCLE_VARS: Record<LifecycleKind, string[]> = {
  welcome: [],
  mid_trial: [],
  trial_ending: ["{daysLeft}"],
  trial_ended: [],
  card_expiring: ["{cardLabel}", "{expLabel}"],
  payment_failed: ["{cardLabel}"],
};

// Editable defaults. {daysLeft}, {cardLabel}, {expLabel} are substituted at send.
export const LIFECYCLE_DEFAULTS: Record<LifecycleKind, EmailTemplate> = {
  welcome: {
    subject: "Welcome to TRAXXR",
    heading: "Welcome to TRAXXR",
    body: "You are on a 14-day Growth trial, no card needed. Editable codes, full analytics, and lead capture are all unlocked.\n\nPrint a code, point it anywhere, and watch the scans roll in.",
    ctaText: "Create your first code",
  },
  mid_trial: {
    subject: "You are halfway through your Growth trial",
    heading: "Halfway through your trial",
    body: "You still have full Growth access. Now is the moment to capture leads and see where your scans actually come from.\n\nEverything you build keeps working, and editing a printed code is one click.",
    ctaText: "Open your dashboard",
  },
  trial_ending: {
    subject: "{daysLeft} of Growth left",
    heading: "{daysLeft} of Growth left",
    body: "When your trial ends, editing printed codes, full analytics, and lead capture lock. Your codes keep redirecting, you just cannot change them anymore.\n\nKeep everything you have built for less than a coffee a week.",
    ctaText: "Upgrade and keep your features",
  },
  trial_ended: {
    subject: "Your trial ended, and your codes still work",
    heading: "Your trial ended",
    body: "Your printed codes still redirect, nothing broke. Editing, full analytics, and lead capture are paused.\n\nRe-unlock them anytime and pick up exactly where you left off.",
    ctaText: "Re-unlock TRAXXR",
  },
  card_expiring: {
    subject: "Your card on file is about to expire",
    heading: "Time to update your card",
    body: "{cardLabel} expires {expLabel}. Once it does, your next TRAXXR renewal will fail and your plan will pause.\n\nUpdate it now and nothing changes, your codes, analytics, and pages keep running without a hitch.",
    ctaText: "Update your card",
  },
  payment_failed: {
    subject: "We could not process your TRAXXR payment",
    heading: "Your payment did not go through",
    body: "We tried to charge {cardLabel} for your renewal and it was declined. Your plan is still active for now while we retry.\n\nUpdate your card to avoid losing access. It takes less than a minute, and we will pick the charge back up automatically.",
    ctaText: "Update your card",
  },
};

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

type Opts = { daysLeft?: number; cardLabel?: string; expLabel?: string };

function fill(s: string, opts?: Opts): string {
  const daysLeft = Math.max(1, opts?.daysLeft ?? 3);
  const dl = `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  return s
    .split("{daysLeft}").join(dl)
    .split("{cardLabel}").join(opts?.cardLabel || "the card on file")
    .split("{expLabel}").join(opts?.expLabel || "soon");
}

function render(
  kind: LifecycleKind,
  tpl: EmailTemplate,
  opts?: Opts
): { subject: string; html: string } {
  const paragraphs = fill(tpl.body, opts)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    subject: fill(tpl.subject, opts),
    html: shell(fill(tpl.heading, opts), paragraphs, fill(tpl.ctaText, opts), CTA_HREF[kind]),
  };
}

export function ctaHrefFor(kind: LifecycleKind): string {
  return CTA_HREF[kind];
}

// Synchronous default renderer (no DB). Used as the fallback and in tests.
export function lifecycleEmail(
  kind: LifecycleKind,
  opts?: Opts
): { subject: string; html: string } {
  return render(kind, LIFECYCLE_DEFAULTS[kind], opts);
}

// DB-aware renderer: applies the admin's saved override if present, otherwise
// the in-code default. Never throws on a read failure, it falls back to default.
export async function renderLifecycleEmail(
  admin: Admin,
  kind: LifecycleKind,
  opts?: Opts
): Promise<{ subject: string; html: string }> {
  let tpl = LIFECYCLE_DEFAULTS[kind];
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
        ctaText: data.cta_text as string,
      };
    }
  } catch {
    /* fall back to default */
  }
  return render(kind, tpl, opts);
}
