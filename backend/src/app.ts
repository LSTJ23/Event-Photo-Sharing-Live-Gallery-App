import express from "express";
import { createLoginHandler, type AuthService } from "./authController.js";

export interface Database {
  query(sql: string): Promise<unknown>;
}
  

   export interface AppServices {
     auth?: AuthService;
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

  if (services.auth) {
    app.post("/api/auth/login", createLoginHandler(services.auth));
  }

  return app;
}