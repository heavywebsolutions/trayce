"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createCode, type CodeFormState } from "@/app/dashboard/codes/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Creating…" : "Create code"}
    </Button>
  );
}

const options = [
  {
    value: "dynamic",
    label: "Dynamic",
    tag: "Editable + tracked",
    blurb: "Re-point it anytime and see every scan. The QR never has to change.",
  },
  {
    value: "static",
    label: "Static",
    tag: "Free · fixed",
    blurb: "Points straight at your URL. Can't be edited or tracked once printed.",
  },
] as const;

export function CreateCodeForm() {
  const [state, action] = useFormState<CodeFormState, FormData>(
    createCode,
    undefined
  );
  const [type, setType] = useState<"dynamic" | "static">("dynamic");

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label>Code type</Label>
        <div className="grid grid-cols-1 gap-2">
          {options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                type === o.value
                  ? "border-accent-ring bg-accent-soft"
                  : "border-ink-200 hover:border-ink-300"
              )}
            >
              <input
                type="radio"
                name="type"
                value={o.value}
                checked={type === o.value}
                onChange={() => setType(o.value)}
                className="mt-1 accent-[#4F46E5]"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">
                    {o.label}
                  </span>
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                    {o.tag}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {o.blurb}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="title">Name it (so you&apos;ll recognize it later)</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Booth banner — Sand Hollow"
        />
      </div>
      <div>
        <Label htmlFor="destination_url">Where should it send people?</Label>
        <Input
          id="destination_url"
          name="destination_url"
          inputMode="url"
          placeholder="https://your-landing-page.com"
          required
        />
        <p className="mt-1.5 text-xs text-ink-400">
          {type === "dynamic"
            ? "You can change this anytime — even after the code is printed."
            : "This gets baked into the QR permanently. Choose carefully."}
        </p>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
