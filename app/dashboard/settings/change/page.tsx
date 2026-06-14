import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Button } from "@/components/ui";
import { changePlan } from "@/app/dashboard/billing/actions";

export const dynamic = "force-dynamic";

const PLANS = {
  starter: {
    label: "Starter",
    price: "$9.95",
    order: 1,
    features: [
      "Dynamic, editable codes",
      "Full design with logos and frames",
      "Scan history and analytics",
      "Unlimited bio pages",
    ],
  },
  growth: {
    label: "Growth",
    price: "$19.95",
    order: 2,
    features: [
      "Everything in Starter",
      "Lead capture forms",
      "Email sync (Klaviyo and more)",
      "Shopify product blocks",
      "Location and device data",
    ],
  },
  agency: {
    label: "Agency",
    price: "$59.95",
    order: 3,
    features: [
      "Everything in Growth",
      "Bulk code generation",
      "Multiple workspaces",
      "Priority support",
    ],
  },
} as const;

type PlanKey = keyof typeof PLANS;

function isPlanKey(v: string): v is PlanKey {
  return v === "starter" || v === "growth" || v === "agency";
}

export default async function ChangePlanPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: target } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan")
    .eq("owner_id", user.id)
    .maybeSingle();
  const current = (ws?.plan as string) ?? "free";

  // This screen is only for switching between paid plans. Anything else (no
  // target, same plan, or upgrading from free) goes through normal checkout.
  if (
    !target ||
    !isPlanKey(target) ||
    !isPlanKey(current) ||
    target === current
  ) {
    redirect("/dashboard/settings");
  }

  const from = PLANS[current];
  const to = PLANS[target];
  const isUpgrade = from.order < to.order;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/settings"
        className="mb-4 inline-block text-sm text-ink-500 hover:text-ink-700"
      >
        ← Back to settings
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {isUpgrade ? "Upgrade" : "Downgrade"} to {to.label}
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          Review the change before you confirm. Nothing is charged or changed
          until you do.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
          {/* Current */}
          <div className="rounded-xl border border-ink-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
              Current
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-900">
              {from.label}
            </p>
            <p className="text-sm text-ink-500">{from.price}/mo</p>
            <ul className="mt-3 space-y-1.5">
              {from.features.map((f) => (
                <li key={f} className="text-sm text-ink-600">
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow */}
          <div className="hidden items-center justify-center text-2xl text-ink-300 sm:flex">
            →
          </div>

          {/* New */}
          <div className="rounded-xl border-2 border-accent bg-accent-soft p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              New
            </p>
            <p className="mt-1 text-lg font-semibold text-ink-900">
              {to.label}
            </p>
            <p className="text-sm text-ink-500">{to.price}/mo</p>
            <ul className="mt-3 space-y-1.5">
              {to.features.map((f) => (
                <li key={f} className="text-sm text-ink-700">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
          {isUpgrade ? (
            <>
              You will be charged the prorated difference for the rest of this
              billing period, and {to.price}/mo from your next renewal. The new
              features are available immediately.
            </>
          ) : (
            <>
              Your plan changes to {to.label} right away and you will be credited
              the prorated difference toward future invoices. Anything above the{" "}
              {to.label} limits, such as extra bio pages, will be paused until
              you are back within the plan.
            </>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <form action={changePlan}>
            <input type="hidden" name="plan" value={target} />
            <Button type="submit">
              Confirm {isUpgrade ? "upgrade" : "downgrade"} to {to.label}
            </Button>
          </form>
          <Link
            href="/dashboard/settings"
            className="text-sm font-medium text-ink-500 hover:text-ink-700"
          >
            Cancel
          </Link>
        </div>
      </Card>
    </div>
  );
}
