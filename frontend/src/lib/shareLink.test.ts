import { describe, expect, it } from "vitest";
import { displayLink, shareLinkFor } from "./shareLink";

describe("shareLinkFor", () => {
  it("builds the event's share link", () => {
    expect(shareLinkFor("https://eventgallery.com", "dlsu-cso-event")).toBe("https://eventgallery.com/e/dlsu-cso-event");
  });

  it("copes with a trailing slash on the site address", () => {
    expect(shareLinkFor("https://eventgallery.com/", "dlsu-cso-event")).toBe("https://eventgallery.com/e/dlsu-cso-event");
  });
});

describe("displayLink", () => {
  it("drops the https:// for display", () => {
    expect(displayLink("https://eventgallery.com/e/dlsu-cso-event")).toBe("eventgallery.com/e/dlsu-cso-event");
  });

  it("drops http:// too", () => {
    expect(displayLink("http://localhost:3000/e/dlsu-cso-event")).toBe("localhost:3000/e/dlsu-cso-event");
  });
});
