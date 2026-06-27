// Shared helpers for the Leads page + CSV export. Leads arrive from three
// public surfaces and we unify them into one stream with a clear source:
//   1. QR lead-capture codes  -> leads row with code_id
//   2. Bio page form blocks    -> leads row with page_id (source = form title)
//   3. Bio page subscribe block-> bio_subscribers row with page_id
// Keeping the range + unify logic here means the page and the CSV stay in sync.

export type SourceType = "qr" | "bio" | "booking";

export type UnifiedLead = {
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  created_at: string;
  sourceType: SourceType;
  sourceLabel: string; // which code / which page, e.g. "Menu code" or "@deviantink"
  sourceDetail: string | null; // sub-label, e.g. a form name or "Subscriber"
};

const RANGE_KEYS = new Set(["today", "yesterday", "7", "30", "365", "all"]);

// Resolve a preset key into an absolute [from, to) window. Day boundaries use
// UTC so the math is stable on the server.
export function resolveLeadRange(r?: string | null): {
  from: Date;
  to: Date;
  key: string;
} {
  const key = r && RANGE_KEYS.has(r) ? r : "30";
  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  if (key === "today") return { from: startOfToday, to: now, key };
  if (key === "yesterday") {
    const from = new Date(startOfToday);
    from.setUTCDate(from.getUTCDate() - 1);
    return { from, to: startOfToday, key };
  }
  if (key === "all") return { from: new Date(0), to: now, key };

  const from = new Date(now);
  if (key === "365") from.setUTCFullYear(from.getUTCFullYear() - 1);
  else from.setUTCDate(from.getUTCDate() - Number(key));
  return { from, to: now, key };
}

type RawLead = {
  email: string;
  name?: string | null;
  phone?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  created_at: string;
  code_id?: string | null;
  page_id?: string | null;
  booking_link_id?: string | null;
  placement_id?: string | null;
  source?: string | null;
  codes?: { title?: string | null } | { title?: string | null }[] | null;
};

type RawSubscriber = {
  email: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  created_at: string;
  page_id?: string | null;
};

function codeTitle(codes: RawLead["codes"]): string | null {
  if (!codes) return null;
  const c = Array.isArray(codes) ? codes[0] : codes;
  return c?.title ?? null;
}

// Merge raw leads + bio subscribers into one source-tagged, newest-first list.
// pageName maps a bio page id to its display label (name or @handle).
export function unifyLeads(opts: {
  leads: RawLead[];
  subscribers: RawSubscriber[];
  pageName: Map<string, string>;
  bookingName?: Map<string, string>;
}): UnifiedLead[] {
  const { leads, subscribers, pageName, bookingName } = opts;

  const fromLeads: UnifiedLead[] = leads.map((l) => {
    const base = {
      email: l.email,
      name: l.name ?? null,
      phone: l.phone ?? null,
      city: l.city ?? null,
      region: l.region ?? null,
      country: l.country ?? null,
      created_at: l.created_at,
    };

    // QR lead-capture code.
    if (l.code_id) {
      return {
        ...base,
        sourceType: "qr",
        sourceLabel: codeTitle(l.codes) || "QR code",
        sourceDetail: null,
      };
    }

    // Booking attribution capture (placement -> booker hand-off).
    if (l.booking_link_id) {
      const label = bookingName?.get(l.booking_link_id) ?? "Booking";
      const placement = l.source
        ? l.source.replace(/^Booking · /, "")
        : null;
      return {
        ...base,
        sourceType: "booking",
        sourceLabel: label,
        sourceDetail: placement || "Booking",
      };
    }

    // Otherwise it came from a bio page form block.
    const label = l.page_id ? pageName.get(l.page_id) ?? "Bio page" : "Bio page";
    return {
      ...base,
      sourceType: "bio",
      sourceLabel: label,
      sourceDetail: l.source || "Form",
    };
  });

  const fromSubs: UnifiedLead[] = subscribers.map((s) => ({
    email: s.email,
    name: null,
    phone: null,
    city: s.city ?? null,
    region: s.region ?? null,
    country: s.country ?? null,
    created_at: s.created_at,
    sourceType: "bio",
    sourceLabel: s.page_id ? pageName.get(s.page_id) ?? "Bio page" : "Bio page",
    sourceDetail: "Subscriber",
  }));

  return [...fromLeads, ...fromSubs].sort(
    (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
  );
}

// Rank sources by lead volume for the "Top sources" panel.
export function topSources(
  rows: UnifiedLead[],
  limit = 6
): { label: string; type: SourceType; count: number }[] {
  const map = new Map<string, { label: string; type: SourceType; count: number }>();
  for (const r of rows) {
    const key = `${r.sourceType}:${r.sourceLabel}`;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { label: r.sourceLabel, type: r.sourceType, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
