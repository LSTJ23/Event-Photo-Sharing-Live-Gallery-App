import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEventSlugHandler, type EventSlugDeps } from "./controllers/eventSlugController.js";

// Set a fixed date for testing.
const TODAY = "2026-06-01";

describe("GET /api/events/slug/:qrSlug", () => {
  // Mock function for finding events using their public codes.
  const findEventByCode = vi.fn<EventSlugDeps["findEventByCode"]>();

  // Creates a small app with only the slug route, so these tests do not depend on how createApp is wired.
  const app = express();
  app.get("/api/events/slug/:qrSlug", createEventSlugHandler({ findEventByCode, today: () => TODAY }));

  // Resets the mock before each test.
  beforeEach(() => {
    findEventByCode.mockReset();
  });

  // Checks if a valid code returns the correct event details.
  it("returns the event for a valid code", async () => {
    findEventByCode.mockResolvedValue({
      id: "event-1",
      name: "Wedding",
      eventDate: "2026-07-15",
      venue: "Manila Hotel"
    });

    const response = await request(app).get("/api/events/slug/ABC123");

    expect(response.status).toBe(200);
    expect(findEventByCode).toHaveBeenCalledWith("ABC123");
    expect(response.body).toEqual({
      valid: true,
      event: { id: "event-1", name: "Wedding", date: "2026-07-15", venue: "Manila Hotel" }
    });
  });

  // Checks if an unknown event code returns a 404 error.
  it("returns 404 for an unknown code", async () => {
    findEventByCode.mockResolvedValue(null);

    const response = await request(app).get("/api/events/slug/non-existent-slug-999");

    expect(response.status).toBe(404);
    expect(response.body.valid).toBe(false);
  });

  // Checks if malformed codes are rejected without querying the database.
  it.each(["%20", "bad%20slug", "a%2Fb", "x".repeat(101)])("returns 404 for malformed code %s", async (slug) => {
    const response = await request(app).get(`/api/events/slug/${slug}`);

    expect(response.status).toBe(404);
    expect(response.body.valid).toBe(false);
    expect(findEventByCode).not.toHaveBeenCalled();
  });

  // Checks if events with dates before today are considered expired.
  it("returns 410 when the event date has passed", async () => {
    findEventByCode.mockResolvedValue({ id: "e1", name: "Old", eventDate: "2026-05-31", venue: null });

    const response = await request(app).get("/api/events/slug/OLD1");

    expect(response.status).toBe(410);
    expect(response.body.valid).toBe(false);
  });

  // Checks if an event is still accessible on its scheduled date.
  it("still lets people in on the day of the event", async () => {
    findEventByCode.mockResolvedValue({ id: "e1", name: "Today", eventDate: TODAY, venue: null });

    const response = await request(app).get("/api/events/slug/TODAY1");

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });

  // Checks if events without a scheduled date are still considered open.
  it("treats an event with no date as open", async () => {
    findEventByCode.mockResolvedValue({ id: "e1", name: "No date", eventDate: null, venue: null });

    const response = await request(app).get("/api/events/slug/NODATE");

    expect(response.status).toBe(200);
  });

  // Checks if database lookup errors return a 500 response.
  it("returns 500 when the lookup fails", async () => {
    findEventByCode.mockRejectedValue(new Error("db down"));

    const response = await request(app).get("/api/events/slug/ABC123");

    expect(response.status).toBe(500);
  });
});