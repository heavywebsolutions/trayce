"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const ranges = [
  { v: "today", label: "Today" },
  { v: "yesterday", label: "Yesterday" },
  { v: "7", label: "7 days" },
  { v: "30", label: "30 days" },
  { v: "365", label: "12 months" },
  { v: "all", label: "All time" },
];

const sources = [
  { v: "all", label: "All sources" },
  { v: "qr", label: "QR codes" },
  { v: "bio", label: "Bio pages" },
];

export function LeadsControls() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const r = sp.get("r") ?? "30";
  const src = sp.get("src") ?? "all";

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const seg =
    "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150";

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2.5">
      {/* Date range */}
      <div className="inline-flex flex-wrap items-center rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
        {ranges.map((p) => {
          const active = r === p.v;
          return (
            <button
              key={p.v}
              type="button"
              onClick={() => push({ r: p.v })}
              className={cn(
                seg,
                active
                  ? "bg-ink-900 text-white shadow-sm"
                  : "text-ink-600 hover:bg-ink-100"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Source filter */}
      <div className="ml-auto inline-flex items-center gap-2">
        <span className="hidden text-xs font-medium uppercase tracking-wide text-ink-400 sm:inline">
          Source
        </span>
        <div className="inline-flex items-center rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
          {sources.map((s) => (
            <button
              key={s.v}
              type="button"
              onClick={() => push({ src: s.v })}
              className={cn(
                seg,
                src === s.v
                  ? "bg-accent-soft text-accent shadow-sm"
                  : "text-ink-600 hover:bg-ink-100"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
