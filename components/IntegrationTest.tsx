"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendTestContact,
  type TestState,
} from "@/app/dashboard/integrations/actions";

function TestButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send test"}
    </button>
  );
}

export function IntegrationTest({
  provider,
  defaultEmail,
}: {
  provider: string;
  defaultEmail: string;
}) {
  const [state, action] = useFormState<TestState, FormData>(
    sendTestContact,
    undefined
  );

  return (
    <form action={action} className="mt-3 border-t border-ink-100 pt-3">
      <input type="hidden" name="provider" value={provider} />
      <p className="mb-1.5 text-xs font-medium text-ink-500">
        Test the connection
      </p>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          placeholder="you@email.com"
          className="min-h-[40px] flex-1 rounded-xl border border-ink-200 px-3 text-sm text-ink-900"
        />
        <TestButton />
      </div>
      {state?.message && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            state.ok
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {state.ok ? "✓ " : "✗ "}
          {state.message}
        </p>
      )}
    </form>
  );
}
