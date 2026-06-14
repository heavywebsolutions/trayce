"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/traxxr-logo.png" alt="Traxxr" className="h-7 w-auto" />
      <p className="mt-10 text-sm font-bold uppercase tracking-[0.16em] text-[#1C6FBE]">
        Something broke
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900">
        That one is on us, not you.
      </h1>
      <p className="mt-3 max-w-sm text-ink-500">
        An unexpected error hit this page. Try again, and if it keeps happening,
        email us at hello@traxxr.com.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-[#2587DE] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1C6FBE]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
