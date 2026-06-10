"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition min-h-[36px]",
        copied
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
      )}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
