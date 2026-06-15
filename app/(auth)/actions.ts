"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, adminRecipients } from "@/lib/email";
import { applyPromo } from "@/lib/promo";
import { lifecycleEmail } from "@/lib/lifecycle";
import { emailFlags, flowOn } from "@/lib/settings";

export type AuthState = { error?: string } | undefined;

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Honeypot: a hidden field only bots fill. Reject without creating an account.
  if (String(formData.get("company_url") || "").trim() !== "") {
    return { error: "Something went wrong. Please try again." };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const promo = String(formData.get("promo") || "").trim();
  if (!email || !password) return { error: "Enter your email and password." };
  if (password.length < 8)
    return { error: "Use at least 8 characters for your password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // Best-effort post-signup tasks; never block the user on these.
  const newUserId = data.user?.id;
  if (newUserId) {
    const admin = createAdminClient();
    const recipients = adminRecipients();
    if (recipients.length) {
      await sendEmail({
        to: recipients,
        subject: `New TRAXXR signup: ${email}`,
        html: `<p>A new account was just created on TRAXXR.</p><p><strong>${email}</strong></p>`,
      }).catch(() => {});
    }
    if (promo) {
      await applyPromo(admin, newUserId, promo).catch(() => {});
    }
    // Instant welcome email + log it so the daily cron never repeats it.
    const { data: ws } = await admin
      .from("workspaces")
      .select("id")
      .eq("owner_id", newUserId)
      .maybeSingle();
    const flags = await emailFlags(admin);
    if (ws && flowOn(flags, "welcome")) {
      const tmpl = lifecycleEmail("welcome");
      const ok = await sendEmail({
        to: email,
        subject: tmpl.subject,
        html: tmpl.html,
      }).catch(() => false);
      if (ok) {
        await admin
          .from("email_log")
          .insert({ workspace_id: ws.id, email, kind: "welcome" })
          .then(
            () => {},
            () => {}
          );
      }
    }
  }

  // If email confirmation is on, there's no session yet — send them to login with a note.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login?check=1");

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
