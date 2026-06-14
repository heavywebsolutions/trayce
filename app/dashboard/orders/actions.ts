"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Confirm the order belongs to the signed-in user (RLS only lets them read
// their own), then return its id so we can update it via the service role.
async function ownedOrderId(formData: FormData): Promise<string | null> {
  const id = String(formData.get("id") || "");
  if (!id) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase
    .from("print_orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  return data ? (data.id as string) : null;
}

export async function approveProof(formData: FormData) {
  const id = await ownedOrderId(formData);
  if (!id) redirect("/dashboard/orders");
  await createAdminClient()
    .from("print_orders")
    .update({ status: "approved" })
    .eq("id", id);
  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?approved=1");
}

export async function requestProofChange(formData: FormData) {
  const id = await ownedOrderId(formData);
  if (!id) redirect("/dashboard/orders");
  const note = String(formData.get("note") || "").slice(0, 500);
  await createAdminClient()
    .from("print_orders")
    .update({ status: "changes_requested", proof_note: note || null })
    .eq("id", id);
  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders?change=1");
}
