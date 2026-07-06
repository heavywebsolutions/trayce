import { cn } from "@/lib/utils";
import * as React from "react";

// --- Domain color chips ------------------------------------------------
// A small, fixed palette so color means something: each product area gets a
// consistent hue on its icons, tags, and stat cards. This is the backbone of
// the "scannable" refresh.
export type ChipColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "gray";

const chipTones: Record<ChipColor, string> = {
  blue: "bg-accent-soft text-accent",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-500",
  gray: "bg-ink-100 text-ink-500",
};

export function IconChip({
  color = "blue",
  size = "md",
  children,
  className,
}: {
  color?: ChipColor;
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl",
        size === "sm" ? "h-7 w-7 [&>svg]:h-4 [&>svg]:w-4" : "h-9 w-9 [&>svg]:h-[18px] [&>svg]:w-[18px]",
        chipTones[color],
        className
      )}
    >
      {children}
    </span>
  );
}

// A small up/down delta pill for metrics.
export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        up ? "text-emerald-600" : "text-rose-500"
      )}
    >
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

// Stat card with a colored icon chip, a big number, and an optional delta.
export function StatCard({
  label,
  value,
  color = "blue",
  icon,
  delta,
  hint,
}: {
  label: string;
  value: string;
  color?: ChipColor;
  icon?: React.ReactNode;
  delta?: number;
  hint?: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      {icon && (
        <IconChip color={color} className="mb-3">
          {icon}
        </IconChip>
      )}
      <p className="tabular text-2xl font-semibold text-ink-900 sm:text-3xl">
        {value}
      </p>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
        <span className="text-sm text-ink-500">{label}</span>
        {typeof delta === "number" && <Delta value={delta} />}
      </div>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </Card>
  );
}

// --- Card -------------------------------------------------------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-white shadow-card",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  iconColor = "blue",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: ChipColor;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
      <div className="flex items-start gap-3">
        {icon && (
          <IconChip color={iconColor} size="sm" className="mt-0.5">
            {icon}
          </IconChip>
        )}
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// --- Button -----------------------------------------------------------
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none min-h-[44px]";
  const variants = {
    primary: "bg-ink-900 text-white hover:bg-ink-800",
    secondary:
      "bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50",
    ghost: "text-ink-600 hover:bg-ink-100",
    danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props} />
  );
}

// --- Input ------------------------------------------------------------
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400",
        "min-h-[44px] outline-none transition focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30",
        className
      )}
      {...props}
    />
  );
});

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-ink-700"
    >
      {children}
    </label>
  );
}

// --- Badge ------------------------------------------------------------
const badgeTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  gray: "bg-ink-100 text-ink-600 border-ink-200",
  indigo: "bg-accent-soft text-accent border-blue-100",
  violet: "bg-violet-50 text-violet-700 border-violet-100",
};

export function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: keyof typeof badgeTones | string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone] ?? badgeTones.gray
      )}
    >
      {children}
    </span>
  );
}
