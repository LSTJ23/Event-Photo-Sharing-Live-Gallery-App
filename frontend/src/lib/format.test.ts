import { describe, expect, it } from "vitest";
import { formatEventDate, formatPhotoTimestamp } from "./format";

describe("formatEventDate", () => {
  it("formats a calendar date without shifting the day", () => {
    expect(formatEventDate("2026-10-14")).toBe("October 14, 2026");
  });

  it("returns the input when it is not a date", () => {
    expect(formatEventDate("soon")).toBe("soon");
  });
});

describe("formatPhotoTimestamp", () => {
  it("shows the date and time in the given time zone", () => {
    expect(formatPhotoTimestamp("2026-10-14T11:14:00Z", "Asia/Manila")).toBe("October 14, 2026 · 7:14 PM");
  });

  it("returns an empty string for a bad timestamp", () => {
    expect(formatPhotoTimestamp("not a time")).toBe("");
  });
});
