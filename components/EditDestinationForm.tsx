"use client";

import { useFormStatus } from "react-dom";
import { Button, Input } from "@/components/ui";
import { updateDestination } from "@/app/dashboard/codes/actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? "Saving…" : "Update destination"}
    </Button>
  );
}

export function EditDestinationForm({
  codeId,
  current,
}: {
  codeId: string;
  current: string;
}) {
  return (
    <form
      action={updateDestination}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input type="hidden" name="code_id" value={codeId} />
      <Input
        name="destination_url"
        defaultValue={current}
        inputMode="url"
        className="flex-1"
      />
      <Save />
    </form>
  );
}
