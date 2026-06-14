import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, Button } from "@/components/ui";
import { cancelSubscription } from "@/app/dashboard/billing/actions";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  agency: "Agency",
};

// What a customer gives up when they drop from their paid plan back to Free.
const LOSE: Record<string, string[]> = {
  starter: [
    "Dynamic, editable codes (printed codes become locked)",
    "Full design with logos and frames",
    "Scan history and analytics",
    "All but one bio page",
  ],
  growth: [
    "Lead capture forms",
    "Email sync to Klaviyo and others",
    "Shopify product blocks",
    "Location and device analytics",
    "Dynamic codes and scan history",
    "All but one bio page",
  ],
  agency: [
    "Bulk code generation",
    "Multiple workspaces",
    "Priority support",
    "Lead capture, email sync, and Shopify blocks",
    "Dynamic codes and scan history",
    "All but one bio page",
  ],
};

export default async function CancelPlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("plan, current_period_end, cancel_at_period_end")
    .eq("owner_id", user.id)
    .maybeSingle();

  const plan = (ws?.plan as string) ?? "free";
  // Only paid, not-already-canceling subscriptions can be cancelled here.
  if (plan === "free" || ws?.cancel_at_period_end) {
    redirect("/dashboard/settings");
  }

  const label = PLAN_LABELS[plan] ?? plan;
  const lose = LOSE[plan] ?? [];
  const endsOn = ws?.current_period_end
    ? new Date(ws.current_period_end as string).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

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
          Cancel your {label} plan?
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          {endsOn
            ? `You will keep ${label} access until ${endsOn}. After that your account moves to the free plan.`
            : `Your plan will move to free at the end of the current billing period.`}
        </p>
      </div>

      <Card className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            What you will lose when it ends
          </p>
          <ul className="mt-2 space-y-1.5">
            {lose.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-amber-900">
                <span aria-hidden>•</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 rounded-xl border border-ink-200 p-4">
          <p className="text-sm font-semibold text-ink-800">
            What you keep on Free
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-600">
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>Unlimited static codes</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>One bio page</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>Basic scan counts</span>
            </li>
          </ul>
        </div>

        <p className="mt-4 text-xs text-ink-400">
          Nothing is deleted. Anything over the free limits, like extra bio
          pages and dynamic codes, is paused and comes right back if you
          resubscribe.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/dashboard/settings">
            <Button>Keep my plan</Button>
          </Link>
          <form action={cancelSubscription}>
            <button className="text-sm font-medium text-red-600 underline-offset-2 hover:underline">
              Yes, cancel my subscription
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
