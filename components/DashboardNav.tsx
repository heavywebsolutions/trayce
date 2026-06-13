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
    items: [{ href: "/dashboard", label: "Home", short: "Home", icon: "▦" }],
  },
  {
    label: "Create",
    items: [
      { href: "/dashboard/codes", label: "QR Codes", short: "Codes", icon: "▢" },
      { href: "/dashboard/bio", label: "Bio Pages", short: "Bio", icon: "❖" },
    ],
  },
  {
    label: "Results",
    items: [
      { href: "/dashboard/leads", label: "Leads", icon: "✉" },
      { href: "/dashboard/analytics", label: "Analytics", short: "Stats", icon: "▤" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/integrations", label: "Integrations", short: "Apps", icon: "⚡" },
      { href: "/dashboard/settings", label: "Settings", short: "You", icon: "⚙", desktopOnly: true },
    ],
  },
];

const flat = groups.flatMap((g) => g.items).filter((i) => !i.desktopOnly);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// Desktop: left rail grouped by plain function. Mobile: thumb-reachable bottom tab bar.
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-5 border-r border-ink-200 bg-white px-4 py-6 md:flex">
        <Link href="/dashboard" className="flex items-center px-2">
          <img src="/traxxr-logo.png" alt="Traxxr" className="h-5 w-auto" />
        </Link>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label || "home"}>
              {group.label && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.soon ? "#" : item.href}
                    aria-disabled={item.soon}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive(pathname, item.href)
                        ? "bg-accent-soft text-accent"
                        : "text-ink-600 hover:bg-ink-100",
                      item.soon && "cursor-default opacity-60 hover:bg-transparent"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-ink-400">{item.icon}</span>
                      {item.label}
                    </span>
                    {item.soon && (
                      <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">
                        SOON
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {flat.map((item) => (
          <Link
            key={item.href}
            href={item.soon ? "#" : item.href}
            aria-disabled={item.soon}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2.5 text-[10px] font-medium",
              isActive(pathname, item.href) ? "text-accent" : "text-ink-500",
              item.soon && "opacity-50"
            )}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span className="w-full truncate text-center">
              {item.short ?? item.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
