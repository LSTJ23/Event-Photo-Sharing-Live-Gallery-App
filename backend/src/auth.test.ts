import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { AuthError, type AuthService } from "./controllers/authController.js";

const user = { id: "staff-1", name: "Alex", email: "alex@example.com", role: "organizer" as const, mustChangePassword: true };
const result = { user, session: { accessToken: "access-token", refreshToken: "refresh-token" } };
const auth: AuthService = {
  signIn: vi.fn(),
  requestCode: vi.fn(),
  verifyCode: vi.fn(),
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

  it("requires event context to request and verify a code", async () => {
    expect((await request(app).post("/api/auth/code").send({ email: "a@example.com" })).status).toBe(400);
    expect((await request(app).post("/api/auth/verify").send({ email: "a@example.com", code: "123456", name: "A" })).status).toBe(400);
    expect(auth.requestCode).not.toHaveBeenCalled();
    expect(auth.verifyCode).not.toHaveBeenCalled();
  });

  it("sends a code and verifies participant details", async () => {
    vi.mocked(auth.verifyCode).mockResolvedValue(result);
    const sent = await request(app).post("/api/auth/code").send({ email: " A@EXAMPLE.COM ", eventId: "event" });
    expect(sent.status).toBe(200);
    expect(auth.requestCode).toHaveBeenCalledWith("a@example.com", "event");
    const verified = await request(app).post("/api/auth/verify").send({ email: "a@example.com", code: "123456", name: " Alex ", eventId: "event" });
    expect(verified.body).toEqual(result);
    expect(auth.verifyCode).toHaveBeenCalledWith("a@example.com", "123456", "Alex", "event");
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
    vi.mocked(auth.verifyCode).mockRejectedValue(new AuthError(401, "Invalid or expired verification code."));
    const response = await request(app).post("/api/auth/verify").send({ email: "a@example.com", code: "bad", name: "A", eventId: "event" });
    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty("session");
  });
});
