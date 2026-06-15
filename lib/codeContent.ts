import { normalizeUrl } from "@/lib/utils";

export type ContentMode = "url" | "app" | "direct";

export interface ContentTypeDef {
  v: string;
  label: string;
  mode: ContentMode;
  hint: string;
}

// The set of code types TRAXXR can generate.
export const CONTENT_TYPES: ContentTypeDef[] = [
  { v: "url", label: "Website", mode: "url", hint: "Open a link" },
  { v: "app", label: "App", mode: "app", hint: "Send to the right app store" },
  { v: "vcard", label: "vCard", mode: "direct", hint: "Save a contact" },
  { v: "wifi", label: "Wi-Fi", mode: "direct", hint: "Join a network" },
  { v: "text", label: "Text", mode: "direct", hint: "Show a message" },
  { v: "email", label: "Email", mode: "direct", hint: "Start an email" },
  { v: "sms", label: "SMS", mode: "direct", hint: "Pre-fill a text" },
  { v: "phone", label: "Call", mode: "direct", hint: "Dial a number" },
];

export type FieldType = "text" | "url" | "tel" | "email" | "textarea" | "select" | "checkbox";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { v: string; label: string }[];
}

export const FIELD_DEFS: Record<string, FieldDef[]> = {
  url: [{ name: "url", label: "Website URL", type: "url", placeholder: "https://example.com" }],
  app: [
    { name: "ios", label: "iOS App Store URL", type: "url", placeholder: "https://apps.apple.com/..." },
    { name: "android", label: "Google Play URL", type: "url", placeholder: "https://play.google.com/..." },
    { name: "fallback", label: "Fallback URL (other devices)", type: "url", placeholder: "https://yoursite.com" },
  ],
  vcard: [
    { name: "firstName", label: "First name", type: "text" },
    { name: "lastName", label: "Last name", type: "text" },
    { name: "org", label: "Company", type: "text" },
    { name: "title", label: "Title", type: "text" },
    { name: "phone", label: "Phone", type: "tel" },
    { name: "email", label: "Email", type: "email" },
    { name: "url", label: "Website", type: "url", placeholder: "https://" },
  ],
  wifi: [
    { name: "ssid", label: "Network name (SSID)", type: "text" },
    { name: "password", label: "Password", type: "text" },
    {
      name: "encryption",
      label: "Security",
      type: "select",
      options: [
        { v: "WPA", label: "WPA/WPA2" },
        { v: "WEP", label: "WEP" },
        { v: "nopass", label: "None" },
      ],
    },
    { name: "hidden", label: "Hidden network", type: "checkbox" },
  ],
  text: [{ name: "text", label: "Text", type: "textarea", placeholder: "Anything you want to show" }],
  email: [
    { name: "to", label: "To", type: "email", placeholder: "you@email.com" },
    { name: "subject", label: "Subject", type: "text" },
    { name: "body", label: "Message", type: "textarea" },
  ],
  sms: [
    { name: "number", label: "Phone number", type: "tel", placeholder: "+15555555555" },
    { name: "message", label: "Message", type: "textarea" },
  ],
  phone: [{ name: "number", label: "Phone number", type: "tel", placeholder: "+15555555555" }],
};

export function modeFor(contentType: string): ContentMode {
  return CONTENT_TYPES.find((t) => t.v === contentType)?.mode ?? "url";
}

export function isDirect(contentType: string): boolean {
  return modeFor(contentType) === "direct";
}

type Content = Record<string, string>;

// Escape special chars for the WIFI: payload format.
function wifiEscape(s: string): string {
  return (s || "").replace(/([\\;,:"])/g, "\\$1");
}

// The exact string the QR encodes for direct types, or the destination URL for url/app.
export function buildPayload(contentType: string, c: Content): string {
  switch (contentType) {
    case "url":
      return c.url ? normalizeUrl(c.url) : "";
    case "app":
      // The stored destination is the fallback; the engine device-detects at scan time.
      return c.fallback ? normalizeUrl(c.fallback) : c.ios || c.android || "";
    case "text":
      return c.text || "";
    case "phone":
      return `tel:${(c.number || "").replace(/[^\d+]/g, "")}`;
    case "sms":
      return `SMSTO:${(c.number || "").replace(/[^\d+]/g, "")}:${c.message || ""}`;
    case "email": {
      const params: string[] = [];
      if (c.subject) params.push(`subject=${encodeURIComponent(c.subject)}`);
      if (c.body) params.push(`body=${encodeURIComponent(c.body)}`);
      return `mailto:${c.to || ""}${params.length ? `?${params.join("&")}` : ""}`;
    }
    case "wifi": {
      const enc = c.encryption === "nopass" ? "nopass" : c.encryption || "WPA";
      const pwd = enc === "nopass" ? "" : `P:${wifiEscape(c.password)};`;
      const hidden = c.hidden === "true" || c.hidden === "on" ? "H:true;" : "";
      return `WIFI:T:${enc};S:${wifiEscape(c.ssid)};${pwd}${hidden};`;
    }
    case "vcard": {
      const lines = ["BEGIN:VCARD", "VERSION:3.0"];
      lines.push(`N:${c.lastName || ""};${c.firstName || ""}`);
      const fn = [c.firstName, c.lastName].filter(Boolean).join(" ");
      if (fn) lines.push(`FN:${fn}`);
      if (c.org) lines.push(`ORG:${c.org}`);
      if (c.title) lines.push(`TITLE:${c.title}`);
      if (c.phone) lines.push(`TEL:${c.phone}`);
      if (c.email) lines.push(`EMAIL:${c.email}`);
      if (c.url) lines.push(`URL:${normalizeUrl(c.url)}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    }
    default:
      return c.url || "";
  }
}

// Whether a content type's key field is present enough to create.
export function hasRequired(contentType: string, c: Content): boolean {
  switch (contentType) {
    case "url":
      return !!c.url?.trim();
    case "app":
      return !!(c.ios?.trim() || c.android?.trim() || c.fallback?.trim());
    case "vcard":
      return !!(c.firstName?.trim() || c.lastName?.trim());
    case "wifi":
      return !!c.ssid?.trim();
    case "text":
      return !!c.text?.trim();
    case "email":
      return !!c.to?.trim();
    case "sms":
    case "phone":
      return !!c.number?.trim();
    default:
      return false;
  }
}
