"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { createCode, type CodeFormState } from "@/app/dashboard/codes/actions";
import { CONTENT_TYPES, modeFor } from "@/lib/codeContent";
import { ContentFields } from "@/components/ContentFields";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating…" : "Create code"}
    </Button>
  );
}

export function CreateCodeForm() {
  const [state, action] = useFormState<CodeFormState, FormData>(
    createCode,
    undefined
  );
  const [contentType, setContentType] = useState("url");
  const [content, setContent] = useState<Record<string, string>>({
    encryption: "WPA",
  });
  const [codeKind, setCodeKind] = useState<"dynamic" | "static">("dynamic");

  const mode = modeFor(contentType);
  // url codes follow the dynamic/static toggle; app is always dynamic; direct types are static.
  const typeValue =
    mode === "url" ? codeKind : mode === "app" ? "dynamic" : "static";

  function set(name: string, val: string) {
    setContent((c) => ({ ...c, [name]: val }));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="content_type" value={contentType} />
      <input type="hidden" name="content" value={JSON.stringify(content)} />
      <input type="hidden" name="type" value={typeValue} />

      {/* Type picker */}
      <div>
        <Label>Type</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setContentType(t.v)}
              title={t.hint}
              className={cn(
                "rounded-lg border px-1 py-2 text-xs font-medium transition",
                contentType === t.v
                  ? "border-accent-ring bg-accent-soft text-accent"
                  : "border-ink-200 text-ink-600 hover:bg-ink-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type-specific fields */}
      <ContentFields contentType={contentType} value={content} onChange={set} />

      <div>
        <Label htmlFor="title">Name it (for your own reference)</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Booth banner — Sand Hollow"
        />
      </div>

      {/* Dynamic vs static — only meaningful for Website codes */}
      {mode === "url" && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "dynamic", label: "Dynamic", hint: "Editable + tracked" },
            { v: "static", label: "Static", hint: "Free · fixed" },
          ].map((k) => (
            <button
              key={k.v}
              type="button"
              onClick={() => setCodeKind(k.v as "dynamic" | "static")}
              className={cn(
                "rounded-xl border p-2.5 text-left transition",
                codeKind === k.v
                  ? "border-accent-ring bg-accent-soft"
                  : "border-ink-200 hover:border-ink-300"
              )}
            >
              <span className="block text-sm font-semibold text-ink-900">
                {k.label}
              </span>
              <span className="block text-xs text-ink-500">{k.hint}</span>
            </button>
          ))}
        </div>
      )}
      {mode === "direct" && (
        <p className="text-xs text-ink-400">
          This type is encoded straight into the QR — it works offline and
          can&apos;t be edited or scan-tracked once printed.
        </p>
      )}
      {mode === "app" && (
        <p className="text-xs text-ink-400">
          Dynamic: scans are tracked and you can edit the store links anytime.
        </p>
      )}

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
