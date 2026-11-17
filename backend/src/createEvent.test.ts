import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { createCreateEventHandler, type CreateEventDeps } from "./controllers/createEventController.js";
import { generateEventCode } from "./eventCode.js";
import { validateNewEvent } from "./eventValidation.js";

// Fixed date used by the tests.
const TODAY = "2026-06-01";

// Mock database query.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Sample valid event data used in the tests.
const validBody = {
  name: "Wedding",
  date: "2026-07-15",
  venue: "Manila Hotel",
  organizerId: "eo-1",
  maxCapacity: 3
};

describe("validateNewEvent", () => {
  // Checks if a complete event passes validation.
  it("accepts a complete event", () => {
    expect(validateNewEvent(validBody, TODAY)).toEqual({ ok: true, value: validBody });
  });

  // Checks if venue and capacity can be left empty.
  it("treats venue and capacity as optional", () => {
    const result = validateNewEvent({ name: "Party", date: TODAY, organizerId: "eo-1" }, TODAY);

    expect(result).toEqual({
      ok: true,
      value: { name: "Party", date: TODAY, venue: null, organizerId: "eo-1", maxCapacity: null }
    });
  });

  // Checks if extra spaces are removed from the event name.
  it("trims the name", () => {
    const result = validateNewEvent({ ...validBody, name: "  Wedding  " }, TODAY);

    expect(result.ok && result.value.name).toBe("Wedding");
  });

  // Checks if an empty name is rejected.
  it("requires a name", () => {
    const result = validateNewEvent({ ...validBody, name: "   " }, TODAY);

    expect(result).toEqual({ ok: false, fields: { name: "Name is required." } });
  });

  // Checks if an empty date is rejected.
  it("requires a date", () => {
    const result = validateNewEvent({ ...validBody, date: "" }, TODAY);

    expect(result).toEqual({ ok: false, fields: { date: "Date is required." } });
  });

  // Checks if an organizer must be assigned.
  it("requires an assigned organizer", () => {
    const result = validateNewEvent({ ...validBody, organizerId: undefined }, TODAY);

    expect(result).toEqual({ ok: false, fields: { organizerId: "Assigned organizer is required." } });
  });

  // Checks if all missing required fields are reported together.
  it("reports every missing required field at once", () => {
    const result = validateNewEvent({}, TODAY);

    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.fields).sort()).toEqual(["date", "name", "organizerId"]);
  });

  // Checks if validation handles an undefined request body.
  it("handles a missing body", () => {
    expect(validateNewEvent(undefined, TODAY).ok).toBe(false);
  });

  // Checks if incorrectly formatted or impossible dates are rejected.
  it.each(["abc", "06/01/2026", "2026-13-01", "2026-02-30", "2026-6-1"])("rejects invalid date %s", (date) => {
    const result = validateNewEvent({ ...validBody, date }, TODAY);

    expect(!result.ok && result.fields.date).toBe("Date is invalid. Use YYYY-MM-DD.");
  });

  // Checks if dates before today are rejected.
  it("rejects a past date", () => {
    const result = validateNewEvent({ ...validBody, date: "2026-05-31" }, TODAY);

    expect(!result.ok && result.fields.date).toBe("Date cannot be in the past.");
  });

  // Checks if today's date is allowed.
  it("allows today", () => {
    expect(validateNewEvent({ ...validBody, date: TODAY }, TODAY).ok).toBe(true);
  });

  // Checks if zero, negative, decimal, and non-number capacities are rejected.
  it.each([0, -15, "a", 2.5, "3"])("rejects capacity %s", (maxCapacity) => {
    const result = validateNewEvent({ ...validBody, maxCapacity }, TODAY);

    expect(!result.ok && result.fields.maxCapacity).toBe("Capacity must be a positive whole number.");
  });
});

describe("generateEventCode", () => {
  // Checks if generating multiple codes produces different values.
  it("gives a different code each time", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateEventCode()));

    expect(codes.size).toBe(50);
  });
});

describe("POST /api/events", () => {
  // Mock functions for checking organizers and saving events.
  const organizerExists = vi.fn<CreateEventDeps["organizerExists"]>();
  const createEvent = vi.fn<CreateEventDeps["createEvent"]>();

  // Provides fixed values so the tests produce predictable results.
  const deps: CreateEventDeps = {
    organizerExists,
    createEvent,
    generateEventCode: () => "CODE1234",
    today: () => TODAY
  };

  // Creates a test app with a simulated logged-in user.
  function buildApp(user?: { id: string; role: string }) {
    const app = express();
    app.use(express.json());

    // Simulates the authentication middleware.
    app.use((_request, response, next) => {
      if (user) response.locals.user = user;
      next();
    });

    app.post("/api/events", createCreateEventHandler(deps));
    return app;
  }

  // Sample admin account used for authorized requests.
  const admin = { id: "admin-1", role: "ADMIN" };

  // Resets mock functions before every test.
  beforeEach(() => {
    organizerExists.mockReset().mockResolvedValue(true);
    createEvent.mockReset().mockResolvedValue({ id: "event-1" });
  });

  // Checks if requests without a logged-in user are rejected.
  it("returns 401 when nobody is logged in", async () => {
    const response = await request(buildApp()).post("/api/events").send(validBody);

    expect(response.status).toBe(401);
    expect(createEvent).not.toHaveBeenCalled();
  });

  // Checks if non-admin users are prevented from creating events.
  it("returns 403 for an organizer", async () => {
    const response = await request(buildApp({ id: "eo-1", role: "ORGANIZER" })).post("/api/events").send(validBody);

    expect(response.status).toBe(403);
    expect(createEvent).not.toHaveBeenCalled();
  });

  // Checks if invalid event details return errors without saving anything.
  it("returns 400 with a message per field and saves nothing", async () => {
    const response = await request(buildApp(admin)).post("/api/events").send({});

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.fields).sort()).toEqual(["date", "name", "organizerId"]);
    expect(createEvent).not.toHaveBeenCalled();
  });

  // Checks if an event cannot be assigned to a nonexistent organizer.
  it("returns 400 when the organizer doesn't exist", async () => {
    organizerExists.mockResolvedValue(false);

    const response = await request(buildApp(admin)).post("/api/events").send(validBody);

    expect(response.status).toBe(400);
    expect(response.body.fields.organizerId).toBe("Assigned organizer not found.");
    expect(createEvent).not.toHaveBeenCalled();
  });

  // Checks if a valid event is saved and its details are returned.
  it("creates the event and returns its id and link code", async () => {
    const response = await request(buildApp(admin)).post("/api/events").send(validBody);

    expect(response.status).toBe(201);
    expect(createEvent).toHaveBeenCalledWith({ ...validBody, eventCode: "CODE1234" });
    expect(response.body).toEqual({ id: "event-1", ...validBody, eventCode: "CODE1234" });
  });

  // Checks if a database error returns a server error response.
  it("returns 500 when saving fails", async () => {
    createEvent.mockRejectedValue(new Error("db down"));

    const response = await request(buildApp(admin)).post("/api/events").send(validBody);

    expect(response.status).toBe(500);
  });
});

describe("createApp", () => {
  // Checks if the event route is registered when its service is provided.
  it("registers the route when the service is provided", async () => {
    const app = createApp(database, {
      createEvent: { organizerExists: vi.fn(), createEvent: vi.fn() }
    });

    const response = await request(app).post("/api/events").send({});

    // A 401 means the route exists, while a 404 would mean it was not registered.
    expect(response.status).toBe(401);
  });
});