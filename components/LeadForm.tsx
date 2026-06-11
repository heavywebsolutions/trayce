"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { submitLead, type LeadState } from "@/app/f/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Sending…" : label}
    </Button>
  );
}

export function LeadForm({
  slug,
  button,
  collectName,
  collectPhone,
  successMessage,
}: {
  slug: string;
  button: string;
  collectName: boolean;
  collectPhone: boolean;
  successMessage: string;
}) {
  const [state, action] = useFormState<LeadState, FormData>(
    submitLead,
    undefined
  );

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-6 text-center">
        <p className="text-lg font-semibold text-emerald-800">Got it!</p>
        <p className="mt-1 text-sm text-emerald-700">{successMessage}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      {collectName && (
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="Your name" />
        </div>
      )}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          required
        />
      </div>
      {collectPhone && (
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-5555"
          />
        </div>
      )}

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit label={button} />
    </form>
  );
}
