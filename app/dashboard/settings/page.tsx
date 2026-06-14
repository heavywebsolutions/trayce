import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, Input, Label } from "@/components/ui";
import { updateProfile, updatePassword } from "./actions";
import Link from "next/link";
import {
  startCheckout,
  openBillingPortal,
  resumeSubscription,
} from "@/app/dashboard/billing/actions";

export const dynamic = "force-dynamic";

const PLAN_META: Record<
  string,
  { label: string; price: string; blurb: string }
> = {
  free: {
    label: "Free",
    price: "$0",
    blurb: "Unlimited static codes, 1 bio page, and basic scan counts.",
  },
  starter: {
    label: "Starter",
    price: "$9.95",
    blurb: "Dynamic editable codes, full design, and analytics history.",
  },
  growth: {
    label: "Growth",
    price: "$19.95",
    blurb: "Lead capture, email sync, and Shopify product blocks.",
  },
  agency: {
    label: "Agency",
    price: "$59.95",
    blurb: "Bulk codes, multiple workspaces, and priority support.",
  },
};

const PLAN_ORDER = { free: 0, starter: 1, growth: 2, agency: 3 } as const;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; billing?: string }>;
}) {
  const { saved, billing } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name, plan, subscription_status, current_period_end, stripe_customer_id, cancel_at_period_end")
    .eq("owner_id", user.id)
    .maybeSingle();

  const plan = (ws?.plan as string) ?? "free";
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const isPaid = plan !== "free";
  const canceling = Boolean(ws?.cancel_at_period_end);
  const displayName = (user.user_metadata?.display_name as string) ?? "";
  const renews = ws?.current_period_end
    ? new Date(ws.current_period_end as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const [codes, bios, leads] = await Promise.all([
    supabase.from("codes").select("id", { count: "exact", head: true }),
    supabase.from("bio_pages").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const usage = [
    { label: "Codes", value: codes.count ?? 0 },
    { label: "Bio pages", value: bios.count ?? 0 },
    { label: "Leads", value: leads.count ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          Settings
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Manage your profile, your workspace, and your plan.
        </p>
      </div>

      {saved && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {saved === "password"
            ? "Your password has been updated."
            : "Your changes have been saved."}
        </div>
      )}

      {billing === "success" && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          You are all set. Your plan is active.
        </div>
      )}
      {billing === "cancelled" && (
        <div className="mb-4 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          Checkout cancelled. No charge was made.
        </div>
      )}
      {billing === "changed" && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your plan has been updated.
        </div>
      )}
      {billing === "cancel_scheduled" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your plan is set to cancel at the end of the current period. You can
          resume anytime before then.
        </div>
      )}
      {billing === "resumed" && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your subscription has been resumed.
        </div>
      )}
      {(billing === "unavailable" || billing === "nocustomer") && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {billing === "nocustomer"
            ? "No billing account yet. Upgrade to a paid plan first."
            : "Billing is not available right now. Please try again shortly."}
        </div>
      )}

      {/* Profile */}
      <Card className="mb-4 p-6">
        <h2 className="text-base font-semibold text-ink-900">Profile</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Your name and the workspace this account belongs to.
        </p>
        <form action={updateProfile} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email ?? ""}
              disabled
              className="bg-ink-50 text-ink-500"
            />
            <p className="mt-1 text-xs text-ink-400">
              Email changes are not available here yet. Contact us if you need to
              change it.
            </p>
          </div>
          <div>
            <Label htmlFor="display_name">Display name</Label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={displayName}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="workspace_name">Workspace name</Label>
            <Input
              id="workspace_name"
              name="workspace_name"
              defaultValue={ws?.name ?? ""}
              placeholder="My Workspace"
            />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      {/* Password */}
      <Card className="mb-4 p-6">
        <h2 className="text-base font-semibold text-ink-900">Password</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Set a new password for your account.
        </p>
        <form action={updatePassword} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              placeholder="At least 8 characters"
            />
          </div>
          <Button type="submit">Update password</Button>
        </form>
      </Card>

      {/* Plan and billing */}
      <Card className="mb-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink-900">
            Plan and billing
          </h2>
          <Badge tone="indigo">{meta.label}</Badge>
        </div>
        <p className="mt-2 text-sm text-ink-600">
          <span className="font-semibold">{meta.label} plan</span>
          {meta.price !== "$0" && (
            <span className="text-ink-400"> · {meta.price}/mo</span>
          )}
        </p>
        <p className="mt-1 text-sm text-ink-500">{meta.blurb}</p>
        {isPaid && renews && (
          <p className="mt-1 text-sm text-ink-500">
            {canceling
              ? `Your plan cancels on ${renews}. You keep access until then.`
              : `Renews on ${renews}.`}
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          {usage.map((u) => (
            <div key={u.label} className="rounded-xl border border-ink-200 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-ink-400">
                {u.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">
                {u.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {!isPaid ? (
            <div className="flex flex-wrap items-center gap-2">
              {(["starter", "growth", "agency"] as const).map((p) => (
                <form key={p} action={startCheckout}>
                  <input type="hidden" name="plan" value={p} />
                  <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50">
                    Upgrade to {PLAN_META[p].label} · {PLAN_META[p].price}/mo
                  </button>
                </form>
              ))}
            </div>
          ) : canceling ? (
            <form action={resumeSubscription}>
              <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover">
                Resume subscription
              </button>
            </form>
          ) : (
            <>
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
                  Switch plan
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {(["starter", "growth", "agency"] as const)
                    .filter((p) => p !== plan)
                    .map((p) => {
                      const isUp =
                        PLAN_ORDER[p] >
                        PLAN_ORDER[plan as keyof typeof PLAN_ORDER];
                      return (
                        <Link
                          key={p}
                          href={`/dashboard/settings/change?plan=${p}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:border-ink-300 hover:bg-ink-50"
                        >
                          {isUp ? "Upgrade" : "Downgrade"} to {PLAN_META[p].label}{" "}
                          · {PLAN_META[p].price}/mo
                        </Link>
                      );
                    })}
                </div>
              </div>
              <Link
                href="/dashboard/settings/cancel"
                className="text-sm font-medium text-ink-500 underline-offset-2 hover:text-red-600 hover:underline"
              >
                Cancel subscription
              </Link>
            </>
          )}

          {isPaid && (
            <form action={openBillingPortal}>
              <button className="text-xs font-medium text-accent hover:underline">
                Update card or view invoices ↗
              </button>
            </form>
          )}
        </div>
        <p className="mt-3 text-xs text-ink-400">
          Plan changes are prorated automatically. Card details and invoices are
          handled securely by Stripe.
        </p>
      </Card>

      {/* Session */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink-900">Session</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Sign out of Traxxr on this device.
        </p>
        <form action="/api/auth/signout" method="post" className="mt-4">
          <Button variant="secondary">Sign out</Button>
        </form>
      </Card>
    </div>
  );
}
