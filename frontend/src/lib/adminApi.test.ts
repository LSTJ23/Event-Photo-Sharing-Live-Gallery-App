import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("./supabase", () => ({ getSupabase: () => ({ auth: { getSession } }) }));

import { createEvent, listEvents } from "./adminApi";

const form = {
  name: "Event", venue: "Venue", organizerId: "organizer", hashtag: "Event",
  capacity: "100", date: "2027-01-01", time: "18:00", endDate: "2027-01-02", endTime: "01:00"
};
const row = {
  id: "uuid", organizer_id: "organizer", name: "Event", location: "Venue", hashtag: "Event",
  start_at: new Date("2027-01-01T18:00:00").toISOString(),
  end_at: new Date("2027-01-02T01:00:00").toISOString(), photo_capacity: 100,
  share_slug: "public-link", share_link_active: true, archived_at: null,
  participant_count: 0, photo_count: 0
};

beforeEach(() => {
  getSession.mockResolvedValue({ data: { session: { access_token: "access" } }, error: null });
});
afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("admin event API", () => {
  it("sends the signed-in session and local times as UTC instants", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => row });
    vi.stubGlobal("fetch", fetch);
    const event = await createEvent(form);
    expect(fetch).toHaveBeenCalledWith("/api/admin/events", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer access" })
    }));
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.startAt).toBe(row.start_at);
    expect(body.endAt).toBe(row.end_at);
    expect(event).toMatchObject({ id: "uuid", date: form.date, time: form.time, shareSlug: "public-link" });
  });

  it("surfaces API failures rather than creating a local event", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 500, json: async () => ({ error: "Database unavailable." })
    }));
    await expect(createEvent(form)).rejects.toThrow("Database unavailable.");
  });

  it("loads stored events and converts timestamps back to local time", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => [row] }));
    const events = await listEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ id: "uuid", date: form.date, time: form.time, endDate: form.endDate, endTime: form.endTime });
  });

  it("does not submit without a session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(createEvent(form)).rejects.toThrow("Please sign in again.");
    expect(fetch).not.toHaveBeenCalled();
  });
});
