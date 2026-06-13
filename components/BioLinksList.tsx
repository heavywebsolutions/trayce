"use client";

import { useRef, useState, useTransition } from "react";
import { Button, Input, Badge } from "@/components/ui";
import { LinkThumb } from "@/components/LinkThumb";
import {
  updateBioLink,
  deleteBioLink,
  reorderBioLinks,
  updateBioLinkConfig,
  fetchBioProduct,
  toggleBioLink,
} from "@/app/dashboard/bio/actions";
import { formatNumber, cn } from "@/lib/utils";
import { formatPrice } from "@/lib/shopify";
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
  const listRef = useRef<HTMLUListElement>(null);

  function persist(next: BioLink[]) {
    const fd = new FormData();
    fd.set("page_id", pageId);
    fd.set("ids", JSON.stringify(next.map((l) => l.id)));
    start(() => {
      reorderBioLinks(fd);
    });
  }

  // Pointer-based drag — works with both mouse and touch.
  function targetIndex(clientY: number): number {
    const ul = listRef.current;
    if (!ul) return -1;
    const items = Array.from(
      ul.querySelectorAll<HTMLLIElement>("li[data-id]")
    );
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return items.length - 1;
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    setDragId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragId) return;
    const to = targetIndex(e.clientY);
    if (to < 0) return;
    setOrder((cur) => {
      const from = cur.findIndex((l) => l.id === dragId);
      if (from < 0 || from === to) return cur;
      const copy = [...cur];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    });
  }

  function onPointerUp() {
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
    <ul ref={listRef} className="space-y-3 p-4">
      {order.map((l) => {
        const hasUrl = l.kind === "link" || l.kind === "video";
        const hasImage = l.kind === "link" || l.kind === "image";
        return (
          <li
            key={l.id}
            data-id={l.id}
            className={cn(
              "rounded-xl border border-ink-200 bg-white p-4 shadow-sm transition",
              l.hidden && "opacity-60",
              dragId === l.id &&
                "relative z-10 border-accent-ring bg-accent-soft shadow-lg ring-1 ring-accent-ring"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onPointerDown={(e) => onPointerDown(e, l.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  style={{ touchAction: "none" }}
                  className={cn(
                    "grid h-9 w-8 shrink-0 cursor-grab touch-none select-none place-items-center rounded-lg text-lg leading-none active:cursor-grabbing",
                    dragId === l.id
                      ? "bg-accent text-white"
                      : "text-ink-400 hover:bg-ink-100"
                  )}
                  aria-label="Drag to reorder"
                >
                  ⣿
                </button>
                <Badge tone={kindTone[l.kind] ?? "gray"}>{l.kind}</Badge>
                {l.hidden && <Badge tone="gray">Hidden</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {(l.kind === "link" || l.kind === "product") && (
                  <span className="text-xs text-ink-400">
                    {formatNumber(l.clicks)} clicks
                  </span>
                )}
                <form action={toggleBioLink}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="page_id" value={pageId} />
                  <input type="hidden" name="hidden" value={String(l.hidden)} />
                  <button
                    className="rounded px-2 py-0.5 text-xs font-medium text-ink-500 hover:bg-ink-100"
                    title={l.hidden ? "Show on your page" : "Hide from your page"}
                  >
                    {l.hidden ? "Show" : "Hide"}
                  </button>
                </form>
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
                      : l.kind === "form"
                        ? "Form heading (e.g. Apply to be a Dealer)"
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

            {l.kind === "form" && (
              <form
                action={updateBioLinkConfig}
                className="mt-2 space-y-2 rounded-lg bg-ink-50 p-3"
              >
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="page_id" value={pageId} />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      name="collect_name"
                      defaultChecked={l.config?.collect_name ?? true}
                      className="accent-[#4F46E5]"
                    />
                    Collect name
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      name="collect_phone"
                      defaultChecked={l.config?.collect_phone ?? false}
                      className="accent-[#4F46E5]"
                    />
                    Collect phone
                  </label>
                </div>
                <Input
                  name="button"
                  defaultValue={l.config?.button ?? "Submit"}
                  placeholder="Button text"
                />
                <Input
                  name="success"
                  defaultValue={
                    l.config?.success ?? "Thanks — we'll be in touch!"
                  }
                  placeholder="Success message"
                />
                <Button type="submit" variant="secondary">
                  Save form settings
                </Button>
              </form>
            )}

            {l.kind === "product" && (
              <form
                action={fetchBioProduct}
                className="mt-2 space-y-2 rounded-lg bg-ink-50 p-3"
              >
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="page_id" value={pageId} />
                <Input
                  name="product_input"
                  defaultValue={l.config?.product?.handle ?? ""}
                  placeholder="Shopify product URL or handle"
                />
                <Button type="submit" variant="secondary">
                  Fetch product
                </Button>
                {l.config?.product ? (
                  <div className="flex items-center gap-2 text-xs text-ink-600">
                    {l.config.product.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.config.product.image}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <span className="truncate">
                      {l.config.product.title} ·{" "}
                      {formatPrice(
                        l.config.product.price,
                        l.config.product.currency
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-400">
                    Connect Shopify under Integrations, then paste a product
                    link.
                  </p>
                )}
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
