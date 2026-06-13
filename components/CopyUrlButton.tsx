"use client";

import { useState } from "react";

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked in rare cases; fail quietly.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy your bio page URL"
      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
    >
      {copied ? "Copied!" : "Copy URL"}
    </button>
  );
}
