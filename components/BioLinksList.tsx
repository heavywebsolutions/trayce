"use client";

import { useState, useTransition } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { LinkThumb } from "@/components/LinkThumb";
import {
  updateBioLink,
  deleteBioLink,
  reorderBioLinks,
} from "@/app/dashboard/bio/actions";
import { formatNumber } from "@/lib/utils";
import type { BioLink } from "@/lib/types";

const kindTone: Record<string, string> = {
  link: "indigo",
  header: "gray",
  video: "violet",
  subscribe: "green",
  text: "gray",
  image: "amber",
};

export function BioLinksList({
  links,
  pageId,
}: {
  links: BioLink[];
  pageId: string;
}) {
  const [order, setOrder] = useState<BioLink[]>(links);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, start] = useTransition();

  function persist(next: BioLink[]) {
    const fd = new FormData();
    fd.set("page_id", pageId);
    fd.set("ids", JSON.stringify(next.map((l) => l.id)));
    start(() => {
      reorderBioLinks(fd);
    });
  }

  function onDragOver(e: React.DragEvent, overId: string) {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    setOrder((cur) => {
      const from = cur.findIndex((l) => l.id === dragId);
      const to = cur.findIndex((l) => l.id === overId);
      if (from < 0 || to < 0) return cur;
      const copy = [...cur];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onDrop() {
    if (dragId) persist(order);
    setDragId(null);
  }

  if (order.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-ink-500">
        No blocks yet. Add your first one above.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {order.map((l) => {
        const hasUrl = l.kind === "link" || l.kind === "video";
        const hasImage = l.kind === "link" || l.kind === "image";
        return (
          <li
            key={l.id}
            onDragOver={(e) => onDragOver(e, l.id)}
            onDrop={onDrop}
            className={dragId === l.id ? "px-6 py-4 opacity-50" : "px-6 py-4"}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  draggable
                  onDragStart={() => setDragId(l.id)}
                  onDragEnd={() => setDragId(null)}
                  className="cursor-grab select-none text-ink-300 hover:text-ink-500"
                  title="Drag to reorder"
                >
                  ⠿
                </span>
                <Badge tone={kindTone[l.kind] ?? "gray"}>{l.kind}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {l.kind === "link" && (
                  <span className="text-xs text-ink-400">
                    {formatNumber(l.clicks)} clicks
                  </span>
                )}
                <form action={deleteBioLink}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="page_id" value={pageId} />
                  <button className="rounded px-1.5 text-rose-500 hover:bg-rose-50">
                    ✕
                  </button>
                </form>
              </div>
            </div>

            <form
              action={updateBioLink}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="page_id" value={pageId} />
              <Input
                name="title"
                defaultValue={l.title}
                placeholder={
                  l.kind === "text"
                    ? "Text to show"
                    : l.kind === "subscribe"
                      ? "Prompt (e.g. Get wrap drops first)"
                      : "Title"
                }
                className="flex-1"
              />
              {hasUrl && (
                <Input
                  name="url"
                  defaultValue={l.url}
                  placeholder="URL"
                  className="flex-1"
                />
              )}
              <Button type="submit" variant="secondary">
                Save
              </Button>
            </form>

            {hasImage && (
              <LinkThumb
                linkId={l.id}
                pageId={pageId}
                initial={l.thumbnail_url}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
