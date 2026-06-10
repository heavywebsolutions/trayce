"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  soon?: boolean;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Grow",
    items: [
      { href: "/dashboard", label: "Overview", icon: "▦" },
      { href: "/dashboard/codes", label: "Codes", icon: "▢" },
    ],
  },
  {
    label: "Measure",
    items: [
      { href: "/dashboard/attribution", label: "Attribution", icon: "$", soon: true },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/dashboard/integrations", label: "Integrations", icon: "⚡", soon: true },
    ],
  },
];

const flat = groups.flatMap((g) => g.items);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

// Desktop: left rail grouped by intent. Mobile: thumb-reachable bottom tab bar.
export function DashboardNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-6 border-r border-ink-200 bg-white px-4 py-6 md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-sm font-bold text-white">
            T
          </span>
          <span className="text-base font-semibold tracking-tight text-ink-900">
            Trayce
          </span>
        </Link>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {group.label}
              </p>
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
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200 bg-white md:hidden">
        {flat.map((item) => (
          <Link
            key={item.href}
            href={item.soon ? "#" : item.href}
            aria-disabled={item.soon}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              isActive(pathname, item.href) ? "text-accent" : "text-ink-500",
              item.soon && "opacity-50"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
