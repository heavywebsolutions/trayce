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
    { href: "/dashboard/admin/promos", label: "Promo codes", icon: "promos", desktopOnly: true },
    { href: "/dashboard/admin/orders", label: "Fulfillment", icon: "fulfillment", desktopOnly: true },
  ],
};

const flat = groups.flatMap((g) => g.items).filter((i) => !i.desktopOnly);

// Clean monoline icon set, one stroke weight, inherits text color.
const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  codes: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3v3" />
      <path d="M21 14v7h-7" />
    </>
  ),
  bio: (
    <>
      <path d="M10 13a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L11.5 6" />
      <path d="M14 11a4 4 0 0 0-5.66 0L5.5 13.83a4 4 0 0 0 5.66 5.66L12.5 18" />
    </>
  ),
  print: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="6" y="14" width="12" height="7" rx="1" />
      <path d="M6 17H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
    </>
  ),
  leads: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 21V11" />
      <path d="M12 21V4" />
      <path d="M19 21v-7" />
      <path d="M3 21h18" />
    </>
  ),
  integrations: (
    <>
      <path d="M13 2 4.5 12.5a1 1 0 0 0 .8 1.6H11l-1 7.9 8.5-10.9a1 1 0 0 0-.8-1.6H13z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  overview: (
    <>
      <path d="M12 2 4 5v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V5l-8-3z" />
    </>
  ),
  promos: (
    <>
      <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.83 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </>
  ),
  fulfillment: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
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
  if (href === "/dashboard") return pathname === "/dashboard";
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
