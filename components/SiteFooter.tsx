import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/product" },
      { label: "Pricing", href: "/pricing" },
      { label: "Why Traxxr", href: "/why-traxxr" },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "Traxxr vs Linktree", href: "/compare/linktree" },
      { label: "Traxxr vs QR tools", href: "/compare/qr-codes" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Use cases", href: "/use-cases" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <img
              src="/traxxr-logo.png"
              alt="Traxxr"
              className="h-7 w-auto brightness-0 invert"
            />
            <p className="mt-3 max-w-[200px] text-sm text-white/50">
              Know what your marketing does.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-wide text-white/40">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/70 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Traxxr. All rights reserved.</p>
          <p>Made for businesses that print, post, and sell.</p>
        </div>
      </div>
    </footer>
  );
}
