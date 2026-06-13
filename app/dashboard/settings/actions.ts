"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("display_name") ?? "").trim();
  const workspaceName = String(formData.get("workspace_name") ?? "").trim();

  await supabase.auth.updateUser({ data: { display_name: displayName } });

  if (workspaceName) {
    await supabase
      .from("workspaces")
      .update({ name: workspaceName })
      .eq("owner_id", user.id);
  }

  redirect("/dashboard/settings?saved=profile");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  // Supabase enforces its own minimum; we keep a floor here too.
  if (password.length >= 8) {
    await supabase.auth.updateUser({ password });
  }

  redirect("/dashboard/settings?saved=password");
}
