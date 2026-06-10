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
    </Card>
  );
}
