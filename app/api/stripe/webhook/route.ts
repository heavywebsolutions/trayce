import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe, planFromPrice, getCardForCustomer } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { lifecycleEmail } from "@/lib/lifecycle";
import { proofReadyEmail } from "@/lib/print/emails";
import { recordDiscountRedemption } from "@/lib/promo";

// Pull the applied promotion-code id off a completed checkout session, if any.
function promoCodeIdFrom(s: Stripe.Checkout.Session): string | null {
  const raw = s.discounts?.[0]?.promotion_code;
  if (!raw) return null;
  return typeof raw === "string" ? raw : raw.id;
}
import { emailFlags, flowOn } from "@/lib/settings";

// Statuses where the customer still has paid access. past_due keeps access
// during Stripe's retry (dunning) window so an expired card does not instantly
// cut a paying customer off; only a real cancellation drops them to free.
const ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

function cardLabel(brand: string | null, last4: string | null): string {
  const b = brand ? brand[0].toUpperCase() + brand.slice(1) : "Your card";
  return last4 ? `${b} ending ${last4}` : b;
}

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

  // Refresh the card-on-file details so the expiry banner + warnings stay
  // accurate. Returns the fields to merge into a workspace update (empty if we
  // could not read a card).
  async function cardFields(
    customerId: string | null
  ): Promise<Record<string, unknown>> {
    if (!customerId) return {};
    const card = await getCardForCustomer(customerId);
    if (!card) return {};
    return {
      card_brand: card.brand,
      card_last4: card.last4,
      card_exp_month: card.exp_month,
      card_exp_year: card.exp_year,
    };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const workspaceId =
          s.metadata?.workspace_id || s.client_reference_id || null;

        // Print & Ship one-time order (mode=payment), not a subscription. The
        // draft order was created before checkout; flip it to proof_ready and
        // record the shipping address.
        if (s.metadata?.kind === "print_order") {
          const orderId = s.metadata.order_id;
          if (orderId) {
            const ship =
              (s as unknown as { shipping_details?: unknown })
                .shipping_details ??
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
            const buyerEmail =
              s.customer_details?.email ?? s.customer_email ?? null;
            const { data: order } = await admin
              .from("print_orders")
              .update({
                status: "proof_ready",
                stripe_session_id: s.id,
                shipping: shipObj
                  ? {
                      name: shipObj.name ?? null,
                      address: shipObj.address ?? null,
                    }
                  : null,
                ...(buyerEmail ? { customer_email: buyerEmail } : {}),
                paid_at: new Date().toISOString(),
              })
              .eq("id", orderId)
              .select("id, product_name")
              .maybeSingle();

            // Tell the customer their proof is ready to review.
            if (buyerEmail && order) {
              const tmpl = proofReadyEmail({
                orderId: order.id as string,
                productName: (order.product_name as string) ?? "order",
              });
              await sendEmail({
                to: buyerEmail,
                subject: tmpl.subject,
                html: tmpl.html,
              }).catch(() => {});
            }
          }
          // Count a print-domain discount redemption, if one was used.
          const printPromo = promoCodeIdFrom(s);
          if (printPromo) {
            await recordDiscountRedemption(admin, printPromo, workspaceId).catch(
              () => {}
            );
          }
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
              ...(await cardFields(customerId)),
              subscription_status: "active",
              cancel_at_period_end: false,
              payment_failed_at: null,
            })
            .eq("id", workspaceId);
        }
        // Count a subscription-domain discount redemption, if one was used.
        const subPromo = promoCodeIdFrom(s);
        if (subPromo) {
          await recordDiscountRedemption(admin, subPromo, workspaceId).catch(
            () => {}
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const priceId = sub.items.data[0]?.price?.id ?? null;
        // Keep the paid plan while active, trialing, OR past_due (grace period).
        const keepAccess = ACCESS_STATUSES.has(sub.status);
        const pause = sub.pause_collection;
        const paused = Boolean(pause);
        const pausedUntil = pause?.resumes_at
          ? new Date(pause.resumes_at * 1000).toISOString()
          : null;
        await updateByCustomer(customerId, {
          plan: keepAccess ? planFromPrice(priceId) : "free",
          subscription_status: paused ? "paused" : sub.status,
          current_period_end: periodEndISO(sub),
          stripe_subscription_id: sub.id,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          paused_until: pausedUntil,
        });
        break;
      }

      case "invoice.payment_failed": {
        // A renewal charge failed. Stay in the grace period (keep the plan),
        // mark the failure, and email the customer once per failure episode.
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string"
            ? inv.customer
            : inv.customer?.id ?? null;
        if (!customerId) break;

        // Only the first failure of an episode emails; payment_failed_at is
        // cleared on the next success, so a fresh failure can notify again.
        const { data: ws } = await admin
          .from("workspaces")
          .select("id, payment_failed_at, card_brand, card_last4")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        await updateByCustomer(customerId, {
          subscription_status: "past_due",
          payment_failed_at: new Date().toISOString(),
        });

        const firstFailure = ws && !ws.payment_failed_at;
        const to = inv.customer_email;
        if (firstFailure && to) {
          const flags = await emailFlags(admin);
          if (flowOn(flags, "payment_failed")) {
            const tmpl = lifecycleEmail("payment_failed", {
              cardLabel: cardLabel(
                (ws?.card_brand as string) ?? null,
                (ws?.card_last4 as string) ?? null
              ),
            });
            await sendEmail({ to, subject: tmpl.subject, html: tmpl.html });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Renewal (or recovery) cleared. Refresh the card on file and clear the
        // failure marker. Status is reconciled by subscription.updated.
        const inv = event.data.object as Stripe.Invoice;
        const customerId =
          typeof inv.customer === "string"
            ? inv.customer
            : inv.customer?.id ?? null;
        if (!customerId) break;
        await updateByCustomer(customerId, {
          ...(await cardFields(customerId)),
          payment_failed_at: null,
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
          payment_failed_at: null,
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
