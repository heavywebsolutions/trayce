"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { submitContact, type ContactState } from "@/app/contact/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#2587DE] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1C6FBE] disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

export function ContactForm() {
  const [state, action] = useFormState<ContactState, FormData>(
    submitContact,
    undefined
  );
  // Stamp the render time so the server can reject instant (bot) submissions.
  const [ts, setTs] = useState("");
  useEffect(() => setTs(String(Date.now())), []);

  if (state?.ok) {
    return (
      <div className="border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-base font-bold text-emerald-800">Message sent</p>
        <p className="mt-1 text-sm text-emerald-700">
          Thanks for reaching out. A real person will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ts" value={ts} />
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company website
          <input
            type="text"
            name="company_url"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink-700">
            Name
          </label>
          <input
            name="name"
            required
            className="min-h-[44px] w-full border border-ink-200 px-3 text-sm text-ink-900"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink-700">
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="min-h-[44px] w-full border border-ink-200 px-3 text-sm text-ink-900"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold text-ink-700">
          Message
        </label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full border border-ink-200 px-3 py-2 text-sm text-ink-900"
          placeholder="How can we help?"
        />
      </div>

      {state?.error && (
        <p className="border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <Submit />
      <p className="text-center text-xs text-ink-400">
        We reply from hello@traxxr.com.
      </p>
    </form>
  );
}
