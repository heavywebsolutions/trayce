"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLAN_PRICES, stripeConfigured } from "@/lib/stripe";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

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
