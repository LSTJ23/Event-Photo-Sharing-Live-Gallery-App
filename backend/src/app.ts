import express from "express";
import { createAuthHandlers, type AuthService } from "./controllers/authController.js";
import { createEventHandlers } from "./controllers/eventController.js";
import { checkSupabaseDatabase } from "./supabase.js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  auth?: AuthService;
  supabase?: SupabaseClient;
}

export function createApp(
  database: Database,
  checkSupabase: () => Promise<void> = checkSupabaseDatabase,
  services: AppServices = {}
) {
  const app = express();

  app.use(express.json());

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

  if (services.auth) {
    const auth = createAuthHandlers(services.auth);
    app.post("/api/auth/join", auth.joinEvent);
    app.post("/api/auth/login", auth.login);
    app.get("/api/auth/me", auth.me);
    app.post("/api/auth/password", auth.changePassword);
    app.get("/api/auth/events/:eventId", auth.event);
  }

  if (services.supabase && services.auth) {
    const events = createEventHandlers(services.supabase, services.auth);
    app.post("/api/admin/events", events.createEvent);
    app.get("/api/admin/events", events.listEvents);
    app.get("/api/admin/organizers", events.organizers);
  }

  return app;
}