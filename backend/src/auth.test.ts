import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import type { AuthService } from "./controllers/authController.js";

// Creates a fake database for testing.
const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };

// Sample login result used for successful login tests.
const loggedIn = {
  user: {
    id: "user-1",
    name: "Alex",
    username: "alex",
    email: "alex@example.com",
    role: "ORGANIZER" as const
  },
  accessToken: "access-token"
};

describe("POST /api/auth/login", () => {
  // Creates a fake sign-in function to control login results during tests.
  const signIn = vi.fn<AuthService["signIn"]>();
  const app = createApp(database, { auth: { signIn } });

  // Resets the fake function before each test.
  beforeEach(() => {
    signIn.mockReset();
  });

  // Checks whether the endpoint requires both username and email.
  it("requires a username and an email", async () => {
    const response = await request(app).post("/api/auth/login").send({ username: "alex" });

    expect(response.status).toBe(400);
    expect(signIn).not.toHaveBeenCalled();
  });

  // Checks whether the endpoint handles requests without a body.
  it("returns 400 when no body is sent", async () => {
    const response = await request(app).post("/api/auth/login");

    expect(response.status).toBe(400);
  });

  // Checks whether the endpoint rejects values that are not strings.
  it("rejects non-string values", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: { $ne: "" }, email: 123 });

    expect(response.status).toBe(400);
    expect(signIn).not.toHaveBeenCalled();
  });

  // Checks whether login fails when no matching user is found.
  it("returns 401 when no user matches", async () => {
    signIn.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "alex", email: "wrong@example.com" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid username or email." });
  });

  // Checks whether successful login returns the access token and user information.
  it("returns a token and the user on success", async () => {
    signIn.mockResolvedValue(loggedIn);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "  Alex ", email: " Alex@Example.com " });

    expect(response.status).toBe(200);

    // Checks whether extra spaces are removed and both values are converted to lowercase.
    expect(signIn).toHaveBeenCalledWith("alex", "alex@example.com");

    expect(response.body).toEqual({
      message: "Login successful",
      access_token: "access-token",
      user: loggedIn.user
    });
  });

  // Checks whether the endpoint handles database lookup errors.
  it("returns 500 when the lookup fails", async () => {
    signIn.mockRejectedValue(new Error("db down"));

    const response = await request(app)
      .post("/api/auth/login")
      .send({ username: "alex", email: "alex@example.com" });

    expect(response.status).toBe(500);
  });
});
