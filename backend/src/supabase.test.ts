import { describe, expect, it } from "vitest";
import { createSupabaseAdminClient } from "./supabase.js";

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
});
