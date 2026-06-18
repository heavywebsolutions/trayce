"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/lifecycle";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.email)) redirect("/dashboard");
}

export async function markPrinting(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  await createAdminClient()
    .from("print_orders")
    .update({ status: "printing" })
    .eq("id", id);
  revalidatePath("/dashboard/admin/orders");
}

export async function markShipped(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") || "");
  const tracking = String(formData.get("tracking") || "").slice(0, 120) || null;
  const trackingUrl =
    String(formData.get("tracking_url") || "").slice(0, 300) || null;
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("print_orders")
    .update({
      status: "shipped",
      tracking_number: tracking,
      tracking_url: trackingUrl,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, product_name, customer_email")
    .maybeSingle();

  // Let the customer know it shipped, with tracking if we have it.
  if (order?.customer_email) {
    const tmpl = await renderEmail(admin, "shipped", {
      orderId: order.id as string,
      productName: (order.product_name as string) ?? "order",
      tracking,
      trackingUrl,
    });
    await sendEmail({
      to: order.customer_email as string,
      subject: tmpl.subject,
      html: tmpl.html,
    }).catch(() => {});
  }
  revalidatePath("/dashboard/admin/orders");
}
