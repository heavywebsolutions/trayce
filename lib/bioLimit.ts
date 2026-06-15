// Freemium bio-page enforcement, shared by the public renderer and the
// dashboard so both agree on which pages are live.
//
// Rules:
//  - Unlimited plans (limit === Infinity): every page is live.
//  - Free plans (finite limit): the owner keeps `limit` pages active. If they
//    have made an explicit choice (parked the extras with paused = true) and
//    the un-paused set fits the limit, we honor it. Otherwise we fall back to
//    the oldest pages by creation date so enforcement is deterministic even
//    before the owner picks.
//
// Nothing here mutates data — paused flags are written only when the owner
// chooses. Upgrading lifts the limit, so parked pages light back up with no
// extra bookkeeping.

export type BioPageLite = {
  id: string;
  created_at: string;
  paused?: boolean | null;
};

export function activeBioPageIds<T extends BioPageLite>(
  pages: T[],
  limit: number
): Set<string> {
  if (!isFinite(limit)) return new Set(pages.map((p) => p.id));
  if (limit <= 0 || pages.length === 0) return new Set();

  const kept = pages.filter((p) => !p.paused);
  const pool = kept.length > 0 && kept.length <= limit ? kept : pages;

  const ordered = [...pool].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  return new Set(ordered.slice(0, limit).map((p) => p.id));
}

// True when a free workspace has more pages than its plan allows and therefore
// needs the owner to choose which one stays live.
export function isOverBioLimit(pageCount: number, limit: number): boolean {
  return isFinite(limit) && pageCount > limit;
}
