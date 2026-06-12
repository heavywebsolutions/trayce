import type { BioProduct } from "@/lib/types";

// Pull a product handle out of a Shopify URL or accept a bare handle.
export function productHandleFromInput(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  const m = s.match(/\/products\/([a-z0-9_-]+)/i);
  if (m) return m[1].toLowerCase();
  if (/^[a-z0-9_-]+$/i.test(s)) return s.toLowerCase();
  return null;
}

// Fetch live product data from the Shopify Storefront API (read-only, public token).
export async function fetchShopifyProduct(
  shop: string,
  token: string,
  handle: string
): Promise<BioProduct | null> {
  const domain = shop.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const query = `query($handle:String!){
    product(handle:$handle){
      title
      onlineStoreUrl
      featuredImage { url }
      priceRange { minVariantPrice { amount currencyCode } }
    }
  }`;
  try {
    const res = await fetch(`https://${domain}/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Storefront-Access-Token": token,
        "content-type": "application/json",
      },
      body: JSON.stringify({ query, variables: { handle } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const p = json?.data?.product;
    if (!p) return null;
    const amount = p.priceRange?.minVariantPrice?.amount;
    return {
      handle,
      title: p.title,
      image: p.featuredImage?.url ?? null,
      price: amount ? String(amount) : null,
      currency: p.priceRange?.minVariantPrice?.currencyCode ?? null,
      url: p.onlineStoreUrl || `https://${domain}/products/${handle}`,
    };
  } catch {
    return null;
  }
}

export function formatPrice(price: string | null, currency: string | null): string {
  if (!price) return "";
  const n = Number(price);
  if (Number.isNaN(n)) return price;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(n);
  } catch {
    return `${currency || ""} ${n.toFixed(2)}`.trim();
  }
}
