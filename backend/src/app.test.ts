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

  it("reports a working Supabase database connection", async () => {
    const checkSupabase = vi.fn().mockResolvedValue(undefined);
    const response = await request(createApp({ query }, checkSupabase)).get("/health/supabase");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
    expect(checkSupabase).toHaveBeenCalledOnce();
  });

  it("reports a Supabase connection failure without exposing the error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const checkSupabase = vi.fn().mockRejectedValue(new Error("connection details"));
      const response = await request(createApp({ query }, checkSupabase)).get("/health/supabase");

      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: "error", database: "unavailable" });
      expect(log).toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
