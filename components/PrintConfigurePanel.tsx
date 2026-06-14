"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPrintCheckout } from "@/app/dashboard/print/actions";
import { backfillDesignSvg } from "@/app/dashboard/codes/actions";
import {
  priceFor,
  formatUsd,
  LOGO_PREP_CENTS,
  type PrintProduct,
} from "@/lib/print/catalog";
import {
  CTA_PRESETS,
  DEFAULT_DECAL,
  DECAL_TEMPLATES,
  FONT_OPTIONS,
  type DecalShape,
  type CtaPosition,
  type DecalTemplate,
} from "@/lib/print/decal";
import { buildDesignSvg } from "@/lib/qrStyling";
import { DecalPreview } from "@/components/DecalPreview";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

type Code = {
  id: string;
  title: string | null;
  slug: string;
  design_svg: string | null;
  content: string;
  fg_color: string;
  bg_color: string;
  dot_style: string;
  corner_style: string;
  logo_url: string | null;
  frame_style: string;
  frame_color: string;
  frame_text: string;
  destination_url: string;
};

function hostFromUrl(u?: string): string {
  if (!u) return "";
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(
      /^www\./,
      ""
    );
  } catch {
    return "";
  }
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[40px] rounded-xl border px-3.5 text-sm font-medium transition",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-50"
      )}
    >
      {children}
    </button>
  );
}

