import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { lifecycleEmail, type LifecycleKind } from "@/lib/lifecycle";

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

  return NextResponse.json({ ok: true, processed: workspaces.length, sent });
}
