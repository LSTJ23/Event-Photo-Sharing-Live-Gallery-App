import express from "express";
import { createEventSlugHandler, type EventSlugDeps } from "./controllers/eventSlugController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  eventSlug?: EventSlugDeps;
}

export function createApp(database: Database, services: AppServices = {}) {
  const app = express();

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    await database.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  });

  if (services.eventSlug) {
    app.get("/api/events/slug/:qrSlug", createEventSlugHandler(services.eventSlug));
  }

  return app;
}