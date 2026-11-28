import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { AuthError, type AuthService } from "./controllers/authController.js";

const user = { id: "staff-1", name: "Alex", email: "alex@example.com", role: "organizer" as const, mustChangePassword: true };
const result = { user, session: { accessToken: "access-token", refreshToken: "refresh-token" } };
const auth: AuthService = {
  signIn: vi.fn(),
  joinEvent: vi.fn(),
  currentUser: vi.fn(),
  changePassword: vi.fn(),
  event: vi.fn()
};
const app = createApp({ query: vi.fn() }, undefined, { auth });

beforeEach(() => vi.resetAllMocks());

describe("authentication API", () => {
  it("requires a password rather than accepting a username and email", async () => {
    const response = await request(app).post("/api/auth/login").send({ username: "alex", email: "alex@example.com" });
    expect(response.status).toBe(400);
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it("normalizes email without modifying the password and returns the session", async () => {
    vi.mocked(auth.signIn).mockResolvedValue(result);
    const response = await request(app).post("/api/auth/login").send({ email: " Alex@Example.com ", password: " secret " });
    expect(response.status).toBe(200);
    expect(auth.signIn).toHaveBeenCalledWith("alex@example.com", " secret ");
    expect(response.body).toEqual(result);
    expect(response.headers["cache-control"]).toBe("no-store");
  });

  it("returns an invalid-credentials error", async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new AuthError(401, "Invalid email or password."));
    const response = await request(app).post("/api/auth/login").send({ email: "alex@example.com", password: "wrong" });
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid email or password.");
  });

  it("requires a valid email, name, and event to join", async () => {
    expect((await request(app).post("/api/auth/join").send({ email: "a@example.com", name: "A" })).status).toBe(400);
    expect((await request(app).post("/api/auth/join").send({ email: "invalid", name: "A", eventId: "event" })).status).toBe(400);
    expect(auth.joinEvent).not.toHaveBeenCalled();
  });

  it("normalizes participant details and returns a session", async () => {
    vi.mocked(auth.joinEvent).mockResolvedValue(result);
    const joined = await request(app).post("/api/auth/join").send({ email: " A@EXAMPLE.COM ", name: " Alex ", eventId: "event" });
    expect(joined.body).toEqual(result);
    expect(auth.joinEvent).toHaveBeenCalledWith("a@example.com", "Alex", "event");
  });

  it("requires a bearer token for session checks and password changes", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).post("/api/auth/password").send({ password: "new-password" })).status).toBe(401);
    expect(auth.currentUser).not.toHaveBeenCalled();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("checks event membership for the authenticated token", async () => {
    vi.mocked(auth.currentUser).mockResolvedValue(user);
    const response = await request(app).get("/api/auth/me?eventId=event").set("Authorization", "Bearer token");
    expect(response.body).toEqual({ user });
    expect(auth.currentUser).toHaveBeenCalledWith("token", "event");
  });

  it("requires a sufficiently long new password", async () => {
    const response = await request(app).post("/api/auth/password").set("Authorization", "Bearer token").send({ password: "short" });
    expect(response.status).toBe(400);
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("returns errors from the auth service without issuing a session", async () => {
    vi.mocked(auth.joinEvent).mockRejectedValue(new AuthError(404, "This event link is unavailable."));
    const response = await request(app).post("/api/auth/join").send({ email: "a@example.com", name: "A", eventId: "event" });
    expect(response.status).toBe(404);
    expect(response.body).not.toHaveProperty("session");
  });
});
