import type { Request, Response } from "express";
import { validateOrganizerInput } from "../organizerValidation.js";
import { DuplicateOrganizerError, type OrganizerStore } from "../organizerStore.js";

// Handles GET /organizers?search=...
// An empty list means no organizer matches, so the frontend can show its empty message.
export function listOrganizersController(store: OrganizerStore) {
  return async function listOrganizers(request: Request, response: Response) {
    // Gets the search text from the URL query.
    const search = typeof request.query.search === "string" ? request.query.search : undefined;

    try {
      // Gets the organizers that match the search text.
      const organizers = await store.list(search);
      response.status(200).json({ organizers });
    } catch (error) {
      // Logs the error and sends a server error response.
      console.error("Failed to list organizers:", error);
      response.status(500).json({ error: "Could not load the organizers. Please try again." });
    }import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { createPlaceholderManagedOrganizerStore, type ManagedOrganizerStore } from "./managedOrganizerStore.js";

// Creates the real app with a placeholder database and the given organizer store.
function buildApp(store: ManagedOrganizerStore) {
  return createApp({ query: async () => ({}) }, store);
}

// Makes every store method fail, to test the 500 responses.
function failingStore(): ManagedOrganizerStore {
  const fail = () => Promise.reject(new Error("boom"));
  return { create: fail, list: fail, getById: fail, update: fail };
}

// Tests the GET /organizers endpoint.
describe("GET /organizers", () => {
  // Checks if an empty list is returned when there are no organizers.
  it("returns an empty list when no organizers exist", async () => {
    const response = await request(buildApp(createPlaceholderManagedOrganizerStore())).get("/organizers");

    expect(response.status).toBe(200);
    expect(response.body.organizers).toEqual([]);
  });

  // Checks if all organizers are returned in alphabetical order.
  it("lists every organizer sorted by name", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    await store.create({ organizerName: "Zeta Events", personName: "Jane Cruz" });
    await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(buildApp(store)).get("/organizers");

    expect(response.status).toBe(200);
    expect(response.body.organizers.map((o: { organizerName: string }) => o.organizerName)).toEqual([
      "Acme Events",
      "Zeta Events"
    ]);
  });

  // Checks if searching works regardless of uppercase or lowercase letters.
  it("filters by name, ignoring case", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });
    await store.create({ organizerName: "Zeta Productions", personName: "Jane Cruz" });

    const response = await request(buildApp(store)).get("/organizers").query({ search: "ACME" });

    expect(response.body.organizers).toHaveLength(1);
    expect(response.body.organizers[0].organizerName).toBe("Acme Events");
  });

  // Checks if an empty list is returned when no organizer matches the search.
  it("returns an empty list when nothing matches the search", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(buildApp(store)).get("/organizers").query({ search: "nothing" });

    expect(response.status).toBe(200);
    expect(response.body.organizers).toEqual([]);
  });

  // Checks if the endpoint returns 500 when the store fails.
  it("returns 500 when the store fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore())).get("/organizers");

    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});

// Tests the GET /organizers/:id endpoint.
describe("GET /organizers/:id", () => {
  // Checks if the correct organizer is returned using its ID.
  it("returns the organizer", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    const created = await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(buildApp(store)).get(`/organizers/${created.id}`);

    expect(response.status).toBe(200);
    expect(response.body.organizer).toMatchObject({ organizerName: "Acme Events", personName: "Jane Cruz" });
  });

  // Checks if 404 is returned when the organizer ID does not exist.
  it("returns 404 for an unknown id", async () => {
    const response = await request(buildApp(createPlaceholderManagedOrganizerStore())).get("/organizers/does-not-exist");

    expect(response.status).toBe(404);
  });

  // Checks if the endpoint returns 500 when the store fails.
  it("returns 500 when the store fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore())).get("/organizers/abc");

    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});

