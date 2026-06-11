"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import {
  CONTENT_TYPES,
  modeFor,
  buildPayload,
  hasRequired,
} from "@/lib/codeContent";

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

  const ctRaw = String(formData.get("content_type") || "url");
  const contentType = CONTENT_TYPES.some((t) => t.v === ctRaw) ? ctRaw : "url";

  let content: Record<string, string> = {};
  try {
    const parsed = JSON.parse(String(formData.get("content") || "{}"));
    if (parsed && typeof parsed === "object") content = parsed;
  } catch {
    /* ignore */
  }

  if (!hasRequired(contentType, content)) {
    return { error: "Fill in the required field for this type." };
  }
  if (contentType === "url" && !isValidUrl(content.url || "")) {
    return { error: "Enter a valid website URL (e.g. https://example.com)." };
  }

  const mode = modeFor(contentType);
  const type =
    mode === "url"
      ? String(formData.get("type")) === "static"
        ? "static"
        : "dynamic"
      : mode === "app"
        ? "dynamic"
        : "static";

  const destination = buildPayload(contentType, content);
  if (!destination) return { error: "Couldn't build this code's content." };

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
      content_type: contentType,
      content,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (contentType === "url" && type === "dynamic") {
    await supabase
      .from("code_destinations")
      .insert({ code_id: code.id, destination_url: destination });
  }

  revalidatePath("/dashboard/codes");
  revalidatePath("/dashboard");
  redirect(`/dashboard/codes/${code.id}`);
}

// Edit the structured content of a non-URL code (vCard, Wi-Fi, App, etc.) and
// rebuild what the code encodes/points to.
export async function updateContent(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  const ctRaw = String(formData.get("content_type") || "url");
  const contentType = CONTENT_TYPES.some((t) => t.v === ctRaw) ? ctRaw : "url";
  if (!codeId) return;

  let content: Record<string, string> = {};
  try {
    const parsed = JSON.parse(String(formData.get("content") || "{}"));
    if (parsed && typeof parsed === "object") content = parsed;
  } catch {
    return;
  }

  if (!hasRequired(contentType, content)) return;
  const destination = buildPayload(contentType, content);
  if (!destination) return;

  const { supabase } = await currentWorkspaceId();
  await supabase
    .from("codes")
    .update({
      destination_url: destination,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", codeId);

  revalidatePath(`/dashboard/codes/${codeId}`);
  revalidatePath("/dashboard/codes");
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

  const frameAllowed = ["none", "bottom", "top", "border"];
  const frameRaw = String(formData.get("frame_style") || "");
  const frame = frameAllowed.includes(frameRaw) ? frameRaw : "none";
  const frameColor = hex(formData.get("frame_color"), "#0A2540");
  const frameText =
    String(formData.get("frame_text") || "SCAN ME").slice(0, 24) || "SCAN ME";

  const { supabase } = await currentWorkspaceId();
  await supabase
    .from("codes")
    .update({
      fg_color: fg,
      bg_color: bg,
      dot_style: dot,
      corner_style: corner,
      logo_url: logo,
      frame_style: frame,
      frame_color: frameColor,
      frame_text: frameText,
    })
    .eq("id", codeId);

  revalidatePath(`/dashboard/codes/${codeId}`);
  revalidatePath("/dashboard/codes");
}

// Save the current design as a reusable workspace template.
export async function saveDesignTemplate(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim().slice(0, 60) || "Untitled";
  const { supabase, workspaceId } = await currentWorkspaceId();
  const settings = {
    fg_color: String(formData.get("fg_color") || "#0A2540"),
    bg_color: String(formData.get("bg_color") || "#FFFFFF"),
    dot_style: String(formData.get("dot_style") || "square"),
    corner_style: String(formData.get("corner_style") || "square"),
    frame_style: String(formData.get("frame_style") || "none"),
    frame_color: String(formData.get("frame_color") || "#0A2540"),
    frame_text: String(formData.get("frame_text") || "SCAN ME"),
  };
  await supabase
    .from("design_templates")
    .insert({ workspace_id: workspaceId, name, settings });
  revalidatePath("/dashboard/codes", "layout");
}

// Save an uploaded logo to the workspace library for reuse.
export async function saveLogoAsset(formData: FormData): Promise<void> {
  const dataUrl = String(formData.get("data_url") || "");
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > 400_000) return;
  const name = String(formData.get("name") || "Logo").slice(0, 60) || "Logo";
  const { supabase, workspaceId } = await currentWorkspaceId();
  await supabase
    .from("logo_assets")
    .insert({ workspace_id: workspaceId, name, data_url: dataUrl });
  revalidatePath("/dashboard/codes", "layout");
}

export async function deleteLogoAsset(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const { supabase } = await currentWorkspaceId();
  await supabase.from("logo_assets").delete().eq("id", id);
  revalidatePath("/dashboard/codes", "layout");
}

// Switch a code between plain redirect and lead-capture form.
export async function setActionType(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  const action = String(formData.get("action_type") || "");
  if (!codeId || !["redirect", "lead"].includes(action)) return;
  const { supabase } = await currentWorkspaceId();
  await supabase.from("codes").update({ action_type: action }).eq("id", codeId);
  revalidatePath(`/dashboard/codes/${codeId}`);
}

// Save the lead-capture form configuration (also flips the code to lead mode).
export async function saveLeadConfig(formData: FormData): Promise<void> {
  const codeId = String(formData.get("code_id") || "");
  if (!codeId) return;
  const str = (k: string, fallback: string, max = 200) =>
    (String(formData.get(k) || "").trim() || fallback).slice(0, max);
  const { supabase } = await currentWorkspaceId();
  await supabase
    .from("codes")
    .update({
      action_type: "lead",
      lead_headline: str("lead_headline", "Stay in the loop", 80),
      lead_subtext: str("lead_subtext", "Drop your info and we'll be in touch."),
      lead_button: str("lead_button", "Submit", 40),
      lead_collect_name: formData.get("lead_collect_name") === "on",
      lead_collect_phone: formData.get("lead_collect_phone") === "on",
      lead_success_message: str(
        "lead_success_message",
        "Thanks — you're on the list!"
      ),
    })
    .eq("id", codeId);
  revalidatePath(`/dashboard/codes/${codeId}`);
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
