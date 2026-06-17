"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const presets = [
  { v: "7", label: "7 days" },
  { v: "30", label: "30 days" },
  { v: "90", label: "90 days" },
];
const grans = [
  { v: "day", label: "Day" },
  { v: "week", label: "Week" },
  { v: "month", label: "Month" },
];

export function AnalyticsControls() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const g = sp.get("g") ?? "day";
  const r = sp.get("r") ?? "30";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const custom = Boolean(from && to);

  const [showCustom, setShowCustom] = useState(custom);

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  // Shared segmented-button styling for a clean, premium pill group.
  const seg =
    "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150";

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        {/* Date range */}
        <div className="inline-flex items-center rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
          {presets.map((p) => {
            const active = !showCustom && !custom && r === p.v;
            return (
              <button
                key={p.v}
                type="button"
                onClick={() => {
                  setShowCustom(false);
                  push({ r: p.v, from: null, to: null });
                }}
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
          <button
            type="button"
            onClick={() => setShowCustom((s) => !s)}
            aria-expanded={showCustom}
            className={cn(
              seg,
              "flex items-center gap-1.5",
              showCustom || custom
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-600 hover:bg-ink-100"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
              <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
            </svg>
            Custom
          </button>
        </div>

        {/* Granularity, pushed to the right */}
        <div className="ml-auto inline-flex items-center gap-2">
          <span className="hidden text-xs font-medium uppercase tracking-wide text-ink-400 sm:inline">
            View by
          </span>
          <div className="inline-flex items-center rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
            {grans.map((gr) => (
              <button
                key={gr.v}
                type="button"
                onClick={() => push({ g: gr.v })}
                className={cn(
                  seg,
                  g === gr.v
                    ? "bg-accent-soft text-accent shadow-sm"
                    : "text-ink-600 hover:bg-ink-100"
                )}
              >
                {gr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom range, revealed only when chosen */}
      {showCustom && (
        <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-sm">
          <input
            type="date"
            aria-label="Custom range start date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              const v = e.target.value;
              if (v && to) push({ from: v, to });
              else if (v) push({ from: v, to: v });
            }}
            className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-800 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
          <span className="text-ink-300" aria-hidden="true">
            to
          </span>
          <input
            type="date"
            aria-label="Custom range end date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              const v = e.target.value;
              if (from && v) push({ from, to: v });
              else if (v) push({ from: v, to: v });
            }}
            className="h-9 rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-800 outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
          />
          {custom && (
            <button
              type="button"
              onClick={() => {
                setShowCustom(false);
                push({ from: null, to: null, r: r || "30" });
              }}
              className="ml-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
