import { describe, it, expect } from "vitest";
import {
  isServable,
  resolveRedirectTarget,
  type RedirectCode,
} from "@/lib/redirect";

const base: RedirectCode = {
  id: "c1",
  workspace_id: "w1",
  destination_url: "https://example.com/menu",
  status: "active",
  action_type: "redirect",
  content_type: "url",
  content: null,
};

describe("isServable — a scanner must never hit an error page", () => {
  it("missing code is not servable (caller falls back)", () => {
    expect(isServable(null)).toBe(false);
  });

  it("archived code is not servable (caller falls back)", () => {
    expect(isServable({ ...base, status: "archived" })).toBe(false);
  });

  it("active code is servable", () => {
    expect(isServable(base)).toBe(true);
  });

  it("paused code still redirects (only archived stops)", () => {
    expect(isServable({ ...base, status: "paused" })).toBe(true);
  });
});

describe("resolveRedirectTarget", () => {
  const opts = { slug: "abc123", ua: "", appUrl: "https://traxxr.com" };

  it("plain URL code goes to its current destination", () => {
    expect(resolveRedirectTarget({ ...opts, code: base })).toBe(
      "https://example.com/menu"
    );
  });

  it("re-pointing the destination changes where it goes", () => {
    const repointed = { ...base, destination_url: "https://example.com/new" };
    expect(resolveRedirectTarget({ ...opts, code: repointed })).toBe(
      "https://example.com/new"
    );
  });

  it("lead code routes to the hosted form for its slug", () => {
    const lead = { ...base, action_type: "lead" };
    expect(resolveRedirectTarget({ ...opts, code: lead })).toBe(
      "https://traxxr.com/f/abc123"
    );
  });

  it("app code sends iOS devices to the App Store", () => {
    const app: RedirectCode = {
      ...base,
      content_type: "app",
      content: {
        ios: "https://apps.apple.com/x",
        android: "https://play.google.com/x",
        fallback: "https://example.com",
      },
    };
    const out = resolveRedirectTarget({
      ...opts,
      code: app,
      ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    });
    expect(out).toBe("https://apps.apple.com/x");
  });

  it("app code sends Android devices to Google Play", () => {
    const app: RedirectCode = {
      ...base,
      content_type: "app",
      content: {
        ios: "https://apps.apple.com/x",
        android: "https://play.google.com/x",
        fallback: "https://example.com",
      },
    };
    const out = resolveRedirectTarget({
      ...opts,
      code: app,
      ua: "Mozilla/5.0 (Linux; Android 14)",
    });
    expect(out).toBe("https://play.google.com/x");
  });

  it("app code sends desktop to the fallback, normalized to https", () => {
    const app: RedirectCode = {
      ...base,
      content_type: "app",
      content: { ios: "", android: "", fallback: "example.com/get" },
    };
    const out = resolveRedirectTarget({
      ...opts,
      code: app,
      ua: "Mozilla/5.0 (Macintosh)",
    });
    expect(out).toBe("https://example.com/get");
  });
});
