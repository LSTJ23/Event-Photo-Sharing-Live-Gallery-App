import { describe, expect, it } from "vitest";
import { listPhotos, setPhotoHidden } from "./mockApi";

describe("hidden photos (mock API)", () => {
  it("leaves hidden photos out for guests but keeps them, marked, for organizers and admins", async () => {
    await setPhotoHidden("dlsu-cso-event", "sample-9", true);
    const guest = await listPhotos("dlsu-cso-event");
    const staff = await listPhotos("dlsu-cso-event", { includeHidden: true });
    expect(guest.some((p) => p.id === "sample-9")).toBe(false);
    expect(staff.find((p) => p.id === "sample-9")?.hidden).toBe(true);

    await setPhotoHidden("dlsu-cso-event", "sample-9", false);
    const again = await listPhotos("dlsu-cso-event");
    expect(again.some((p) => p.id === "sample-9")).toBe(true);
  });
});
