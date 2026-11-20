import express from "express";
import {
  getOrganizerController,
  listOrganizersController,
  updateOrganizerController
} from "./controllers/manageOrganizersController.js";
import {
  createPlaceholderManagedOrganizerStore,
  type ManagedOrganizerStore
} from "./managedOrganizerStore.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export function createApp(
  database: Database,
  organizerStore: ManagedOrganizerStore = createPlaceholderManagedOrganizerStore()
) {
  const app = express();

  // Lets Express read JSON request bodies into request.body.
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    await database.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  });

  // TODO: put the admin auth middleware in front of the organizer routes.
  app.get("/organizers", listOrganizersController(organizerStore));
  app.get("/organizers/:id", getOrganizerController(organizerStore));
  app.patch("/organizers/:id", updateOrganizerController(organizerStore));

  return app;
}