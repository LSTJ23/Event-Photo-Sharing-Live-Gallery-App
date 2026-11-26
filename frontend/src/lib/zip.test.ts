import { describe, expect, it } from "vitest";
import { crc32, makeZip } from "./zip";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(bytes("123456789"))).toBe(0xcbf43926);
  });
});

describe("makeZip", () => {
  it("writes a zip with every file stored and an end record", () => {
    const zip = makeZip([
      { name: "a.txt", data: bytes("hello") },
      { name: "b.txt", data: bytes("world!") }
    ]);
    const view = new DataView(zip.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50); // starts with a file
    expect(view.getUint32(zip.length - 22, true)).toBe(0x06054b50); // ends with the directory end
    expect(view.getUint16(zip.length - 22 + 10, true)).toBe(2); // two files
    // 2 local headers (30 + name) + data + 2 central headers (46 + name) + end (22)
    expect(zip.length).toBe(30 + 5 + 5 + (30 + 5 + 6) + (46 + 5) * 2 + 22);
  });
});
