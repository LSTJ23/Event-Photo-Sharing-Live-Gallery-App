import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import type { EoEventsDeps } from "./controllers/eoEventsController.js";
import { createEoEventsHandler } from "./controllers/eoEventsController.js";
import { getEventStatus } from "./eventStatus.js";

// Create a fake database for testing.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Test how event statuses are determined based on their dates.
describe("getEventStatus", () => {
  // Set the event's start and end times.
  const start = new Date("2026-06-01T10:00:00Z");
  const end = new Date("2026-06-01T18:00:00Z");

  // Events should be Upcoming before their start time.
  it("is Upcoming before the start", () => {
    expect(getEventStatus(start, end, new Date("2026-06-01T09:59:59Z"))).toBe("Upcoming");
  });

  // Events should be Live starting from their start time until their end time.
  it("is Live from the start until the end", () => {
    expect(getEventStatus(start, end, start)).toBe("Live");
    expect(getEventStatus(start, end, new Date("2026-06-01T12:00:00Z"))).toBe("Live");
  });

  // Events should be Ended once their end time is reached or passed.
  it("is Ended at and after the end time", () => {
    expect(getEventStatus(start, end, end)).toBe("Ended");
    expect(getEventStatus(start, end, new Date("2026-06-02T00:00:00Z"))).toBe("Ended");
  });
});

// Test the API endpoint that loads an organizer's events.
describe("GET /api/eo/events", () => {
  // Create a mock function to simulate getting events from the database.
  const findEventsByOrganizer = vi.fn<EoEventsDeps["findEventsByOrganizer"]>();

  // Provide the mock function and a fixed date for testing.
  const deps: EoEventsDeps = {
    findEventsByOrganizer,
    now: () => new Date("2026-06-01T12:00:00Z")
  };

  // Create a test app and simulate the authentication middleware.
  function buildApp(user?: { id: string; role: string }) {
    const app = express();

    // Store the logged-in user's information in the response.
    app.use((_request, response, next) => {
      if (user) response.locals.user = user;
      next();
    });

    // Register the organizer's events endpoint.
    app.get("/api/eo/events", createEoEventsHandler(deps));
    return app;
  }

  // Reset the mock before each test.
  beforeEach(() => {
    findEventsByOrganizer.mockReset();
  });

  // Requests without a logged-in user should return 401.
  it("returns 401 when no user is logged in", async () => {
    const response = await request(buildApp()).get("/api/eo/events");

    expect(response.status).toBe(401);

    // Make sure no database lookup was performed.
    expect(findEventsByOrganizer).not.toHaveBeenCalled();
  });

  // Organizers without assigned events should receive an empty array.
  it("returns an empty array when the organizer has no events", async () => {
    findEventsByOrganizer.mockResolvedValue([]);

    const response = await request(buildApp({ id: "eo-1", role: "ORGANIZER" })).get("/api/eo/events");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  // The API should only look up events belonging to the logged-in organizer.
  it("looks up only the logged-in organizer's events", async () => {
    findEventsByOrganizer.mockResolvedValue([]);

    await request(buildApp({ id: "eo-1", role: "ORGANIZER" })).get("/api/eo/events");

    // Check if the correct organizer ID was passed to the lookup function.
    expect(findEventsByOrganizer).toHaveBeenCalledWith("eo-1");
  });

  // The API should return event details, statuses, and reported photo counts.
  it("returns each event with its status and reported photo count", async () => {
    // Provide sample events as if they came from the database.
    findEventsByOrganizer.mockResolvedValue([
      {
        id: "e1",
        name: "Wedding",
        startsAt: "2026-06-01T10:00:00Z",
        endsAt: "2026-06-01T18:00:00Z",
        venue: "Manila Hotel",
        reportedPhotosCount: 3
      },
      {
        id: "e2",
        name: "Birthday",
        startsAt: "2026-07-01T10:00:00Z",
        endsAt: "2026-07-01T18:00:00Z",
        venue: null,
        reportedPhotosCount: 0
      }
    ]);

    const response = await request(buildApp({ id: "eo-1", role: "ORGANIZER" })).get("/api/eo/events");

    expect(response.status).toBe(200);

    // Check if both events have the correct information and status.
    expect(response.body).toEqual([
      {
        id: "e1",
        name: "Wedding",
        date: "2026-06-01T10:00:00Z",
        venue: "Manila Hotel",
        status: "Live",
        reportedPhotosCount: 3
      },
      {
        id: "e2",
        name: "Birthday",
        date: "2026-07-01T10:00:00Z",
        venue: null,
        status: "Upcoming",
        reportedPhotosCount: 0
      }
    ]);
  });

  // The API should return 500 if the database lookup fails.
  it("returns 500 when the lookup fails", async () => {
    findEventsByOrganizer.mockRejectedValue(new Error("db down"));

    const response = await request(buildApp({ id: "eo-1", role: "ORGANIZER" })).get("/api/eo/events");

    expect(response.status).toBe(500);
  });
});

// Test whether the main app registers the organizer's events endpoint.
describe("createApp", () => {
  it("registers the route when the service is provided", async () => {
    // Create the app with a mock organizer events service.
    const app = createApp(database, undefined, {
      eoEvents: { findEventsByOrganizer: vi.fn().mockResolvedValue([]) }
    });

    const response = await request(app).get("/api/eo/events");

    // A 401 instead of 404 means the route exists but no authenticated user was provided.
    expect(response.status).toBe(401);
  });
});