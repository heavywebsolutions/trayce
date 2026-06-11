"use client";

import { useState, useTransition } from "react";
import { setBioLinkThumbnail } from "@/app/dashboard/bio/actions";

export function LinkThumb({
  linkId,
  pageId,
  initial,
}: {
  linkId: string;
  pageId: string;
  initial: string | null;
}) {
  const [thumb, setThumb] = useState<string | null>(initial);
  const [, start] = useTransition();

  function persist(dataUrl: string | null) {
    setThumb(dataUrl);
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("page_id", pageId);
    fd.set("thumbnail_url", dataUrl ?? "");
    start(() => {
      setBioLinkThumbnail(fd);
    });
  }

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        persist(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="h-8 w-8 rounded object-cover ring-1 ring-ink-200"
        />
      ) : (
        <div className="grid h-8 w-8 place-items-center rounded bg-ink-100 text-[9px] text-ink-400">
          img
        </div>
      )}
      <label className="cursor-pointer text-xs font-medium text-accent hover:underline">
        {thumb ? "Change thumbnail" : "Add thumbnail"}
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
      {thumb && (
        <button
          type="button"
          onClick={() => persist(null)}
          className="text-xs font-medium text-rose-500 hover:underline"
        >
          Remove
        </button>
      )}
    </div>
  );
}
