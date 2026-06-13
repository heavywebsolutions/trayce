"use client";

import { useState } from "react";

// YouTube "facade": show the real thumbnail with a play button, then load the
// actual player only on click. Renders instantly, works inside the editor
// preview (where a live nested embed often will not load), and is faster.
export function BioVideo({
  videoId,
  title,
}: {
  videoId: string;
  title?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div
        className="overflow-hidden rounded-2xl bg-black"
        style={{ aspectRatio: "16 / 9" }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={title ? `Play ${title}` : "Play video"}
      className="group relative block w-full overflow-hidden rounded-2xl bg-black"
      style={{ aspectRatio: "16 / 9" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt={title || "Video thumbnail"}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-black/55 backdrop-blur-sm transition group-hover:bg-red-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-0.5 fill-white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
