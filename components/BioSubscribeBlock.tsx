"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitBioSubscribe, type SubscribeState } from "@/app/p/actions";

// Turn the page's accent hex into an rgba so we can tint borders/rings without
// hard-coding a color. Falls back to a neutral ink if the hex can't be parsed.
function tint(hex: string, alpha: number): string {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return `rgba(10,37,64,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function Submit({ accent, textColor }: { accent: string; textColor: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold tracking-tight shadow-sm transition active:scale-[0.98] disabled:opacity-60"
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
      <div
        className="rounded-2xl px-4 py-4 text-center text-sm font-semibold"
        style={{
          backgroundColor: tint(accent, 0.1),
          border: `1.5px solid ${tint(accent, 0.35)}`,
        }}
      >
        Thanks, you&apos;re on the list!
      </div>
    );
  }

  return (
    <form action={action}>
      {title && <p className="mb-2 text-center text-sm font-semibold">{title}</p>}
      <input type="hidden" name="handle" value={handle} />

      {/* One slick "field": white pill, accent-tinted outline + soft shadow so it
          reads clearly on any panel color, with the accent Join button attached. */}
      <div
        className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0_4px_14px_rgba(10,37,64,0.10)] transition focus-within:shadow-[0_4px_18px_rgba(10,37,64,0.16)]"
        style={{ border: `1.5px solid ${tint(accent, 0.55)}` }}
      >
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@email.com"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-ink-900 outline-none placeholder:text-ink-400"
        />
        <Submit accent={accent} textColor={textColor} />
      </div>

      {state?.error && (
        <p className="mt-2 text-center text-xs text-rose-300">{state.error}</p>
      )}
    </form>
  );
}
