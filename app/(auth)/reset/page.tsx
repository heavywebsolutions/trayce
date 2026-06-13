"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Button, Input, Label } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setHasSession(true);
        setReady(true);
        settled = true;
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setHasSession(true);
        setReady(true);
        settled = true;
      }
    });

    // The recovery link takes a moment to establish the session. Wait before
    // concluding the link is bad, so we do not flash an error.
    const t = setTimeout(() => {
      if (!settled) setReady(true);
    }, 2500);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") || "");
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) setError(error.message);
    else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    }
  }

  return (
    <Card className="p-7">
      <h1 className="text-xl font-semibold text-ink-900">Set a new password</h1>

      {!ready ? (
        <p className="mt-2 text-sm text-ink-500">Checking your reset link…</p>
      ) : done ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Password updated. Taking you to your dashboard…
        </div>
      ) : hasSession ? (
        <form onSubmit={handle} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>
          {error && (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Update password"}
          </Button>
        </form>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-ink-500">
            This reset link is invalid or expired, or it was opened on a different
            device than the one that requested it.
          </p>
          <Link href="/forgot" className="mt-4 inline-block font-medium text-accent">
            Request a new link
          </Link>
        </div>
      )}
    </Card>
  );
}
