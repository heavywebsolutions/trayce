"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { createBioPage, type BioFormState } from "@/app/dashboard/bio/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create page"}
    </Button>
  );
}

export function CreateBioForm() {
  const [state, action] = useFormState<BioFormState, FormData>(
    createBioPage,
    undefined
  );
  return (
    <form action={action} className="space-y-3">
      <div>
        <Label htmlFor="handle">Handle</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-ink-400">traxxr.com/@</span>
          <Input id="handle" name="handle" placeholder="deviantink" className="flex-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="display_name">Display name</Label>
        <Input id="display_name" name="display_name" placeholder="Deviant Ink" />
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
