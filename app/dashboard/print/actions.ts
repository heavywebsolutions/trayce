"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { resolveDiscount } from "@/lib/promo";
import {
  getPrintProduct,
  priceFor,
  LOGO_PREP_CENTS,
  LOGO_PREP_LABEL,
  type PrintProduct,
  type PriceResult,
} from "@/lib/print/catalog";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://traxxr.com"
).replace(/\/$/, "");

// Shared Stripe Checkout session for a print order, used by both new orders and
// reorders so they never drift apart.
async function createPrintStripeSession(params: {
  product: PrintProduct;
  price: PriceResult;
  logoPrep: boolean;
  workspaceId: string;
  orderId: string;
  productKey: string;
  userEmail?: string | null;
  discounts?: { promotion_code: string }[];
}) {
  const { product, price, logoPrep, workspaceId, orderId, productKey } = params;
  return stripe.checkout.sessions.create({
    mode: "payment",
    ...(params.discounts ? { discounts: params.discounts } : {}),
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${product.name} · ${price.size.label} · ${price.finish.label}`,
          },
          unit_amount: price.unitPriceCents,
        },
        quantity: price.tier.qty,
      },
      ...(logoPrep
        ? [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${LOGO_PREP_LABEL} (logo cleanup + vectorization)`,
                },
                unit_amount: LOGO_PREP_CENTS,
              },
              quantity: 1,
            },
          ]
        : []),
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
    customer_email: params.userEmail ?? undefined,
    client_reference_id: workspaceId,
    metadata: { kind: "print_order", order_id: orderId, workspace_id: workspaceId },
    success_url: `${APP_URL}/dashboard/orders?ok=1`,
    cancel_url: `${APP_URL}/dashboard/print/${productKey}?canceled=1`,
  });
}

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
  // Print-ready logo: PNG or SVG only.
  const logoRaw = String(formData.get("logo") || "");
  const logo =
    (logoRaw.startsWith("data:image/png") ||
      logoRaw.startsWith("data:image/svg")) &&
    logoRaw.length < 1_600_000
      ? logoRaw
      : "";
  // Source file needing prep: JPEG or PDF.
  const prepRaw = String(formData.get("prep_source") || "");
  const prepSource =
    (prepRaw.startsWith("data:image/jpeg") ||
      prepRaw.startsWith("data:application/pdf")) &&
    prepRaw.length < 5_000_000
      ? prepRaw
      : "";
  const showUrl = String(formData.get("show_url") || "") === "true";
  const urlText = String(formData.get("url_text") || "").slice(0, 80);
  const urlPosition =
    String(formData.get("url_position") || "") === "top" ? "top" : "bottom";
  // Prep is forced when a non-print-ready source was uploaded, optional for PNG/SVG.
  const logoPrep =
    !!prepSource ||
    (String(formData.get("logo_prep") || "") === "true" && !!logo);

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
    prep_source: prepSource,
    show_url: showUrl ? "true" : "false",
    url_text: showUrl ? urlText : "",
    url_position: urlPosition,
    logo_prep: logoPrep ? "true" : "false",
  };

  const goodsTotal = price.totalCents + (logoPrep ? LOGO_PREP_CENTS : 0);

  const admin = createAdminClient();

  // Optional discount code, validated as a print-domain code (a subscription or
  // comp code is rejected here, so it can't be used to get free stickers).
  const promo = String(formData.get("promo") || "").trim();
  let discounts: { promotion_code: string }[] | undefined;
  if (promo) {
    const res = await resolveDiscount(admin, promo, "print");
    if (!res.ok) redirect(`/dashboard/print/${productKey}?err=promo`);
    discounts = [{ promotion_code: res.promotionCodeId as string }];
  }

  // Create a draft order up front so the full design (including an uploaded
  // logo, which is too large for Stripe metadata) is persisted. The webhook
  // flips it to proof_ready after payment.
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
      total_cents: goodsTotal,
      currency: "usd",
      status: "pending",
    })
    .select("id")
    .single();
  if (!order) redirect(`/dashboard/print/${productKey}?err=invalid`);

  const session = await createPrintStripeSession({
    product,
    price,
    logoPrep,
    workspaceId: ws.id,
    orderId: order.id as string,
    productKey,
    userEmail: user.email,
    discounts,
  });

  if (session.url) redirect(session.url);
  redirect(`/dashboard/print/${productKey}`);
}

// Reorder: copy a past order's exact design and quantity into a new draft and
// send the customer to checkout. Price is recomputed from the current catalog.
export async function reorderPrint(formData: FormData) {
  if (!stripeConfigured()) redirect("/dashboard/orders?err=unavailable");

  const orderId = String(formData.get("order_id") || "");
  if (!orderId) redirect("/dashboard/orders");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS ensures the user can only read their own orders.
  const { data: src } = await supabase
    .from("print_orders")
    .select("product_key, code_id, options, quantity")
    .eq("id", orderId)
    .maybeSingle();
  if (!src) redirect("/dashboard/orders");

  const options = (src.options ?? {}) as Record<string, unknown>;
  const sizeKey = typeof options.size === "string" ? options.size : "";
  const finishKey = typeof options.finish === "string" ? options.finish : "";
  const qty = (src.quantity as number) ?? 0;
  const productKey = src.product_key as string;

  const product = getPrintProduct(productKey);
  const price = priceFor(productKey, sizeKey, finishKey, qty);
  // If the catalog changed (size/qty no longer offered), send them to reconfigure.
  if (!product || !price) redirect(`/dashboard/print/${productKey}`);

  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!ws) redirect("/dashboard/orders");

  const logoPrep = options.logo_prep === "true";
  const goodsTotal = price.totalCents + (logoPrep ? LOGO_PREP_CENTS : 0);

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("print_orders")
    .insert({
      workspace_id: ws.id,
      code_id: src.code_id,
      product_key: productKey,
      product_name: product.name,
      options,
      quantity: qty,
      unit_price_cents: price.unitPriceCents,
      total_cents: goodsTotal,
      currency: "usd",
      status: "pending",
    })
    .select("id")
    .single();
  if (!order) redirect("/dashboard/orders");

  const session = await createPrintStripeSession({
    product,
    price,
    logoPrep,
    workspaceId: ws.id,
    orderId: order.id as string,
    productKey,
    userEmail: user.email,
  });

  if (session.url) redirect(session.url);
  redirect("/dashboard/orders");
}
