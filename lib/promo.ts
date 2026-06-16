import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

const PLAN_RANK: Record<string, number> = {
  starter: 1,
  growth: 2,
  agency: 3,
};

// Pick the most generous plan from a comp code's eligible tiers.
function topPlan(plans: string[] | null | undefined, legacy?: string | null): string {
  const list = plans && plans.length ? plans : legacy ? [legacy] : [];
  let best = "growth";
  let bestRank = -1;
  for (const p of list) {
    const r = PLAN_RANK[p] ?? 0;
    if (r > bestRank) {
      bestRank = r;
      best = p;
    }
  }
  return best;
}

function isExpired(expires_at: string | null | undefined): boolean {
  return !!expires_at && new Date(expires_at) < new Date();
}

function fullyRedeemed(p: {
  max_redemptions: number | null;
  redeemed_count: number;
}): boolean {
  return p.max_redemptions != null && p.redeemed_count >= p.max_redemptions;
}

// Redeem a COMP code in-app: grants a free (comped) plan. Discount codes
// (percent/amount) are NOT redeemed here, they apply at checkout instead.
export async function applyPromo(
  admin: Admin,
  userId: string,
  codeRaw: string
): Promise<{ ok: boolean; error?: string; plan?: string }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a promo code." };

  const { data: promo } = await admin
    .from("promo_codes")
    .select(
      "id, kind, plan, comp_plans, active, max_redemptions, redeemed_count, expires_at"
    )
    .eq("code", code)
    .maybeSingle();
  if (!promo || !promo.active) return { ok: false, error: "That code is not valid." };

  const kind = (promo.kind as string) || "comp";
  if (kind !== "comp") {
    return {
      ok: false,
      error: "That's a discount code, enter it at checkout when you upgrade.",
    };
  }
  if (isExpired(promo.expires_at as string)) {
    return { ok: false, error: "That code has expired." };
  }
  if (fullyRedeemed(promo as { max_redemptions: number | null; redeemed_count: number })) {
    return { ok: false, error: "That code has been fully redeemed." };
  }

  const { data: ws } = await admin
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!ws) return { ok: false, error: "No workspace found for this account." };

  const { data: existing } = await admin
    .from("promo_redemptions")
    .select("id")
    .eq("code", code)
    .eq("workspace_id", ws.id)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "This code is already applied to your account." };
  }

  const plan = topPlan(promo.comp_plans as string[], promo.plan as string);

  await admin
    .from("workspaces")
    .update({
      plan,
      comp: true,
      subscription_status: "comp",
      cancel_at_period_end: false,
    })
    .eq("id", ws.id);
  await admin.from("promo_redemptions").insert({ code, workspace_id: ws.id });
  await admin
    .from("promo_codes")
    .update({ redeemed_count: (promo.redeemed_count ?? 0) + 1 })
    .eq("id", promo.id);

  return { ok: true, plan };
}

// Validate a DISCOUNT code (percent/amount) for a specific checkout and return
// the Stripe promotion code id to attach. Enforces domain + tier scope here, so
// a subscription code can't be spent on print and vice versa.
export async function resolveDiscount(
  admin: Admin,
  codeRaw: string,
  domain: "subscription" | "print",
  plan?: string
): Promise<{ ok: boolean; promotionCodeId?: string; error?: string }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };

  const { data: promo } = await admin
    .from("promo_codes")
    .select(
      "kind, domain, active, expires_at, max_redemptions, redeemed_count, applies_to_plans, stripe_promotion_code_id"
    )
    .eq("code", code)
    .maybeSingle();
  if (!promo || !promo.active) return { ok: false, error: "That code is not valid." };

  const kind = (promo.kind as string) || "comp";
  if (kind === "comp") {
    return {
      ok: false,
      error: "That's a free-access code, redeem it in your account settings.",
    };
  }
  if ((promo.domain as string) !== domain) {
    return {
      ok: false,
      error:
        domain === "print"
          ? "That code can't be used on Print & Ship orders."
          : "That code can't be used on a subscription.",
    };
  }
  if (isExpired(promo.expires_at as string)) {
    return { ok: false, error: "That code has expired." };
  }
  if (fullyRedeemed(promo as { max_redemptions: number | null; redeemed_count: number })) {
    return { ok: false, error: "That code has been fully redeemed." };
  }
  const appliesTo = (promo.applies_to_plans as string[]) ?? [];
  if (domain === "subscription" && appliesTo.length && plan && !appliesTo.includes(plan)) {
    return { ok: false, error: "That code doesn't apply to this plan." };
  }
  if (!promo.stripe_promotion_code_id) {
    return { ok: false, error: "This code isn't available right now." };
  }
  return { ok: true, promotionCodeId: promo.stripe_promotion_code_id as string };
}

// Record a discount redemption (called from the Stripe webhook on a completed
// checkout that used one of our promotion codes). Idempotent per workspace+code.
export async function recordDiscountRedemption(
  admin: Admin,
  promotionCodeId: string,
  workspaceId: string | null
): Promise<void> {
  if (!promotionCodeId) return;
  const { data: promo } = await admin
    .from("promo_codes")
    .select("id, code, redeemed_count")
    .eq("stripe_promotion_code_id", promotionCodeId)
    .maybeSingle();
  if (!promo) return;

  if (workspaceId) {
    const { data: existing } = await admin
      .from("promo_redemptions")
      .select("id")
      .eq("code", promo.code as string)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (existing) return; // already counted
    await admin
      .from("promo_redemptions")
      .insert({ code: promo.code, workspace_id: workspaceId });
  }
  await admin
    .from("promo_codes")
    .update({ redeemed_count: (promo.redeemed_count ?? 0) + 1 })
    .eq("id", promo.id);
}
