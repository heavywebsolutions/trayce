import { describe, it, expect } from "vitest";
import { youtubeId } from "@/lib/bio";

describe("youtubeId", () => {
  it("parses a watch URL", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });
  it("parses youtu.be", () => {
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses shorts", () => {
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });
  it("returns null for non-youtube and empty", () => {
    expect(youtubeId("https://vimeo.com/123")).toBeNull();
    expect(youtubeId("")).toBeNull();
  });
});
