// Plan tests 1.1, 1.2 (nonexistent event), 11.5 (anonymous share) and 17.5 (removed
// photo is gone for participants), run against the in-browser stand-in API
// (lib/mockApi.ts). When the real backend exists, point these same checks at it.
import { beforeEach, describe, expect, it, vi } from "vitest";

type MockApi = typeof import("@/lib/mockApi");
let api: MockApi;

beforeEach(async () => {
  // The mock keeps its data in module memory, so load a fresh copy for every test.
  vi.resetModules();
  api = await import("@/lib/mockApi");
});

const image = () => new Blob(["fake image bytes"], { type: "image/jpeg" });

describe("1.1 / 1.2 - event lookup", () => {
  it("a valid event id returns that event", async () => {
    const event = await api.getEvent("dlsu-cso-event");
    expect(event?.id).toBe("dlsu-cso-event");
    expect(event?.name).toBe("DLSU CSO Event");
  });

  it("each event id returns its own event", async () => {
    expect((await api.getEvent("event-2"))?.name).toBe("Event 2");
  });

  it("an event id that does not exist returns null", async () => {
    expect(await api.getEvent("no-such-event")).toBeNull();
  });
});

describe("11.5 - anonymous sharing", () => {
  it("a photo shared with a name shows that name, and appears first", async () => {
    const photo = await api.uploadPhoto("dlsu-cso-event", image(), { anonymous: false }, "Test User");
    expect(photo.sharedBy).toBe("Test User");

    const photos = await api.listPhotos("dlsu-cso-event");
    expect(photos[0].id).toBe(photo.id);
  });

  it("a photo shared anonymously shows 'Anonymous' and never contains the name", async () => {
    const photo = await api.uploadPhoto("dlsu-cso-event", image(), { anonymous: true }, "Test User");
    expect(photo.sharedBy).toBe("Anonymous");

    const stored = (await api.listPhotos("dlsu-cso-event")).find((p) => p.id === photo.id);
    expect(stored?.sharedBy).toBe("Anonymous");
    expect(JSON.stringify(stored)).not.toContain("Test User");
  });

  it("a new photo is only added to its own event", async () => {
    await api.uploadPhoto("dlsu-cso-event", image(), { anonymous: false }, "Test User");
    expect(await api.listPhotos("event-2")).toHaveLength(0);
  });
});

describe("17.5 - removed photos are gone for participants", () => {
  it("removing selected photos leaves the others", async () => {
    const before = await api.listPhotos("dlsu-cso-event");
    const removed = before.slice(0, 3).map((p) => p.id);

    await api.removePhotos("dlsu-cso-event", removed);

    const after = await api.listPhotos("dlsu-cso-event");
    expect(after).toHaveLength(before.length - 3);
    for (const id of removed) expect(after.map((p) => p.id)).not.toContain(id);
  });

  it("removing photos of one event does not touch another event", async () => {
    const photo = (await api.listPhotos("dlsu-cso-event"))[0];
    await api.removePhotos("event-2", [photo.id]);
    expect((await api.listPhotos("dlsu-cso-event")).map((p) => p.id)).toContain(photo.id);
  });
});
