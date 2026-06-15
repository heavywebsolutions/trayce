"use client";

import { useState, useTransition } from "react";
import { setBioLinkThumbnail, uploadBioMedia } from "@/app/dashboard/bio/actions";

// Per-block image uploader. For image blocks it is the block's image (full
// resolution); for link blocks it is a small thumbnail. Either way the file is
// resized sensibly, uploaded to storage, and the public URL is saved.
export function LinkThumb({
  linkId,
  pageId,
  initial,
  variant = "thumb",
}: {
  linkId: string;
  pageId: string;
  initial: string | null;
  variant?: "image" | "thumb";
}) {
  const [thumb, setThumb] = useState<string | null>(initial);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isImage = variant === "image";

  function persist(url: string | null) {
    setThumb(url);
    const fd = new FormData();
    fd.set("id", linkId);
    fd.set("page_id", pageId);
    fd.set("thumbnail_url", url ?? "");
    start(() => {
      setBioLinkThumbnail(fd);
    });
  }

  function onFile(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = isImage ? 1280 : 320;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Could not read that image.");
              return;
            }
            const up = new FormData();
            up.set("page_id", pageId);
            up.set(
              "file",
              new File([blob], "upload.png", { type: "image/png" })
            );
            start(async () => {
              const url = await uploadBioMedia(up);
              if (!url) {
                setError("Upload failed. Try a smaller image.");
                return;
              }
              persist(url);
            });
          },
          "image/png"
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  const addLabel = isImage ? "Upload image" : "Add thumbnail";
  const changeLabel = isImage ? "Replace image" : "Change thumbnail";
  const previewSize = isImage ? "h-14 w-14" : "h-8 w-8";

  return (
    <div className="mt-2 flex items-center gap-2">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className={`${previewSize} rounded object-cover ring-1 ring-ink-200`}
        />
      ) : (
        <div
          className={`grid ${previewSize} place-items-center rounded bg-ink-100 text-[9px] text-ink-400`}
        >
          img
        </div>
      )}
      <label className="cursor-pointer text-xs font-medium text-accent hover:underline">
        {busy ? "Uploading…" : thumb ? changeLabel : addLabel}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
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
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
