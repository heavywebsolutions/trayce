import QRCode from "qrcode";

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
