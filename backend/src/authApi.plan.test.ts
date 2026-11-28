// Plan tests for the login and event-link API, sent through the real Express app
// with Supertest (the auth service is replaced by a stand-in):
//   3.3 / 3.4   wrong password and unknown email give the same answer
//   3.5 / 3.6   empty or badly formed input is rejected before the service is asked
//   3.7 / 3.9   protected routes need a signed-in user; the service's refusals are passed on
//   1.1 - 1.4   the event link lookup answers 200 for a good event, and the same 404 otherwise
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { AuthError, type AuthService } from "./controllers/authController.js";

const staff = { id: "eo-1", name: "Eli", email: "eli@example.com", role: "organizer" as const, mustChangePassword: false };
const login = { user: staff, session: { accessToken: "access", refreshToken: "refresh" } };
const event = { id: "test-event", name: "Test Event", date: "2026-10-14", location: "Manila", shareLinkActive: true };

const auth: AuthService = {
  signIn: vi.fn(),
  joinEvent: vi.fn(),
  currentUser: vi.fn(),
  changePassword: vi.fn(),
  event: vi.fn()
};
const app = createApp({ query: vi.fn() }, undefined, { auth });

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("3.3 / 3.4 - failed logins look the same", () => {
  it("a wrong password and an unregistered email get the same status and message", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new AuthError(401, "Invalid email or password."));

    const wrongPassword = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "wrong" });
    const unknownEmail = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(wrongPassword.body).toEqual({ error: "Invalid email or password." });
  });

  it("a failed login never returns a session", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new AuthError(401, "Invalid email or password."));
    const response = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "wrong" });
    expect(response.body).not.toHaveProperty("session");
    expect(response.body).not.toHaveProperty("user");
  });

  it("too many attempts are passed on as 429", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new AuthError(429, "Too many attempts. Please try again later."));
    const response = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "x" });
    expect(response.status).toBe(429);
  });

  it("an unexpected failure shows a generic message and leaks no details", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    const response = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "x" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Authentication is temporarily unavailable." });
    expect(JSON.stringify(response.body)).not.toContain("ECONNREFUSED");
  });
});

describe("3.1 / 3.2 - a good login", () => {
  it("returns the user's role, so the page can open the right dashboard", async () => {
    vi.mocked(auth.signIn).mockResolvedValue(login);
    const response = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "right" });

    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("organizer");
    expect(response.body.session).toEqual({ accessToken: "access", refreshToken: "refresh" });
  });

  it("is never stored in a cache", async () => {
    vi.mocked(auth.signIn).mockResolvedValue(login);
    const response = await request(app).post("/api/auth/login").send({ email: "eli@example.com", password: "right" });
    expect(response.headers["cache-control"]).toBe("no-store");
  });
});

