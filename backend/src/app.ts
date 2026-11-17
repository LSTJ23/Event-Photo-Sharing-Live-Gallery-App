import express from "express";
import { createCreateEventHandler, type CreateEventDeps } from "./controllers/createEventController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  createEvent?: CreateEventDeps;
}

export function createApp(database: Database, services: AppServices = {}) {
  const app = express();

  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    await database.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  });

  if (services.createEvent) {
    app.post("/api/events", createCreateEventHandler(services.createEvent));
  }

  return app;
}