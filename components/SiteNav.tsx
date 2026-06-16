import Link from "next/link";

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <Link href="/" aria-label="TRAXXR home" className="shrink-0">
        <img src="/traxxr-logo.png" alt="TRAXXR" className="h-6 w-auto sm:h-7" />
      </Link>
      <nav className="flex items-center gap-4 sm:gap-6">
        <div className="hidden items-center gap-6 text-sm font-semibold text-ink-600 md:flex">
          <Link href="/product" className="hover:text-ink-900">
            Product
          </Link>
          <Link href="/pricing" className="hover:text-ink-900">
            Pricing
          </Link>
          <Link href="/why-traxxr" className="hover:text-ink-900">
            Why TRAXXR
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="whitespace-nowrap px-2 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900 sm:px-3"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="whitespace-nowrap bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
