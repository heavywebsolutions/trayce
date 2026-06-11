"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { normalizeUrl, isValidUrl } from "@/lib/utils";

async function currentWorkspaceId() {
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

  if (!ws) throw new Error("No workspace found for this account.");
  return { supabase, workspaceId: ws.id, userId: user.id };
}

export type CodeFormState = { error?: string } | undefined;

export async function createCode(
  _prev: CodeFormState,
  formData: FormData
): Promise<CodeFormState> {
  const title = String(formData.get("title") || "").trim() || "Untitled code";
  const rawUrl = String(formData.get("destination_url") || "");
  if (!isValidUrl(rawUrl)) {
    return { error: "Enter a valid destination URL (e.g. https://example.com)." };
  }
  const destination = normalizeUrl(rawUrl);
  const type = String(formData.get("type") || "dynamic") === "static"
    ? "static"
    : "dynamic";

  const { supabase, workspaceId } = await currentWorkspaceId();

  // Generate a unique slug, retrying on the rare collision.
  let slug = generateSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("codes")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = generateSlug();
  }

  const { data: code, error } = await supabase
    .from("codes")
    .insert({
      workspace_id: workspaceId,
      slug,
      title,
      destination_url: destination,
      type,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("code_destinations")
    .insert({ code_id: code.id, destination_url: destination });

  revalidatePath("/dashboard/codes");
  revalidatePath("/dashboard");
  redirect(`/dashboard/codes/${code.id}`);
}

export async function updateDestination(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  const rawUrl = String(formData.get("destination_url") || "");
  if (!codeId || !isValidUrl(rawUrl)) return;
  const destination = normalizeUrl(rawUrl);

  const { supabase, userId } = await currentWorkspaceId();

  const { error } = await supabase
    .from("codes")
    .update({ destination_url: destination, updated_at: new Date().toISOString() })
    .eq("id", codeId);
  if (error) return;

  await supabase
    .from("code_destinations")
    .insert({ code_id: codeId, destination_url: destination, changed_by: userId });

  revalidatePath(`/dashboard/codes/${codeId}`);
  revalidatePath("/dashboard/codes");
}

export async function setStatus(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  const status = String(formData.get("status") || "");
  if (!codeId || !["active", "paused", "archived"].includes(status)) return;

  const { supabase } = await currentWorkspaceId();
  await supabase
    .from("codes")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", codeId);

  revalidatePath("/dashboard/codes");
  revalidatePath(`/dashboard/codes/${codeId}`);
}

// Persist a code's visual design (colors, dot/corner style, center logo).
export async function updateDesign(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  if (!codeId) return;

  const hex = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  const fg = hex(formData.get("fg_color"), "#0A2540");
  const bg = hex(formData.get("bg_color"), "#FFFFFF");

  const dotAllowed = ["square", "rounded", "dots", "classy", "classy-rounded"];
  const cornerAllowed = ["square", "dot", "extra-rounded"];
  const dotRaw = String(formData.get("dot_style") || "");
  const cornerRaw = String(formData.get("corner_style") || "");
  const dot = dotAllowed.includes(dotRaw) ? dotRaw : "square";
  const corner = cornerAllowed.includes(cornerRaw) ? cornerRaw : "square";

  const logoRaw = formData.get("logo_url");
  // Accept a data: URL (uploaded, resized client-side) or clear it.
  const logo =
    typeof logoRaw === "string" &&
    logoRaw.startsWith("data:image/") &&
    logoRaw.length < 400_000
      ? logoRaw
      : null;

  const { supabase } = await currentWorkspaceId();
  await supabase
    .from("codes")
    .update({
      fg_color: fg,
      bg_color: bg,
      dot_style: dot,
      corner_style: corner,
      logo_url: logo,
    })
    .eq("id", codeId);

  revalidatePath(`/dashboard/codes/${codeId}`);
  revalidatePath("/dashboard/codes");
}

// Upgrade a static code to dynamic (editable + tracked). Note: this changes what
// the QR encodes, so it's only useful before the code has been printed.
export async function convertToDynamic(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  if (!codeId) return;
  const { supabase } = await currentWorkspaceId();
  await supabase.from("codes").update({ type: "dynamic" }).eq("id", codeId);
  revalidatePath(`/dashboard/codes/${codeId}`);
  revalidatePath("/dashboard/codes");
}
