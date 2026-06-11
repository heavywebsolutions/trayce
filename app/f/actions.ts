"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export type LeadState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(
  _prev: LeadState,
  formData: FormData
): Promise<LeadState> {
  const slug = String(formData.get("slug") || "");
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!slug) return { error: "Something went wrong." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "This form isn't accepting submissions right now." };
  }

  const { data: code } = await admin
    .from("codes")
    .select("id, workspace_id, action_type, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!code || code.action_type !== "lead" || code.status === "archived") {
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

  const { error } = await admin.from("leads").insert({
    code_id: code.id,
    workspace_id: code.workspace_id,
    email,
    name,
    phone,
    country: h.get("x-vercel-ip-country"),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
  });

  if (error) return { error: "Couldn't save that — please try again." };
  return { ok: true };
}
