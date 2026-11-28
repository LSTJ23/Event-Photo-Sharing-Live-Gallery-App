import { createClient } from "@supabase/supabase-js";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { AuthError, type AuthService } from "./authController.js";

const organizerId = "11111111-1111-4111-8111-111111111111";
const eventId = "22222222-2222-4222-8222-222222222222";
const admin = { id: "admin", name: "Admin", email: "admin@example.test", role: "admin" as const, mustChangePassword: false };
const auth: AuthService = {
  signIn: vi.fn(), joinEvent: vi.fn(), currentUser: vi.fn(), changePassword: vi.fn(), event: vi.fn()
};
const input = {
  name: " Event ", venue: " Venue ", organizerId, hashtag: "#MyEvent",
  capacity: 100, startAt: "2027-01-01T10:00:00.000Z", endAt: "2027-01-01T11:00:00.000Z"
};
const saved = {
  id: eventId, organizer_id: organizerId, name: "Event", location: "Venue", hashtag: "MyEvent",
  start_at: input.startAt, end_at: input.endAt, photo_capacity: 100, share_slug: "public-link",
  share_link_active: true, archived_at: null, created_at: "2026-01-01T00:00:00.000Z"
};

const fetchMock = vi.fn<typeof fetch>();
const client = createClient("http://127.0.0.1:12345", "test-key", {
  global: { fetch: fetchMock }, auth: { persistSession: false }
});
const app = createApp({ query: vi.fn() }, undefined, { auth, supabase: client });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(auth.currentUser).mockResolvedValue(admin);
  fetchMock.mockImplementation(async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith("/staff_users")) return Response.json({ id: organizerId });
    if (path.endsWith("/events") && init?.method === "POST") return Response.json(saved, { status: 201 });
    if (path.endsWith("/events")) return Response.json([saved]);
    if (path.endsWith("/event_stats")) return Response.json([{ event_id: eventId, participant_count: 2, photo_count: 3 }]);
    throw new Error(`Unexpected request: ${path}`);
  });
});

describe("admin event creation", () => {
  it("requires a verified admin session", async () => {
    expect((await request(app).post("/api/admin/events").send(input)).status).toBe(401);
    vi.mocked(auth.currentUser).mockResolvedValue({ ...admin, role: "organizer" });
    expect((await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send(input)).status).toBe(403);
    vi.mocked(auth.currentUser).mockResolvedValue({ ...admin, mustChangePassword: true });
    expect((await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send(input)).status).toBe(403);
    vi.mocked(auth.currentUser).mockRejectedValue(new AuthError(401, "Session expired."));
    expect((await request(app).post("/api/admin/events").set("Authorization", "Bearer bad").send(input)).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not expose the old unauthenticated event routes", async () => {
    expect((await request(app).post("/api/events").send(input)).status).toBe(404);
    expect((await request(app).delete(`/api/events/${eventId}`)).status).toBe(404);
  });

  it("inserts validated fields and lets the database generate the UUID and share link", async () => {
    const response = await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send(input);
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: eventId, share_slug: "public-link", name: "Event", photo_count: 0 });
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
    expect(post).toBeDefined();
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      organizer_id: organizerId, name: "Event", location: "Venue", hashtag: "MyEvent",
      start_at: input.startAt, end_at: input.endAt, photo_capacity: 100
    });
    expect(JSON.parse(String(post?.[1]?.body))).not.toHaveProperty("id");
    expect(JSON.parse(String(post?.[1]?.body))).not.toHaveProperty("share_slug");
  });

  it.each([
    { name: "" }, { organizerId: "not-a-uuid" }, { capacity: 0 }, { capacity: true },
    { startAt: "2027-02-30T10:00:00.000Z" }, { startAt: "2027-01-01T25:00:00.000Z" },
    { endAt: "2027-01-01T10:00:00.000Z" }, { hashtag: "bad tag" }
  ])("rejects invalid input %j before database access", async (invalid) => {
    const response = await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send({ ...input, ...invalid });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing or inactive organizer", async () => {
    fetchMock.mockResolvedValue(Response.json(null));
    const response = await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send(input);
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get("role")).toBe("eq.organizer");
    expect(url.searchParams.get("is_active")).toBe("eq.true");
  });

  it("returns an error when the database insert fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(async (url) => new URL(String(url)).pathname.endsWith("/staff_users")
      ? Response.json({ id: organizerId })
      : Response.json({ message: "database unavailable" }, { status: 500 }));
    const response = await request(app).post("/api/admin/events").set("Authorization", "Bearer token").send(input);
    expect(response.status).toBe(500);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("lists stored events and their current counts", async () => {
    const response = await request(app).get("/api/admin/events").set("Authorization", "Bearer token");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject([{ id: eventId, participant_count: 2, photo_count: 3 }]);
  });
});
