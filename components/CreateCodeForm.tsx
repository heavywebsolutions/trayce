"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { createCode, type CodeFormState } from "@/app/dashboard/codes/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Creating…" : "Create code"}
    </Button>
  );
}

export function CreateCodeForm() {
  const [state, action] = useFormState<CodeFormState, FormData>(
    createCode,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="title">Name it (so you&apos;ll recognize it later)</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Booth banner — Sand Hollow"
        />
      </div>
      <div>
        <Label htmlFor="destination_url">Where should it send people?</Label>
        <Input
          id="destination_url"
          name="destination_url"
          inputMode="url"
          placeholder="https://your-landing-page.com"
          required
        />
        <p className="mt-1.5 text-xs text-ink-400">
          You can change this anytime — even after the code is printed.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit />
    </form>
  );
}
