// Human-friendly formatting for scan metadata.

export function formatLocation(loc: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  const parts = [loc.city, loc.region].filter(Boolean) as string[];
  const place = parts.join(", ");
  if (place && loc.country) return `${place} · ${loc.country}`;
  if (place) return place;
  if (loc.country) return loc.country;
  return "Unknown location";
}

// Best-effort device/OS label from a user-agent string.
export function deviceLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Other";
}
