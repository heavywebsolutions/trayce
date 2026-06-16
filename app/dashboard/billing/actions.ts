"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, PLAN_PRICES, stripeConfigured } from "@/lib/stripe";
import { applyPromo, resolveDiscount } from "@/lib/promo";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

// Resolve the caller's workspace + active Stripe subscription id. Falls back to
// looking the subscription up by customer if we have not stored its id yet.
async function getWorkspaceSub() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, plan, stripe_customer_id, stripe_subscription_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ws) redirect("/dashboard/settings");

  let subscriptionId = ws.stripe_subscription_id as string | null;
  if (!subscriptionId && ws.stripe_customer_id) {
    const list = await stripe.subscriptions.list({
      customer: ws.stripe_customer_id,
      status: "active",
      limit: 1,
    });
    subscriptionId = list.data[0]?.id ?? null;
  }
  return {
    workspaceId: ws.id as string,
    currentPlan: (ws.plan as string) ?? "free",
    subscriptionId,
  };
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  agency: 3,
};

// Start a Stripe Checkout session for the chosen plan and send the user to it.
export async function startCheckout(formData: FormData) {
  const plan = String(formData.get("plan") || "");
  const priceId = PLAN_PRICES[plan];

  if (!stripeConfigured() || !priceId) {
    redirect("/dashboard/settings?billing=unavailable");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, stripe_customer_id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ws) redirect("/dashboard/settings");

  // Optional discount code, validated as a subscription-domain code for this
  // plan. We attach the specific promotion code ourselves (allow_promotion_codes
  // is off) so a print or comp code can never be used here.
  const promo = String(formData.get("promo") || "").trim();
  let discounts: { promotion_code: string }[] | undefined;
  if (promo) {
    const res = await resolveDiscount(createAdminClient(), promo, "subscription", plan);
    if (!res.ok) {
      redirect(
        `/dashboard/settings?billing=promo_invalid&plan=${plan}`
      );
    }
    discounts = [{ promotion_code: res.promotionCodeId as string }];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Reuse an existing customer if we have one, otherwise let Stripe make one
    // and prefill their email.
    customer: ws.stripe_customer_id || undefined,
    customer_email: ws.stripe_customer_id ? undefined : user.email ?? undefined,
    client_reference_id: ws.id,
    metadata: { workspace_id: ws.id, plan },
    subscription_data: { metadata: { workspace_id: ws.id } },
    ...(discounts ? { discounts } : {}),
    success_url: `${APP_URL}/dashboard/settings?billing=success`,
    cancel_url: `${APP_URL}/dashboard/settings?billing=cancelled`,
  });

  if (session.url) redirect(session.url);
  redirect("/dashboard/settings");
}

// Open the Stripe customer billing portal so the user can update their card,
// download invoices, change plan, or cancel.
export async function openBillingPortal() {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("stripe_customer_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!ws?.stripe_customer_id) {
    redirect("/dashboard/settings?billing=nocustomer");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: ws.stripe_customer_id,
    return_url: `${APP_URL}/dashboard/settings`,
  });

  redirect(portal.url);
}

// Switch an existing subscriber to a different plan, prorating the difference.
export async function changePlan(formData: FormData) {
  const plan = String(formData.get("plan") || "");
  const priceId = PLAN_PRICES[plan];
  if (!stripeConfigured() || !priceId) {
    redirect("/dashboard/settings?billing=unavailable");
  }

  const { workspaceId, currentPlan, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) redirect("/dashboard/settings?billing=unavailable");

  const isUpgrade = (PLAN_RANK[plan] ?? 0) > (PLAN_RANK[currentPlan] ?? 0);

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    // Upgrade: invoice the prorated difference immediately so the customer pays
    // now for the access they get now. Downgrade: bank the prorated credit and
    // apply it to future invoices (no cash refund).
    proration_behavior: isUpgrade ? "always_invoice" : "create_prorations",
    cancel_at_period_end: false,
    metadata: { workspace_id: workspaceId, plan },
  });

  // Reflect immediately; the subscription.updated webhook will reconcile.
  await createAdminClient()
    .from("workspaces")
    .update({ plan, cancel_at_period_end: false })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=changed");
}

// Schedule cancellation at the end of the current paid period (keeps access
// until then), rather than cutting the user off immediately. Records the
// cancellation reason from the save flow for churn analysis.
export async function cancelSubscription(formData: FormData) {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const reason = String(formData.get("reason") || "").slice(0, 80);
  const note = String(formData.get("note") || "").slice(0, 500);
  const reasonText = note ? `${reason || "other"}: ${note}` : reason;

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  await createAdminClient()
    .from("workspaces")
    .update({
      cancel_at_period_end: true,
      ...(reasonText ? { cancel_reason: reasonText } : {}),
    })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=cancel_scheduled");
}

// Pause billing for 1-3 months instead of cancelling. Stripe voids invoices
// during the pause and auto-resumes on the chosen date.
export async function pauseSubscription(formData: FormData) {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const months = Math.min(
    3,
    Math.max(1, parseInt(String(formData.get("months") || "1"), 10) || 1)
  );
  const reason = String(formData.get("reason") || "").slice(0, 80);

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  const resumesAt = Math.floor(Date.now() / 1000) + months * 30 * 24 * 60 * 60;

  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: { behavior: "void", resumes_at: resumesAt },
  });

  await createAdminClient()
    .from("workspaces")
    .update({
      subscription_status: "paused",
      paused_until: new Date(resumesAt * 1000).toISOString(),
      cancel_at_period_end: false,
      ...(reason ? { cancel_reason: `pause: ${reason}` } : {}),
    })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=paused");
}

// Redeem a promo code for the current user's workspace (comped plan).
export async function redeemPromo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const code = String(formData.get("promo") || "");
  const res = await applyPromo(createAdminClient(), user.id, code);
  revalidatePath("/dashboard/settings");
  redirect(
    res.ok ? "/dashboard/settings?promo=ok" : "/dashboard/settings?promo=err"
  );
}

// Resume a paused subscription right away.
export async function resumeNow() {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: null,
  });

  await createAdminClient()
    .from("workspaces")
    .update({ subscription_status: "active", paused_until: null })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=resumed");
}

// Undo a scheduled cancellation.
export async function resumeSubscription() {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  await createAdminClient()
    .from("workspaces")
    .update({ cancel_at_period_end: false })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=resumed");
}
