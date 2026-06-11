export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", short: "IG" },
  { key: "facebook", label: "Facebook", short: "FB" },
  { key: "tiktok", label: "TikTok", short: "TT" },
  { key: "youtube", label: "YouTube", short: "YT" },
  { key: "x", label: "X / Twitter", short: "X" },
  { key: "website", label: "Website", short: "WWW" },
] as const;

// Extract a YouTube video id from common URL shapes.
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Pick black or white text for readability on a hex background.
export function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#FFFFFF";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0A2540" : "#FFFFFF";
}
