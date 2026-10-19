import { Pool } from "pg";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

if (process.env.CI && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in CI to run the PostgreSQL integration test.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

describe.skipIf(!process.env.DATABASE_URL)("PostgreSQL integration", () => {
  it("serves a healthy database connection", async () => {
    const response = await request(createApp(pool)).get("/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });
});
