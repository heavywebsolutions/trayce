"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BioPageFilter({
  pages,
  selected,
}: {
  pages: { id: string; name: string }[];
  selected: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", "bio");
    if (value) params.set("bp", value);
    else params.delete("bp");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex items-center gap-2">
      <label className="text-sm font-medium text-ink-500">Showing</label>
      <select
        value={selected ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px] rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800"
      >
        <option value="">All bio pages</option>
        {pages.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
