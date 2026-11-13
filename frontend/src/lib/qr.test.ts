import { describe, expect, it } from "vitest";
import { makeQr, qrPath } from "./qr";

// The real check (that phone cameras and scanners read these codes) was done by
// decoding generated codes with OpenCV; these tests guard the basic structure.

const finderAt = (m: boolean[][], row: number, col: number) =>
  [0, 1, 2, 3, 4, 5, 6].every((i) => m[row][col + i] && m[row + 6][col + i] && m[row + i][col] && m[row + i][col + 6]);

describe("makeQr", () => {
  it("makes a square symbol of a valid QR size", () => {
    const m = makeQr("https://eventgallery.com/e/dlsu-cso-event");
    expect(m.length).toBe(29); // version 3 = 29 × 29 squares
    expect(m.every((row) => row.length === m.length)).toBe(true);
  });

  it("draws the three corner finder patterns", () => {
    const m = makeQr("https://eventgallery.com/e/dlsu-cso-event");
    const end = m.length - 7;
    expect(finderAt(m, 0, 0)).toBe(true);
    expect(finderAt(m, 0, end)).toBe(true);
    expect(finderAt(m, end, 0)).toBe(true);
  });

  it("grows for longer text", () => {
    expect(makeQr("https://eventgallery.com/e/" + "e".repeat(200)).length).toBeGreaterThan(29);
  });

  it("gives the same code for the same text", () => {
    const text = "https://eventgallery.com/e/dlsu-cso-event";
    expect(JSON.stringify(makeQr(text))).toBe(JSON.stringify(makeQr(text)));
  });
});

describe("qrPath", () => {
  it("draws one square per dark module, offset by the margin", () => {
    expect(qrPath([[true, false], [false, true]], 4)).toBe("M4 4h1v1h-1zM5 5h1v1h-1z");
  });
});
