import express from "express";
import { getEventBySlug } from "./controllers/eventController";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export function createApp(database: Database) {
  const app = express();

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    try {
      await database.query("SELECT 1");
      response.status(200).json({ status: "ok", database: "connected" });
    } catch {
      response.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  // Route for User Story #1 (QR validation)
  app.get("/api/events/slug/:qrSlug", getEventBySlug);

  return app;
}