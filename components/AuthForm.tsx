"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button, Input, Label } from "@/components/ui";
import { login, signup, type AuthState } from "@/app/(auth)/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "One moment…" : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useFormState<AuthState, FormData>(
    action,
    undefined
  );

  const isLogin = mode === "login";
  return (
    <form action={formAction} className="space-y-4">
      {/* Honeypot: hidden from people, bait for bots. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input
          type="text"
          name="company_url"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
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
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder={isLogin ? "Your password" : "At least 8 characters"}
          required
        />
      </div>

      {!isLogin && (
        <div>
          <Label htmlFor="promo">Promo code (optional)</Label>
          <Input
            id="promo"
            name="promo"
            placeholder="Ambassador or early-access code"
            autoCapitalize="characters"
          />
        </div>
      )}

      {isLogin && (
        <div className="-mt-1 text-right">
          <Link href="/forgot" className="text-sm font-medium text-accent">
            Forgot password?
          </Link>
        </div>
      )}

      {state?.error && (
        <p className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <SubmitButton label={isLogin ? "Log in" : "Create your account"} />

      <p className="pt-1 text-center text-sm text-ink-500">
        {isLogin ? (
          <>
            New here?{" "}
            <Link href="/signup" className="font-medium text-accent">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
