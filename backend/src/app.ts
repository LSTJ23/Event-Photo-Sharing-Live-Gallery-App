import express from "express";
import { createEventQrHandler, type EventQrDeps } from "./controllers/eventQrController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  eventQr?: EventQrDeps;
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

  if (services.eventQr) {
    app.get("/api/events/:id/qr", createEventQrHandler(services.eventQr));
  }

  return app;
}