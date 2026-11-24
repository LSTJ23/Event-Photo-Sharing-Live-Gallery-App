import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import {
  getOrganizerController,
  listOrganizersController,
  updateOrganizerController
} from "./controllers/manageOrganizersController.js";
import { createPlaceholderManagedOrganizerStore, type ManagedOrganizerStore } from "./managedOrganizerStore.js";

// Builds a small app with only the organizer manage routes and the given store.
// It does not use createApp, so these tests do not depend on how createApp is wired.
function buildApp(store: ManagedOrganizerStore) {
  const app = express();
  app.use(express.json());
  app.get("/organizers", listOrganizersController(store));
  app.get("/organizers/:id", getOrganizerController(store));
  app.patch("/organizers/:id", updateOrganizerController(store));
  return app;
}

// Makes every store method fail, to test the 500 responses.
function failingStore(): ManagedOrganizerStore {
  // Simulates a failed database operation.
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
    // Adds organizers in reverse alphabetical order.
    await store.create({ organizerName: "Zeta Events", personName: "Jane Cruz" });
    await store.create({ organizerName: "Acme Events", personName: "Jane Cruz" });

    const response = await request(buildApp(store)).get("/organizers");

    expect(response.status).toBe(200);
    // Confirms that the returned names are sorted alphabetically.
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
    // Prevents the expected error from appearing in the test output.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await request(buildApp(failingStore())).get("/organizers");

    expect(response.status).toBe(500);
    // Restores the original console.error function.
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

    // Sends updated names, including extra spaces to test input trimming.
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