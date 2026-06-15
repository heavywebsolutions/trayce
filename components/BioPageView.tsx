import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { effectivePlan, entitlementsFor } from "@/lib/plan";
import { activeBioPageIds } from "@/lib/bioLimit";
import { SOCIAL_PLATFORMS, youtubeId, readableOn, fontStack } from "@/lib/bio";
import { ShareButton } from "@/components/ShareButton";
import { BioSubscribeBlock } from "@/components/BioSubscribeBlock";
import { BioFormBlock } from "@/components/BioFormBlock";
import { BioVideo } from "@/components/BioVideo";
import { SocialIcon } from "@/components/SocialIcon";
import { formatPrice } from "@/lib/shopify";
import type { BioPage, BioLink } from "@/lib/types";

export async function BioPageView({
  handle,
  preview = false,
}: {
  handle: string;
  preview?: boolean;
}) {
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    notFound();
  }

  const { data: page } = await admin
    .from("bio_pages")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (!page) notFound();
  // In preview mode (the editor's iframe) we render even an unpublished draft.
  if (!page.published && !preview) notFound();
  const p = page as BioPage;

  // Freemium enforcement: a free workspace over its page limit keeps one page
  // live. Visits to a parked page bounce to the active one. Paid/trial/comp
  // plans have an unlimited limit, so this whole block is skipped for them.
  // Never enforce inside the editor preview.
  if (!preview) {
    const { data: ws } = await admin
      .from("workspaces")
      .select("plan, comp, trial_ends_at")
      .eq("id", p.workspace_id)
      .maybeSingle();
    const limit = entitlementsFor(effectivePlan(ws).key).bioPageLimit;
    if (isFinite(limit)) {
      const { data: sib } = await admin
        .from("bio_pages")
        .select("id, handle, created_at, paused")
        .eq("workspace_id", p.workspace_id);
      const siblings = sib ?? [];
      const live = activeBioPageIds(siblings, limit);
      if (!live.has(p.id)) {
        const target = siblings
          .filter((x) => live.has(x.id))
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          )[0];
        if (target?.handle) redirect(`/@${target.handle}`);
        notFound();
      }
    }
  }

  const { data: linkRows } = await admin
    .from("bio_links")
    .select("*")
    .eq("page_id", p.id)
    .eq("hidden", false)
    .order("position", { ascending: true });
  const links = (linkRows ?? []) as BioLink[];

  // Count the visit, but never in the editor preview, and skip obvious bots
  // (crawlers, link unfurlers, uptime checks) plus rapid repeat loads from the
  // same visitor, so the numbers stay honest. All best-effort: any failure here
  // never blocks the page render.
  if (!preview)
    try {
      const h = await headers();
      const ua = h.get("user-agent") || "";
      const isBot =
        /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|whatsapp|telegram|slackbot|discordbot|preview|monitor|uptime|headless|lighthouse|pingdom|curl|wget|python-requests|axios|go-http|node-fetch/i.test(
          ua
        );
      if (!isBot) {
        const ip =
          h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
        const ipHash = ip
          ? createHash("sha256").update(ip).digest("hex").slice(0, 32)
          : null;

        // De-dupe: the same hashed IP counts at most once per 30 minutes.
        let repeat = false;
        if (ipHash) {
          const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
          const { data: recent } = await admin
            .from("bio_events")
            .select("id")
            .eq("page_id", p.id)
            .eq("type", "view")
            .eq("ip_hash", ipHash)
            .gte("created_at", since)
            .limit(1)
            .maybeSingle();
          repeat = Boolean(recent);
        }

        if (!repeat) {
          const decode = (v: string | null) => {
            if (!v) return null;
            try {
              return decodeURIComponent(v);
            } catch {
              return v;
            }
          };
          await admin.rpc("increment_bio_view", { p_page_id: p.id });
          await admin.from("bio_events").insert({
            page_id: p.id,
            workspace_id: p.workspace_id,
            type: "view",
            device_type: /mobile/i.test(ua) ? "mobile" : "desktop",
            ip_hash: ipHash,
            user_agent: ua.slice(0, 500),
            country: h.get("x-vercel-ip-country"),
            region: decode(h.get("x-vercel-ip-country-region")),
            city: decode(h.get("x-vercel-ip-city")),
          });
        }
      }
    } catch {
      /* ignore */
    }

  const onBg = readableOn(p.bg_color);
  const socials = p.socials || {};

  const bgStyle: React.CSSProperties = {
    backgroundColor: p.bg_color,
    color: onBg,
  };
  if (p.bg_image_url && p.bg_fit !== "solid") {
    bgStyle.backgroundImage = `url(${p.bg_image_url})`;
    if (p.bg_fit === "tile") {
      bgStyle.backgroundRepeat = "repeat";
      bgStyle.backgroundSize = "300px auto";
    } else {
      bgStyle.backgroundSize = "cover";
      bgStyle.backgroundPosition = "center";
    }
  }
  const contentColor = p.framed ? readableOn(p.panel_color) : onBg;

  return (
    <main
      className="min-h-screen w-full px-5 py-6"
      style={{ ...bgStyle, fontFamily: fontStack(p.font_family) }}
    >
      <div className="mx-auto mb-2 flex w-full max-w-md items-center justify-end">
        <ShareButton
          url={`/@${handle}`}
          title={p.display_name || handle}
          color={onBg}
        />
      </div>
      <div
        className="mx-auto w-full max-w-md"
        style={
          p.framed
            ? {
                backgroundColor: p.panel_color,
                color: contentColor,
                borderRadius: 24,
                padding: "28px 20px",
                marginBottom: 24,
              }
            : { color: contentColor }
        }
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {p.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.avatar_url}
              alt={p.display_name}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-white/20"
            />
          )}
          <h1 className="mt-4 text-2xl font-bold">{p.display_name || handle}</h1>
          {p.tagline && <p className="mt-1 text-sm opacity-80">{p.tagline}</p>}

          {/* Socials */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {SOCIAL_PLATFORMS.map((s) =>
              socials[s.key] ? (
                <a
                  key={s.key}
                  href={socials[s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full"
                  style={{
                    backgroundColor: p.accent_color,
                    color: p.button_text_color,
                  }}
                  aria-label={s.label}
                >
                  <SocialIcon platform={s.key} className="h-5 w-5" />
                </a>
              ) : null
            )}
          </div>
        </div>

        {/* Blocks */}
        <div className="mt-8 space-y-3">
          {links.map((l) => {
            if (l.kind === "header") {
              return (
                <p
                  key={l.id}
                  className="pt-3 text-center text-xs font-semibold uppercase tracking-widest opacity-70"
                >
                  {l.title}
                </p>
              );
            }
            if (l.kind === "text") {
              return (
                <p
                  key={l.id}
                  className="whitespace-pre-line text-center text-sm opacity-90"
                >
                  {l.title}
                </p>
              );
            }
            if (l.kind === "image") {
              if (!l.thumbnail_url) return null;
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={l.id}
                  src={l.thumbnail_url}
                  alt={l.title || ""}
                  className="w-full rounded-2xl"
                />
              );
            }
            if (l.kind === "product") {
              const pr = l.config?.product;
              if (!pr) return null;
              return (
                <a
                  key={l.id}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 transition hover:opacity-90"
                >
                  {pr.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pr.image}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{pr.title}</p>
                    {pr.price && (
                      <p className="text-sm opacity-80">
                        {formatPrice(pr.price, pr.currency)}
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-xl px-3 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: p.accent_color,
                      color: p.button_text_color,
                    }}
                  >
                    Shop
                  </span>
                </a>
              );
            }
            if (l.kind === "form") {
              return (
                <BioFormBlock
                  key={l.id}
                  linkId={l.id}
                  title={l.title}
                  config={l.config || {}}
                  accent={p.accent_color}
                  textColor={p.button_text_color}
                />
              );
            }
            if (l.kind === "subscribe") {
              return (
                <BioSubscribeBlock
                  key={l.id}
                  handle={handle.toLowerCase()}
                  title={l.title}
                  accent={p.accent_color}
                  textColor={p.button_text_color}
                />
              );
            }
            if (l.kind === "video") {
              const vid = youtubeId(l.url);
              if (!vid) {
                return (
                  <div
                    key={l.id}
                    className="flex items-center gap-3 rounded-2xl border border-dashed px-4 py-4 text-sm opacity-60"
                    style={{ borderColor: "currentColor" }}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/10 text-base">
                      ▶
                    </span>
                    <span>{l.title || "Video"} · add a YouTube link</span>
                  </div>
                );
              }
              return (
                <div key={l.id} className="space-y-2">
                  {l.title && (
                    <p className="text-center text-sm font-semibold opacity-90">
                      {l.title}
                    </p>
                  )}
                  <BioVideo videoId={vid} title={l.title ?? undefined} />
                </div>
              );
            }
            // standard link (click-tracked via /l/[id])
            return (
              <a
                key={l.id}
                href={`/l/${l.id}`}
                className="flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-semibold shadow-sm transition hover:opacity-90"
                style={{
                  backgroundColor: p.accent_color,
                  color: p.button_text_color,
                }}
              >
                {l.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.thumbnail_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                )}
                <span className="flex-1 text-center">{l.title}</span>
                {l.thumbnail_url && <span className="w-10 shrink-0" />}
              </a>
            );
          })}
        </div>

        {/* Growth CTA, like Linktree's "Join X" button. */}
        <div className="mt-10 flex justify-center">
          <a
            href="https://traxxr.com/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/25"
            style={{ color: contentColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/traxxr-mark.png"
              alt="TRAXXR"
              className="h-5 w-5 rounded-md object-contain"
            />
            Create your own TRAXXR page
          </a>
        </div>

        <p className="mt-4 text-center text-xs opacity-50">
          Powered by{" "}
          <a
            href="https://traxxr.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
          >
            TRAXXR
          </a>
        </p>

        {/* Legal / safety footer. */}
        <p className="mt-2 text-center text-[11px] opacity-40">
          <a
            href="https://traxxr.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            Privacy
          </a>
          <span className="mx-1.5">·</span>
          <a
            href={`/report?handle=${encodeURIComponent(handle)}`}
            className="hover:underline"
          >
            Report
          </a>
        </p>
      </div>
    </main>
  );
}
