"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  updateDesign,
  saveDesignTemplate,
  saveLogoAsset,
  deleteLogoAsset,
} from "@/app/dashboard/codes/actions";
import type { DesignTemplate, LogoAsset } from "@/lib/types";

type Initial = {
  fg: string;
  bg: string;
  dot: string;
  corner: string;
  logo: string | null;
  frame: string;
  frameColor: string;
  frameText: string;
};

const dotStyles = [
  { v: "square", label: "Square" },
  { v: "rounded", label: "Rounded" },
  { v: "dots", label: "Dots" },
  { v: "classy", label: "Classy" },
  { v: "classy-rounded", label: "Classy+" },
];
const cornerStyles = [
  { v: "square", label: "Square" },
  { v: "dot", label: "Dot" },
  { v: "extra-rounded", label: "Rounded" },
];
const frameStyles = [
  { v: "none", label: "None" },
  { v: "bottom", label: "Label below" },
  { v: "top", label: "Label above" },
  { v: "border", label: "Bordered" },
];

// --- tiny visual thumbnails ------------------------------------------
function DotThumb({ style, color }: { style: string; color: string }) {
  const rx =
    style === "dots"
      ? 5
      : style === "rounded" || style === "classy-rounded"
        ? 3
        : style === "classy"
          ? 2
          : 0;
  const cells = [0, 1, 2, 3, 4];
  return (
    <svg viewBox="0 0 30 30" className="h-6 w-6">
      {cells.map((y) =>
        cells.map((x) =>
          (x + y) % 2 === 0 ? (
            <rect
              key={`${x}-${y}`}
              x={x * 6 + 1}
              y={y * 6 + 1}
              width={4}
              height={4}
              rx={rx}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
}

function CornerThumb({ style, color }: { style: string; color: string }) {
  const outerRx = style === "extra-rounded" ? 6 : 0;
  const innerCircle = style === "dot" || style === "extra-rounded";
  return (
    <svg viewBox="0 0 30 30" className="h-6 w-6">
      <rect
        x={4}
        y={4}
        width={22}
        height={22}
        rx={outerRx}
        fill="none"
        stroke={color}
        strokeWidth={4}
      />
      {innerCircle ? (
        <circle cx={15} cy={15} r={5} fill={color} />
      ) : (
        <rect x={10} y={10} width={10} height={10} fill={color} />
      )}
    </svg>
  );
}

// --- frame layout shared by canvas + svg -----------------------------
function layoutFor(frame: string) {
  const Q = 600,
    pad = 32,
    bar = 84,
    gap = 16;
  if (frame === "bottom")
    return {
      Q,
      pad,
      W: Q + pad * 2,
      H: pad + Q + gap + bar + pad,
      qrX: pad,
      qrY: pad,
      bar: { x: pad, y: pad + Q + gap, w: Q, h: bar },
      border: false,
    };
  if (frame === "top")
    return {
      Q,
      pad,
      W: Q + pad * 2,
      H: pad + bar + gap + Q + pad,
      qrX: pad,
      qrY: pad + bar + gap,
      bar: { x: pad, y: pad, w: Q, h: bar },
      border: false,
    };
  if (frame === "border")
    return {
      Q,
      pad,
      W: Q + pad * 2,
      H: pad + Q + gap + bar + pad,
      qrX: pad,
      qrY: pad,
      bar: { x: pad, y: pad + Q + gap, w: Q, h: bar },
      border: true,
    };
  return {
    Q,
    pad,
    W: Q + pad * 2,
    H: Q + pad * 2,
    qrX: pad,
    qrY: pad,
    bar: null as null | { x: number; y: number; w: number; h: number },
    border: false,
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export function QrDesigner({
  codeId,
  content,
  initial,
  templates,
  logos,
}: {
  codeId: string;
  content: string;
  initial: Initial;
  templates: DesignTemplate[];
  logos: LogoAsset[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qr = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<string>("");

  const [fg, setFg] = useState(initial.fg);
  const [bg, setBg] = useState(initial.bg);
  const [dot, setDot] = useState(initial.dot);
  const [corner, setCorner] = useState(initial.corner);
  const [logo, setLogo] = useState<string | null>(initial.logo);
  const [frame, setFrame] = useState(initial.frame);
  const [frameColor, setFrameColor] = useState(initial.frameColor);
  const [frameText, setFrameText] = useState(initial.frameText);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tplName, setTplName] = useState("");

  function qrOptions() {
    return {
      width: 600,
      height: 600,
      type: "canvas" as const,
      data: content,
      margin: 10,
      qrOptions: { errorCorrectionLevel: logo ? "H" : "M" },
      dotsOptions: { color: fg, type: dot },
      backgroundOptions: { color: bg },
      cornersSquareOptions: { color: fg, type: corner },
      cornersDotOptions: {
        color: fg,
        type: corner === "extra-rounded" ? "dot" : corner,
      },
      image: logo ?? undefined,
      imageOptions: { crossOrigin: "anonymous", margin: 6, imageSize: 0.25 },
    };
  }

  // init once
  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await import("qr-code-styling");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCodeStyling: any = (mod as any).default;
      if (!active) return;
      qr.current = new QRCodeStyling(qrOptions());
      setReady(true);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recompose preview whenever anything changes
  const compose = useCallback(async () => {
    if (!qr.current) return;
    qr.current.update(qrOptions());
    let blob: Blob | null = null;
    try {
      blob = await qr.current.getRawData("png");
    } catch {
      return;
    }
    if (!blob) return;
    const qrUrl = await blobToDataURL(blob);
    const qrImg = await loadImage(qrUrl);

    const L = layoutFor(frame);
    const canvas = document.createElement("canvas");
    canvas.width = L.W;
    canvas.height = L.H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (L.border) {
      ctx.fillStyle = frameColor;
      roundRect(ctx, 0, 0, L.W, L.H, 36);
      ctx.fill();
    } else {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, L.W, L.H);
    }
    ctx.drawImage(qrImg, L.qrX, L.qrY, L.Q, L.Q);

    if (L.bar) {
      if (!L.border) {
        ctx.fillStyle = frameColor;
        roundRect(ctx, L.bar.x, L.bar.y, L.bar.w, L.bar.h, 16);
        ctx.fill();
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 40px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText, L.bar.x + L.bar.w / 2, L.bar.y + L.bar.h / 2);
    }
    setPreview(canvas.toDataURL("image/png"));
  }, [content, fg, bg, dot, corner, logo, frame, frameColor, frameText]);

  useEffect(() => {
    if (ready) compose();
  }, [ready, compose]);

  // logo upload (resized client-side)
  const onLogoFile = useCallback((file: File, addToLibrary: boolean) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        setLogo(dataUrl);
        if (addToLibrary) {
          const fd = new FormData();
          fd.set("data_url", dataUrl);
          fd.set("name", file.name.slice(0, 40));
          saveLogoAsset(fd);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  function applyTemplate(t: DesignTemplate) {
    const s = t.settings || {};
    if (s.fg_color) setFg(s.fg_color);
    if (s.bg_color) setBg(s.bg_color);
    if (s.dot_style) setDot(s.dot_style);
    if (s.corner_style) setCorner(s.corner_style);
    if (s.frame_style) setFrame(s.frame_style);
    if (s.frame_color) setFrameColor(s.frame_color);
    if (s.frame_text) setFrameText(s.frame_text);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const fd = new FormData();
    fd.set("code_id", codeId);
    fd.set("fg_color", fg);
    fd.set("bg_color", bg);
    fd.set("dot_style", dot);
    fd.set("corner_style", corner);
    if (logo) fd.set("logo_url", logo);
    fd.set("frame_style", frame);
    fd.set("frame_color", frameColor);
    fd.set("frame_text", frameText);
    await updateDesign(fd);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function saveTemplate() {
    const fd = new FormData();
    fd.set("name", tplName || "Brand style");
    fd.set("fg_color", fg);
    fd.set("bg_color", bg);
    fd.set("dot_style", dot);
    fd.set("corner_style", corner);
    fd.set("frame_style", frame);
    fd.set("frame_color", frameColor);
    fd.set("frame_text", frameText);
    await saveDesignTemplate(fd);
    setTplName("");
  }

  async function download(ext: "png" | "svg") {
    if (ext === "png") {
      if (!preview) return;
      const a = document.createElement("a");
      a.href = preview;
      a.download = `qr-${codeId.slice(0, 8)}.png`;
      a.click();
      return;
    }
    // SVG: vector frame + embedded QR raster, fully self-contained.
    if (!qr.current) return;
    let blob: Blob | null = null;
    try {
      blob = await qr.current.getRawData("png");
    } catch {
      return;
    }
    if (!blob) return;
    const qrUrl = await blobToDataURL(blob);

    const L = layoutFor(frame);
    const safeText = frameText.replace(/[<&>]/g, "");
    const bgRect = L.border
      ? `<rect width="${L.W}" height="${L.H}" rx="36" fill="${frameColor}"/>`
      : `<rect width="${L.W}" height="${L.H}" fill="#FFFFFF"/>`;
    const barEl =
      L.bar && !L.border
        ? `<rect x="${L.bar.x}" y="${L.bar.y}" width="${L.bar.w}" height="${L.bar.h}" rx="16" fill="${frameColor}"/>`
        : "";
    const textEl = L.bar
      ? `<text x="${L.bar.x + L.bar.w / 2}" y="${L.bar.y + L.bar.h / 2}" fill="#FFFFFF" font-family="system-ui, sans-serif" font-size="40" font-weight="600" text-anchor="middle" dominant-baseline="central">${safeText}</text>`
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">${bgRect}<image x="${L.qrX}" y="${L.qrY}" width="${L.Q}" height="${L.Q}" href="${qrUrl}"/>${barEl}${textEl}</svg>`;
    const out = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(out);
    a.download = `qr-${codeId.slice(0, 8)}.svg`;
    a.click();
  }

  return (
    <div>
      {/* Preview */}
      <div className="mx-auto w-[220px]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="QR preview"
            className="w-full rounded-xl border border-ink-100"
          />
        ) : (
          <div className="aspect-square w-full animate-pulse rounded-xl bg-ink-100" />
        )}
      </div>

      <div className="mt-5 space-y-4">
        {/* Templates */}
        {templates.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-600">Templates</p>
            <div className="flex flex-wrap gap-1.5">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="rounded-lg border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-ink-600">
            Dots
            <input
              type="color"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white"
            />
          </label>
          <label className="text-xs font-medium text-ink-600">
            Background
            <input
              type="color"
              value={bg}
              onChange={(e) => setBg(e.target.value)}
              className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white"
            />
          </label>
        </div>

        {/* Dot style thumbnails */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-600">Dot style</p>
          <div className="flex flex-wrap gap-1.5">
            {dotStyles.map((s) => (
              <button
                key={s.v}
                type="button"
                title={s.label}
                onClick={() => setDot(s.v)}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg border transition",
                  dot === s.v
                    ? "border-accent-ring bg-accent-soft"
                    : "border-ink-200 hover:bg-ink-50"
                )}
              >
                <DotThumb style={s.v} color="#0A2540" />
              </button>
            ))}
          </div>
        </div>

        {/* Corner style thumbnails */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-600">Corners</p>
          <div className="flex flex-wrap gap-1.5">
            {cornerStyles.map((s) => (
              <button
                key={s.v}
                type="button"
                title={s.label}
                onClick={() => setCorner(s.v)}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg border transition",
                  corner === s.v
                    ? "border-accent-ring bg-accent-soft"
                    : "border-ink-200 hover:bg-ink-50"
                )}
              >
                <CornerThumb style={s.v} color="#0A2540" />
              </button>
            ))}
          </div>
        </div>

        {/* Frame */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-600">Frame</p>
          <div className="flex flex-wrap gap-1.5">
            {frameStyles.map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => setFrame(s.v)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                  frame === s.v
                    ? "border-accent-ring bg-accent-soft text-accent"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {frame !== "none" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-ink-600">
                Frame color
                <input
                  type="color"
                  value={frameColor}
                  onChange={(e) => setFrameColor(e.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white"
                />
              </label>
              <label className="text-xs font-medium text-ink-600">
                Frame text
                <Input
                  value={frameText}
                  maxLength={24}
                  onChange={(e) => setFrameText(e.target.value)}
                  className="mt-1 h-9 py-1"
                />
              </label>
            </div>
          )}
        </div>

        {/* Logo + library */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-600">Center logo</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLogo(null)}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg border text-xs transition",
                !logo
                  ? "border-accent-ring bg-accent-soft text-accent"
                  : "border-ink-200 text-ink-400 hover:bg-ink-50"
              )}
              title="No logo"
            >
              ∅
            </button>
            {logos.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLogo(l.data_url)}
                className={cn(
                  "h-9 w-9 overflow-hidden rounded-lg border bg-white transition",
                  logo === l.data_url
                    ? "border-accent-ring"
                    : "border-ink-200 hover:border-ink-300"
                )}
                title={l.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.data_url}
                  alt={l.name}
                  className="h-full w-full object-contain p-1"
                />
              </button>
            ))}
            <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg border border-dashed border-ink-300 text-ink-500 hover:bg-ink-50">
              +
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onLogoFile(f, true);
                }}
              />
            </label>
          </div>
        </div>

        {/* Save design + downloads */}
        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save design"}
          </Button>
          <button
            type="button"
            onClick={() => download("png")}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => download("svg")}
            className="rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            SVG
          </button>
        </div>

        {/* Save as template */}
        <div className="flex items-center gap-2">
          <Input
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Template name"
            className="h-9 py-1 text-sm"
          />
          <button
            type="button"
            onClick={saveTemplate}
            className="shrink-0 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Save as template
          </button>
        </div>
      </div>
    </div>
  );
}
