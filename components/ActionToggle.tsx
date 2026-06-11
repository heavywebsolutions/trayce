"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { setActionType } from "@/app/dashboard/codes/actions";

// Optimistic redirect/lead toggle: the panel swaps on the first frame while the
// server action persists the change in the background.
export function ActionToggle({
  codeId,
  initialAction,
  redirectPanel,
  leadPanel,
}: {
  codeId: string;
  initialAction: string;
  redirectPanel: React.ReactNode;
  leadPanel: React.ReactNode;
}) {
  const [action, setAction] = useState<"redirect" | "lead">(
    initialAction === "lead" ? "lead" : "redirect"
  );
  const [pending, start] = useTransition();

  function choose(v: "redirect" | "lead") {
    if (v === action) return;
    setAction(v); // optimistic
    const fd = new FormData();
    fd.set("code_id", codeId);
    fd.set("action_type", v);
    start(() => {
      setActionType(fd);
    });
  }

  const options: { v: "redirect" | "lead"; label: string }[] = [
    { v: "redirect", label: "Redirect" },
    { v: "lead", label: "Capture leads" },
  ];

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
              Action
              {pending && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              )}
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
              What happens when someone scans.
            </p>
          </div>
          <div className="flex gap-1.5">
            {options.map((a) => (
              <button
                key={a.v}
                type="button"
                onClick={() => choose(a.v)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  action === a.v
                    ? "border-accent-ring bg-accent-soft text-accent"
                    : "border-ink-200 text-ink-600 hover:bg-ink-50"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {action === "lead" ? leadPanel : redirectPanel}
    </>
  );
}
