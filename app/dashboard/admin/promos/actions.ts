"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
}

export async function createPromoCode(formData: FormData) {
  await assertAdmin();
  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase()
    .slice(0, 40);
  const planRaw = String(formData.get("plan") || "");
  const plan = ["starter", "growth", "agency"].includes(planRaw)
    ? planRaw
    : "growth";
  const label = String(formData.get("label") || "").slice(0, 80) || null;
  const maxRaw = String(formData.get("max_redemptions") || "").trim();
  const maxRedemptions =
    maxRaw === "" ? null : Math.max(1, parseInt(maxRaw, 10) || 1);
  const expires_at = parseExpiry(String(formData.get("expires_at") || ""));

  if (!code) redirect("/dashboard/admin/promos?err=code");

  const { error } = await createAdminClient()
    .from("promo_codes")
    .insert({ code, plan, label, max_redemptions: maxRedemptions, expires_at });

  revalidatePath("/dashboard/admin/promos");
  redirect(
    error ? "/dashboard/admin/promos?err=dupe" : "/dashboard/admin/promos?ok=1"
  );
}

// A date-only input (YYYY-MM-DD) means "good through the end of that day".
function parseExpiry(v: string): string | null {
  const d = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return `${d}T23:59:59`;
}

// Edit an existing code: plan, label, redemption cap, expiry. The code string
// itself is immutable (people may already be holding it).
export async function updatePromoCode(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const planRaw = String(formData.get("plan") || "");
  const plan = ["starter", "growth", "agency"].includes(planRaw)
    ? planRaw
    : "growth";
  const label = String(formData.get("label") || "").slice(0, 80) || null;
  const maxRaw = String(formData.get("max_redemptions") || "").trim();
  const max_redemptions =
    maxRaw === "" ? null : Math.max(1, parseInt(maxRaw, 10) || 1);
  const expires_at = parseExpiry(String(formData.get("expires_at") || ""));

  await createAdminClient()
    .from("promo_codes")
    .update({ plan, label, max_redemptions, expires_at })
    .eq("id", id);

  revalidatePath("/dashboard/admin/promos");
  redirect("/dashboard/admin/promos?ok=1");
}

export async function togglePromoCode(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  await createAdminClient()
    .from("promo_codes")
    .update({ active: !active })
    .eq("id", id);
  revalidatePath("/dashboard/admin/promos");
}
