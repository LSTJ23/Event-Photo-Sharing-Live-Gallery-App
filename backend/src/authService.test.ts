import { createClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAuthService } from "./authService.js";

const user = {
  id: "user-1", email: "person@example.com", email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-01-01T00:00:00Z"
};
const session = {
  access_token: "access", refresh_token: "refresh", token_type: "bearer",
  expires_in: 3600, user
};
const event = {
  id: "event-uuid", share_slug: "event-link", name: "Event",
  start_at: "2026-11-26T00:00:00Z", location: "Manila", share_link_active: true
};
const staff = {
  id: user.id, email: user.email, full_name: "Staff", role: "organizer",
  is_active: true, must_change_password: true
};

describe("Supabase authentication service", () => {
  let eventRow: typeof event | null;
  let staffRow: typeof staff | null;
  let membership: unknown;
  let participantRow: { name: string } | null;
  let passwordUpdated: boolean;

  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname.endsWith("/events")) return Response.json(eventRow);
    if (url.pathname.endsWith("/staff_users")) {
      if (init?.method === "PATCH") return Response.json({ ...staffRow, must_change_password: false });
      return Response.json(staffRow);
    }
    if (url.pathname.endsWith("/participants")) {
      if (init?.method === "POST") membership = JSON.parse(String(init.body));
      return Response.json(init?.method === "POST" ? null : participantRow);
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });
  const admin = createClient("https://example.supabase.co", "service-key", { global: { fetch: fetcher } });
  const publicClient = createClient("https://example.supabase.co", "public-key", { global: { fetch: fetcher } });
  const service = createSupabaseAuthService(
    admin, { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public-key" }, () => publicClient
  );

  beforeEach(() => {
    vi.restoreAllMocks();
    eventRow = event;
    staffRow = null;
    membership = undefined;
    participantRow = { name: "Participant" };
    passwordUpdated = false;
    vi.spyOn(publicClient.auth, "verifyOtp").mockResolvedValue({ data: { user, session }, error: null });
    vi.spyOn(publicClient.auth, "signInWithOtp").mockResolvedValue({ data: { user: null, session: null }, error: null });
    vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({ data: { user, session }, error: null });
    vi.spyOn(admin.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
    vi.spyOn(admin.auth.admin, "updateUserById").mockImplementation(async () => {
      passwordUpdated = true;
      return { data: { user }, error: null };
    });
  });

  it("rejects an unavailable event before sending a code", async () => {
    eventRow = null;
    await expect(service.requestCode(user.email, "missing")).rejects.toMatchObject({ status: 404 });
    expect(publicClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("creates event membership only after verifying the email code", async () => {
    const result = await service.verifyCode(user.email, "123456", "Participant", "event-link");
    expect(result.user.role).toBe("participant");
    expect(publicClient.auth.verifyOtp).toHaveBeenCalledWith({ email: user.email, token: "123456", type: "email" });
    expect(membership).toEqual({ event_id: "event-uuid", auth_user_id: "user-1", name: "Participant" });
  });

  it("does not grant a participant session to a staff account", async () => {
    staffRow = staff;
    await expect(service.verifyCode(user.email, "123456", "Staff", "event-link")).rejects.toMatchObject({ status: 403 });
    expect(membership).toBeUndefined();
  });

  it("does not accept an invalid code or create a membership", async () => {
    vi.spyOn(publicClient.auth, "verifyOtp").mockResolvedValue({
      data: { user: null, session: null },
      error: { name: "AuthApiError", message: "Invalid code", status: 403, __isAuthError: true }
    });
    await expect(service.verifyCode(user.email, "bad", "Participant", "event-link")).rejects.toMatchObject({ status: 401 });
    expect(membership).toBeUndefined();
  });

  it("rejects a participant session without membership in the requested event", async () => {
    participantRow = null;
    await expect(service.currentUser("access", "event-link")).rejects.toMatchObject({ status: 403 });
  });

  it("rejects inactive staff even when their password is valid", async () => {
    staffRow = { ...staff, is_active: false };
    await expect(service.signIn(user.email, "password")).rejects.toMatchObject({ status: 403 });
  });

  it("does not accept an OTP-authenticated staff token for dashboard access", async () => {
    staffRow = staff;
    vi.spyOn(admin.auth, "getClaims").mockResolvedValue({
      data: { claims: { amr: [{ method: "otp" }] }, header: {}, signature: new Uint8Array() },
      error: null
    });
    await expect(service.currentUser("access")).rejects.toMatchObject({ status: 403 });
    await expect(service.changePassword("access", "new-password")).rejects.toMatchObject({ status: 403 });
    expect(passwordUpdated).toBe(false);
  });

  it("changes the first password only for an active password-authenticated staff user", async () => {
    staffRow = staff;
    vi.spyOn(admin.auth, "getClaims").mockResolvedValue({
      data: { claims: { amr: [{ method: "password" }] }, header: {}, signature: new Uint8Array() },
      error: null
    });
    const result = await service.changePassword("access", "new-password");
    expect(passwordUpdated).toBe(true);
    expect(result.mustChangePassword).toBe(false);
  });
});
