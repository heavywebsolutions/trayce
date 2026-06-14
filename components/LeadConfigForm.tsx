"use client";

import { useFormStatus } from "react-dom";
import { Button, Input, Label } from "@/components/ui";
import { saveLeadConfig } from "@/app/dashboard/codes/actions";

function Save() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save form"}
    </Button>
  );
}

export function LeadConfigForm({
  code,
}: {
  code: {
    id: string;
    lead_headline: string;
    lead_subtext: string;
    lead_button: string;
    lead_collect_name: boolean;
    lead_collect_phone: boolean;
    lead_success_message: string;
  };
}) {
  return (
    <form action={saveLeadConfig} className="space-y-3">
      <input type="hidden" name="code_id" value={code.id} />
      <div>
        <Label htmlFor="lead_headline">Headline</Label>
        <Input
          id="lead_headline"
          name="lead_headline"
          defaultValue={code.lead_headline}
          maxLength={80}
        />
      </div>
      <div>
        <Label htmlFor="lead_subtext">Subtext</Label>
        <Input
          id="lead_subtext"
          name="lead_subtext"
          defaultValue={code.lead_subtext}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="lead_collect_name"
            defaultChecked={code.lead_collect_name}
            className="accent-[#2587DE]"
          />
          Collect name
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="lead_collect_phone"
            defaultChecked={code.lead_collect_phone}
            className="accent-[#2587DE]"
          />
          Collect phone
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="lead_button">Button text</Label>
          <Input
            id="lead_button"
            name="lead_button"
            defaultValue={code.lead_button}
            maxLength={40}
          />
        </div>
        <div>
          <Label htmlFor="lead_success_message">Success message</Label>
          <Input
            id="lead_success_message"
            name="lead_success_message"
            defaultValue={code.lead_success_message}
          />
        </div>
      </div>
      <Save />
    </form>
  );
}
