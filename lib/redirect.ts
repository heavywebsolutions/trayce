import { createAdminClient } from "@/lib/supabase/admin";

// Shared redirect logic, kept out of the route handler so the decision-making is
// pure and unit-testable.

export type RedirectCode = {
  id: string;
  workspace_id: string;
  destination_url: string;
  status: string;
  action_type: string | null;
  content_type: string | null;
  content: Record<string, string> | null;
};

// Direct, uncached slug -> code lookup. The redirect path is deliberately the
// simplest correct thing: one indexed read, then redirect. We considered a
// server-side cache and removed it before launch — at this scale a single-row
// indexed lookup is effectively free, and carrying ZERO staleness on
// re-pointable codes matters more than shaving milliseconds. If database reads
// ever become the redirect bottleneck at real scale, add an edge cache then,
// deliberately and with monitoring — not speculatively here.
export async function getRedirectCode(
  slug: string
): Promise<RedirectCode | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("codes")
    .select(
      "id, workspace_id, destination_url, status, action_type, content_type, content"
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as RedirectCode | null) ?? null;
}

// A code is servable (should redirect) unless it is missing or archived.
export function isServable(code: RedirectCode | null): code is RedirectCode {
  return !!code && code.status !== "archived";
}

// Decide the final destination for a servable code. Pure function: same inputs
// always give the same URL, which is what the unit tests assert.
export function resolveRedirectTarget(opts: {
  code: RedirectCode;
  slug: string;
  ua: string;
  appUrl: string;
}): string {
  const { code, slug, ua, appUrl } = opts;

  // Lead-capture codes route to the hosted form instead of an external URL.
  if (code.action_type === "lead") {
    return `${appUrl.replace(/\/$/, "")}/f/${slug}`;
  }

  // App codes: send each device to the right store, with a web fallback.
  if (code.content_type === "app") {
    const norm = (u: string) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);
    const c = (code.content || {}) as Record<string, string>;
    let target = c.fallback || code.destination_url;
    if (/iphone|ipad|ipod/i.test(ua) && c.ios) target = c.ios;
    else if (/android/i.test(ua) && c.android) target = c.android;
    return norm(target);
  }

  return code.destination_url;
}
