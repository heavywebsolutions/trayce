"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { createBookingLink, type BookingFormState } from "@/app/dashboard/booking/actions";

function Submit({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Creating…" : "Create booking link"}
    </Button>
  );
}

export function CreateBookingForm({ disabled }: { disabled?: boolean }) {
  const [state, action] = useFormState<BookingFormState, FormData>(
    createBookingLink,
    undefined
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="Tattoo sessions" disabled={disabled} />
      </div>
      <div>
        <Label htmlFor="destination_url">Your booking URL</Label>
        <Input
          id="destination_url"
          name="destination_url"
          placeholder="squareup.com/appointments/..."
          disabled={disabled}
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Square, Acuity, Calendly, Booksy, or any booking page you already use.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit disabled={disabled} />
    </form>
  );
}
