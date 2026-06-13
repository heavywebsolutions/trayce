// Normalize a /[handle] route param into a clean handle plus whether the
// original already carried a leading "@". The "@" can reach us literally
// ("@name") or percent-encoded ("%40name") depending on the browser, so we
// decode first. Extracted and unit-tested (tests/handle.test.ts) because a bug
// here once caused an infinite redirect loop in production.
export function normalizeHandle(raw: string): {
  hadAt: boolean;
  handle: string;
} {
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // malformed percent-encoding: fall back to the raw value
  }
  const hadAt = decoded.startsWith("@");
  const handle = decoded.replace(/^@+/, "").toLowerCase();
  return { hadAt, handle };
}
