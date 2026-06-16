import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

// Validate and apply a promo code to a user's workspace, granting a free
// (comped) plan. Server-only; always called with the service-role admin client.
export async function applyPromo(
  admin: Admin,
  userId: string,
  codeRaw: string
): Promise<{ ok: boolean; error?: string; plan?: string }> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a promo code." };

  const { data: promo } = await admin
    .from("promo_codes")
    .select("id, plan, active, max_redemptions, redeemed_count, expires_at")
    .eq("code", code)
    .maybeSingle();
  if (!promo || !promo.active) {
    return { ok: false, error: "That code is not valid." };
  }
  if (promo.expires_at && new Date(promo.expires_at as string) < new Date()) {
    return { ok: false, error: "That code has expired." };
  }
  if (
    promo.max_redemptions != null &&
    promo.redeemed_count >= promo.max_redemptions
  ) {
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

  await admin
    .from("workspaces")
    .update({
      plan: promo.plan,
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

  return { ok: true, plan: promo.plan as string };
}
