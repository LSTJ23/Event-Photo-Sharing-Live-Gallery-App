import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { checkSupabaseDatabase, createSupabaseAdminClient } from "./supabase.js";

describe("createSupabaseAdminClient", () => {
  it("explains which settings are missing", () => {
    expect(() => createSupabaseAdminClient({})).toThrow(/SUPABASE_URL or SUPABASE_SECRET_KEY/);
  });

  it("creates a client when both settings are present", () => {
    const client = createSupabaseAdminClient({
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEY: "sb_secret_test"
    });

    expect(client.storage).toBeDefined();
  });

  it("checks the events table through the Supabase Data API", async () => {
    let requestUrl = "";
    let requestMethod = "";
    const client = createClient("https://example.supabase.co", "sb_secret_test", {
      global: {
        fetch: async (input, init) => {
          requestUrl = String(input);
          requestMethod = init?.method ?? "GET";
          return new Response(null, { status: 200 });
        }
      }
    });

    await expect(checkSupabaseDatabase(client)).resolves.toBeUndefined();
    expect(requestMethod).toBe("HEAD");
    expect(requestUrl).toContain("/rest/v1/events?");
    expect(requestUrl).toContain("select=id");
  });

  it("surfaces Supabase database errors", async () => {
    const client = createClient("https://example.supabase.co", "sb_secret_test", {
      global: {
        fetch: async () => new Response(JSON.stringify({ message: "permission denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" }
        })
      }
    });

    await expect(checkSupabaseDatabase(client)).rejects.toThrow("permission denied");
  });
});
