import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { isUploadAllowed, isValidCapacity } from "./capacity.js";
import type { CapacityDeps } from "./controllers/capacityController.js";

// Create a fake database for testing.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Test if the capacity validation function accepts valid values.
describe("isValidCapacity", () => {
  // Positive whole numbers should be accepted.
  it.each([1, 50, 1000])("accepts %s", (value) => {
    expect(isValidCapacity(value)).toBe(true);
  });

  // Zero, negative numbers, decimals, and non-number values should be rejected.
  it.each([0, -1, 2.5, "10", null, undefined, NaN, Infinity, true, {}])("rejects %s", (value) => {
    expect(isValidCapacity(value)).toBe(false);
  });
});

// Test if uploads are allowed based on the event's capacity.
describe("isUploadAllowed", () => {
  // Uploads should be allowed when there is still available space.
  it("allows uploads below capacity", () => {
    expect(isUploadAllowed(9, 10)).toBe(true);
  });

  // Uploads should be blocked when the event is full or over capacity.
  it("blocks uploads at or over capacity", () => {
    expect(isUploadAllowed(10, 10)).toBe(false);
    expect(isUploadAllowed(12, 10)).toBe(false);
  });
});

// Test the API endpoint for updating an event's capacity.
describe("PATCH /api/events/:id/capacity", () => {
  // Create a mock function to simulate updating the event's capacity.
  const updateCapacity = vi.fn<CapacityDeps["updateCapacity"]>();

  // Create the app using the fake database and mock function.
  const app = createApp(database, undefined, { capacity: { updateCapacity } });

  // Reset the mock before each test.
  beforeEach(() => {
    updateCapacity.mockReset();
  });

  // Invalid capacity values should return a 400 Bad Request response.
  it.each([0, -5, 2.5, "10", null])("returns 400 for maxCapacity %s", async (maxCapacity) => {
    const response = await request(app).patch("/api/events/event-1/capacity").send({ maxCapacity });

    expect(response.status).toBe(400);

    // Make sure the update function was not called.
    expect(updateCapacity).not.toHaveBeenCalled();
  });

  // The API should reject requests without a maxCapacity value.
  it("returns 400 when maxCapacity is missing", async () => {
    const response = await request(app).patch("/api/events/event-1/capacity").send({});

    expect(response.status).toBe(400);
  });

  // The API should reject requests without a body.
  it("returns 400 when no body is sent", async () => {
    const response = await request(app).patch("/api/events/event-1/capacity");

    expect(response.status).toBe(400);
  });

  // The API should return 404 if the requested event does not exist.
  it("returns 404 when the event doesn't exist", async () => {
    updateCapacity.mockResolvedValue(null);

    const response = await request(app).patch("/api/events/missing/capacity").send({ maxCapacity: 10 });

    expect(response.status).toBe(404);
  });

  // The API should return the updated capacity and usage when successful.
  it("returns usage and keeps uploads open below capacity", async () => {
    updateCapacity.mockResolvedValue({ currentCount: 3, maxCapacity: 10 });

    const response = await request(app).patch("/api/events/event-1/capacity").send({ maxCapacity: 10 });

    expect(response.status).toBe(200);

    // Check if the update function received the correct event ID and capacity.
    expect(updateCapacity).toHaveBeenCalledWith("event-1", 10);

    // Check if the response contains the correct event information.
    expect(response.body).toEqual({
      eventId: "event-1",
      currentCount: 3,
      maxCapacity: 10,
      usage: "3/10",
      uploadsOpen: true
    });
  });

  // Uploads should close when the event reaches its maximum capacity.
  it("closes uploads when the event is full", async () => {
    updateCapacity.mockResolvedValue({ currentCount: 10, maxCapacity: 10 });

    const response = await request(app).patch("/api/events/event-1/capacity").send({ maxCapacity: 10 });

    expect(response.body.uploadsOpen).toBe(false);
  });

  // Uploads should reopen when the maximum capacity is increased.
  it("re-opens uploads when capacity is raised", async () => {
    updateCapacity.mockResolvedValue({ currentCount: 10, maxCapacity: 20 });

    const response = await request(app).patch("/api/events/event-1/capacity").send({ maxCapacity: 20 });

    expect(response.body.uploadsOpen).toBe(true);
  });

  // The API should return a 500 Internal Server Error if saving fails.
  it("returns 500 when saving fails", async () => {
    updateCapacity.mockRejectedValue(new Error("db down"));

    const response = await request(app).patch("/api/events/event-1/capacity").send({ maxCapacity: 10 });

    expect(response.status).toBe(500);
  });
});