"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { updateDesign } from "@/app/dashboard/codes/actions";

type Initial = {
  fg: string;
  bg: string;
  dot: string;
  corner: string;
  logo: string | null;
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

function buildOptions(
  content: string,
  fg: string,
  bg: string,
  dot: string,
  corner: string,
  logo: string | null
) {
  return {
    width: 240,
    height: 240,
    type: "svg" as const,
    data: content,
    margin: 8,
    qrOptions: { errorCorrectionLevel: logo ? "H" : "M" },
    dotsOptions: { color: fg, type: dot },
    backgroundOptions: { color: bg },
    cornersSquareOptions: { color: fg, type: corner },
    cornersDotOptions: {
      color: fg,
      type: corner === "extra-rounded" ? "dot" : corner,
    },
    image: logo ?? undefined,
    imageOptions: { crossOrigin: "anonymous", margin: 4, imageSize: 0.25 },
  };
}

export function QrDesigner({
  codeId,
  content,
  initial,
}: {
  codeId: string;
  content: string;
  initial: Initial;
}) {
  const holder = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qr = useRef<any>(null);

  const [fg, setFg] = useState(initial.fg);
  const [bg, setBg] = useState(initial.bg);
  const [dot, setDot] = useState(initial.dot);
  const [corner, setCorner] = useState(initial.corner);
  const [logo, setLogo] = useState<string | null>(initial.logo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize the QR instance once, on the client.
  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await import("qr-code-styling");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const QRCodeStyling: any = (mod as any).default;
      if (!active || !holder.current) return;
      qr.current = new QRCodeStyling(
        buildOptions(content, fg, bg, dot, corner, logo)
      );
      holder.current.innerHTML = "";
      qr.current.append(holder.current);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render on any change.
  useEffect(() => {
    if (!qr.current) return;
    qr.current.update(buildOptions(content, fg, bg, dot, corner, logo));
  }, [content, fg, bg, dot, corner, logo]);

  const onLogoFile = useCallback((file: File) => {
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
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setLogo(canvas.toDataURL("image/png"));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

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
    await updateDesign(fd);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function download(ext: "png" | "svg") {
    qr.current?.download({ name: `qr-${codeId.slice(0, 8)}`, extension: ext });
  }

  return (
    <div>
      <div
        ref={holder}
        className="mx-auto w-[200px] [&>svg]:h-auto [&>svg]:w-full [&>svg]:rounded-xl"
      />

      <div className="mt-4 space-y-3">
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

        {/* Dot style */}
        <div>
          <p className="mb-1 text-xs font-medium text-ink-600">Dot style</p>
          <div className="flex flex-wrap gap-1.5">
            {dotStyles.map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => setDot(s.v)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                  dot === s.v
                    ? "border-accent-ring bg-accent-soft text-accent"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner style */}
        <div>
          <p className="mb-1 text-xs font-medium text-ink-600">Corners</p>
          <div className="flex flex-wrap gap-1.5">
            {cornerStyles.map((s) => (
              <button
                key={s.v}
                type="button"
                onClick={() => setCorner(s.v)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                  corner === s.v
                    ? "border-accent-ring bg-accent-soft text-accent"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo */}
        <div>
          <p className="mb-1 text-xs font-medium text-ink-600">Center logo</p>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-ink-200 px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
              {logo ? "Replace" : "Upload"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onLogoFile(f);
                }}
              />
            </label>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="text-xs font-medium text-rose-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
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
      </div>
    </div>
  );
}
