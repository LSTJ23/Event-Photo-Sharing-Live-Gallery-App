
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import type { AuthService } from "./authController.js";

// Mock database used for testing.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Sample user session returned after a successful login.
const session = {
  userId: "user-1",
  email: "organizer@example.com",
  accessToken: "access-token",
  refreshToken: "refresh-token"
};

describe("POST /api/auth/login", () => {
  // Mock the authentication functions so tests do not contact Supabase.
  const signIn = vi.fn<AuthService["signIn"]>();
  const getProfile = vi.fn<AuthService["getProfile"]>();

  // Create the application using the mocked authentication service.
  const app = createApp(database, { auth: { signIn, getProfile } });

  // Reset mock functions before every test.
  beforeEach(() => {
    signIn.mockReset();
    getProfile.mockReset();
  });

  // Test if login rejects requests with missing credentials.
  it("requires an email and password", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: "a@b.com" });

    expect(response.status).toBe(400); // Expect a Bad Request response.
    expect(signIn).not.toHaveBeenCalled(); // Login should not be attempted.
  });

  // Test if login rejects requests with no body.
  it("returns 400 when no body is sent", async () => {
    const response = await request(app).post("/api/auth/login");

    expect(response.status).toBe(400);
  });

  // Test if login rejects values that are not strings.
  it("rejects non-string values", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: "" }, password: 123 });

    expect(response.status).toBe(400);
    expect(signIn).not.toHaveBeenCalled();
  });

  // Test if incorrect login credentials are rejected.
  it("returns 401 for wrong credentials", async () => {
    signIn.mockResolvedValue(null); // Simulate an unsuccessful login.

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "organizer@example.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password." });
    expect(getProfile).not.toHaveBeenCalled(); // Profile should not be retrieved.
  });

  // Test if successful login returns the user's tokens and profile.
  it("returns tokens and the user's role on success", async () => {
    signIn.mockResolvedValue(session); // Simulate successful authentication.
    getProfile.mockResolvedValue({ name: "Alex", role: "ORGANIZER" }); // Simulate an existing profile.

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "  Organizer@Example.com ", password: "secret" });

    expect(response.status).toBe(200);
    expect(signIn).toHaveBeenCalledWith("organizer@example.com", "secret");
    expect(response.body).toEqual({
      message: "Login successful",
      access_token: "access-token",
      refresh_token: "refresh-token",
      user: { id: "user-1", name: "Alex", email: "organizer@example.com", role: "ORGANIZER" }
    });
  });

  // Test if login is rejected when the user has no profile.
  it("returns 403 when the user has no profile", async () => {
    signIn.mockResolvedValue(session);
    getProfile.mockResolvedValue(null); // Simulate a missing profile.

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "organizer@example.com", password: "secret" });

    expect(response.status).toBe(403);
  });

  // Test if unexpected Supabase errors return a server error.
  it("returns 500 when Supabase fails", async () => {
    signIn.mockRejectedValue(new Error("network down")); // Simulate a Supabase failure.

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "organizer@example.com", password: "secret" });

    expect(response.status).toBe(500);
  });
});
