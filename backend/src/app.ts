import express from "express";

export interface Database {
  query(sql: string): Promise<unknown>;
}

export function createApp(database: Database) {
  const app = express();

  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.get("/health/db", async (_request, response) => {
    await database.query("SELECT 1");
    response.status(200).json({ status: "ok", database: "connected" });
  });

  return app;
}
