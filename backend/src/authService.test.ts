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
const guest = { ...user, id: "guest-1", is_anonymous: true, email: undefined, email_confirmed_at: undefined };
const guestSession = { ...session, user: guest };
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
  let guestJoin: unknown;
  let guestMembership: { participants: { name: string; email: string } } | null;
  let guestJoinFails: boolean;
  let participantRow: { name: string } | null;
  let passwordUpdated: boolean;

  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname.endsWith("/events")) return Response.json(eventRow);
    if (url.pathname.endsWith("/rpc/join_event_guest")) {
      guestJoin = JSON.parse(String(init?.body));
      if (guestJoinFails) return Response.json({ code: "XX000", message: "Database unavailable" }, { status: 500 });
      return Response.json({ name: "Original Name", email: "person@example.com" });
    }
    if (url.pathname.endsWith("/participant_sessions")) return Response.json(guestMembership);
    if (url.pathname.endsWith("/staff_users")) {
      if (init?.method === "PATCH") return Response.json({ ...staffRow, must_change_password: false });
      return Response.json(staffRow);
    }
    if (url.pathname.endsWith("/participants")) {
      return Response.json(participantRow);
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
    guestJoin = undefined;
    guestJoinFails = false;
    guestMembership = { participants: { name: "Original Name", email: "person@example.com" } };
    participantRow = { name: "Participant" };
    passwordUpdated = false;
    vi.spyOn(publicClient.auth, "signInAnonymously").mockResolvedValue({ data: { user: guest, session: guestSession }, error: null });
    vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({ data: { user, session }, error: null });
    vi.spyOn(admin.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
    vi.spyOn(admin.auth.admin, "updateUserById").mockImplementation(async () => {
      passwordUpdated = true;
      return { data: { user }, error: null };
    });
  });

  it("rejects an unavailable event before creating a guest session", async () => {
    eventRow = null;
    await expect(service.joinEvent(user.email, "Participant", "missing")).rejects.toMatchObject({ status: 404 });
    expect(publicClient.auth.signInAnonymously).not.toHaveBeenCalled();
  });

  it("joins with a guest session and returns the existing attendance name", async () => {
    const result = await service.joinEvent(user.email, "New Name", "event-link");
    expect(result.user.role).toBe("participant");
    expect(result.user.name).toBe("Original Name");
    expect(guestJoin).toEqual({ p_event_id: "event-uuid", p_auth_user_id: "guest-1", p_email: user.email, p_name: "New Name" });
  });

  it("resolves guest sessions only through their event membership", async () => {
    vi.spyOn(admin.auth, "getUser").mockResolvedValue({ data: { user: guest }, error: null });
    const result = await service.currentUser("access", "event-link");
    expect(result).toMatchObject({ id: "guest-1", name: "Original Name", email: user.email, role: "participant" });
    guestMembership = null;
    await expect(service.currentUser("access", "event-link")).rejects.toMatchObject({ status: 403 });
    await expect(service.changePassword("access", "new-password")).rejects.toMatchObject({ status: 403 });
  });

  it("does not create attendance when anonymous sign-in fails", async () => {
    vi.spyOn(publicClient.auth, "signInAnonymously").mockResolvedValue({
      data: { user: null, session: null },
      error: { name: "AuthApiError", message: "Rate limited", status: 429, __isAuthError: true }
    });
    await expect(service.joinEvent(user.email, "Participant", "event-link")).rejects.toMatchObject({ status: 429 });
    expect(guestJoin).toBeUndefined();
  });

  it("removes the guest account if attendance creation fails", async () => {
    guestJoinFails = true;
    const deleteUser = vi.spyOn(admin.auth.admin, "deleteUser").mockResolvedValue({
      data: { user: null }, error: null
    });
    await expect(service.joinEvent(user.email, "Participant", "event-link")).rejects.toMatchObject({ code: "XX000" });
    expect(deleteUser).toHaveBeenCalledWith("guest-1");
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
