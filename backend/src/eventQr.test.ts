
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { buildShareUrl, generateQrDataUrl } from "./qr.js";
import type { EventQrDeps } from "./controllers/eventQrController.js";

// Creates a fake database with a query function for testing.
// The function returns an empty list of rows by default.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Groups related tests for building and generating QR codes.
describe("buildShareUrl", () => {
  // Checks whether the base URL and event code are joined correctly.
  it("joins the base URL and event code", () => {
    expect(buildShareUrl("https://app.example.com", "ABC123")).toBe(
      "https://app.example.com/event/ABC123"
    );
  });

  // Checks whether extra slashes are removed and spaces in the event code are encoded.
  it("ignores trailing slashes and encodes the code", () => {
    expect(buildShareUrl("https://app.example.com//", "a b")).toBe(
      "https://app.example.com/event/a%20b"
    );
  });
});

// Groups tests for generating QR code images.
describe("generateQrDataUrl", () => {
  // Checks whether the generated QR code is returned as a PNG data URL.
  it("returns a PNG data URL", async () => {
    const result = await generateQrDataUrl("https://app.example.com/event/ABC123");

    // A PNG data URL starts with this specific prefix.
    expect(result.startsWith("data:image/png;base64,")).toBe(true);
  });
});

// Tests the GET endpoint that retrieves an event's QR code.
describe("GET /api/events/:id/qr", () => {
  // Creates fake functions that replace the actual event lookup and QR generation.
  // Their types come from the EventQrDeps interface.
  const findEventCode = vi.fn<EventQrDeps["findEventCode"]>();
  const generateQr = vi.fn<EventQrDeps["generateQr"]>();

  // Creates the Express application with the fake database and QR dependencies.
  const app = createApp(database, {
    eventQr: { findEventCode, generateQr, shareBaseUrl: "https://app.example.com" }
  });

  // Runs before each test to reset the fake functions.
  // This prevents results from one test from affecting another.
  beforeEach(() => {
    findEventCode.mockReset();
    generateQr.mockReset();
  });

  // Checks whether the endpoint returns the correct share URL and QR image.
  it("returns the share URL and QR image", async () => {
    // Makes the fake event lookup return an event code.
    findEventCode.mockResolvedValue("ABC123");

    // Makes the fake QR generator return a sample PNG data URL.
    generateQr.mockResolvedValue("data:image/png;base64,AAA");

    // Sends a GET request to the QR code endpoint using Supertest.
    const response = await request(app).get("/api/events/event-1/qr");

    // Checks whether the request was successful.
    expect(response.status).toBe(200);

    // Checks whether the QR generator received the correct event share URL.
    expect(generateQr).toHaveBeenCalledWith("https://app.example.com/event/ABC123");

    // Checks whether the response contains the correct event ID, share URL, and QR image.
    expect(response.body).toEqual({
      eventId: "event-1",
      shareUrl: "https://app.example.com/event/ABC123",
      qrCode: "data:image/png;base64,AAA"
    });
  });

  // Checks whether the endpoint returns 404 when the requested event cannot be found.
  it("returns 404 when the event doesn't exist", async () => {
    // Makes the fake event lookup return null, meaning no event was found.
    findEventCode.mockResolvedValue(null);

    // Sends a GET request using an event ID that does not exist.
    const response = await request(app).get("/api/events/missing/qr");

    // Checks whether the endpoint correctly returns HTTP 404 (Not Found).
    expect(response.status).toBe(404);

    // Checks that QR generation was skipped because the event was not found.
    expect(generateQr).not.toHaveBeenCalled();
  });

  // Checks whether the endpoint handles database lookup errors.
  it("returns 500 when the lookup fails", async () => {
    // Makes the fake event lookup throw an error to simulate a database failure.
    findEventCode.mockRejectedValue(new Error("db down"));

    // Sends a GET request to the QR code endpoint.
    const response = await request(app).get("/api/events/event-1/qr");

    // Checks whether the endpoint correctly returns HTTP 500 (Internal Server Error).
    expect(response.status).toBe(500);
  });
});
