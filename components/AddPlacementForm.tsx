"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { addPlacement, type BookingFormState } from "@/app/dashboard/booking/actions";
import { BOOKING_CHANNELS } from "@/lib/booking";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Adding…" : "Add placement"}
    </Button>
  );
}

export function AddPlacementForm({ linkId }: { linkId: string }) {
  const [state, action] = useFormState<BookingFormState, FormData>(
    addPlacement,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="booking_link_id" value={linkId} />
      <div className="min-w-[160px] flex-1">
        <Label htmlFor="label">Placement</Label>
        <Input id="label" name="label" placeholder="Window decal" required />
      </div>
      <div className="min-w-[150px]">
        <Label htmlFor="channel">Channel</Label>
        <select
          id="channel"
          name="channel"
          defaultValue="in_person"
          className="min-h-[44px] w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
        >
          {BOOKING_CHANNELS.map((c) => (
            <option key={c.v} value={c.v}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <Submit />
      {state?.error && (
        <p className="w-full rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
