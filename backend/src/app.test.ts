import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp, type Database } from "./app.js";

describe("health endpoints", () => {
  const query = vi.fn<Database["query"]>().mockResolvedValue({ rows: [{ "?column?": 1 }] });
  const app = createApp({ query });

  it("reports that the API is healthy", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("checks the database connection", async () => {
    const response = await request(app).get("/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });
});
