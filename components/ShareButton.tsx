"use client";

import { useState } from "react";

export function ShareButton({
  url,
  title,
  color,
}: {
  url: string;
  title: string;
  color: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const full = typeof window !== "undefined" ? window.location.href : url;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: full });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share"
      className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"
      style={{ color }}
    >
      {copied ? "Copied" : "Share"}
    </button>
  );
}
