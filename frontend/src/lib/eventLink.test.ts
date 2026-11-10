import { describe, expect, it } from "vitest";
import { parseEventLink } from "./eventLink";

describe("parseEventLink", () => {
  it("reads the event id from a share link", () => {
    expect(parseEventLink("https://gallery.example.com/e/dlsu-cso-event")).toBe("dlsu-cso-event");
  });

  it("reads the event id from a deeper link into the event", () => {
    expect(parseEventLink("https://gallery.example.com/e/DLSU-CSO-Event/camera")).toBe("dlsu-cso-event");
  });

  it("reads the event id from an ?event= link", () => {
    expect(parseEventLink("https://gallery.example.com/join?event=DLSU-CSO-Event")).toBe("dlsu-cso-event");
  });

  it("ignores plain text, since there are no event codes", () => {
    expect(parseEventLink("dlsu-cso-event")).toBeNull();
    expect(parseEventLink("   ")).toBeNull();
  });

  it("ignores links that aren't to an event", () => {
    expect(parseEventLink("https://example.com/menu")).toBeNull();
  });
});
