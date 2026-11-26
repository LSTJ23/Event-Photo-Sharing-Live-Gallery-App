import { afterEach, describe, expect, it, vi } from "vitest";

const { setSession, getSession } = vi.hoisted(() => ({
  setSession: vi.fn(),
  getSession: vi.fn()
}));
vi.mock("./supabase", () => ({
  getSupabase: () => ({ auth: { setSession, getSession } })
}));

import { AuthRequestError, changePassword, signIn, verifyCode } from "./auth";

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe("authentication client", () => {
  const user = { id: "1", name: "Person", email: "person@example.com", role: "organizer", mustChangePassword: false };
  const session = { accessToken: "access", refreshToken: "refresh" };

  it("stores the returned Supabase session after staff sign-in", async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user, session }) });
    vi.stubGlobal("fetch", fetch);
    setSession.mockResolvedValue({ error: null });
    expect(await signIn(user.email, "password")).toEqual(user);
    expect(setSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" });
    expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
  });

  it("does not save a session when a participant code is rejected", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({ error: "Invalid code" })
    }));
    await expect(verifyCode(user.email, "bad", user.name, "event")).rejects.toBeInstanceOf(AuthRequestError);
    expect(setSession).not.toHaveBeenCalled();
  });

  it("sends the active bearer token when changing a password", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "access" } }, error: null });
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user }) });
    vi.stubGlobal("fetch", fetch);
    await changePassword("new-password");
    expect(fetch).toHaveBeenCalledWith("/api/auth/password", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer access" })
    }));
  });
});
