"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  short?: string;
  icon: string;
  soon?: boolean;
  desktopOnly?: boolean;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "",
    items: [{ href: "/dashboard", label: "Dashboard", short: "Home", icon: "dashboard" }],
  },
  {
    label: "Create",
    items: [
      { href: "/dashboard/codes", label: "QR Codes", short: "Codes", icon: "codes" },
      { href: "/dashboard/bio", label: "Bio Pages", short: "Bio", icon: "bio" },
      { href: "/dashboard/booking", label: "Booking", short: "Book", icon: "booking" },
      { href: "/dashboard/print", label: "Print & Ship", short: "Print", icon: "print" },
    ],
  },
  {
    label: "Results",
    items: [
      { href: "/dashboard/leads", label: "Leads", icon: "leads" },
      { href: "/dashboard/analytics", label: "Analytics", short: "Stats", icon: "analytics" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/integrations", label: "Integrations", short: "Apps", icon: "integrations", desktopOnly: true },
      { href: "/dashboard/settings", label: "Settings", short: "You", icon: "settings", desktopOnly: true },
    ],
  },
];

const ADMIN_GROUP: { label: string; items: NavItem[] } = {
  label: "Admin",
  items: [
    { href: "/dashboard/admin", label: "Overview", icon: "overview", desktopOnly: true },
    { href: "/dashboard/admin/users", label: "Users", icon: "users", desktopOnly: true },
    { href: "/dashboard/admin/promos", label: "Promo codes", icon: "promos", desktopOnly: true },
    { href: "/dashboard/admin/orders", label: "Fulfillment", icon: "fulfillment", desktopOnly: true },
  ],
};

const flat = groups.flatMap((g) => g.items).filter((i) => !i.desktopOnly);

// Lucide icon set (the icons shadcn/Vercel-class SaaS apps use): one true 24-grid,
// 2px stroke, round joins, optically balanced. Authentic Lucide path data.
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </>
  ),
  codes: (
    <>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </>
  ),
  bio: (
    <>
      <path d="M18 21a6 6 0 0 0-12 0" />
      <circle cx="12" cy="11" r="4" />
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </>
  ),
  booking: (
    <>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V2a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect width="12" height="8" x="6" y="14" rx="1" />
    </>
  ),
  leads: (
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>
  ),
  analytics: (
    <>
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </>
  ),
  integrations: (
    <>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  overview: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  promos: (
    <>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </>
  ),
  fulfillment: (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </>
  ),
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name] ?? <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  // Exact-match the section roots so they don't stay highlighted on sub-pages
  // (e.g. Admin "Overview" shouldn't light up on /dashboard/admin/users).
  if (href === "/dashboard" || href === "/dashboard/admin") {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

// Desktop: left rail grouped by plain function. Mobile: thumb-reachable bottom tab bar.
export function DashboardNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const navGroups = admin ? [...groups, ADMIN_GROUP] : groups;

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-5 border-r border-ink-200 bg-white px-4 py-6 md:flex">
        <Link href="/dashboard" className="flex items-center px-2">
          <img src="/traxxr-logo.png" alt="TRAXXR" className="h-5 w-auto" />
        </Link>

        <div className="flex flex-col gap-5">
          {navGroups.map((group) => (
            <div key={group.label || "home"}>
              {group.label && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.soon ? "#" : item.href}
                      aria-disabled={item.soon}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-accent-soft text-accent"
                          : "text-ink-600 hover:bg-ink-100",
                        item.soon && "cursor-default opacity-60 hover:bg-transparent"
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <NavIcon
                          name={item.icon}
                          className={cn(
                            "h-[18px] w-[18px] shrink-0",
                            active ? "text-accent" : "text-ink-400"
                          )}
                        />
                        {item.label}
                      </span>
                      {item.soon && (
                        <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
                          SOON
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {flat.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.soon ? "#" : item.href}
              aria-disabled={item.soon}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] font-medium",
                active ? "text-accent" : "text-ink-500",
                item.soon && "opacity-50"
              )}
            >
              <NavIcon name={item.icon} className="h-5 w-5" />
              <span className="w-full truncate text-center">
                {item.short ?? item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