describe("3.5 / 3.6 - empty and badly formed input is rejected", () => {
  it.each([
    ["no body at all", undefined],
    ["an empty object", {}],
    ["a blank email", { email: "   ", password: "pw" }],
    ["a missing email", { password: "pw" }],
    ["a missing password", { email: "eli@example.com" }],
    ["an empty password", { email: "eli@example.com", password: "" }],
    ["a number instead of text", { email: 123, password: "pw" }],
    ["an email that is far too long", { email: `${"a".repeat(400)}@example.com`, password: "pw" }]
  ])("login with %s gets 400 and the service is not asked", async (_name, body) => {
    const response = await request(app).post("/api/auth/login").send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Invalid or missing fields." });
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it.each(["eo.test.com", "admin@", "@example.com", "a b@example.com", "a@b", "plainaddress"])(
    "joining an event with the email %j gets 400 and creates no session",
    async (email) => {
      const response = await request(app).post("/api/auth/join").send({ email, name: "Pat", eventId: "test-event" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(auth.joinEvent).not.toHaveBeenCalled();
    }
  );

  it.each([
    ["a blank name", { email: "pat@example.com", name: "  ", eventId: "test-event" }],
    ["a missing name", { email: "pat@example.com", eventId: "test-event" }],
    ["a missing event", { email: "pat@example.com", name: "Pat" }]
  ])("joining with %s gets 400", async (_name, body) => {
    const response = await request(app).post("/api/auth/join").send(body);
    expect(response.status).toBe(400);
    expect(auth.joinEvent).not.toHaveBeenCalled();
  });

  it("the email's capital letters and spaces are cleaned up before use", async () => {
    vi.mocked(auth.joinEvent).mockResolvedValue(login);
    await request(app).post("/api/auth/join").send({ email: "  Pat@Example.COM ", name: " Pat ", eventId: " test-event " });
    expect(auth.joinEvent).toHaveBeenCalledWith("pat@example.com", "Pat", "test-event");
  });
});

describe("3.7 / 3.9 - protected routes need a signed-in user", () => {
  it.each([
    ["no Authorization header", undefined],
    ["an empty Bearer token", "Bearer "],
    ["Bearer with only spaces", "Bearer    "],
    ["a different scheme (Basic)", "Basic dXNlcjpwYXNz"],
    ["a token with no scheme", "just-a-token"]
  ])("GET /api/auth/me with %s gets 401 and the service is not asked", async (_name, header) => {
    const call = request(app).get("/api/auth/me");
    const response = await (header === undefined ? call : call.set("Authorization", header));

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Please sign in." });
    expect(auth.currentUser).not.toHaveBeenCalled();
  });

  it("POST /api/auth/password with no token gets 401 and changes nothing", async () => {
    const response = await request(app).post("/api/auth/password").send({ password: "a-new-password" });
    expect(response.status).toBe(401);
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("the token from the header is what the service checks", async () => {
    vi.mocked(auth.currentUser).mockResolvedValue(staff);
    const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer my-token");

    expect(response.status).toBe(200);
    expect(auth.currentUser).toHaveBeenCalledWith("my-token", undefined);
  });

  it.each([
    [401, "Session expired. Please sign in again."],
    [403, "This account does not have staff access."],
    [403, "This account is inactive."]
  ])("a %i refusal from the service (%j) is passed on and no user is returned", async (status, message) => {
    vi.mocked(auth.currentUser).mockRejectedValue(new AuthError(status, message));
    const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer token");

    expect(response.status).toBe(status);
    expect(response.body).toEqual({ error: message });
  });

  it("a participant who is refused a password change gets 403 and no user", async () => {
    vi.mocked(auth.changePassword).mockRejectedValue(new AuthError(403, "This account does not have staff access."));
    const response = await request(app).post("/api/auth/password").set("Authorization", "Bearer guest-token").send({ password: "a-new-password" });

    expect(response.status).toBe(403);
    expect(response.body).not.toHaveProperty("user");
  });

  it.each(["short", "1234567", ""])("a new password of %j is refused before the service is asked", async (password) => {
    const response = await request(app).post("/api/auth/password").set("Authorization", "Bearer token").send({ password });

    expect(response.status).toBe(400);
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("a password of exactly 8 characters is accepted", async () => {
    vi.mocked(auth.changePassword).mockResolvedValue(staff);
    const response = await request(app).post("/api/auth/password").set("Authorization", "Bearer token").send({ password: "12345678" });

    expect(response.status).toBe(200);
    expect(auth.changePassword).toHaveBeenCalledWith("token", "12345678");
  });
});

describe("1.1 - 1.4 - the event link lookup", () => {
  it("a valid event link returns that event", async () => {
    vi.mocked(auth.event).mockResolvedValue(event);
    const response = await request(app).get("/api/auth/events/test-event");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(event);
    expect(auth.event).toHaveBeenCalledWith("test-event");
  });

  it("works without signing in, so a guest can open an event link", async () => {
    vi.mocked(auth.event).mockResolvedValue(event);
    const response = await request(app).get("/api/auth/events/test-event");
    expect(response.status).toBe(200);
  });

  // Why the event is unavailable (missing, inactive, ended, archived) is decided by the
  // database lookup, which authService.plan.test.ts checks. Here: whatever the reason,
  // the answer is the same generic 404, so a stranger can't probe which events exist.
  it("an unavailable event gets a generic 404", async () => {
    vi.mocked(auth.event).mockRejectedValue(new AuthError(404, "This event link is unavailable."));
    const response = await request(app).get("/api/auth/events/old-event");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "This event link is unavailable." });
  });

  it("joining an unavailable event is refused and returns no session", async () => {
    vi.mocked(auth.joinEvent).mockRejectedValue(new AuthError(404, "This event link is unavailable."));
    const response = await request(app).post("/api/auth/join").send({ email: "pat@example.com", name: "Pat", eventId: "old-event" });

    expect(response.status).toBe(404);
    expect(response.body).not.toHaveProperty("session");
  });

  it("each event id is passed to the lookup exactly as given, so each link shows its own event", async () => {
    vi.mocked(auth.event).mockImplementation(async (id) => ({ ...event, id, name: `Event ${id}` }));
    const a = await request(app).get("/api/auth/events/alpha");
    const b = await request(app).get("/api/auth/events/beta");

    expect(a.body.name).toBe("Event alpha");
    expect(b.body.name).toBe("Event beta");
  });

  it("an event id with special characters is passed on as plain text", async () => {
    vi.mocked(auth.event).mockRejectedValue(new AuthError(404, "This event link is unavailable."));
    const response = await request(app).get(`/api/auth/events/${encodeURIComponent("x'; DROP TABLE events;--")}`);

    expect(auth.event).toHaveBeenCalledWith("x'; DROP TABLE events;--");
    expect(response.status).toBe(404);
  });

  it("the lookup is never stored in a cache", async () => {
    vi.mocked(auth.event).mockResolvedValue(event);
    const response = await request(app).get("/api/auth/events/test-event");
    expect(response.headers["cache-control"]).toBe("no-store");
  });
});

describe("the auth routes only exist when an auth service is provided", () => {
  it("without a service, the login route is not available", async () => {
    const bare = createApp({ query: vi.fn() });
    expect((await request(bare).post("/api/auth/login").send({ email: "a@b.co", password: "x" })).status).toBe(404);
    expect((await request(bare).get("/health")).status).toBe(200);
  });
});
