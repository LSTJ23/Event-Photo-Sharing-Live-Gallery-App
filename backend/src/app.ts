import express from "express";
import { createCapacityHandler, type CapacityDeps } from "./controllers/capacityController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export interface AppServices {
  capacity?: CapacityDeps;
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

  if (services.capacity) {
    app.patch("/api/events/:id/capacity", createCapacityHandler(services.capacity));
  }

  return app;
}