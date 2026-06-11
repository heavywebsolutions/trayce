"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type SubscribeState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const { error } = await admin.from("bio_subscribers").insert({
    page_id: page.id,
    workspace_id: page.workspace_id,
    email,
    country: h.get("x-vercel-ip-country"),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
  });
  if (error) return { error: "Couldn't save that — please try again." };
  return { ok: true };
}
