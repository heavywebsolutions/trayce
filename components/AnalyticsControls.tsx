"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const presets = [
  { v: "7", label: "7d" },
  { v: "30", label: "30d" },
  { v: "90", label: "90d" },
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

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {/* Presets */}
      <div className="flex rounded-xl border border-ink-200 bg-white p-0.5">
        {presets.map((p) => (
          <button
            key={p.v}
            type="button"
            onClick={() => push({ r: p.v, from: null, to: null })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              !custom && r === p.v
                ? "bg-ink-900 text-white"
                : "text-ink-600 hover:bg-ink-100"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Granularity */}
      <div className="flex rounded-xl border border-ink-200 bg-white p-0.5">
        {grans.map((gr) => (
          <button
            key={gr.v}
            type="button"
            onClick={() => push({ g: gr.v })}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              g === gr.v ? "bg-accent-soft text-accent" : "text-ink-600 hover:bg-ink-100"
            )}
          >
            {gr.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          defaultValue={from}
          onChange={(e) => {
            const v = e.target.value;
            if (v && to) push({ from: v, to });
            else if (v) push({ from: v, to: v });
          }}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-700"
        />
        <span className="text-ink-400">–</span>
        <input
          type="date"
          defaultValue={to}
          onChange={(e) => {
            const v = e.target.value;
            if (from && v) push({ from, to: v });
            else if (v) push({ from: v, to: v });
          }}
          className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-700"
        />
      </div>
    </div>
  );
}
