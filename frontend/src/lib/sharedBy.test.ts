import { describe, expect, it } from "vitest";
import { sharedByLabel } from "./sharedBy";

describe("sharedByLabel", () => {
  it("shows the participant's name when they share with their name", () => {
    expect(sharedByLabel("  Maria Santos ", false)).toBe("Maria Santos");
  });

  it("hides the name when they share anonymously", () => {
    expect(sharedByLabel("Maria Santos", true)).toBe("Anonymous");
  });

  it("falls back to Anonymous when there is no name", () => {
    expect(sharedByLabel("", false)).toBe("Anonymous");
    expect(sharedByLabel(null, false)).toBe("Anonymous");
  });
});
