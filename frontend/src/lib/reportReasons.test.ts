import { describe, expect, it } from "vitest";
import { reportFormError } from "./reportReasons";

describe("reportFormError", () => {
  it("needs a reason from the list", () => {
    expect(reportFormError("", "")).toBe("Choose a reason.");
    expect(reportFormError("Made up", "")).toBe("Choose a reason.");
    expect(reportFormError("Spam", "")).toBeNull();
  });

  it("asks for details when the reason is Other", () => {
    expect(reportFormError("Other", "  ")).toBe("Tell us a little about what's wrong.");
    expect(reportFormError("Other", "Blurry photo of my ID")).toBeNull();
  });

  it("limits the details", () => {
    expect(reportFormError("Spam", "x".repeat(201))).toBe("Keep it under 200 characters.");
  });
});
