"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, PLAN_PRICES, stripeConfigured } from "@/lib/stripe";

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
    .select("id, stripe_customer_id, stripe_subscription_id")
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
  return { workspaceId: ws.id as string, subscriptionId };
}

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
    allow_promotion_codes: true,
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

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) redirect("/dashboard/settings?billing=unavailable");

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
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
// until then), rather than cutting the user off immediately.
export async function cancelSubscription() {
  if (!stripeConfigured()) redirect("/dashboard/settings?billing=unavailable");

  const { workspaceId, subscriptionId } = await getWorkspaceSub();
  if (!subscriptionId) redirect("/dashboard/settings?billing=nocustomer");

  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  await createAdminClient()
    .from("workspaces")
    .update({ cancel_at_period_end: true })
    .eq("id", workspaceId);

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?billing=cancel_scheduled");
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