export function PrintConfigurePanel({
  product,
  codes,
}: {
  product: PrintProduct;
  codes: Code[];
}) {
  const [sizeKey, setSizeKey] = useState(product.sizes[0].key);
  const [finishKey, setFinishKey] = useState(product.finishes[0].key);
  const [qty, setQty] = useState(product.tiers[0].qty);
  const [codeId, setCodeId] = useState(codes[0]?.id ?? "");
  const [shape, setShape] = useState<DecalShape>(DEFAULT_DECAL.shape);
  const [bgColor, setBgColor] = useState(DEFAULT_DECAL.bgColor);
  const [border, setBorder] = useState(DEFAULT_DECAL.border);
  const [borderColor, setBorderColor] = useState(DEFAULT_DECAL.borderColor);
  const [cta, setCta] = useState("");
  const [customCta, setCustomCta] = useState(false);
  const [ctaPosition, setCtaPosition] = useState<CtaPosition>("below");
  const [ctaUppercase, setCtaUppercase] = useState(true);
  const [font, setFont] = useState(DEFAULT_DECAL.font ?? "inter");
  const [decalLogo, setDecalLogo] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlPosition, setUrlPosition] = useState<"top" | "bottom">("bottom");
  const [urlText, setUrlText] = useState("");
  const [logoPrep, setLogoPrep] = useState(false);

  function onDecalLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setDecalLogo(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function applyTemplate(t: DecalTemplate) {
    setShape(t.decal.shape);
    setBgColor(t.decal.bgColor);
    setBorder(t.decal.border);
    setBorderColor(t.decal.borderColor);
    setCta(t.decal.cta);
    setCustomCta(true);
    setCtaPosition(t.decal.ctaPosition);
  }

  const price = priceFor(product.key, sizeKey, finishKey, qty);
  const selected = codes.find((c) => c.id === codeId);
  const derivedHost = hostFromUrl(selected?.destination_url);
  const prepCents = logoPrep && decalLogo ? LOGO_PREP_CENTS : 0;
  const goodsTotal = (price?.totalCents ?? 0) + prepCents;

  // Render the code exactly as designed. Use the stored design SVG if present;
  // otherwise rebuild it from the saved design columns and backfill it so the
  // proof and print file match too.
  const [codeHref, setCodeHref] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      if (!selected) {
        setCodeHref("");
        return;
      }
      if (selected.design_svg) {
        setCodeHref(
          `data:image/svg+xml;utf8,${encodeURIComponent(selected.design_svg)}`
        );
        return;
      }
      const svg = await buildDesignSvg(selected.content, {
        fg: selected.fg_color,
        bg: selected.bg_color,
        dot: selected.dot_style,
        corner: selected.corner_style,
        logo: selected.logo_url,
        frame: selected.frame_style,
        frameColor: selected.frame_color,
        frameText: selected.frame_text,
      });
      if (!active) return;
      if (svg) {
        setCodeHref(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        backfillDesignSvg(selected.id, svg).catch(() => {});
      } else {
        setCodeHref(`/api/qr/${selected.slug}`);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeId]);

  if (codes.length === 0) {
    return (
      <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center">
        <p className="text-sm text-ink-600">
          You need a QR code before you can print one.
        </p>
        <Link
          href="/dashboard/codes"
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Create your first code
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Configuration */}
      <div className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Which code
          </p>
          <select
            value={codeId}
            onChange={(e) => setCodeId(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
          >
            {codes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || c.slug}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Size
          </p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <Chip
                key={s.key}
                active={s.key === sizeKey}
                onClick={() => setSizeKey(s.key)}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Finish
          </p>
          <div className="flex flex-wrap gap-2">
            {product.finishes.map((f) => (
              <Chip
                key={f.key}
                active={f.key === finishKey}
                onClick={() => setFinishKey(f.key)}
              >
                {f.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Quantity
          </p>
          <div className="flex flex-wrap gap-2">
            {product.tiers.map((t) => {
              const each = priceFor(product.key, sizeKey, finishKey, t.qty);
              return (
                <Chip
                  key={t.qty}
                  active={t.qty === qty}
                  onClick={() => setQty(t.qty)}
                >
                  {t.qty}
                  {each && (
                    <span className="ml-1 text-xs opacity-70">
                      ({formatUsd(each.unitPriceCents)} ea)
                    </span>
                  )}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Decal style */}
        <div className="space-y-4 border-t border-ink-100 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Decal style
          </p>

          <div>
            <p className="mb-2 text-sm text-ink-600">Start from a template</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {DECAL_TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="rounded-xl border border-ink-200 p-1.5 text-center transition hover:border-ink-300 hover:bg-ink-50"
                >
                  <div className="rounded-lg bg-ink-50 p-1.5">
                    <DecalPreview
                      codeHref={codeHref}
                      options={t.decal}
                      fontPx={7}
                      className="w-full"
                    />
                  </div>
                  <span className="mt-1 block text-[11px] font-medium text-ink-600">
                    {t.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-600">Shape</p>
            <div className="flex flex-wrap gap-2">
              {(["square", "rounded", "circle"] as const).map((s) => (
                <Chip key={s} active={s === shape} onClick={() => setShape(s)}>
                  {s[0].toUpperCase() + s.slice(1)}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-5">
            <label className="text-sm text-ink-600">
              <span className="mb-1 block">Background</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-16 cursor-pointer rounded-lg border border-ink-200 bg-white"
              />
            </label>
            <div className="text-sm text-ink-600">
              <span className="mb-1 block">Border</span>
              <div className="flex items-center gap-2">
                <Chip active={border} onClick={() => setBorder(!border)}>
                  {border ? "On" : "Off"}
                </Chip>
                {border && (
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-600">Call to action</p>
            <select
              value={customCta ? "__custom" : cta}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom") {
                  setCustomCta(true);
                } else {
                  setCustomCta(false);
                  setCta(v);
                }
              }}
              className="min-h-[40px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
            >
              <option value="">None</option>
              {CTA_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__custom">Custom…</option>
            </select>
            {customCta && (
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                maxLength={40}
                placeholder="Your call to action"
                className="mt-2 min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
              />
            )}
            {cta.trim() !== "" && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {(["below", "above"] as const).map((p) => (
                  <Chip
                    key={p}
                    active={p === ctaPosition}
                    onClick={() => setCtaPosition(p)}
                  >
                    {p === "below" ? "Below code" : "Above code"}
                  </Chip>
                ))}
                <Chip
                  active={ctaUppercase}
                  onClick={() => setCtaUppercase(!ctaUppercase)}
                >
                  {ctaUppercase ? "ALL CAPS" : "Normal case"}
                </Chip>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-600">Font</p>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              className="min-h-[40px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-600">Your logo (optional)</p>
            <div className="flex items-center gap-3">
              {decalLogo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={decalLogo}
                    alt="Logo"
                    className="h-10 w-10 rounded-lg border border-ink-200 object-contain p-1"
                  />
                  <button
                    type="button"
                    onClick={() => setDecalLogo(null)}
                    className="text-sm font-medium text-ink-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <label className="inline-flex min-h-[40px] cursor-pointer items-center rounded-xl border border-dashed border-ink-300 px-4 text-sm font-medium text-ink-600 hover:bg-ink-50">
                  Upload logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onDecalLogoFile(f);
                    }}
                  />
                </label>
              )}
            </div>
            {decalLogo && (
              <label className="mt-3 flex items-start gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={logoPrep}
                  onChange={(e) => setLogoPrep(e.target.checked)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  Add{" "}
                  <span className="font-medium text-ink-800">Pro logo prep</span>{" "}
                  (+{formatUsd(LOGO_PREP_CENTS)}). Our team vectorizes your logo
                  and removes the background before printing.
                </span>
              </label>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm text-ink-600">Include your URL</p>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                active={showUrl}
                onClick={() => {
                  const next = !showUrl;
                  setShowUrl(next);
                  if (next && !urlText) setUrlText(derivedHost);
                }}
              >
                {showUrl ? "On" : "Off"}
              </Chip>
              {showUrl &&
                (["bottom", "top"] as const).map((p) => (
                  <Chip
                    key={p}
                    active={p === urlPosition}
                    onClick={() => setUrlPosition(p)}
                  >
                    {p === "bottom" ? "Bottom" : "Top"}
                  </Chip>
                ))}
            </div>
            {showUrl && (
              <input
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                maxLength={80}
                placeholder="yourbrand.com"
                className="mt-2 min-h-[40px] w-full rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
              />
            )}
          </div>
        </div>
      </div>

      {/* Preview + summary */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-ink-200 bg-white p-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">
            Preview
          </p>
          <div className="grid aspect-square w-full place-items-center rounded-xl bg-ink-50 p-6">
            {selected ? (
              <DecalPreview
                codeHref={codeHref}
                options={{
                  shape,
                  bgColor,
                  border,
                  borderColor,
                  cta,
                  ctaPosition,
                  ctaUppercase,
                  font,
                  logo: decalLogo,
                  showUrl,
                  urlText,
                  urlPosition,
                }}
                className="w-full max-w-[260px]"
              />
            ) : (
              <span className="text-sm text-ink-400">Pick a code</span>
            )}
          </div>

          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Each</dt>
              <dd className="font-medium tabular-nums text-ink-900">
                {price ? formatUsd(price.unitPriceCents) : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Quantity</dt>
              <dd className="font-medium tabular-nums text-ink-900">{qty}</dd>
            </div>
            {prepCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-500">Logo prep</dt>
                <dd className="font-medium tabular-nums text-ink-900">
                  {formatUsd(prepCents)}
                </dd>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-100 pt-1.5">
              <dt className="font-semibold text-ink-900">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-ink-900">
                {price ? formatUsd(goodsTotal) : "—"}
              </dd>
            </div>
          </dl>

          <form action={createPrintCheckout} className="mt-4">
            <input type="hidden" name="product_key" value={product.key} />
            <input type="hidden" name="size" value={sizeKey} />
            <input type="hidden" name="finish" value={finishKey} />
            <input type="hidden" name="qty" value={qty} />
            <input type="hidden" name="code_id" value={codeId} />
            <input type="hidden" name="shape" value={shape} />
            <input type="hidden" name="bg_color" value={bgColor} />
            <input type="hidden" name="border" value={border ? "true" : "false"} />
            <input type="hidden" name="border_color" value={borderColor} />
            <input type="hidden" name="cta" value={cta} />
            <input type="hidden" name="cta_position" value={ctaPosition} />
            <input
              type="hidden"
              name="cta_uppercase"
              value={ctaUppercase ? "true" : "false"}
            />
            <input type="hidden" name="font" value={font} />
            <input type="hidden" name="logo" value={decalLogo ?? ""} />
            <input
              type="hidden"
              name="show_url"
              value={showUrl ? "true" : "false"}
            />
            <input type="hidden" name="url_text" value={showUrl ? urlText : ""} />
            <input type="hidden" name="url_position" value={urlPosition} />
            <input
              type="hidden"
              name="logo_prep"
              value={logoPrep ? "true" : "false"}
            />
            <button
              disabled={!price || !codeId}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to checkout{price ? ` · ${formatUsd(goodsTotal)}` : ""}
            </button>
          </form>

          <p className="mt-3 text-xs text-ink-400">
            Shipping and tax are calculated at checkout. Printed in our
            production house and shipped in 3 to 7 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
