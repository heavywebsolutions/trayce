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

  if (!code) redirect("/dashboard/admin/promos?err=code");

  const { error } = await createAdminClient()
    .from("promo_codes")
    .insert({ code, plan, label, max_redemptions: maxRedemptions });

  revalidatePath("/dashboard/admin/promos");
  redirect(
    error ? "/dashboard/admin/promos?err=dupe" : "/dashboard/admin/promos?ok=1"
  );
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
