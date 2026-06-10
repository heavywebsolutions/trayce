// Cloudflare Worker — the production redirect engine.
// Deploy this on your short-link domain. It mirrors /app/r/[code]/route.ts but runs
// at Cloudflare's edge for sub-50ms global redirects. Logging never blocks the redirect.

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  FALLBACK_URL: string; // where to send unknown/archived codes, e.g. your marketing site
}

interface CodeRow {
  id: string;
  workspace_id: string;
  destination_url: string;
  status: string;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // Accept both /slug and /r/slug
    const slug = url.pathname.replace(/^\/(r\/)?/, "").split("/")[0];
    const fallback = env.FALLBACK_URL || "https://example.com";

    if (!slug) return Response.redirect(fallback, 302);

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    };

    const lookup = await fetch(
      `${env.SUPABASE_URL}/rest/v1/codes?slug=eq.${encodeURIComponent(
        slug
      )}&select=id,workspace_id,destination_url,status&limit=1`,
      { headers }
    );

    const rows = (await lookup.json()) as CodeRow[];
    const code = rows?.[0];
    if (!code || code.status === "archived") {
      return Response.redirect(fallback, 302);
    }

    // Log the scan asynchronously — the visitor is already being redirected.
    ctx.waitUntil(
      (async () => {
        const ua = request.headers.get("user-agent") || "";
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "";
        const ipHash = ip ? await sha256Hex(ip) : null;
        const country = (request as any).cf?.country ?? null;

        const scanRes = await fetch(`${env.SUPABASE_URL}/rest/v1/scans`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({
            code_id: code.id,
            workspace_id: code.workspace_id,
            user_agent: ua.slice(0, 500),
            referrer: request.headers.get("referer"),
            ip_hash: ipHash,
            device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
            country,
          }),
        });

        await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/increment_scan`, {
          method: "POST",
          headers,
          body: JSON.stringify({ p_code_id: code.id }),
        });

        try {
          const scan = ((await scanRes.json()) as { id: string }[])?.[0];
          if (scan?.id) {
            await fetch(`${env.SUPABASE_URL}/rest/v1/attribution_events`, {
              method: "POST",
              headers,
              body: JSON.stringify({
                workspace_id: code.workspace_id,
                scan_id: scan.id,
                code_id: code.id,
                event_type: "scan",
                source: "redirect",
              }),
            });
          }
        } catch {
          /* logging best-effort */
        }
      })()
    );

    return Response.redirect(code.destination_url, 302);
  },
};
