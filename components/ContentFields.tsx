"use client";

import { Input, Label } from "@/components/ui";
import { FIELD_DEFS } from "@/lib/codeContent";

export function ContentFields({
  contentType,
  value,
  onChange,
}: {
  contentType: string;
  value: Record<string, string>;
  onChange: (name: string, val: string) => void;
}) {
  const fields = FIELD_DEFS[contentType] ?? [];

  return (
    <div className="space-y-3">
      {fields.map((f) => {
        if (f.type === "textarea") {
          return (
            <div key={f.name}>
              <Label htmlFor={f.name}>{f.label}</Label>
              <textarea
                id={f.name}
                value={value[f.name] ?? ""}
                onChange={(e) => onChange(f.name, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
              />
            </div>
          );
        }
        if (f.type === "select") {
          return (
            <div key={f.name}>
              <Label htmlFor={f.name}>{f.label}</Label>
              <select
                id={f.name}
                value={value[f.name] ?? f.options?.[0]?.v ?? ""}
                onChange={(e) => onChange(f.name, e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-accent-ring focus:ring-2 focus:ring-accent-ring/30"
              >
                {f.options?.map((o) => (
                  <option key={o.v} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
        if (f.type === "checkbox") {
          return (
            <label
              key={f.name}
              className="flex items-center gap-2 text-sm text-ink-700"
            >
              <input
                type="checkbox"
                checked={value[f.name] === "true"}
                onChange={(e) => onChange(f.name, e.target.checked ? "true" : "false")}
                className="accent-[#2587DE]"
              />
              {f.label}
            </label>
          );
        }
        return (
          <div key={f.name}>
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input
              id={f.name}
              type={f.type === "url" ? "url" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"}
              inputMode={f.type === "url" ? "url" : f.type === "email" ? "email" : f.type === "tel" ? "tel" : undefined}
              value={value[f.name] ?? ""}
              onChange={(e) => onChange(f.name, e.target.value)}
              placeholder={f.placeholder}
            />
          </div>
        );
      })}
    </div>
  );
}
