import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Badge, Button, Input, Label } from "@/components/ui";
import { updateProfile, updatePassword } from "./actions";
import Link from "next/link";
import {
  startCheckout,
  openBillingPortal,
  resumeSubscription,
  resumeNow,
  redeemPromo,
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

const UPGRADE_MSG: Record<string, string> = {
  dynamic:
    "Editable, trackable codes are a paid feature. Upgrade to Starter to change where a code points after it is printed.",
  leads: "Lead capture is on Growth. Upgrade to collect and own your contacts.",
  shopify:
    "Shopify product blocks are on Growth. Upgrade to add shoppable blocks.",
  email:
    "Email sync is on Growth. Upgrade to auto-send new contacts to your email tool.",
  pages:
    "More bio pages are a paid feature. Upgrade to Starter for unlimited pages.",
  analytics:
    "Full analytics (location, device, history, date ranges) are on the paid plans. Upgrade to Starter to unlock them.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    billing?: string;
    promo?: string;
    upgrade?: string;
  }>;
}) {
  const { saved, billing, promo, upgrade } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, name, plan, subscription_status, current_period_end, stripe_customer_id, cancel_at_period_end, paused_until, comp, card_brand, card_last4, card_exp_month, card_exp_year, payment_failed_at")
    .eq("owner_id", user.id)
    .maybeSingle();

  const plan = (ws?.plan as string) ?? "free";
  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const isPaid = plan !== "free";
  const comp = Boolean(ws?.comp);
  const canceling = Boolean(ws?.cancel_at_period_end);
  const paused = ws?.subscription_status === "paused";
  const pausedUntil = ws?.paused_until
    ? new Date(ws.paused_until as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
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

  // Payment method on file (captured by the Stripe webhook).
  const hasCard = Boolean(ws?.card_last4);
  const cardBrand = ws?.card_brand
    ? String(ws.card_brand)[0].toUpperCase() + String(ws.card_brand).slice(1)
    : "Card";
  const cardExpLabel =
    ws?.card_exp_month && ws?.card_exp_year
      ? `${String(ws.card_exp_month).padStart(2, "0")}/${ws.card_exp_year}`
      : null;
  const pastDue =
    ws?.subscription_status === "past_due" || Boolean(ws?.payment_failed_at);
  let cardExpiringSoon = false;
  if (ws?.card_exp_month && ws?.card_exp_year) {
    const expEnd = new Date(
      ws.card_exp_year as number,
      ws.card_exp_month as number,
      0,
      23,
      59,
      59
    ).getTime();
    const days = Math.ceil((expEnd - Date.now()) / 86_400_000);
    cardExpiringSoon = days <= 45 && days >= -3;
  }

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

      {promo === "ok" && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Promo applied. Your plan has been upgraded.
        </div>
      )}
      {promo === "err" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That promo code could not be applied. Check the code and try again.
        </div>
      )}
      {upgrade && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          {UPGRADE_MSG[upgrade] ??
            "That feature is on a paid plan. Upgrade below to unlock it."}
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
      {billing === "paused" && (
        <div className="mb-4 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm text-ink-600">
          Your subscription is paused. Billing is on hold and resumes
          automatically, or you can resume any time.
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
          {comp ? (
            <span className="text-ink-400"> · complimentary</span>
          ) : (
            meta.price !== "$0" && (
              <span className="text-ink-400"> · {meta.price}/mo</span>
            )
          )}
        </p>
        <p className="mt-1 text-sm text-ink-500">{meta.blurb}</p>
        {comp && (
          <p className="mt-1 text-sm text-ink-500">
            This plan is complimentary. You will never be billed for it.
          </p>
        )}
        {!comp && isPaid && (paused ? pausedUntil : renews) && (
          <p className="mt-1 text-sm text-ink-500">
            {paused
              ? `Paused until ${pausedUntil}. You will not be billed until then.`
              : canceling
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

        {comp ? (
          <p className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
            Your {meta.label} plan is complimentary, with no billing. You still
            pay only for Print &amp; Ship orders.
          </p>
        ) : (
          <>
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
          ) : paused ? (
            <form action={resumeNow}>
              <button className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover">
                Resume now
              </button>
            </form>
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
          </>
        )}

        {!comp && (
          <form
            action={redeemPromo}
            className="mt-4 border-t border-ink-100 pt-4"
          >
            <p className="mb-2 text-sm font-medium text-ink-700">
              Have a promo code?
            </p>
            <div className="flex gap-2">
              <input
                name="promo"
                placeholder="Enter code"
                className="min-h-[40px] flex-1 rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
              />
              <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                Apply
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Payment method */}
      {!comp && isPaid && (
        <Card className="mb-4 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink-900">
              Payment method
            </h2>
            {pastDue ? (
              <Badge tone="red">Action needed</Badge>
            ) : cardExpiringSoon ? (
              <Badge tone="amber">Expiring soon</Badge>
            ) : hasCard ? (
              <Badge tone="green">Active</Badge>
            ) : null}
          </div>

          {hasCard ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-200 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-ink-100 text-xs font-bold text-ink-600">
                  {cardBrand.slice(0, 4).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    {cardBrand} ending {ws?.card_last4}
                  </p>
                  {cardExpLabel && (
                    <p className="text-xs text-ink-400">
                      Expires {cardExpLabel}
                    </p>
                  )}
                </div>
              </div>
              <form action={openBillingPortal}>
                <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                  Update card
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                No card on file yet. Add one to keep your plan active.
              </p>
              <form action={openBillingPortal}>
                <button className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                  Add card
                </button>
              </form>
            </div>
          )}

          {pastDue && (
            <p className="mt-3 text-sm text-red-700">
              Your last payment did not go through. Update your card to avoid
              losing access.
            </p>
          )}
          {!pastDue && cardExpiringSoon && (
            <p className="mt-3 text-sm text-ink-600">
              This card expires soon. Update it so your next renewal goes through
              without a hitch.
            </p>
          )}
          <p className="mt-3 text-xs text-ink-400">
            Card details are stored securely by Stripe. Updating opens Stripe's
            secure portal.
          </p>
        </Card>
      )}

      {/* Session */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-ink-900">Session</h2>
        <p className="mt-0.5 text-sm text-ink-500">
          Sign out of TRAXXR on this device.
        </p>
        <form action="/api/auth/signout" method="post" className="mt-4">
          <Button variant="secondary">Sign out</Button>
        </form>
      </Card>
    </div>
  );
}
