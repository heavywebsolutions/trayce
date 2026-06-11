"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { ContentFields } from "@/components/ContentFields";
import { updateContent } from "@/app/dashboard/codes/actions";

export function ContentEditor({
  codeId,
  contentType,
  initial,
}: {
  codeId: string;
  contentType: string;
  initial: Record<string, string>;
}) {
  const [content, setContent] = useState<Record<string, string>>(
    initial && Object.keys(initial).length ? initial : { encryption: "WPA" }
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function set(name: string, val: string) {
    setContent((c) => ({ ...c, [name]: val }));
  }

  function save() {
    const fd = new FormData();
    fd.set("code_id", codeId);
    fd.set("content_type", contentType);
    fd.set("content", JSON.stringify(content));
    start(async () => {
      await updateContent(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  }

  return (
    <div className="space-y-3">
      <ContentFields contentType={contentType} value={content} onChange={set} />
      <Button type="button" onClick={save} disabled={pending}>
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </Button>
    </div>
  );
}
