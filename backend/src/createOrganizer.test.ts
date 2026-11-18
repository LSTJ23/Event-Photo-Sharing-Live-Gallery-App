
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
  it("accepts valid input and trims whitespace", () => {
    const result = validateOrganizerInput({ organizerName: "  Acme Events ", personName: " Jane Cruz " });

    expect(result).toEqual({
      valid: true,
      data: { organizerName: "Acme Events", personName: "Jane Cruz" }
    });
  });

  it("requires the organizer name", () => {
    const result = validateOrganizerInput({ organizerName: "", personName: "Jane" });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.organizerName).toBeDefined();
  });

  it("requires the person name", () => {
    const result = validateOrganizerInput({ organizerName: "Acme", personName: "   " });

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.errors.personName).toBeDefined();
  });

  it("reports both errors when everything is missing", () => {
    const result = validateOrganizerInput(undefined);

    expect(result.valid).toBe(false);
    if (!result.valid) expect(Object.keys(result.errors).sort()).toEqual(["organizerName", "personName"]);
  });

  it("rejects non-string values", () => {
    expect(validateOrganizerInput({ organizerName: 123, personName: ["x"] }).valid).toBe(false);
  });

  it("rejects names longer than 100 characters", () => {
    expect(validateOrganizerInput({ organizerName: "a".repeat(101), personName: "Jane" }).valid).toBe(false);
  });
});

// Tests the POST /organizers endpoint.
describe("POST /organizers", () => {
  it("creates an organizer and returns 201", async () => {
    const response = await request(buildApp())
      .post("/organizers")
      .send({ organizerName: "Acme Events", personName: "Jane Cruz" });

    expect(response.status).toBe(201);
    expect(response.body.organizer).toMatchObject({
      organizerName: "Acme Events",
      personName: "Jane Cruz"
    });
    expect(response.body.organizer.id).toBeDefined();
  });

  it("returns 400 with messages when input is invalid", async () => {
    const response = await request(buildApp()).post("/organizers").send({});

    expect(response.status).toBe(400);
    expect(response.body.errors.organizerName).toBeDefined();
    expect(response.body.errors.personName).toBeDefined();
  });

  it("returns 409 when the organizer name already exists, ignoring case", async () => {
    const app = buildApp();
    await request(app).post("/organizers").send({ organizerName: "Acme Events", personName: "Jane" });

    const response = await request(app)
      .post("/organizers")
      .send({ organizerName: "ACME events", personName: "John" });

    expect(response.status).toBe(409);
    expect(response.body.errors.organizerName).toMatch(/already exists/i);
  });

  it("returns 500 when saving fails", async () => {
    const failingStore: OrganizerStore = { create: () => Promise.reject(new Error("boom")) };
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore))
      .post("/organizers")
      .send({ organizerName: "Acme Events", personName: "Jane Cruz" });

    expect(response.status).toBe(500);
    expect(response.body.error).toBeDefined();
    consoleError.mockRestore();
  });
});