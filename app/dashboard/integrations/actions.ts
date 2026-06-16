"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, testIntegration } from "@/lib/integrations";
import { encryptSecret } from "@/lib/crypto";
import { loadEntitlements } from "@/lib/plan";

export type TestState = { ok?: boolean; message?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Send a test contact to a connected integration and report pass/fail inline.
export async function sendTestContact(
  _prev: TestState,
  formData: FormData
): Promise<TestState> {
  const gate = await loadEntitlements();
  if (gate && !gate.ent.emailSync) {
    return { ok: false, message: "Email sync is a Growth feature." };
  }
  const provider = String(formData.get("provider") || "");
  if (!PROVIDERS.some((p) => p.key === provider)) {
    return { ok: false, message: "Unknown integration." };
  }
  const email = String(formData.get("email") || "").trim();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Enter a valid email to test with." };
  }
  const { workspaceId } = await currentWorkspace();
  return testIntegration(workspaceId, provider, email);
}

async function currentWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (!ws) throw new Error("No workspace");
  return { supabase, workspaceId: ws.id };
}

export async function saveIntegration(formData: FormData): Promise<void> {
  const gate = await loadEntitlements();
  if (gate && !gate.ent.emailSync) {
    redirect("/dashboard/settings?upgrade=email");
  }
  const provider = String(formData.get("provider") || "");
  if (!PROVIDERS.some((p) => p.key === provider)) return;

  const { supabase, workspaceId } = await currentWorkspace();

  // Keep the existing secret if the field was left blank.
  const { data: existing } = await supabase
    .from("integrations")
    .select("api_key")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .maybeSingle();

  const apiKeyInput = String(formData.get("api_key") || "").trim();
  // Encrypt new keys; keep the (already-encrypted) existing one if left blank.
  const api_key = apiKeyInput
    ? encryptSecret(apiKeyInput)
    : (existing?.api_key ?? null);
  const list_id = String(formData.get("list_id") || "").trim() || null;
  const endpoint = String(formData.get("endpoint") || "").trim() || null;
  const enabled = formData.get("enabled") === "on";

  await supabase.from("integrations").upsert(
    {
      workspace_id: workspaceId,
      provider,
      api_key,
      list_id,
      endpoint,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,provider" }
  );
  revalidatePath("/dashboard/integrations");
}

export async function deleteIntegration(formData: FormData): Promise<void> {
  const provider = String(formData.get("provider") || "");
  if (!provider) return;
  const { supabase, workspaceId } = await currentWorkspace();
  await supabase
    .from("integrations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);
  revalidatePath("/dashboard/integrations");
}
