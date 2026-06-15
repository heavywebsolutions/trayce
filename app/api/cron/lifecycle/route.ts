import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { lifecycleEmail, type LifecycleKind } from "@/lib/lifecycle";
import { emailFlags, flowOn } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DAY = 86_400_000;

// Daily lifecycle email run. Triggered by Vercel Cron (see vercel.json), which
// sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  const admin = createAdminClient();
  const flags = await emailFlags(admin);

  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? null])
  );

  // Only free (non-comped) workspaces are in the trial-to-paid funnel.
  const { data: rows } = await admin
    .from("workspaces")
    .select("id, owner_id, trial_ends_at, created_at")
    .eq("plan", "free")
    .eq("comp", false);
  const workspaces = rows ?? [];

  const now = Date.now();
  let sent = 0;

  for (const w of workspaces) {
    const email = emailById.get(w.owner_id as string);
    if (!email || !w.trial_ends_at) continue;

    const ends = new Date(w.trial_ends_at as string).getTime();
    const created = w.created_at
      ? new Date(w.created_at as string).getTime()
      : now;
    const daysLeft = Math.ceil((ends - now) / DAY);
    const daysOld = Math.floor((now - created) / DAY);

    let kind: LifecycleKind | null = null;
    if (ends <= now) kind = "trial_ended";
    else if (daysLeft <= 3) kind = "trial_ending";
    else if (daysOld >= 7) kind = "mid_trial";
    if (!kind) continue;
    if (!flowOn(flags, kind)) continue;

    const { data: existing } = await admin
      .from("email_log")
      .select("id")
      .eq("workspace_id", w.id as string)
      .eq("kind", kind)
      .maybeSingle();
    if (existing) continue;

    const tmpl = lifecycleEmail(kind, { daysLeft });
    const ok = await sendEmail({
      to: email,
      subject: tmpl.subject,
      html: tmpl.html,
    });
    if (ok) {
      await admin
        .from("email_log")
        .insert({ workspace_id: w.id, email, kind });
      sent++;
    }
  }

  // Card-expiry advance warnings. We know each subscriber's card expiry, so we
  // email before the renewal that would otherwise fail. Dedup per card period
  // via email_log (kind "card_expiring:<YYYY-MM>"), so a replaced card with a
  // new expiry gets its own warning.
  let cardWarnings = 0;
  if (flowOn(flags, "card_expiring")) {
    const { data: payRows } = await admin
      .from("workspaces")
      .select(
        "id, owner_id, card_brand, card_last4, card_exp_month, card_exp_year"
      )
      .not("stripe_subscription_id", "is", null)
      .not("card_exp_year", "is", null);

    for (const w of payRows ?? []) {
      const email = emailById.get(w.owner_id as string);
      const expM = w.card_exp_month as number | null;
      const expY = w.card_exp_year as number | null;
      if (!email || !expM || !expY) continue;

      // A card is valid through the last day of its expiry month.
      const expEnd = new Date(expY, expM, 0, 23, 59, 59).getTime();
      const daysToExp = Math.ceil((expEnd - now) / DAY);
      // Warn inside a ~6-week window, and once more just after it lapses.
      if (daysToExp > 45 || daysToExp < -3) continue;

      const period = `${expY}-${String(expM).padStart(2, "0")}`;
      const logKind = `card_expiring:${period}`;
      const { data: already } = await admin
        .from("email_log")
        .select("id")
        .eq("workspace_id", w.id as string)
        .eq("kind", logKind)
        .maybeSingle();
      if (already) continue;

      const tmpl = lifecycleEmail("card_expiring", {
        cardLabel:
          (w.card_brand
            ? String(w.card_brand)[0].toUpperCase() +
              String(w.card_brand).slice(1)
            : "Your card") +
          (w.card_last4 ? ` ending ${w.card_last4}` : ""),
        expLabel: `${String(expM).padStart(2, "0")}/${expY}`,
      });
      const ok = await sendEmail({
        to: email,
        subject: tmpl.subject,
        html: tmpl.html,
      });
      if (ok) {
        await admin
          .from("email_log")
          .insert({ workspace_id: w.id, email, kind: logKind });
        cardWarnings++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processed: workspaces.length,
    sent,
    cardWarnings,
  });
}
