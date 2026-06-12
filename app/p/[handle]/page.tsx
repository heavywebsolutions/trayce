import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SOCIAL_PLATFORMS, youtubeId, readableOn, fontStack } from "@/lib/bio";
import { ShareButton } from "@/components/ShareButton";
import { BioSubscribeBlock } from "@/components/BioSubscribeBlock";
import { BioFormBlock } from "@/components/BioFormBlock";
import { SocialIcon } from "@/components/SocialIcon";
import { formatPrice } from "@/lib/shopify";
import type { BioPage, BioLink } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BioPublicPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

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

  if (!page || !page.published) notFound();
  const p = page as BioPage;

  const { data: linkRows } = await admin
    .from("bio_links")
    .select("*")
    .eq("page_id", p.id)
    .order("position", { ascending: true });
  const links = (linkRows ?? []) as BioLink[];

  // Count the visit (best-effort).
  try {
    await admin.rpc("increment_bio_view", { p_page_id: p.id });
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
          url={`/p/${handle}`}
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
          {p.tagline && (
            <p className="mt-1 text-sm opacity-80">{p.tagline}</p>
          )}

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
              if (!vid) return null;
              return (
                <div
                  key={l.id}
                  className="overflow-hidden rounded-2xl bg-black/20"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${vid}`}
                    title={l.title || "Video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
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

        <p className="mt-10 text-center text-xs opacity-50">Powered by Trayce</p>
      </div>
    </main>
  );
}
