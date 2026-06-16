import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createPromoCode, togglePromoCode, updatePromoCode } from "./actions";

export const dynamic = "force-dynamic";

type Promo = {
  id: string;
  code: string;
  plan: string;
  label: string | null;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

const selectCls =
  "min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900";
const inputCls =
  "min-h-[44px] w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900";
const lblCls =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400";

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

  // Usage + attribution: who redeemed each code.
  const { data: reds } = await admin
    .from("promo_redemptions")
    .select("code, workspace_id, redeemed_at")
    .order("redeemed_at", { ascending: false });
  const { data: wsRows } = await admin
    .from("workspaces")
    .select("id, owner_id");
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
          Grant a free, comped plan to ambassadors and early adopters. For
          percentage or dollar discounts on paid plans, create promotion codes in
          Stripe, they apply automatically at checkout.
        </p>
      </div>

      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Saved.
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {err === "dupe"
            ? "That code already exists. Pick a different one."
            : "Enter a code."}
        </div>
      )}

      {/* Create */}
      <div className="mb-6 rounded-2xl border border-ink-200 bg-white p-6">
        <h2 className="mb-3 text-base font-semibold text-ink-900">
          Create a code
        </h2>
        <form action={createPromoCode} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={lblCls}>Code</label>
            <input
              name="code"
              required
              placeholder="AMBASSADOR25"
              autoCapitalize="characters"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lblCls}>Grants plan</label>
            <select name="plan" defaultValue="growth" className={selectCls}>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          <div>
            <label className={lblCls}>Label (optional)</label>
            <input
              name="label"
              placeholder="Founding ambassadors"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lblCls}>Max redemptions (blank = unlimited)</label>
            <input
              name="max_redemptions"
              type="number"
              min={1}
              placeholder="Unlimited"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lblCls}>Expires (optional)</label>
            <input name="expires_at" type="date" className={inputCls} />
          </div>
          <div className="flex items-end sm:col-span-2">
            <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-hover">
              Create code
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {promos.length === 0 ? (
        <p className="text-sm text-ink-500">No codes yet.</p>
      ) : (
        <div className="space-y-2">
          {promos.map((p) => {
            const used = redsByCode.get(p.code) ?? [];
            const expired =
              p.expires_at != null && new Date(p.expires_at) < new Date();
            return (
              <div
                key={p.id}
                className="rounded-xl border border-ink-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold text-ink-900">
                      {p.code}
                    </p>
                    <p className="text-xs text-ink-500">
                      {p.label ? `${p.label} · ` : ""}
                      <span className="capitalize">{p.plan}</span> · used{" "}
                      {p.redeemed_count}
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

                  {/* Edit */}
                  <form
                    action={updatePromoCode}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <div>
                      <label className={lblCls}>Grants plan</label>
                      <select
                        name="plan"
                        defaultValue={p.plan}
                        className={selectCls}
                      >
                        <option value="starter">Starter</option>
                        <option value="growth">Growth</option>
                        <option value="agency">Agency</option>
                      </select>
                    </div>
                    <div>
                      <label className={lblCls}>Label</label>
                      <input
                        name="label"
                        defaultValue={p.label ?? ""}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={lblCls}>
                        Max redemptions (blank = unlimited)
                      </label>
                      <input
                        name="max_redemptions"
                        type="number"
                        min={1}
                        defaultValue={p.max_redemptions ?? ""}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={lblCls}>Expires (blank = never)</label>
                      <input
                        name="expires_at"
                        type="date"
                        defaultValue={
                          p.expires_at ? p.expires_at.slice(0, 10) : ""
                        }
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                        Save changes
                      </button>
                    </div>
                  </form>

                  {/* Usage / attribution */}
                  <div className="mt-3">
                    <p className={lblCls}>
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
