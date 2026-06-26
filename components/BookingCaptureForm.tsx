"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { submitBookingLead, type BookingLeadState } from "@/app/book/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "One sec…" : "Continue to booking →"}
    </Button>
  );
}

// The capture step never blocks a booking: on success we forward to the booker,
// and a "Skip" link lets anyone go straight there without sharing anything.
export function BookingCaptureForm({
  slug,
  destination,
  collectPhone,
}: {
  slug: string;
  destination: string;
  collectPhone: boolean;
}) {
  const [state, action] = useFormState<BookingLeadState, FormData>(
    submitBookingLead,
    undefined
  );

  useEffect(() => {
    if (state?.ok) window.location.href = destination;
  }, [state?.ok, destination]);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-6 text-center">
        <p className="text-base font-semibold text-emerald-800">
          Taking you to booking…
        </p>
        <a
          href={destination}
          className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline"
        >
          Continue now
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 text-left">
      <input type="hidden" name="slug" value={slug} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Your name" />
      </div>
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

      <Submit />
      <p className="text-center">
        <a href={destination} className="text-xs text-ink-400 hover:text-ink-600">
          Skip and go to booking
        </a>
      </p>
    </form>
  );
}
