"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { getPrintProduct, priceFor } from "@/lib/print/catalog";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

// Create a one-time Stripe Checkout (mode=payment) for a physical print order.
// Price is recomputed server-side from the catalog so the client cannot tamper
// with it. The order row is created by the webhook on completion.
export async function createPrintCheckout(formData: FormData) {
  if (!stripeConfigured()) redirect("/dashboard/print?err=unavailable");

  const productKey = String(formData.get("product_key") || "");
  const sizeKey = String(formData.get("size") || "");
  const finishKey = String(formData.get("finish") || "");
  const qty = parseInt(String(formData.get("qty") || "0"), 10);
  const codeId = String(formData.get("code_id") || "") || null;

  // Decal options, sanitized.
  const hex = (v: unknown, fallback: string) =>
    typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
  const shapeRaw = String(formData.get("shape") || "");
  const shape = ["square", "rounded", "circle"].includes(shapeRaw)
    ? shapeRaw
    : "rounded";
  const bgColor = hex(formData.get("bg_color"), "#FFFFFF");
  const border = String(formData.get("border") || "") === "true";
  const borderColor = hex(formData.get("border_color"), "#0A2540");
  const cta = String(formData.get("cta") || "").slice(0, 40);
  const ctaPosition =
    String(formData.get("cta_position") || "") === "above" ? "above" : "below";
  const ctaUppercase = String(formData.get("cta_uppercase") || "true") !== "false";
  const font = String(formData.get("font") || "inter").slice(0, 24);
  const logoRaw = String(formData.get("logo") || "");
  const logo =
    logoRaw.startsWith("data:image/") && logoRaw.length < 400_000
      ? logoRaw
      : "";
  const showUrl = String(formData.get("show_url") || "") === "true";
  const urlText = String(formData.get("url_text") || "").slice(0, 80);
  const urlPosition =
    String(formData.get("url_position") || "") === "top" ? "top" : "bottom";

  const product = getPrintProduct(productKey);
  const price = priceFor(productKey, sizeKey, finishKey, qty);
  if (!product || !price) {
    redirect(`/dashboard/print/${productKey}?err=invalid`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ws) redirect("/dashboard/print");

  const options = {
    size: sizeKey,
    finish: finishKey,
    shape,
    bg_color: bgColor,
    border: border ? "true" : "false",
    border_color: borderColor,
    cta,
    cta_position: ctaPosition,
    cta_uppercase: ctaUppercase ? "true" : "false",
    font,
    logo: logo,
    show_url: showUrl ? "true" : "false",
    url_text: showUrl ? urlText : "",
    url_position: urlPosition,
  };

  // Create a draft order up front so the full design (including an uploaded
  // logo, which is too large for Stripe metadata) is persisted. The webhook
  // flips it to proof_ready after payment.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("print_orders")
    .insert({
      workspace_id: ws.id,
      code_id: codeId,
      product_key: productKey,
      product_name: product.name,
      options,
      quantity: qty,
      unit_price_cents: price.unitPriceCents,
      total_cents: price.totalCents,
      currency: "usd",
      status: "pending",
    })
    .select("id")
    .single();
  if (!order) redirect(`/dashboard/print/${productKey}?err=invalid`);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.name} · ${price.size.label} · ${price.finish.label}`,
          },
          unit_amount: price.unitPriceCents,
        },
        quantity: qty,
      },
    ],
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 600, currency: "usd" },
          display_name: "Standard shipping",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
    ],
    customer_email: user.email ?? undefined,
    client_reference_id: ws.id,
    metadata: {
      kind: "print_order",
      order_id: order.id,
      workspace_id: ws.id,
    },
    success_url: `${APP_URL}/dashboard/orders?ok=1`,
    cancel_url: `${APP_URL}/dashboard/print/${productKey}?canceled=1`,
  });

  if (session.url) redirect(session.url);
  redirect(`/dashboard/print/${productKey}`);
}
