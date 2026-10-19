import { describe, expect, it } from "vitest";
import { eventSlug } from "./eventSlug";

describe("eventSlug", () => {
  it("converts an event name into a URL-friendly slug", () => {
    expect(eventSlug("  Summer Gala 2026! ")).toBe("summer-gala-2026");
  });

  it("returns an empty slug when the name has no letters or numbers", () => {
    expect(eventSlug("!!!")).toBe("");
  });
});
