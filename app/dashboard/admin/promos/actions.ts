"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { createPromoDiscount, setPromoCodeActive } from "@/lib/stripe";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
}

const PLANS = ["starter", "growth", "agency"];

// A date-only input (YYYY-MM-DD) means "good through the end of that day".
function parseExpiry(v: string): string | null {
  const d = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return `${d}T23:59:59`;
}

function planList(values: FormDataEntryValue[]): string[] {
  return values
    .map((v) => String(v))
    .filter((v) => PLANS.includes(v));
}

// "once" | "3" | "6" | "12" | "forever" -> Stripe duration shape.
function parseDuration(v: string): {
  duration: "once" | "repeating" | "forever";
  duration_months: number | null;
} {
  if (v === "forever") return { duration: "forever", duration_months: null };
  const n = parseInt(v, 10);
  if (n === 3 || n === 6 || n === 12)
    return { duration: "repeating", duration_months: n };
  return { duration: "once", duration_months: null };
}

export async function createPromoCode(formData: FormData) {
  await assertAdmin();
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase()
    .slice(0, 40);
  if (!code) redirect("/dashboard/admin/promos?err=code");

  const kind = ["comp", "percent", "amount"].includes(
    String(formData.get("kind"))
  )
    ? String(formData.get("kind"))
    : "comp";
  const label = String(formData.get("label") || "").slice(0, 80) || null;
  const maxRaw = String(formData.get("max_redemptions") || "").trim();
  const max_redemptions =
    maxRaw === "" ? null : Math.max(1, parseInt(maxRaw, 10) || 1);
  const expires_at = parseExpiry(String(formData.get("expires_at") || ""));

  const admin = createAdminClient();

  if (kind === "comp") {
    const comp_plans = planList(formData.getAll("comp_plans"));
    if (comp_plans.length === 0) redirect("/dashboard/admin/promos?err=plans");
    const { error } = await admin.from("promo_codes").insert({
      code,
      kind: "comp",
      domain: "subscription",
      comp_plans,
      label,
      max_redemptions,
      expires_at,
    });
    revalidatePath("/dashboard/admin/promos");
    redirect(
      error ? "/dashboard/admin/promos?err=dupe" : "/dashboard/admin/promos?ok=1"
    );
  }

  // Discount (percent | amount)
  const domain =
    String(formData.get("domain")) === "print" ? "print" : "subscription";
  const percent_off =
    kind === "percent"
      ? Math.min(100, Math.max(1, parseInt(String(formData.get("percent_off") || "0"), 10) || 0))
      : null;
  const amount_off_cents =
    kind === "amount"
      ? Math.max(
          1,
          Math.round(parseFloat(String(formData.get("amount_off") || "0")) * 100) || 0
        )
      : null;
  if (kind === "percent" && !percent_off)
    redirect("/dashboard/admin/promos?err=value");
  if (kind === "amount" && !amount_off_cents)
    redirect("/dashboard/admin/promos?err=value");

  // Print is one-time; subscriptions carry a duration.
  const { duration, duration_months } =
    domain === "print"
      ? { duration: "once" as const, duration_months: null }
      : parseDuration(String(formData.get("duration") || "once"));
  const applies_to_plans =
    domain === "subscription" ? planList(formData.getAll("applies_to_plans")) : [];

  // Create the Stripe coupon + promotion code (Stripe enforces the math).
  let couponId: string | null = null;
  let promoCodeId: string | null = null;
  try {
    const made = await createPromoDiscount({
      code,
      percentOff: percent_off,
      amountOffCents: amount_off_cents,
      duration,
      durationMonths: duration_months,
      maxRedemptions: max_redemptions,
      expiresAt: expires_at,
    });
    couponId = made?.couponId ?? null;
    promoCodeId = made?.promotionCodeId ?? null;
  } catch {
    redirect("/dashboard/admin/promos?err=stripe");
  }

  const { error } = await admin.from("promo_codes").insert({
    code,
    kind,
    domain,
    percent_off,
    amount_off_cents,
    duration,
    duration_months,
    applies_to_plans,
    label,
    max_redemptions,
    expires_at,
    stripe_coupon_id: couponId,
    stripe_promotion_code_id: promoCodeId,
  });
  revalidatePath("/dashboard/admin/promos");
  redirect(
    error ? "/dashboard/admin/promos?err=dupe" : "/dashboard/admin/promos?ok=1"
  );
}

// Edit: comp codes are fully editable. Discount codes only allow label edits,
// because Stripe coupon value/duration and promo-code expiry/limit are immutable
// once created (change those by making a new code).
export async function updatePromoCode(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("promo_codes")
    .select("kind")
    .eq("id", id)
    .maybeSingle();
  const kind = ((row?.kind as string) || "comp") as string;

  const label = String(formData.get("label") || "").slice(0, 80) || null;

  if (kind === "comp") {
    const comp_plans = planList(formData.getAll("comp_plans"));
    const maxRaw = String(formData.get("max_redemptions") || "").trim();
    const max_redemptions =
      maxRaw === "" ? null : Math.max(1, parseInt(maxRaw, 10) || 1);
    const expires_at = parseExpiry(String(formData.get("expires_at") || ""));
    await admin
      .from("promo_codes")
      .update({
        label,
        ...(comp_plans.length ? { comp_plans } : {}),
        max_redemptions,
        expires_at,
      })
      .eq("id", id);
  } else {
    await admin.from("promo_codes").update({ label }).eq("id", id);
  }

  revalidatePath("/dashboard/admin/promos");
  redirect("/dashboard/admin/promos?ok=1");
}

export async function togglePromoCode(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("promo_codes")
    .select("stripe_promotion_code_id")
    .eq("id", id)
    .maybeSingle();
  await admin.from("promo_codes").update({ active: !active }).eq("id", id);
  // Keep the Stripe promotion code in sync for discount codes.
  if (row?.stripe_promotion_code_id) {
    await setPromoCodeActive(row.stripe_promotion_code_id as string, !active);
  }
  revalidatePath("/dashboard/admin/promos");
}
