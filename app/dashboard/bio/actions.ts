"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeUrl } from "@/lib/utils";
import { SOCIAL_PLATFORMS } from "@/lib/bio";
import { productHandleFromInput, fetchShopifyProduct } from "@/lib/shopify";
import { decryptSecret } from "@/lib/crypto";
import { RESERVED_HANDLES } from "@/lib/reserved";

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

const hex = (v: unknown, fallback: string) =>
  typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;

export type BioFormState = { error?: string } | undefined;

export async function createBioPage(
  _prev: BioFormState,
  formData: FormData
): Promise<BioFormState> {
  const handle = String(formData.get("handle") || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(handle)) {
    return { error: "Handle must be 3–30 letters, numbers, or hyphens." };
  }
  if (RESERVED_HANDLES.has(handle)) {
    return { error: "That handle is reserved — try another." };
  }
  const display_name = String(formData.get("display_name") || "").trim() || handle;

  const { supabase, workspaceId } = await currentWorkspace();

  const { data: existing } = await supabase
    .from("bio_pages")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (existing) return { error: "That handle is taken — try another." };

  const { data: page, error } = await supabase
    .from("bio_pages")
    .insert({ workspace_id: workspaceId, handle, display_name })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/dashboard/bio");
  redirect(`/dashboard/bio/${page.id}`);
}

