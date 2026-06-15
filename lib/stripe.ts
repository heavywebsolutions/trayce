import Stripe from "stripe";

// Server-only Stripe client. Never import into client components.
// apiVersion is intentionally omitted so the installed SDK uses its own
// pinned version, which avoids version-string type churn on upgrades.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

// Our internal plan keys mapped to the Stripe Price IDs (set as env vars).
// Create the products/prices in the Stripe dashboard, then paste the
// price_… IDs into these env vars.
export const PLAN_PRICES: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

// Reverse lookup used by the webhook: given the price the customer is on,
// figure out which plan to record on the workspace.
export function planFromPrice(priceId: string | null | undefined): string {
  if (!priceId) return "free";
  for (const [plan, id] of Object.entries(PLAN_PRICES)) {
    if (id && id === priceId) return plan;
  }
  return "free";
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type CardInfo = {
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

// Resolve the card a customer pays with: prefer the invoice default payment
// method, fall back to their most recent saved card. Used by the webhook to
// keep card-on-file details fresh for the expiry banner + warnings.
export async function getCardForCustomer(
  customerId: string
): Promise<CardInfo | null> {
  try {
    const cust = await stripe.customers.retrieve(customerId, {
      expand: ["invoice_settings.default_payment_method"],
    });
    if (!cust || (cust as { deleted?: boolean }).deleted) return null;

    const pm = (cust as Stripe.Customer).invoice_settings
      ?.default_payment_method as Stripe.PaymentMethod | null;
    let card = pm?.card ?? null;

    if (!card) {
      const pms = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 1,
      });
      card = pms.data[0]?.card ?? null;
    }
    if (!card) return null;

    return {
      brand: card.brand ?? null,
      last4: card.last4 ?? null,
      exp_month: card.exp_month ?? null,
      exp_year: card.exp_year ?? null,
    };
  } catch {
    return null;
  }
}
