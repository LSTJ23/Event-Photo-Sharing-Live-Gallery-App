// Plan tests for the real auth service (authService.ts), with Supabase replaced by a
// stand-in that records every database request:
//   1.2 / 1.3 / 1.4   only an ACTIVE, NOT ARCHIVED event is found by its link
//   3.3 / 3.4         wrong password and unknown email are indistinguishable
//   3.1 / 3.2 / 3.7   staff get the role they have; non-staff and unknown roles get no dashboard
//   password          the first-login password change is only allowed when it is due
import { createClient, type Session, type User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseAuthService } from "./authService.js";

const user = {
  id: "user-1", email: "eli@example.com", email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-01-01T00:00:00Z"
} as User;
const session = { access_token: "access", refresh_token: "refresh", token_type: "bearer", expires_in: 3600, user } as Session;
const event = {
  id: "11111111-aaaa-bbbb-cccc-222222222222", share_slug: "event-link", name: "Event",
  start_at: "2026-11-26T09:30:00Z", location: "Manila", share_link_active: true
};
const staff = { id: user.id, email: user.email!, full_name: "Eli", role: "organizer", is_active: true, must_change_password: false };

describe("auth service", () => {
  let eventRow: typeof event | null;
  let staffRow: typeof staff | null;
  let requests: URL[];
  let passwordUpdates: number;

  const fetcher = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    requests.push(url);
    if (url.pathname.endsWith("/events")) return Response.json(eventRow);
    if (url.pathname.endsWith("/staff_users")) {
      if (init?.method === "PATCH") return Response.json({ ...staffRow, must_change_password: false });
      return Response.json(staffRow);
    }
    throw new Error(`Unexpected request: ${url.pathname}`);
  });
  const admin = createClient("https://example.supabase.co", "service-key", { global: { fetch: fetcher } });
  const publicClient = createClient("https://example.supabase.co", "public-key", { global: { fetch: fetcher } });
  const service = createSupabaseAuthService(
    admin, { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "public-key" }, () => publicClient
  );

  const authError = (status: number, message: string) => ({ name: "AuthApiError", message, status, __isAuthError: true as const });
  const passwordLogin = (amr: string) => vi.spyOn(admin.auth, "getClaims").mockResolvedValue({
    data: { claims: { amr: [{ method: amr }] }, header: {}, signature: new Uint8Array() }, error: null
  } as never);

  beforeEach(() => {
    vi.restoreAllMocks();
    eventRow = event;
    staffRow = staff;
    requests = [];
    passwordUpdates = 0;
    vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({ data: { user, session }, error: null });
    vi.spyOn(admin.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
    vi.spyOn(admin.auth.admin, "updateUserById").mockImplementation(async () => {
      passwordUpdates += 1;
      return { data: { user }, error: null };
    });
  });

  describe("1.1 - 1.4 event link lookup", () => {
    it("asks the database for an active, non-archived event with that link", async () => {
      await service.event("event-link");

      const lookup = requests.find((url) => url.pathname.endsWith("/events"))!;
      expect(lookup.searchParams.get("share_slug")).toBe("eq.event-link");
      expect(lookup.searchParams.get("share_link_active")).toBe("eq.true"); // inactive events are not found
      expect(lookup.searchParams.get("archived_at")).toBe("is.null"); // ended / archived events are not found
    });

    it("returns the event under its public link name, never the internal database id", async () => {
      const found = await service.event("event-link");

      expect(found).toEqual({
        id: "event-link", name: "Event", date: "2026-11-26", location: "Manila", shareLinkActive: true
      });
      expect(JSON.stringify(found)).not.toContain(event.id);
    });

    it("an event that is missing, inactive or archived (nothing found) is a 404", async () => {
      eventRow = null;
      await expect(service.event("old-event")).rejects.toMatchObject({ status: 404, message: "This event link is unavailable." });
    });

    it("joining the same unavailable event is also refused", async () => {
      eventRow = null;
      await expect(service.joinEvent("pat@example.com", "Pat", "old-event")).rejects.toMatchObject({ status: 404 });
    });
  });

  describe("3.3 / 3.4 failed logins", () => {
    it.each([
      ["a wrong password", authError(400, "Invalid login credentials")],
      ["an email with no account", authError(400, "Invalid login credentials")],
      ["a server rejection without details", authError(401, "Unauthorized")]
    ])("%s gives the one generic 401", async (_case, error) => {
      vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({ data: { user: null, session: null }, error } as never);

      await expect(service.signIn("eli@example.com", "wrong")).rejects.toMatchObject({
        status: 401, message: "Invalid email or password."
      });
    });

    it("an account whose email was never confirmed gets the same generic 401", async () => {
      vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({
        data: { user: { ...user, email_confirmed_at: undefined }, session }, error: null
      } as never);
      await expect(service.signIn("eli@example.com", "pw")).rejects.toMatchObject({ status: 401, message: "Invalid email or password." });
    });

    it("a guest (anonymous) session cannot be used to log in to a dashboard", async () => {
      vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({
        data: { user: { ...user, is_anonymous: true }, session }, error: null
      } as never);
      await expect(service.signIn("eli@example.com", "pw")).rejects.toMatchObject({ status: 401 });
    });

    it("too many attempts give 429", async () => {
      vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null }, error: authError(429, "rate limited")
      } as never);
      await expect(service.signIn("eli@example.com", "pw")).rejects.toMatchObject({ status: 429 });
    });

    it("a server outage is reported as a failure, not mistaken for wrong credentials", async () => {
      vi.spyOn(publicClient.auth, "signInWithPassword").mockResolvedValue({
        data: { user: null, session: null }, error: authError(503, "unavailable")
      } as never);
      const failure = await service.signIn("eli@example.com", "pw").catch((error: unknown) => error);

      expect(failure).toMatchObject({ status: 503 });
      expect(failure).not.toMatchObject({ message: "Invalid email or password." });
    });
  });

  describe("3.1 / 3.2 / 3.7 roles", () => {
    it.each(["organizer", "admin"])("a %s signs in and gets that role, with their tokens", async (role) => {
      staffRow = { ...staff, role };
      const result = await service.signIn("eli@example.com", "pw");

      expect(result.user.role).toBe(role);
      expect(result.session).toEqual({ accessToken: "access", refreshToken: "refresh" });
    });

    it("an account with a valid password but no staff record gets 403", async () => {
      staffRow = null;
      await expect(service.signIn("eli@example.com", "pw")).rejects.toMatchObject({
        status: 403, message: "This account does not have staff access."
      });
    });

    it("a staff record with an unknown role (such as 'participant') never opens a dashboard", async () => {
      staffRow = { ...staff, role: "participant" };
      await expect(service.signIn("eli@example.com", "pw")).rejects.toThrow("Unexpected staff role.");
    });

    it("a deactivated account is refused at sign-in", async () => {
      staffRow = { ...staff, is_active: false };
      await expect(service.signIn("eli@example.com", "pw")).rejects.toMatchObject({ status: 403, message: "This account is inactive." });
    });

    it("a deactivated account is also refused on a session that was already open", async () => {
      staffRow = { ...staff, is_active: false };
      passwordLogin("password");
      await expect(service.currentUser("access")).rejects.toMatchObject({ status: 403 });
    });

    it("a session token the server no longer accepts is a 401", async () => {
      vi.spyOn(admin.auth, "getUser").mockResolvedValue({ data: { user: null }, error: authError(401, "invalid JWT") } as never);
      await expect(service.currentUser("old-token")).rejects.toMatchObject({ status: 401 });
    });

    it("a token for an account with an unconfirmed email is a 401", async () => {
      vi.spyOn(admin.auth, "getUser").mockResolvedValue({
        data: { user: { ...user, email_confirmed_at: undefined } }, error: null
      } as never);
      await expect(service.currentUser("token")).rejects.toMatchObject({ status: 401 });
    });

    it("a signed-in person who is not staff must name an event, or gets 403", async () => {
      staffRow = null;
      await expect(service.currentUser("token")).rejects.toMatchObject({ status: 403, message: "An event is required." });
    });
  });

  describe("first-login password change", () => {
    it("is refused when no change is due (so a stolen session can't reset the password)", async () => {
      staffRow = { ...staff, must_change_password: false };
      passwordLogin("password");

      await expect(service.changePassword("access", "new-password")).rejects.toMatchObject({
        status: 403, message: "A password change is not required."
      });
      expect(passwordUpdates).toBe(0);
    });

    it("is refused for an inactive account", async () => {
      staffRow = { ...staff, is_active: false, must_change_password: true };
      passwordLogin("password");
      await expect(service.changePassword("access", "new-password")).rejects.toMatchObject({ status: 403 });
      expect(passwordUpdates).toBe(0);
    });

    it("is refused for someone with no staff record", async () => {
      staffRow = null;
      await expect(service.changePassword("access", "new-password")).rejects.toMatchObject({ status: 403 });
      expect(passwordUpdates).toBe(0);
    });

    it("works when due, and the account no longer has to change its password", async () => {
      staffRow = { ...staff, must_change_password: true };
      passwordLogin("password");

      const updated = await service.changePassword("access", "a-new-password");

      expect(passwordUpdates).toBe(1);
      expect(updated.mustChangePassword).toBe(false);
    });

    it("a password the server rejects gives a 400 with a helpful message", async () => {
      staffRow = { ...staff, must_change_password: true };
      passwordLogin("password");
      vi.spyOn(admin.auth.admin, "updateUserById").mockResolvedValue({
        data: { user: null }, error: authError(422, "Password is too weak")
      } as never);

      await expect(service.changePassword("access", "password1")).rejects.toMatchObject({
        status: 400, message: "The password was rejected. Choose a stronger password."
      });
    });
  });
});
