import { cn } from "@/lib/utils";
import * as React from "react";

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
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
      <div>
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
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
  indigo: "bg-accent-soft text-accent border-indigo-100",
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
