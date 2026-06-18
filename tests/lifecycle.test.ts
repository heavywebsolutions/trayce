import { describe, it, expect } from "vitest";
import {
  lifecycleEmail,
  LIFECYCLE_DEFAULTS,
  type LifecycleKind,
} from "@/lib/lifecycle";

describe("lifecycleEmail rendering", () => {
  it("fills {daysLeft} with correct pluralization", () => {
    expect(lifecycleEmail("trial_ending", { daysLeft: 1 }).subject).toBe(
      "1 day of Growth left"
    );
    expect(lifecycleEmail("trial_ending", { daysLeft: 3 }).subject).toBe(
      "3 days of Growth left"
    );
  });

  it("fills {cardLabel} and {expLabel}", () => {
    const { html } = lifecycleEmail("card_expiring", {
      cardLabel: "Visa ending 4242",
      expLabel: "08/2026",
    });
    expect(html).toContain("Visa ending 4242");
    expect(html).toContain("08/2026");
    expect(html).not.toContain("{cardLabel}");
  });

  it("welcome button links to the codes page", () => {
    expect(lifecycleEmail("welcome").html).toContain("/dashboard/codes");
  });

  it("every kind renders a non-empty subject + html with no leftover tokens", () => {
    for (const kind of Object.keys(LIFECYCLE_DEFAULTS) as LifecycleKind[]) {
      const out = lifecycleEmail(kind, {
        daysLeft: 2,
        cardLabel: "Visa ending 1111",
        expLabel: "01/2027",
      });
      expect(out.subject.length).toBeGreaterThan(0);
      expect(out.html).toContain("<a href=");
      expect(out.subject + out.html).not.toMatch(/\{(daysLeft|cardLabel|expLabel)\}/);
    }
  });
});
