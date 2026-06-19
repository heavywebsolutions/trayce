"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { duplicateBioPage } from "@/app/dashboard/bio/actions";

function DupButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="h-8 shrink-0 rounded-lg bg-ink-900 px-2.5 text-xs font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? "Copying…" : "Duplicate"}
    </button>
  );
}

// Inline "Duplicate" control: click reveals a handle field (the new bio's URL),
// then duplicates the page + all blocks under that handle.
export function DuplicateBioForm({
  pageId,
  handle,
}: {
  pageId: string;
  handle: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-ink-500 transition hover:text-ink-800"
      >
        Duplicate
      </button>
    );
  }

  return (
    <form action={duplicateBioPage} className="flex items-center gap-1.5">
      <input type="hidden" name="source_id" value={pageId} />
      <span className="text-xs text-ink-400">@</span>
      <input
        name="handle"
        defaultValue={`${handle}-copy`}
        autoFocus
        autoCapitalize="none"
        spellCheck={false}
        className="h-8 w-28 rounded-lg border border-ink-200 px-2 text-xs text-ink-900 outline-none focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
      />
      <DupButton />
    </form>
  );
}
