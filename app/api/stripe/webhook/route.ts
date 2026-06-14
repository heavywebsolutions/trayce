import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, planFromPrice } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe needs the raw request body to verify the signature, so this route
// must run on the Node runtime and read the body as text.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function periodEndISO(sub: Stripe.Subscription): string | null {
  // current_period_end lives at the top level in most API versions and on the
  // subscription item in the newest ones. Read both defensively.
  const top = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const item = (
    sub.items?.data?.[0] as unknown as { current_period_end?: number }
  )?.current_period_end;
  const unix = top ?? item ?? null;
  return unix ? new Date(unix * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  async function updateByCustomer(
    customerId: string,
    fields: Record<string, unknown>
  ) {
    await admin
      .from("workspaces")
      .update(fields)
      .eq("stripe_customer_id", customerId);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          s.metadata?.workspace_id || s.client_reference_id || null;

        // Print & Ship one-time order (mode=payment), not a subscription.
        if (s.metadata?.kind === "print_order" && workspaceId) {
          const ship =
            (s as unknown as { shipping_details?: unknown }).shipping_details ??
            (
              s as unknown as {
                collected_information?: { shipping_details?: unknown };
              }
            ).collected_information?.shipping_details ??
            s.customer_details ??
            null;
          const shipObj = ship as {
            name?: string | null;
            address?: unknown;
          } | null;
          await admin.from("print_orders").insert({
            workspace_id: workspaceId,
            code_id: s.metadata.code_id || null,
            product_key: s.metadata.product_key,
            product_name: s.metadata.product_name,
            options: {
              size: s.metadata.size,
              finish: s.metadata.finish,
              shape: s.metadata.shape,
              bg_color: s.metadata.bg_color,
              border: s.metadata.border,
              border_color: s.metadata.border_color,
              cta: s.metadata.cta,
              cta_position: s.metadata.cta_position,
            },
            quantity: parseInt(s.metadata.qty || "0", 10),
            unit_price_cents: parseInt(s.metadata.unit_price_cents || "0", 10),
            total_cents: parseInt(s.metadata.total_cents || "0", 10),
            currency: s.currency || "usd",
            status: "proof_ready",
            stripe_session_id: s.id,
            shipping: shipObj
              ? { name: shipObj.name ?? null, address: shipObj.address ?? null }
              : null,
            paid_at: new Date().toISOString(),
          });
          break;
        }

        const customerId =
          typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
        const subscriptionId =
          typeof s.subscription === "string"
            ? s.subscription
            : s.subscription?.id ?? null;
        const plan = s.metadata?.plan || null;
        // Bind the Stripe customer + subscription to the workspace AND set the
        // plan now, so the upgrade is reflected immediately regardless of the
        // order in which the subscription.* events arrive. Later subscription
        // events refine status, renewal date, and cancel state.
        if (workspaceId) {
          await admin
            .from("workspaces")
            .update({
              ...(customerId ? { stripe_customer_id: customerId } : {}),
              ...(subscriptionId
                ? { stripe_subscription_id: subscriptionId }
                : {}),
              ...(plan ? { plan } : {}),
              subscription_status: "active",
              cancel_at_period_end: false,
            })
            .eq("id", workspaceId);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        const active = sub.status === "active" || sub.status === "trialing";
        const pause = sub.pause_collection;
        const paused = Boolean(pause);
        const pausedUntil = pause?.resumes_at
          ? new Date(pause.resumes_at * 1000).toISOString()
          : null;
        await updateByCustomer(customerId, {
          plan: active ? planFromPrice(priceId) : "free",
          subscription_status: paused ? "paused" : sub.status,
          current_period_end: periodEndISO(sub),
          stripe_subscription_id: sub.id,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          paused_until: pausedUntil,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await updateByCustomer(customerId, {
          plan: "free",
          subscription_status: "canceled",
          current_period_end: null,
          stripe_subscription_id: null,
          cancel_at_period_end: false,
          paused_until: null,
        });
        break;
      }

      default:
        break;
    }
  } catch {
    // Returning 200 prevents an infinite Stripe retry storm on a bug in our
    // handler; the event is still logged in the Stripe dashboard for replay.
    return NextResponse.json({ received: true, handled: false });
  }

  return NextResponse.json({ received: true });
}
