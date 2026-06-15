"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

// Toggle an email-automation flag on or off. Admin-only.
export async function setEmailFlag(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");

  const key = String(formData.get("key") || "");
  if (!key.startsWith("email_")) return;
  const enabled = String(formData.get("enabled") || "") === "true";

  await createAdminClient()
    .from("app_settings")
    .upsert(
      { key, value: enabled, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  revalidatePath("/dashboard/admin");
}
