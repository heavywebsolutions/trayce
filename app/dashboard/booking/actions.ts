"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";
import { normalizeUrl, isValidUrl } from "@/lib/utils";
import { isBookingChannel } from "@/lib/booking";
import { loadEntitlements } from "@/lib/plan";

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

  if (!ws) throw new Error("No workspace found for this account.");
  return { supabase, workspaceId: ws.id as string, userId: user.id };
}

async function requireBookingGate(): Promise<string | null> {
  const gate = await loadEntitlements();
  if (gate && !gate.ent.bookingAttribution) {
    return "Booking attribution is a Growth feature. Upgrade to turn your existing booker into a measurable, lead-capturing channel.";
  }
  return null;
}

function dollarsToCents(raw: string): number | null {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export type BookingFormState = { error?: string } | undefined;

// --- Booking links -----------------------------------------------------

export async function createBookingLink(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const gateErr = await requireBookingGate();
  if (gateErr) return { error: gateErr };

  const name = String(formData.get("name") || "").trim() || "Bookings";
  const urlRaw = String(formData.get("destination_url") || "").trim();
  if (!isValidUrl(urlRaw)) {
    return { error: "Enter a valid booking URL (e.g. squareup.com/appointments/...)." };
  }

  const { supabase, workspaceId } = await currentWorkspace();
  const { data: link, error } = await supabase
    .from("booking_links")
    .insert({
      workspace_id: workspaceId,
      name,
      destination_url: normalizeUrl(urlRaw),
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/booking");
  redirect(`/dashboard/booking/${link.id}`);
}

export async function updateBookingLink(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const name = String(formData.get("name") || "").trim() || "Bookings";
  const urlRaw = String(formData.get("destination_url") || "").trim();
  const captureLead = formData.get("capture_lead") === "on";
  const collectPhone = formData.get("capture_collect_phone") === "on";
  const avgCents = dollarsToCents(String(formData.get("avg_value") || ""));

  if (!isValidUrl(urlRaw)) return;

  const { supabase } = await currentWorkspace();
  await supabase
    .from("booking_links")
    .update({
      name,
      destination_url: normalizeUrl(urlRaw),
      capture_lead: captureLead,
      capture_collect_phone: collectPhone,
      avg_value_cents: avgCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/dashboard/booking/${id}`);
}

export async function setBookingLinkStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["active", "paused", "archived"].includes(status)) return;

  const { supabase } = await currentWorkspace();
  await supabase
    .from("booking_links")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (status === "archived") {
    revalidatePath("/dashboard/booking");
    redirect("/dashboard/booking");
  }
  revalidatePath(`/dashboard/booking/${id}`);
}

// --- Placements --------------------------------------------------------

export async function addPlacement(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const gateErr = await requireBookingGate();
  if (gateErr) return { error: gateErr };

  const linkId = String(formData.get("booking_link_id") || "");
  const label = String(formData.get("label") || "").trim() || "Placement";
  const channelRaw = String(formData.get("channel") || "in_person");
  const channel = isBookingChannel(channelRaw) ? channelRaw : "in_person";
  if (!linkId) return { error: "Something went wrong." };

  const { supabase, workspaceId } = await currentWorkspace();

  // Confirm the link belongs to this workspace (RLS also enforces this).
  const { data: link } = await supabase
    .from("booking_links")
    .select("id")
    .eq("id", linkId)
    .maybeSingle();
  if (!link) return { error: "Booking link not found." };

  let slug = generateSlug();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await supabase
      .from("booking_placements")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = generateSlug();
  }

  const { error } = await supabase.from("booking_placements").insert({
    booking_link_id: linkId,
    workspace_id: workspaceId,
    label,
    channel,
    slug,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/booking/${linkId}`);
}

export async function archivePlacement(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  const linkId = String(formData.get("booking_link_id") || "");
  if (!id) return;

  const { supabase } = await currentWorkspace();
  await supabase
    .from("booking_placements")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/dashboard/booking/${linkId}`);
}

// --- Mark booked (revenue) --------------------------------------------

export async function setLeadBooked(formData: FormData): Promise<void> {
  const leadId = String(formData.get("lead_id") || "");
  const linkId = String(formData.get("booking_link_id") || "");
  const booked = formData.get("booked") === "true";
  const valueCents = dollarsToCents(String(formData.get("value") || ""));
  if (!leadId) return;

  const { supabase } = await currentWorkspace();
  await supabase
    .from("leads")
    .update({
      booked,
      booked_value_cents: booked ? valueCents : null,
      booked_at: booked ? new Date().toISOString() : null,
    })
    .eq("id", leadId);

  revalidatePath(`/dashboard/booking/${linkId}`);
}
