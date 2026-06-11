"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";

// A button that invokes a server action with immediate pending feedback,
// so the click registers on the first frame instead of feeling laggy.
export function PendingActionButton({
  action,
  fields,
  children,
  pendingLabel = "…",
  variant = "secondary",
}: {
  action: (fd: FormData) => Promise<void>;
  fields: Record<string, string>;
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const [pending, start] = useTransition();

  function go() {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    start(() => {
      action(fd);
    });
  }

  return (
    <Button type="button" variant={variant} onClick={go} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
