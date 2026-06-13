import Link from "next/link";

export function SiteNav() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Link href="/" aria-label="Traxxr home">
        <img src="/traxxr-logo.png" alt="Traxxr" className="h-7 w-auto" />
      </Link>
      <nav className="flex items-center gap-6">
        <div className="hidden items-center gap-6 text-sm font-semibold text-ink-600 md:flex">
          <Link href="/product" className="hover:text-ink-900">
            Product
          </Link>
          <Link href="/pricing" className="hover:text-ink-900">
            Pricing
          </Link>
          <Link href="/why-traxxr" className="hover:text-ink-900">
            Why Traxxr
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-3 py-2 text-sm font-semibold text-ink-600 hover:text-ink-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Start free
          </Link>
        </div>
      </nav>
    </header>
  );
}
