// Instant skeleton shown the moment you navigate to any dashboard page, while
// the live data loads on the server. Masks the round trip so navigation feels
// immediate instead of pausing on the previous page.
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <div className="h-7 w-40 rounded bg-ink-100" />
          <div className="mt-2 h-4 w-56 rounded bg-ink-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-ink-100" />
      </div>

      {/* KPI / card row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card"
          >
            <div className="h-3 w-16 rounded bg-ink-100" />
            <div className="mt-3 h-7 w-12 rounded bg-ink-100" />
          </div>
        ))}
      </div>

      {/* Content blocks */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-5 shadow-card"
          >
            <div className="w-full max-w-sm">
              <div className="h-4 w-1/2 rounded bg-ink-100" />
              <div className="mt-2 h-3 w-3/4 rounded bg-ink-100" />
            </div>
            <div className="h-6 w-12 shrink-0 rounded bg-ink-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