export async function updateBioPage(formData: FormData): Promise<void> {
  const pageId = String(formData.get("page_id") || "");
  if (!pageId) return;
  const { supabase } = await currentWorkspace();

  const socials: Record<string, string> = {};
  for (const s of SOCIAL_PLATFORMS) {
    const v = String(formData.get(`social_${s.key}`) || "").trim();
    if (v) socials[s.key] = normalizeUrl(v);
  }

  const avatarRaw = formData.get("avatar_url");
  const avatar =
    typeof avatarRaw === "string" &&
    avatarRaw.startsWith("data:image/") &&
    avatarRaw.length < 400_000
      ? avatarRaw
      : typeof avatarRaw === "string" && avatarRaw === ""
        ? null
        : undefined; // undefined = leave unchanged

  const bgRaw = formData.get("bg_image_url");
  const bgImage =
    typeof bgRaw === "string" &&
    bgRaw.startsWith("data:image/") &&
    bgRaw.length < 1_200_000
      ? bgRaw
      : typeof bgRaw === "string" && bgRaw === ""
        ? null
        : undefined;

  // Custom domain: normalize to a bare host (lowercase, no protocol/path).
  const domRaw = String(formData.get("custom_domain") || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const custom_domain = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domRaw) ? domRaw : null;

  const update: Record<string, unknown> = {
    display_name: String(formData.get("display_name") || "").slice(0, 80),
    tagline: String(formData.get("tagline") || "").slice(0, 160),
    custom_domain,
    bg_color: hex(formData.get("bg_color"), "#0A2540"),
    accent_color: hex(formData.get("accent_color"), "#4F46E5"),
    button_text_color: hex(formData.get("button_text_color"), "#FFFFFF"),
    font_family: ["sans", "serif", "mono", "rounded", "condensed"].includes(
      String(formData.get("font_family"))
    )
      ? String(formData.get("font_family"))
      : "sans",
    bg_fit: ["cover", "tile", "solid"].includes(String(formData.get("bg_fit")))
      ? String(formData.get("bg_fit"))
      : "cover",
    framed: formData.get("framed") === "on",
    panel_color: hex(formData.get("panel_color"), "#000000"),
    socials,
    updated_at: new Date().toISOString(),
  };
  if (avatar !== undefined) update.avatar_url = avatar;
  if (bgImage !== undefined) update.bg_image_url = bgImage;

  await supabase.from("bio_pages").update(update).eq("id", pageId);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function addBioLink(formData: FormData): Promise<void> {
  const pageId = String(formData.get("page_id") || "");
  const kind = [
    "link",
    "header",
    "video",
    "subscribe",
    "text",
    "image",
    "form",
    "product",
  ].includes(String(formData.get("kind")))
    ? String(formData.get("kind"))
    : "link";
  if (!pageId) return;

  const { supabase, workspaceId } = await currentWorkspace();

  const { data: last } = await supabase
    .from("bio_links")
    .select("position")
    .eq("page_id", pageId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (last?.position ?? -1) + 1;

  const rawUrl = String(formData.get("url") || "").trim();
  await supabase.from("bio_links").insert({
    page_id: pageId,
    workspace_id: workspaceId,
    kind,
    title: String(formData.get("title") || "").slice(0, 120),
    url: kind === "header" ? "" : rawUrl ? normalizeUrl(rawUrl) : "",
    position,
  });
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function updateBioLink(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  if (!id) return;
  const { supabase } = await currentWorkspace();
  const rawUrl = String(formData.get("url") || "").trim();
  await supabase
    .from("bio_links")
    .update({
      title: String(formData.get("title") || "").slice(0, 120),
      url: rawUrl ? normalizeUrl(rawUrl) : "",
    })
    .eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function updateBioLinkConfig(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  if (!id) return;
  const config = {
    button: String(formData.get("button") || "Submit").slice(0, 40) || "Submit",
    success:
      String(formData.get("success") || "Thanks — we'll be in touch!").slice(
        0,
        160
      ) || "Thanks — we'll be in touch!",
    collect_name: formData.get("collect_name") === "on",
    collect_phone: formData.get("collect_phone") === "on",
  };
  const { supabase } = await currentWorkspace();
  await supabase.from("bio_links").update({ config }).eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

// Resolve a Shopify product (live) and cache it on the block.
export async function fetchBioProduct(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  const handle = productHandleFromInput(String(formData.get("product_input") || ""));
  if (!id || !handle) return;

  const { supabase, workspaceId } = await currentWorkspace();
  const { data: integ } = await supabase
    .from("integrations")
    .select("endpoint, api_key, enabled")
    .eq("workspace_id", workspaceId)
    .eq("provider", "shopify")
    .maybeSingle();
  if (!integ?.endpoint || !integ.api_key) return;

  const token = decryptSecret(integ.api_key as string);
  if (!token) return;

  const product = await fetchShopifyProduct(
    integ.endpoint as string,
    token,
    handle
  );
  if (!product) return;

  await supabase
    .from("bio_links")
    .update({ title: product.title, url: product.url, config: { product } })
    .eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function setBioLinkThumbnail(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  if (!id) return;
  const raw = formData.get("thumbnail_url");
  const thumb =
    typeof raw === "string" &&
    raw.startsWith("data:image/") &&
    raw.length < 400_000
      ? raw
      : null;
  const { supabase } = await currentWorkspace();
  await supabase.from("bio_links").update({ thumbnail_url: thumb }).eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function deleteBioLink(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  if (!id) return;
  const { supabase } = await currentWorkspace();
  await supabase.from("bio_links").delete().eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function toggleBioLink(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  if (!id) return;
  // The form sends the current state; we flip it.
  const currentlyHidden = String(formData.get("hidden") || "") === "true";
  const { supabase } = await currentWorkspace();
  await supabase
    .from("bio_links")
    .update({ hidden: !currentlyHidden })
    .eq("id", id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function reorderBioLinks(formData: FormData): Promise<void> {
  const pageId = String(formData.get("page_id") || "");
  if (!pageId) return;
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("ids") || "[]"));
    if (Array.isArray(parsed))
      ids = parsed.filter((x) => typeof x === "string");
  } catch {
    return;
  }
  const { supabase } = await currentWorkspace();
  await Promise.all(
    ids.map((id, i) =>
      supabase.from("bio_links").update({ position: i }).eq("id", id)
    )
  );
  revalidatePath(`/dashboard/bio/${pageId}`);
}

export async function moveBioLink(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const pageId = String(formData.get("page_id") || "");
  const dir = String(formData.get("dir") || "");
  if (!id || !pageId) return;
  const { supabase } = await currentWorkspace();

  const { data: rows } = await supabase
    .from("bio_links")
    .select("id, position")
    .eq("page_id", pageId)
    .order("position", { ascending: true });
  if (!rows) return;

  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const swapIdx = dir === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;

  const a = rows[idx];
  const b = rows[swapIdx];
  await supabase.from("bio_links").update({ position: b.position }).eq("id", a.id);
  await supabase.from("bio_links").update({ position: a.position }).eq("id", b.id);
  revalidatePath(`/dashboard/bio/${pageId}`);
}
