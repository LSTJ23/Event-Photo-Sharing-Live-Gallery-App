import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  createOrganizerController,
  createPlaceholderOrganizerStore,
  type OrganizerStore
} from "./controllers/createOrganizerController.js";
import { validateOrganizerInput } from "./organizerValidation.js";

// Creates an Express app for testing.
function buildApp(store: OrganizerStore = createPlaceholderOrganizerStore()) {
  const app = express();
  app.use(express.json());
  app.post("/organizers", createOrganizerController(store));
  return app;
}

// Tests organizer input validation.
describe("validateOrganizerInput", () => {
  // Checks if valid input is accepted and extra spaces are removed.
  it("accepts valid input and trims whitespace", () => {
    const result = validateOrganizerInput({ organizerName: "  Acme Events ", personName: " Jane Cruz " });

    expect(result).toEqual({
      valid: true,
      data: { organizerName: "Acme Events", personName: "Jane Cruz" }
    });
  });

  // Checks if an empty organizer name is rejected.
  it("requires the organizer name", () => {
    const result = validateOrganizerInput({ organizerName: "", personName: "Jane" });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.organizerName).toBeDefined();
  });

  // Checks if an empty person name is rejected.
  it("requires the person name", () => {
    const result = validateOrganizerInput({ organizerName: "Acme", personName: "   " });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.personName).toBeDefined();
  });

  // Checks if errors for both fields are returned when no input is provided.
  it("reports both errors when everything is missing", () => {
    const result = validateOrganizerInput(undefined);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(Object.keys(result.errors).sort()).toEqual(["organizerName", "personName"]);
  });

  // Checks if values that are not strings are rejected.
  it("rejects non-string values", () => {
    expect(validateOrganizerInput({ organizerName: 123, personName: ["x"] }).valid).toBe(false);
  });

  // Checks if names longer than 100 characters are rejected.
  it("rejects names longer than 100 characters", () => {
    expect(validateOrganizerInput({ organizerName: "a".repeat(101), personName: "Jane" }).valid).toBe(false);
  });
});

// Tests the POST /organizers endpoint.
describe("POST /organizers", () => {
  // Checks if an organizer is created successfully.
  it("creates an organizer and returns 201", async () => {
    const response = await request(buildApp())
      .post("/organizers")
      .send({ organizerName: "Acme Events", personName: "Jane Cruz" });

    expect(response.status).toBe(201);
    expect(response.body.organizer).toMatchObject({
      organizerName: "Acme Events",
      personName: "Jane Cruz"
    });
    // Checks if the created organizer has an ID.
    expect(response.body.organizer.id).toBeDefined();
  });

  // Checks if invalid input returns 400 with validation messages.
  it("returns 400 with messages when input is invalid", async () => {
    const response = await request(buildApp()).post("/organizers").send({});

    expect(response.status).toBe(400);
    expect(response.body.errors.organizerName).toBeDefined();
    expect(response.body.errors.personName).toBeDefined();
  });

  // Checks if duplicate names are rejected, even when the letter case is different.
  it("returns 409 when the organizer name already exists, ignoring case", async () => {
    const app = buildApp();
    await request(app).post("/organizers").send({ organizerName: "Acme Events", personName: "Jane" });

    const response = await request(app)
      .post("/organizers")
      .send({ organizerName: "ACME events", personName: "John" });

    expect(response.status).toBe(409);
    expect(response.body.errors.organizerName).toMatch(/already exists/i);
  });

  // Checks if the endpoint returns 500 when saving fails.
  it("returns 500 when saving fails", async () => {
    const failingStore: OrganizerStore = { create: () => Promise.reject(new Error("boom")) };

    // Prevents the expected error from appearing in the test output.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore))
      .post("/organizers")
      .send({ organizerName: "Acme Events", personName: "Jane Cruz" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();

    // Restores the original console.error function.
    consoleError.mockRestore();
  });
});