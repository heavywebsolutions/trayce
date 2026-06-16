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

// Create a Stripe coupon + promotion code for a discount promo. Stripe enforces
// the math, duration, expiry, and redemption cap. Returns the ids to store, or
// null if Stripe isn't configured. Domain/plan scoping is enforced by us at
// checkout (we only attach the code on the matching session), not via the coupon.
export async function createPromoDiscount(opts: {
  code: string;
  percentOff?: number | null;
  amountOffCents?: number | null;
  duration: "once" | "repeating" | "forever";
  durationMonths?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null; // ISO
}): Promise<{ couponId: string; promotionCodeId: string } | null> {
  if (!stripeConfigured()) return null;

  const coupon = await stripe.coupons.create({
    name: opts.code,
    duration: opts.duration,
    ...(opts.duration === "repeating" && opts.durationMonths
      ? { duration_in_months: opts.durationMonths }
      : {}),
    ...(opts.percentOff != null
      ? { percent_off: opts.percentOff }
      : { amount_off: opts.amountOffCents ?? 0, currency: "usd" }),
  });

  const promoParams: Stripe.PromotionCodeCreateParams = {
    promotion: { type: "coupon", coupon: coupon.id },
    code: opts.code,
  };
  if (opts.maxRedemptions) promoParams.max_redemptions = opts.maxRedemptions;
  if (opts.expiresAt) {
    promoParams.expires_at = Math.floor(
      new Date(opts.expiresAt).getTime() / 1000
    );
  }
  const promo = await stripe.promotionCodes.create(promoParams);

  return { couponId: coupon.id, promotionCodeId: promo.id };
}

// Toggle a Stripe promotion code on/off (used when enabling/disabling our code).
export async function setPromoCodeActive(
  promotionCodeId: string,
  active: boolean
): Promise<void> {
  if (!stripeConfigured() || !promotionCodeId) return;
  try {
    await stripe.promotionCodes.update(promotionCodeId, { active });
  } catch {
    /* ignore */
  }
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
