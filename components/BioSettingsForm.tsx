"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { updateBioPage } from "@/app/dashboard/bio/actions";
import { SOCIAL_PLATFORMS } from "@/lib/bio";
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
