"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { updateBioPage } from "@/app/dashboard/bio/actions";
import { SOCIAL_PLATFORMS, FONTS } from "@/lib/bio";
import type { BioPage } from "@/lib/types";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save page"}
    </Button>
  );
}

export function BioSettingsForm({ page }: { page: BioPage }) {
  const [avatar, setAvatar] = useState<string | null>(page.avatar_url);
  const [bgImage, setBgImage] = useState<string | null>(page.bg_image_url);

  function onBgImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setBgImage(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function onAvatar(file: File) {
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
        setAvatar(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <form action={updateBioPage} className="space-y-4">
      <input type="hidden" name="page_id" value={page.id} />
      <input type="hidden" name="avatar_url" value={avatar ?? ""} />
      <input type="hidden" name="bg_image_url" value={bgImage ?? ""} />

      {/* Avatar */}
      <div>
        <Label>Avatar</Label>
        <div className="flex items-center gap-3">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="h-14 w-14 rounded-full object-cover ring-1 ring-ink-200"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-100 text-xs text-ink-400">
              none
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
            {avatar ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onAvatar(f);
              }}
            />
          </label>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" defaultValue={page.display_name} maxLength={80} />
      </div>
      <div>
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={page.tagline} maxLength={160} />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-3 gap-3">
        <label className="text-xs font-medium text-ink-600">
          Background
          <input type="color" name="bg_color" defaultValue={page.bg_color} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white" />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Buttons
          <input type="color" name="accent_color" defaultValue={page.accent_color} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white" />
        </label>
        <label className="text-xs font-medium text-ink-600">
          Button text
          <input type="color" name="button_text_color" defaultValue={page.button_text_color} className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white" />
        </label>
      </div>

      {/* Font */}
      <div>
        <Label htmlFor="font_family">Font</Label>
        <select
          id="font_family"
          name="font_family"
          defaultValue={page.font_family}
          className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
        >
          {FONTS.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* Background image */}
      <div>
        <Label>Background image (optional)</Label>
        <div className="flex items-center gap-3">
          {bgImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgImage}
              alt=""
              className="h-12 w-20 rounded-lg object-cover ring-1 ring-ink-200"
            />
          ) : (
            <div className="grid h-12 w-20 place-items-center rounded-lg bg-ink-100 text-[10px] text-ink-400">
              none
            </div>
          )}
          <label className="cursor-pointer rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50">
            {bgImage ? "Replace" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onBgImage(f);
              }}
            />
          </label>
          {bgImage && (
            <button
              type="button"
              onClick={() => setBgImage(null)}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Layout: background fit + content panel */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="bg_fit">Background fit</Label>
          <select
            id="bg_fit"
            name="bg_fit"
            defaultValue={page.bg_fit}
            className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-900"
          >
            <option value="cover">Cover (fill)</option>
            <option value="tile">Tile (repeat)</option>
            <option value="solid">Solid color only</option>
          </select>
        </div>
        <label className="text-xs font-medium text-ink-600">
          Panel color
          <input
            type="color"
            name="panel_color"
            defaultValue={page.panel_color}
            className="mt-1 h-9 w-full cursor-pointer rounded-lg border border-ink-200 bg-white"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input
          type="checkbox"
          name="framed"
          defaultChecked={page.framed}
          className="accent-[#2587DE]"
        />
        Contain content in a panel (great over busy backgrounds)
      </label>

      {/* Socials */}
      <div>
        <Label>Social links</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((s) => (
            <Input
              key={s.key}
              name={`social_${s.key}`}
              defaultValue={page.socials?.[s.key] ?? ""}
              placeholder={s.label}
            />
          ))}
        </div>
      </div>

      <Save />
    </form>
  );
}