// Tests the PATCH /organizers/:id endpoint.
describe("PATCH /organizers/:id", () => {
  // Checks if the organizer's information is updated successfully.
  it("updates the names and the list shows the new values", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    const app = buildApp(store);
    const created = await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(app)
      .patch(`/organizers/${created.id}`)
      .send({ organizerName: "  Acme Productions ", personName: "John Reyes" });

    expect(response.status).toBe(200);
    expect(response.body.organizer).toMatchObject({
      id: created.id,
      organizerName: "Acme Productions",
      personName: "John Reyes"
    });

    // Checks if the updated information also appears in the organizer list.
    const list = await request(app).get("/organizers");
    expect(list.body.organizers).toHaveLength(1);
    expect(list.body.organizers[0].organizerName).toBe("Acme Productions");
  });

  // Checks if an organizer can keep its current name while changing the person's name.
  it("allows saving under the organizer's own name (only the person changes)", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    const created = await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(buildApp(store))
      .patch(`/organizers/${created.id}`)
      .send({ organizerName: "ACME EVENTS", personName: "John Reyes" });

    expect(response.status).toBe(200);
    expect(response.body.organizer.personName).toBe("John Reyes");
  });

  // Checks if invalid input is rejected and the existing information stays unchanged.
  it("returns 400 and saves nothing when input is invalid", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    const app = buildApp(store);
    const created = await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(app).patch(`/organizers/${created.id}`).send({ organizerName: "", personName: " " });

    expect(response.status).toBe(400);
    expect(response.body.errors.organizerName).toBeDefined();
    expect(response.body.errors.personName).toBeDefined();

    // Confirms that the original organizer information was not changed.
    const unchanged = await request(app).get(`/organizers/${created.id}`);
    expect(unchanged.body.organizer).toMatchObject({ organizerName: "Acme Events", personName: "Jane Cruz" });
  });

  // Checks if 404 is returned when the organizer ID does not exist.
  it("returns 404 for an unknown id", async () => {
    const response = await request(buildApp(createPlaceholderManagedOrganizerStore()))
      .patch("/organizers/does-not-exist")
      .send({ organizerName: "Acme", personName: "Jane" });

    expect(response.status).toBe(404);
  });

  // Checks if an organizer cannot use a name that belongs to another organizer.
  it("returns 409 when the name belongs to another organizer, and saves nothing", async () => {
    const store = createPlaceholderManagedOrganizerStore();
    const app = buildApp(store);
    await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });
    const other = await store.create({ organizerName: "Zeta Events", personName: "Jane Cruz" });

    const response = await request(app)
      .patch(`/organizers/${other.id}`)
      .send({ organizerName: "acme events", personName: "Jane" });

    expect(response.status).toBe(409);
    expect(response.body.errors.organizerName).toMatch(/already exists/i);

    // Confirms that the original organizer information was not changed.
    const unchanged = await request(app).get(`/organizers/${other.id}`);
    expect(unchanged.body.organizer.organizerName).toBe("Zeta Events");
  });

  // Checks if the endpoint returns 500 when the store fails.
  it("returns 500 when the store fails", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore()))
      .patch("/organizers/abc")
      .send({ organizerName: "Acme", personName: "Jane" });

    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});
  };
}

// Handles GET /organizers/:id. Used to pre-fill the Edit User page.
export function getOrganizerController(store: OrganizerStore) {
  return async function getOrganizer(request: Request, response: Response) {
    try {
      // Finds the organizer using the ID from the URL.
      const organizer = await store.getById(String(request.params.id));

      // Checks if the organizer exists.
      if (!organizer) {
        response.status(404).json({ error: "Organizer not found." });
        return;
      }

      // Sends the organizer's information.
      response.status(200).json({ organizer });
    } catch (error) {
      // Logs the error and sends a server error response.
      console.error("Failed to get organizer:", error);
      response.status(500).json({ error: "Could not load the organizer. Please try again." });
    }
  };
}

// Handles PATCH /organizers/:id.
// Same required fields and rules as create, so both names must be sent.
export function updateOrganizerController(store: OrganizerStore) {
  return async function updateOrganizer(request: Request, response: Response) {
    // Checks if the submitted information is valid.
    const result = validateOrganizerInput(request.body);

    // Sends validation errors if the input is invalid.
    if (!result.valid) {
      response.status(400).json({ errors: result.errors });
      return;
    }

    try {
      // Updates the organizer using its ID and the new information.
      const organizer = await store.update(String(request.params.id), result.data);

      // Checks if the organizer exists.
      if (!organizer) {
        response.status(404).json({ error: "Organizer not found." });
        return;
      }

      // Sends the updated organizer.
      response.status(200).json({ organizer });
    } catch (error) {
      // Checks if the organizer name is already being used.
      if (error instanceof DuplicateOrganizerError) {
        response.status(409).json({ errors: { organizerName: error.message } });
        return;
      }

      // Logs unexpected errors and sends a server error response.
      console.error("Failed to update organizer:", error);
      response.status(500).json({ error: "Could not update the organizer. Please try again." });
    }
  };
}