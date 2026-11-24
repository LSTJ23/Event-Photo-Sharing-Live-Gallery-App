import express from "express";
import {
  createOrganizerController,
  createPlaceholderOrganizerStore,
  type OrganizerStore
} from "./controllers/createOrganizerController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export function createApp(
  database: Database,
  organizerStore: OrganizerStore = createPlaceholderOrganizerStore()
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

  // TODO: put the admin auth middleware in front of this route.
  app.post("/organizers", createOrganizerController(organizerStore));

  return app;
}