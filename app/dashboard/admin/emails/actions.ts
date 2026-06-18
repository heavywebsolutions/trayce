"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { EMAILS, EMAIL_KINDS, type EmailKind } from "@/lib/lifecycle";

const KINDS = EMAIL_KINDS;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
}

// Save (upsert) an edited email template. Admin-only.
export async function saveEmailTemplate(formData: FormData) {
  await requireAdmin();
  const kind = String(formData.get("kind") || "") as EmailKind;
  if (!KINDS.includes(kind)) return;

  const subject = String(formData.get("subject") || "").trim();
  const heading = String(formData.get("heading") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const cta_text = String(formData.get("cta_text") || "").trim();
  const needsCta = EMAILS[kind].hasCta;
  if (!subject || !heading || !body || (needsCta && !cta_text)) {
    redirect(`/dashboard/admin/emails/${kind}?err=1`);
  }

  await createAdminClient()
    .from("email_templates")
    .upsert(
      { kind, subject, heading, body, cta_text, updated_at: new Date().toISOString() },
      { onConflict: "kind" }
    );

  revalidatePath(`/dashboard/admin/emails/${kind}`);
  redirect(`/dashboard/admin/emails/${kind}?saved=1`);
}

// Reset an email back to the built-in default (deletes the override row).
export async function resetEmailTemplate(formData: FormData) {
  await requireAdmin();
  const kind = String(formData.get("kind") || "") as EmailKind;
  if (!KINDS.includes(kind)) return;

  await createAdminClient().from("email_templates").delete().eq("kind", kind);

  revalidatePath(`/dashboard/admin/emails/${kind}`);
  redirect(`/dashboard/admin/emails/${kind}?reset=1`);
}
