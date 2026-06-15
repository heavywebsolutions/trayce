import QRCode from "qrcode";
import { modeFor } from "@/lib/codeContent";

// Generate a crisp SVG QR code for a given URL. Server-side only.
export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#0A2540", light: "#FFFFFF" },
    width: 240,
  });
}

export function redirectUrlFor(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_REDIRECT_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/r/${slug}`;
}

// What the QR actually encodes.
//
// URL and app codes ALWAYS route through our /r/<slug> redirect, even on the
// free plan and even for "static" codes. This means a printed code can always be
// re-pointed later: the redirect is free, editing the destination is the paid
// gate. So a free user who prints a code and then upgrades can fix every printed
// piece without reprinting.
//
// "direct" codes (vCard, Wi-Fi, text, email, SMS, phone) must carry their data
// in the QR itself, so those encode their payload directly and cannot be tracked
// or re-pointed by nature.
export function qrContentFor(code: {
  type?: string;
  slug: string;
  destination_url: string;
  content_type?: string;
}): string {
  const mode = modeFor(code.content_type ?? "url");
  if (mode === "direct") return code.destination_url;
  return redirectUrlFor(code.slug);
}
