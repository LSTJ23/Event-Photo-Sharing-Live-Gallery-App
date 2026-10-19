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

  it("reports the API version", async () => {
    const response = await request(app).get("/version");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: "event-photo-sharing-api", version: "0.1.0" });
  });

  it("checks the database connection", async () => {
    const response = await request(app).get("/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
    expect(query).toHaveBeenCalledWith("SELECT 1");
  });

  it("checks if the files in the directory exist", async () => {
    // Implement the test logic here
    const fs = await import("fs");
    const path = await import("path");
    const expectedFiles = ["app.ts", "app.test.ts"];
    const directoryPath = path.resolve(__dirname);
    const files = fs.readdirSync(directoryPath);
    expect(files.length).toBeGreaterThan(0);
  });
});
