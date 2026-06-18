import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { formatUsd } from "@/lib/print/catalog";
import { emailFlags } from "@/lib/settings";
import { setEmailFlag } from "./actions";

export const dynamic = "force-dynamic";

function FlagRow({
  label,
  flagKey,
  on,
  count,
  mutedByMaster,
  editHref,
}: {
  label: string;
  flagKey: string;
  on: boolean;
  count?: number;
  mutedByMaster?: boolean;
  editHref?: string;
}) {
  // When the master switch is off, every flow is effectively off no matter what
  // its own flag says. Show that clearly and disable the per-flow toggle so the
  // UI never claims "On" while nothing is actually sending.
  return (
    <li
      className={`flex items-center justify-between py-2.5 ${
        mutedByMaster ? "opacity-50" : ""
      }`}
    >
      <span className="text-ink-700">
        {label}
        {typeof count === "number" && (
          <span className="ml-2 text-xs text-ink-400">{count} sent (30d)</span>
        )}
        {mutedByMaster && (
          <span className="ml-2 text-xs italic text-ink-400">
            paused by master
          </span>
        )}
      </span>
      <div className="flex items-center gap-3">
        {editHref && (
          <Link
            href={editHref}
            className="text-xs font-medium text-accent hover:underline"
          >
            Edit copy
          </Link>
        )}
        {mutedByMaster ? (
          <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-500">
            Off
          </span>
        ) : (
          <form action={setEmailFlag}>
            <input type="hidden" name="key" value={flagKey} />
            <input type="hidden" name="enabled" value={on ? "false" : "true"} />
            <button
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                on ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
              }`}
            >
              {on ? "On" : "Off"}
            </button>
          </form>
        )}
      </div>
    </li>
  );
}

function EditEmailRow({ label, href }: { label: string; href: string }) {
  return (
    <li className="flex items-center justify-between py-2.5">
      <span className="text-ink-700">{label}</span>
      <Link href={href} className="text-xs font-medium text-accent hover:underline">
        Edit copy
      </Link>
    </li>
  );
}

const PLAN_PRICE_CENTS: Record<string, number> = {
  starter: 995,
  growth: 1995,
  agency: 5995,
};
const DAY = 86_400_000;

export default async function AdminMetricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) notFound();

  const admin = createAdminClient();

  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const users = usersData?.users ?? [];
  const totalUsers = users.length;

  // Admin-owned workspaces are excluded from revenue + subscriber metrics so
  // your own testing never inflates MRR, paid count, or comp count.
  const adminIds = new Set(
    users.filter((u) => isAdmin(u.email)).map((u) => u.id)
  );

  const { data: wsRows } = await admin
    .from("workspaces")
    .select("plan, comp, owner_id");
  const workspaces = wsRows ?? [];
  const planCounts: Record<string, number> = {
    free: 0,
    starter: 0,
    growth: 0,
    agency: 0,
  };
  let mrr = 0;
  let compCount = 0;
  for (const w of workspaces) {
    if (adminIds.has(w.owner_id as string)) continue; // skip your own test accounts
    const p = (w.plan as string) ?? "free";
    planCounts[p] = (planCounts[p] ?? 0) + 1;
    if (w.comp) compCount++;
    else if (PLAN_PRICE_CENTS[p]) mrr += PLAN_PRICE_CENTS[p];
  }
  const paidCount = planCounts.starter + planCounts.growth + planCounts.agency;

  const [codes, bios, scans, leads] = await Promise.all([
    admin.from("codes").select("id", { count: "exact", head: true }),
    admin.from("bio_pages").select("id", { count: "exact", head: true }),
    admin.from("scans").select("id", { count: "exact", head: true }),
    admin.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const { data: orderRows } = await admin
    .from("print_orders")
    .select("status, total_cents");
  const orders = orderRows ?? [];
  let printRevenue = 0;
  let pendingFulfillment = 0;
  for (const o of orders) {
    const st = o.status as string;
    if (["proof_ready", "approved", "printing", "shipped"].includes(st)) {
      printRevenue += (o.total_cents as number) ?? 0;
    }
    if (["proof_ready", "approved", "printing"].includes(st)) {
      pendingFulfillment++;
    }
  }

  const now = Date.now();
  const buckets = Array.from({ length: 14 }, () => 0);
  let last7 = 0;
  for (const u of users) {
    const ageDays = Math.floor(
      (now - new Date(u.created_at).getTime()) / DAY
    );
    if (ageDays >= 0 && ageDays < 14) buckets[13 - ageDays]++;
    if (ageDays >= 0 && ageDays < 7) last7++;
  }
  const maxBucket = Math.max(1, ...buckets);

  const recent = [...users]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 12);

  const since30 = new Date(now - 30 * DAY).toISOString();
  const { data: emailRows } = await admin
    .from("email_log")
    .select("kind, sent_at")
    .gte("sent_at", since30);
  const emailCounts: Record<string, number> = {};
  for (const e of emailRows ?? []) {
    const k = e.kind as string;
    emailCounts[k] = (emailCounts[k] ?? 0) + 1;
    // Card-expiry warnings are logged per period (card_expiring:YYYY-MM); roll
    // them up under the base kind for the toggle's sent count.
    if (k.startsWith("card_expiring:")) {
      emailCounts.card_expiring = (emailCounts.card_expiring ?? 0) + 1;
    }
  }
  const flags = await emailFlags(admin);
  const masterOff = flags["email_master"] === false;

  const kpis = [
    { label: "Total accounts", value: totalUsers.toLocaleString() },
    { label: "New (7 days)", value: last7.toLocaleString() },
    { label: "Paid subscribers", value: paidCount.toLocaleString() },
    { label: "MRR", value: formatUsd(mrr) },
    { label: "Comped accounts", value: compCount.toLocaleString() },
    { label: "Print revenue", value: formatUsd(printRevenue) },
    { label: "Orders to fulfill", value: pendingFulfillment.toLocaleString() },
    { label: "Total scans", value: (scans.count ?? 0).toLocaleString() },
    { label: "Total leads", value: (leads.count ?? 0).toLocaleString() },
    { label: "Codes created", value: (codes.count ?? 0).toLocaleString() },
    { label: "Bio pages", value: (bios.count ?? 0).toLocaleString() },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            Platform overview
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">
            Super admin. Everything across all accounts.
          </p>
        </div>
        <div className="flex gap-2 text-sm font-medium">
          <Link
            href="/dashboard/admin/promos"
            className="rounded-xl border border-ink-200 px-3 py-2 text-ink-700 hover:bg-ink-50"
          >
            Promo codes
          </Link>
          <Link
            href="/dashboard/admin/orders"
            className="rounded-xl border border-ink-200 px-3 py-2 text-ink-700 hover:bg-ink-50"
          >
            Fulfillment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-ink-200 bg-white p-4"
          >
            <p className="text-xs uppercase tracking-wide text-ink-400">
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink-900">
            Signups, last 14 days
          </p>
          <svg viewBox="0 0 300 70" className="h-20 w-full">
            {buckets.map((n, i) => {
              const h = (n / maxBucket) * 58;
              return (
                <rect
                  key={i}
                  x={i * 21 + 3}
                  y={64 - h}
                  width={15}
                  height={h}
                  rx={2}
                  fill="#2587DE"
                />
              );
            })}
          </svg>
          <p className="mt-2 text-xs text-ink-400">
            {totalUsers} total accounts, {last7} in the last week.
          </p>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink-900">
            Plan breakdown
          </p>
          <ul className="space-y-2 text-sm">
            {(["free", "starter", "growth", "agency"] as const).map((p) => (
              <li key={p} className="flex justify-between">
                <span className="capitalize text-ink-600">{p}</span>
                <span className="font-medium tabular-nums text-ink-900">
                  {planCounts[p] ?? 0}
                </span>
              </li>
            ))}
            <li className="flex justify-between border-t border-ink-100 pt-2">
              <span className="text-ink-600">Comped</span>
              <span className="font-medium tabular-nums text-ink-900">
                {compCount}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-ink-900">Recent signups</p>
        <div className="divide-y divide-ink-100">
          {recent.length === 0 ? (
            <p className="text-sm text-ink-500">No accounts yet.</p>
          ) : (
            recent.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-ink-800">{u.email}</span>
                <span className="text-xs text-ink-400">
                  {new Date(u.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-ink-900">
          Email automations
        </p>
        <p className="mb-3 text-xs text-ink-400">
          Toggle flows on or off, or click &quot;Edit copy&quot; to change what
          each email says. The master switch turns off all lifecycle emails at
          once.
        </p>
        <ul className="divide-y divide-ink-100 text-sm">
          <FlagRow
            label="Master switch (all emails)"
            flagKey="email_master"
            on={flags["email_master"] !== false}
          />
          <FlagRow
            label="Welcome"
            flagKey="email_welcome"
            on={flags["email_welcome"] !== false}
            count={emailCounts.welcome ?? 0}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/welcome"
          />
          <FlagRow
            label="Mid-trial"
            flagKey="email_mid_trial"
            on={flags["email_mid_trial"] !== false}
            count={emailCounts.mid_trial ?? 0}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/mid_trial"
          />
          <FlagRow
            label="Trial ending"
            flagKey="email_trial_ending"
            on={flags["email_trial_ending"] !== false}
            count={emailCounts.trial_ending ?? 0}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/trial_ending"
          />
          <FlagRow
            label="Trial ended"
            flagKey="email_trial_ended"
            on={flags["email_trial_ended"] !== false}
            count={emailCounts.trial_ended ?? 0}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/trial_ended"
          />
          <FlagRow
            label="Card expiring"
            flagKey="email_card_expiring"
            on={flags["email_card_expiring"] !== false}
            count={emailCounts.card_expiring ?? 0}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/card_expiring"
          />
          <FlagRow
            label="Payment failed"
            flagKey="email_payment_failed"
            on={flags["email_payment_failed"] !== false}
            mutedByMaster={masterOff}
            editHref="/dashboard/admin/emails/payment_failed"
          />
        </ul>

        <div className="mt-5 border-t border-ink-100 pt-4">
          <p className="mb-1 text-sm font-semibold text-ink-900">
            Order &amp; system emails
          </p>
          <p className="mb-2 text-xs text-ink-400">
            These always send (order receipts and your signup alert). Edit the
            wording here.
          </p>
          <ul className="divide-y divide-ink-100 text-sm">
            <EditEmailRow label="Proof ready" href="/dashboard/admin/emails/proof_ready" />
            <EditEmailRow label="Order shipped" href="/dashboard/admin/emails/shipped" />
            <EditEmailRow
              label="New signup alert (to you)"
              href="/dashboard/admin/emails/new_signup"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}
