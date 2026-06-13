import Link from "next/link";
import { Card } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <Card className="p-7">
      <h1 className="text-xl font-semibold text-ink-900">
        Start tracking your scans
      </h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Free to start. No card required.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-4 text-center text-xs text-ink-400">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline hover:text-ink-600">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-ink-600">
          Privacy Policy
        </Link>
        .
      </p>
    </Card>
  );
}
