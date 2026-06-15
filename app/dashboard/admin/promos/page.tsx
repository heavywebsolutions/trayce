import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createPromoCode, togglePromoCode } from "./actions";

export const dynamic = "force-dynamic";

type Promo = {
  id: string;
  code: string;
  plan: string;
  label: string | null;
  max_redemptions: number | null;
  redeemed_count: number;
  active: boolean;
  created_at: string;
};

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
          Grant a free, comped plan to ambassadors and early adopters. They never
          pay for the plan, only for Print &amp; Ship.
        </p>
      </div>

      {ok && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Promo code created.
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
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400">
              Code
            </label>
            <input
              name="code"
              required
              placeholder="AMBASSADOR25"
              autoCapitalize="characters"
              className="min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400">
              Grants plan
            </label>
            <select
              name="plan"
              defaultValue="growth"
              className="min-h-[40px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
            >
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400">
              Label (optional)
            </label>
            <input
              name="label"
              placeholder="Founding ambassadors"
              className="min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-400">
              Max redemptions (blank = unlimited)
            </label>
            <input
              name="max_redemptions"
              type="number"
              min={1}
              placeholder="Unlimited"
              className="min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
            />
          </div>
          <div className="sm:col-span-2">
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
          {promos.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-semibold text-ink-900">
                  {p.code}
                </p>
                <p className="text-xs text-ink-500">
                  {p.label ? `${p.label} · ` : ""}
                  <span className="capitalize">{p.plan}</span> · redeemed{" "}
                  {p.redeemed_count}
                  {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {p.active ? "Active" : "Off"}
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
          ))}
        </div>
      )}
    </div>
  );
}
