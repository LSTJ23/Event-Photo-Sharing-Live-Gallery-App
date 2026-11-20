import { describe, expect, it } from "vitest";
import { visibleCrop } from "./captureFrame";

describe("visibleCrop", () => {
  it("uses the whole picture when it isn't cropped on screen", () => {
    expect(visibleCrop(1080, 1920, 390, 520, "contain")).toEqual({ sx: 0, sy: 0, sw: 1080, sh: 1920 });
  });

  it("keeps the middle of a tall 9:16 picture shown in a 3:4 viewfinder", () => {
    // 1080 wide → 1440 tall at 3:4, so 240px is hidden at the top and bottom.
    expect(visibleCrop(1080, 1920, 390, 520, "cover")).toEqual({ sx: 0, sy: 240, sw: 1080, sh: 1440 });
  });

  it("keeps the middle of a wide picture shown in a narrower viewfinder", () => {
    // 1920×1080 into a 4:3 box: 1440 wide is kept, 240px hidden on each side.
    expect(visibleCrop(1920, 1080, 400, 300, "cover")).toEqual({ sx: 240, sy: 0, sw: 1440, sh: 1080 });
  });

  it("uses the whole picture when it already fits the viewfinder exactly", () => {
    expect(visibleCrop(1440, 1920, 390, 520, "cover")).toEqual({ sx: 0, sy: 0, sw: 1440, sh: 1920 });
  });
});
