import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("API configuration", () => {
  it("uses mock data when a backend URL is configured with mock mode enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { getEvent } = await import("./api");

    expect(await getEvent("dlsu-cso-event")).toMatchObject({ id: "dlsu-cso-event" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the configured backend when mock mode is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "event-1" })
    });
    vi.stubGlobal("fetch", fetch);
    const { getEvent } = await import("./api");

    expect(await getEvent("event-1")).toEqual({ id: "event-1" });
    expect(fetch).toHaveBeenCalledWith("https://api.example.com/events/event-1", undefined);
  });

  it("uses mock data when no backend URL is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { getEvent } = await import("./api");

    expect(await getEvent("dlsu-cso-event")).toMatchObject({ id: "dlsu-cso-event" });
    expect(fetch).not.toHaveBeenCalled();
  });
});
