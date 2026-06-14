import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { CancelFlow } from "@/components/CancelFlow";

export const dynamic = "force-dynamic";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  agency: "Agency",
};

// The next cheaper paid plan to offer as a downgrade alternative to cancelling.
const LOWER_PLAN: Record<
  string,
  { key: string; label: string; price: string } | null
> = {
  starter: null,
  growth: { key: "starter", label: "Starter", price: "$9.95" },
  agency: { key: "growth", label: "Growth", price: "$19.95" },
};

// What a customer gives up when they drop from their paid plan back to Free.
const LOSE: Record<string, string[]> = {
  starter: [
    "Dynamic, editable codes",
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
    "Multiple workspaces and priority support",
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
    .select("id, plan, current_period_end, cancel_at_period_end")
    .eq("owner_id", user.id)
    .maybeSingle();

  const plan = (ws?.plan as string) ?? "free";
  // Only paid, not-already-canceling subscriptions can be cancelled here.
  if (plan === "free" || ws?.cancel_at_period_end) {
    redirect("/dashboard/settings");
  }

  const wsId = ws!.id as string;
  const [leads, scans, codes, bioPages] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId),
    supabase
      .from("scans")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId),
    supabase
      .from("codes")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId),
    supabase
      .from("bio_pages")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wsId),
  ]);

  const label = PLAN_LABELS[plan] ?? plan;
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
          Thinking about leaving {label}?
        </h1>
        <p className="mt-0.5 text-sm text-ink-500">
          {endsOn
            ? `If you cancel, you keep ${label} access until ${endsOn}, then move to the free plan.`
            : `If you cancel, your plan moves to free at the end of the current billing period.`}
        </p>
      </div>

      <Card className="p-6">
        <CancelFlow
          planLabel={label}
          usage={{
            leads: leads.count ?? 0,
            scans: scans.count ?? 0,
            codes: codes.count ?? 0,
            bioPages: bioPages.count ?? 0,
          }}
          loseList={LOSE[plan] ?? []}
          lowerPlan={LOWER_PLAN[plan] ?? null}
        />
      </Card>
    </div>
  );
}
