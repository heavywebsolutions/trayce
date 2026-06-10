import { Card } from "@/components/ui";
import { AuthForm } from "@/components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string }>;
}) {
  const { check } = await searchParams;
  return (
    <Card className="p-7">
      <h1 className="text-xl font-semibold text-ink-900">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Log in to manage your codes and scans.
      </p>
      {check && (
        <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Check your inbox to confirm your email, then log in.
        </p>
      )}
      <AuthForm mode="login" />
    </Card>
  );
}
