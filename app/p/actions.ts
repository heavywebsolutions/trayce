"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncContact } from "@/lib/integrations";

export type SubscribeState = { ok?: boolean; error?: string } | undefined;
export type BioFormState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitBioForm(
  _prev: BioFormState,
  formData: FormData
): Promise<BioFormState> {
  const linkId = String(formData.get("link_id") || "");
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!linkId) return { error: "Something went wrong." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "This form isn't accepting submissions right now." };
  }

  const { data: link } = await admin
    .from("bio_links")
    .select("id, page_id, workspace_id, title, kind")
    .eq("id", linkId)
    .maybeSingle();
  if (!link || link.kind !== "form") {
    return { error: "This form is no longer available." };
  }

  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const h = await headers();

  const geo = {
    country: h.get("x-vercel-ip-country"),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
  };

  const { error } = await admin.from("leads").insert({
    code_id: null,
    page_id: link.page_id,
    bio_link_id: link.id,
    workspace_id: link.workspace_id,
    source: link.title || "Bio form",
    email,
    name,
    phone,
    ...geo,
  });
  if (error) return { error: "Couldn't submit that, please try again." };

  await syncContact(link.workspace_id, {
    email,
    name,
    phone,
    source: link.title || "Bio form",
    ...geo,
  });
  return { ok: true };
}

export async function submitBioSubscribe(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const handle = String(formData.get("handle") || "").toLowerCase();
  const email = String(formData.get("email") || "").trim();
  if (!handle) return { error: "Something went wrong." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Not accepting sign-ups right now." };
  }

  const { data: page } = await admin
    .from("bio_pages")
    .select("id, workspace_id, published")
    .eq("handle", handle)
    .maybeSingle();
  if (!page || !page.published) return { error: "This page isn't available." };

  const decode = (v: string | null) => {
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const h = await headers();

  const geo = {
    country: h.get("x-vercel-ip-country"),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
  };

  const { error } = await admin.from("bio_subscribers").insert({
    page_id: page.id,
    workspace_id: page.workspace_id,
    email,
    ...geo,
  });
  if (error) return { error: "Couldn't save that, please try again." };

  await syncContact(page.workspace_id, {
    email,
    source: "Bio subscribe",
    ...geo,
  });
  return { ok: true };
}
