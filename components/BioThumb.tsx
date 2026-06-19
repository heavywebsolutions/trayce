import type { BioPage } from "@/lib/types";

// Tiny phone-style preview of a bio page using its own theme colors + avatar,
// so the list reads visually and each page looks distinct at a glance.
export function BioThumb({ page }: { page: BioPage }) {
  const bg = page.bg_color || "#0A2540";
  const accent = page.accent_color || "#2587DE";
  return (
    <div
      className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-ink-200 shadow-sm"
      style={{ background: bg }}
      aria-hidden="true"
    >
      <div
        className="absolute left-1/2 top-2 grid h-5 w-5 -translate-x-1/2 place-items-center overflow-hidden rounded-full border border-white/70"
        style={{ background: accent }}
      >
        {page.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.avatar_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="absolute inset-x-2 top-9 space-y-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ background: accent, opacity: 0.9 }}
        />
        <div className="h-1.5 rounded-full bg-white/70" />
        <div className="h-1.5 w-3/4 rounded-full bg-white/45" />
      </div>
    </div>
  );
}
