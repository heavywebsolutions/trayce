"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  IMP_COOKIE,
  signImpersonator,
  verifyImpersonator,
} from "@/lib/impersonation";

// Admin "log in as": swap the current session to the target user via a
// server-generated magic link, so RLS + every existing page behave exactly as
// that user (you can view AND edit their codes/pages). The admin's own identity
// is stashed in a signed cookie so "exit" restores it.
export async function startImpersonation(formData: FormData) {
  const targetId = String(formData.get("user_id") || "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
  if (!targetId || targetId === user!.id) redirect("/dashboard/admin");

  const adminClient = createAdminClient();
  const { data: target } = await adminClient.auth.admin.getUserById(targetId);
  const targetEmail = target?.user?.email;
  if (!targetEmail) redirect("/dashboard/admin?imp=err");

  const { data: link, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: targetEmail,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) redirect("/dashboard/admin?imp=err");

  const { error: vErr } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: tokenHash,
  });
  if (vErr) redirect("/dashboard/admin?imp=err");

  const cookieStore = await cookies();
  cookieStore.set(IMP_COOKIE, signImpersonator(user!.email!), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  await adminClient
    .from("impersonation_log")
    .insert({
      admin_email: user!.email,
      target_email: targetEmail,
      action: "start",
    })
    .then(
      () => {},
      () => {}
    );

  redirect("/dashboard");
}

// Exit impersonation: restore the admin's own session from the signed cookie.
export async function stopImpersonation() {
  const cookieStore = await cookies();
  const adminEmail = verifyImpersonator(cookieStore.get(IMP_COOKIE)?.value);
  if (!adminEmail || !isAdmin(adminEmail)) {
    cookieStore.delete(IMP_COOKIE);
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();
  const { data: link } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: adminEmail!,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (tokenHash) {
    const supabase = await createClient();
    await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  }

  cookieStore.delete(IMP_COOKIE);
  await adminClient
    .from("impersonation_log")
    .insert({ admin_email: adminEmail, target_email: null, action: "stop" })
    .then(
      () => {},
      () => {}
    );

  redirect("/dashboard/admin");
}

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
