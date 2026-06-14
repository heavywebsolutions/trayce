"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitBioSubscribe, type SubscribeState } from "@/app/p/actions";

function Submit({ accent, textColor }: { accent: string; textColor: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
      style={{ backgroundColor: accent, color: textColor }}
    >
      {pending ? "…" : "Join"}
    </button>
  );
}

export function BioSubscribeBlock({
  handle,
  title,
  accent,
  textColor,
}: {
  handle: string;
  title: string;
  accent: string;
  textColor: string;
}) {
  const [state, action] = useFormState<SubscribeState, FormData>(
    submitBioSubscribe,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-white/10 px-4 py-4 text-center text-sm font-medium">
        Thanks, you&apos;re on the list!
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl bg-white/10 p-4">
      {title && <p className="mb-2 text-center text-sm font-semibold">{title}</p>}
      <input type="hidden" name="handle" value={handle} />
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          inputMode="email"
          required
          placeholder="you@email.com"
          className="min-w-0 flex-1 rounded-xl border-0 px-3.5 py-3 text-sm text-ink-900 outline-none"
        />
        <Submit accent={accent} textColor={textColor} />
      </div>
      {state?.error && (
        <p className="mt-2 text-center text-xs text-rose-200">{state.error}</p>
      )}
    </form>
  );
}
