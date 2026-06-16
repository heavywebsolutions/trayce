import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { togglePromoCode, updatePromoCode } from "./actions";
import { PromoCreateForm } from "@/components/PromoCreateForm";

export const dynamic = "force-dynamic";

type Promo = {
  id: string;
  code: string;
  kind: string;
  domain: string;
  plan: string | null;
  comp_plans: string[] | null;
  percent_off: number | null;
  amount_off_cents: number | null;
  duration: string | null;
  duration_months: number | null;
  applies_to_plans: string[] | null;
  label: string | null;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const lbl = "mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400";
const inp =
  "min-h-[44px] w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900";
const PLANS = ["starter", "growth", "agency"];

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function describe(p: Promo): string {
  if (p.kind === "comp") {
    const tiers = p.comp_plans?.length ? p.comp_plans : p.plan ? [p.plan] : [];
    return `Free access · ${tiers.map(cap).join(", ") || "Growth"}`;
  }
  const val =
    p.kind === "percent"
      ? `${p.percent_off}% off`
      : `$${((p.amount_off_cents ?? 0) / 100).toFixed(2)} off`;
  const dom = p.domain === "print" ? "Print & Ship" : "Subscription";
  const dur =
    p.domain === "print"
      ? ""
      : p.duration === "forever"
        ? " · forever"
        : p.duration === "repeating"
          ? ` · ${p.duration_months} mo`
          : " · first payment";
  const scope =
    p.domain === "subscription" && p.applies_to_plans?.length
      ? ` · ${p.applies_to_plans.map(cap).join("/")}`
      : "";
  return `${val} · ${dom}${dur}${scope}`;
}

export default async function AdminPromosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const { ok, err } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.email)) notFound();

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  const promos = (rows ?? []) as Promo[];

  // Usage + attribution.
  const { data: reds } = await admin
    .from("promo_redemptions")
    .select("code, workspace_id, redeemed_at")
    .order("redeemed_at", { ascending: false });
  const { data: wsRows } = await admin.from("workspaces").select("id, owner_id");
  const ownerByWs = new Map(
    (wsRows ?? []).map((w) => [w.id as string, w.owner_id as string])
  );
  const { data: usersData } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? "unknown"])
  );
  const redsByCode = new Map<string, { email: string; at: string }[]>();
  for (const r of reds ?? []) {
    const email =
      emailById.get(ownerByWs.get(r.workspace_id as string) ?? "") ?? "unknown";
    const list = redsByCode.get(r.code as string) ?? [];
    list.push({ email, at: r.redeemed_at as string });
    redsByCode.set(r.code as string, list);
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const errMsg: Record<string, string> = {
    dupe: "That code already exists. Pick a different one.",
    code: "Enter a code.",
    plans: "Pick at least one tier for the comp code.",
    value: "Enter a discount value.",
    stripe: "Could not create the discount in Stripe. Check your Stripe keys.",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/admin"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← Platform overview
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Promo codes
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Comp codes grant free access. Percent/amount codes discount a
          subscription or a Print &amp; Ship order, a code only works on the
          product it&apos;s scoped to.
        </p>
      </div>

      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Saved.
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {errMsg[err] ?? "Something went wrong."}
        </div>
      )}

      <PromoCreateForm />

      {promos.length === 0 ? (
        <p className="text-sm text-ink-500">No codes yet.</p>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => {
            const used = redsByCode.get(p.code) ?? [];
            const expired =
              p.expires_at != null && new Date(p.expires_at) < new Date();
            const compPlans = p.comp_plans?.length
              ? p.comp_plans
              : p.plan
                ? [p.plan]
                : [];
            return (
              <div
                key={p.id}
                className="rounded-xl border border-ink-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold text-ink-900">
                      {p.code}
                    </p>
                    <p className="text-xs text-ink-500">
                      {p.label ? `${p.label} · ` : ""}
                      {describe(p)} · used {p.redeemed_count}
                      {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ""}
                      {p.expires_at
                        ? ` · ${expired ? "expired" : "expires"} ${fmt(p.expires_at)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.active && !expired
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {expired ? "Expired" : p.active ? "Active" : "Off"}
                    </span>
                    <form action={togglePromoCode}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={p.active ? "true" : "false"}
                      />
                      <button className="text-sm font-medium text-ink-500 hover:text-ink-800">
                        {p.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </div>
                </div>

                <details className="mt-2 border-t border-ink-100 pt-2">
                  <summary className="cursor-pointer text-xs font-medium text-accent">
                    Edit &amp; usage
                  </summary>

                  <form action={updatePromoCode} className="mt-3 space-y-3">
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className={lbl}>Label</label>
                      <input
                        name="label"
                        defaultValue={p.label ?? ""}
                        className={inp}
                      />
                    </div>

                    {p.kind === "comp" ? (
                      <>
                        <div>
                          <label className={lbl}>Grants free access to</label>
                          <div className="flex flex-wrap gap-3">
                            {PLANS.map((pl) => (
                              <label
                                key={pl}
                                className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-700"
                              >
                                <input
                                  type="checkbox"
                                  name="comp_plans"
                                  value={pl}
                                  defaultChecked={compPlans.includes(pl)}
                                  className="accent-[#2587DE]"
                                />
                                {cap(pl)}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className={lbl}>Max redemptions</label>
                            <input
                              name="max_redemptions"
                              type="number"
                              min={1}
                              defaultValue={p.max_redemptions ?? ""}
                              className={inp}
                            />
                          </div>
                          <div>
                            <label className={lbl}>Expires</label>
                            <input
                              name="expires_at"
                              type="date"
                              defaultValue={
                                p.expires_at ? p.expires_at.slice(0, 10) : ""
                              }
                              className={inp}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-ink-400">
                        Discount value, duration, expiry, and limit are fixed in
                        Stripe once created. To change those, disable this code
                        and create a new one. (Label is editable here.)
                      </p>
                    )}

                    <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                      Save changes
                    </button>
                  </form>

                  <div className="mt-3">
                    <p className={lbl}>
                      Used by {used.length}{" "}
                      {used.length === 1 ? "account" : "accounts"}
                    </p>
                    {used.length === 0 ? (
                      <p className="text-xs text-ink-400">No redemptions yet.</p>
                    ) : (
                      <ul className="divide-y divide-ink-100 text-sm">
                        {used.slice(0, 50).map((u, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between py-1.5"
                          >
                            <span className="text-ink-700">{u.email}</span>
                            <span className="text-xs text-ink-400">
                              {fmt(u.at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
