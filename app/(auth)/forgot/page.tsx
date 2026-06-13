"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Button, Input, Label } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setPending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-semibold text-ink-900">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Enter your email and we will send you a link to set a new one.
      </p>

      {sent ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Check your inbox. If an account exists for that email, a reset link is
          on its way. Open it on this device to finish.
        </div>
      ) : (
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
          {error && (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="pt-4 text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-accent">
          Back to log in
        </Link>
      </p>
    </Card>
  );
}
