import express from "express";
import { createEoEventsHandler, type EoEventsDeps } from "./controllers/eoEventsController.js";
import { checkSupabaseDatabase } from "./supabase.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  eoEvents?: EoEventsDeps;
}

export function createApp(
  database: Database,
  checkSupabase: () => Promise<void> = checkSupabaseDatabase,
  services: AppServices = {}
) {
  const app = express();

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    await database.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  });

  app.get("/health/supabase", async (_request, response) => {
    try {
      await checkSupabase();
      response.status(200).json({ status: "ok", database: "connected" });
    } catch (error) {
      console.error("Supabase database health check failed:", error);
      response.status(503).json({ status: "error", database: "unavailable" });
    }
  });

  if (services.eoEvents) {
    app.get("/api/eo/events", createEoEventsHandler(services.eoEvents));
  }

  return app;
}