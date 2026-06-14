"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitBioForm, type BioFormState } from "@/app/p/actions";
import type { BioLinkConfig } from "@/lib/types";

function Submit({
  label,
  accent,
  textColor,
}: {
  label: string;
  accent: string;
  textColor: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
      style={{ backgroundColor: accent, color: textColor }}
    >
      {pending ? "Sending…" : label}
    </button>
  );
}

export function BioFormBlock({
  linkId,
  title,
  config,
  accent,
  textColor,
}: {
  linkId: string;
  title: string;
  config: BioLinkConfig;
  accent: string;
  textColor: string;
}) {
  const [state, action] = useFormState<BioFormState, FormData>(
    submitBioForm,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-white/10 px-4 py-5 text-center text-sm font-medium">
        {config.success || "Thanks, we'll be in touch!"}
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border-0 px-3.5 py-3 text-sm text-ink-900 outline-none";

  return (
    <form action={action} className="space-y-2.5 rounded-2xl bg-white/10 p-4">
      {title && (
        <p className="text-center text-sm font-semibold">{title}</p>
      )}
      <input type="hidden" name="link_id" value={linkId} />
      {config.collect_name && (
        <input
          name="name"
          autoComplete="name"
          placeholder="Name"
          className={inputCls}
        />
      )}
      <input
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        placeholder="Email"
        className={inputCls}
      />
      {config.collect_phone && (
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Phone"
          className={inputCls}
        />
      )}
      {state?.error && (
        <p className="text-center text-xs text-rose-200">{state.error}</p>
      )}
      <Submit
        label={config.button || "Submit"}
        accent={accent}
        textColor={textColor}
      />
    </form>
  );
}
