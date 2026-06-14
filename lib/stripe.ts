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
