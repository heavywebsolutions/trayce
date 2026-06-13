import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/traxxr-logo.png" alt="Traxxr" className="h-7 w-auto" />
      <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#1C63C2]">
        404
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">
        This page took a wrong turn.
      </h1>
      <p className="mt-3 max-w-sm text-ink-500">
        The link may be broken, or the page may have moved. Let us get you back on
        track.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="bg-[#2E80E6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1C63C2]"
        >
          Go home
        </Link>
        <Link
          href="/dashboard"
          className="border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
