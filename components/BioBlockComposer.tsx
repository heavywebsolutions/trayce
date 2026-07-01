"use client";

import { useRef, useState, useTransition } from "react";
import { addBioLink, uploadBioMedia } from "@/app/dashboard/bio/actions";
import { Button, Input } from "@/components/ui";

const TYPES = [
  { value: "link", label: "Link button" },
  { value: "book", label: "Book button" },
  { value: "header", label: "Section header" },
  { value: "video", label: "YouTube video" },
  { value: "subscribe", label: "Email subscribe" },
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "form", label: "Lead form" },
  { value: "product", label: "Shopify product" },
] as const;

// Add-a-block composer. Shows only the fields a block type needs, and for Image
// blocks gives a real upload button right here (no hunting in the list below).
export function BioBlockComposer({
  pageId,
  bookingLinks = [],
}: {
  pageId: string;
  bookingLinks?: { id: string; name: string }[];
}) {
  const [kind, setKind] = useState("link");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isImage = kind === "image";
  const needsUrl = kind === "link" || kind === "video" || kind === "product";
  const isBook = kind === "book";
  const showTitle = kind !== "image" || true; // image uses it as an optional caption

  const titlePlaceholder =
    kind === "header" || kind === "text"
      ? "Text"
      : kind === "image"
        ? "Caption (optional)"
        : kind === "subscribe"
          ? "Heading, e.g. Join our list"
          : isBook
            ? "Button label, e.g. Book now"
            : "Title";
  const urlPlaceholder =
    kind === "video"
      ? "YouTube link"
      : kind === "product"
        ? "Shopify product URL or handle"
        : "https://…";

  function pickFile(f: File | null) {
    setError(null);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    fd.set("page_id", pageId);
    fd.set("kind", kind);

    start(async () => {
      if (isImage) {
        if (!file) {
          setError("Choose an image to upload.");
          return;
        }
        const up = new FormData();
        up.set("page_id", pageId);
        up.set("file", file);
        const url = await uploadBioMedia(up);
        if (!url) {
          setError("Upload failed. Use a PNG, JPEG, or WebP under 5 MB.");
          return;
        }
        fd.set("image_url", url);
      }
      await addBioLink(fd);
      form.reset();
      setFile(null);
      setPreview(null);
      setKind("link");
    });
  }

  return (
    <div className="rounded-2xl border-2 border-accent bg-accent-soft p-6 shadow-cardHover">
      <h2 className="flex items-center gap-2 text-base font-semibold text-accent">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-accent text-xs font-bold leading-none text-white">
          +
        </span>
        Add a block
      </h2>
      <p className="mt-1 text-xs text-ink-500">
        Pick a type, fill it in, and add it to your page.
      </p>

      <form ref={formRef} onSubmit={onSubmit} className="mt-3 space-y-2.5">
        <select
          name="kind"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value);
            setError(null);
          }}
          className="min-h-[48px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {showTitle && <Input name="title" placeholder={titlePlaceholder} />}

        {needsUrl && <Input name="url" placeholder={urlPlaceholder} />}

        {isBook &&
          (bookingLinks.length > 0 ? (
            <>
              <select
                name="booking_link_id"
                className="min-h-[48px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900"
              >
                {bookingLinks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-ink-500">
                Adds a Book button that captures the visitor and tracks it as a
                bio-page booking. Manage the booker in Booking.
              </p>
            </>
          ) : (
            <p className="rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-xs text-ink-500">
              Create a booking link first in{" "}
              <a
                href="/dashboard/booking"
                className="font-semibold text-accent hover:underline"
              >
                Booking
              </a>
              , then add it here.
            </p>
          ))}

        {isImage && (
          <div className="rounded-xl border border-dashed border-ink-300 bg-white p-3">
            {preview ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="h-16 w-16 rounded-lg object-cover ring-1 ring-ink-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800">
                    {file?.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => pickFile(null)}
                    className="text-xs font-medium text-rose-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-700 hover:bg-ink-100"
              >
                <span className="text-accent">↑</span> Upload an image
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-2 text-[11px] text-ink-400">
              PNG, JPEG, or WebP, up to 5 MB.
            </p>
          </div>
        )}

        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

        <Button
          type="submit"
          disabled={busy || (isBook && bookingLinks.length === 0)}
        >
          {busy ? "Adding…" : "Add block"}
        </Button>
      </form>
    </div>
  );
}
