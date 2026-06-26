"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncContact } from "@/lib/integrations";

export type BookingLeadState = { ok?: boolean; error?: string } | undefined;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Capture a lead before the booking hand-off. Tags the lead with its placement +
// booking link + a readable source label, so it shows up in the leads inbox and
// rolls into booking attribution. The client forwards to the booker afterwards.
export async function submitBookingLead(
  _prev: BookingLeadState,
  formData: FormData
): Promise<BookingLeadState> {
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
    return { error: "This isn't accepting submissions right now." };
  }

  type PlacementRow = {
    id: string;
    booking_link_id: string;
    workspace_id: string;
    label: string;
    status: string;
    booking_links: { name: string; status: string } | { name: string; status: string }[] | null;
  };
  const { data } = await admin
    .from("booking_placements")
    .select(
      "id, booking_link_id, workspace_id, label, status, booking_links(name, status)"
    )
    .eq("slug", slug)
    .maybeSingle();
  const placement = data as unknown as PlacementRow | null;

  const link = Array.isArray(placement?.booking_links)
    ? placement?.booking_links[0]
    : placement?.booking_links;

  if (!placement || placement.status === "archived" || !link) {
    return { error: "This booking link is no longer available." };
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

  // Source label reads cleanly in the leads inbox: "Booking · Flash sheet".
  const source = `Booking · ${placement.label}`;

  const { error } = await admin.from("leads").insert({
    workspace_id: placement.workspace_id,
    booking_link_id: placement.booking_link_id,
    placement_id: placement.id,
    email,
    name,
    phone,
    source,
    ...geo,
  });

  if (error) return { error: "Couldn't save that, please try again." };

  await syncContact(placement.workspace_id, {
    email,
    name,
    phone,
    source,
    ...geo,
  });
  return { ok: true };
}
