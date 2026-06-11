import { formatLocation, deviceLabel } from "@/lib/geo";

export type Gran = "day" | "week" | "month";

export interface ScanLite {
  scanned_at: string;
  device_type: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  code_title?: string | null;
}

export interface Bucket {
  key: string;
  label: string;
  total: number;
  unique: number;
}

const DAY = 86400000;
const PRESETS = [7, 30, 90];

export interface ResolvedRange {
  from: Date;
  to: Date;
  gran: Gran;
  preset: number | null; // null when a custom from/to is used
}

export function resolveRange(sp: {
  g?: string;
  r?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const gran: Gran =
    sp.g === "week" || sp.g === "month" ? sp.g : "day";

  const fromValid = sp.from && !isNaN(Date.parse(sp.from));
  const toValid = sp.to && !isNaN(Date.parse(sp.to));
  if (fromValid && toValid) {
    const from = new Date(sp.from + "T00:00:00.000Z");
    const to = new Date(sp.to + "T23:59:59.999Z");
    return { from, to, gran, preset: null };
  }

  const preset = PRESETS.includes(Number(sp.r)) ? Number(sp.r) : 30;
  const to = new Date();
  const from = new Date(Date.now() - (preset - 1) * DAY);
  from.setUTCHours(0, 0, 0, 0);
  return { from, to, gran, preset };
}

// --- bucket key + label helpers -------------------------------------
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function weekStart(d: Date): Date {
  const c = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = (c.getUTCDay() + 6) % 7; // Monday = 0
  c.setUTCDate(c.getUTCDate() - dow);
  return c;
}
function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function keyFor(d: Date, gran: Gran): string {
  if (gran === "day") return dayKey(d);
  if (gran === "week") return dayKey(weekStart(d));
  return monthKey(d);
}

function labelFor(key: string, gran: Gran): string {
  if (gran === "month") {
    const [y, m] = key.split("-");
    return `${MONTHS[Number(m) - 1]} ${y}`;
  }
  // day/week keys are YYYY-MM-DD
  const [, m, dd] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(dd)}`;
}

// Generate every bucket key spanning [from, to] so the chart has no gaps.
function bucketKeys(from: Date, to: Date, gran: Gran): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const cur = new Date(from);
  // step daily and collect distinct bucket keys (cheap for our ranges)
  while (cur.getTime() <= to.getTime()) {
    const k = keyFor(cur, gran);
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return keys;
}

export function bucketize(scans: ScanLite[], range: ResolvedRange): Bucket[] {
  const keys = bucketKeys(range.from, range.to, range.gran);
  const totals = new Map<string, number>(keys.map((k) => [k, 0]));
  const seen = new Map<string, Set<string>>(keys.map((k) => [k, new Set()]));
  const nullExtra = new Map<string, number>(keys.map((k) => [k, 0]));

  for (const s of scans) {
    const k = keyFor(new Date(s.scanned_at), range.gran);
    if (!totals.has(k)) continue;
    totals.set(k, (totals.get(k) ?? 0) + 1);
    if (s.ip_hash) seen.get(k)!.add(s.ip_hash);
    else nullExtra.set(k, (nullExtra.get(k) ?? 0) + 1);
  }

  return keys.map((k) => ({
    key: k,
    label: labelFor(k, range.gran),
    total: totals.get(k) ?? 0,
    unique: (seen.get(k)?.size ?? 0) + (nullExtra.get(k) ?? 0),
  }));
}

export function uniqueCount(scans: ScanLite[]): number {
  const set = new Set<string>();
  let nulls = 0;
  for (const s of scans) {
    if (s.ip_hash) set.add(s.ip_hash);
    else nulls++;
  }
  return set.size + nulls;
}

function rank(map: Map<string, number>, limit = 8): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export function osBreakdown(scans: ScanLite[]): [string, number][] {
  const m = new Map<string, number>();
  for (const s of scans) {
    const os = deviceLabel(s.user_agent);
    m.set(os, (m.get(os) ?? 0) + 1);
  }
  return rank(m);
}

export function locationBreakdown(scans: ScanLite[]): [string, number][] {
  const m = new Map<string, number>();
  for (const s of scans) {
    const loc = formatLocation(s);
    m.set(loc, (m.get(loc) ?? 0) + 1);
  }
  return rank(m);
}

export function codeBreakdown(scans: ScanLite[]): [string, number][] {
  const m = new Map<string, number>();
  for (const s of scans) {
    const t = s.code_title ?? "Unknown";
    m.set(t, (m.get(t) ?? 0) + 1);
  }
  return rank(m);
}
