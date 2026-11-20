import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requireRole } from "./requireRole.js";

// Secret key used to sign and verify test tokens.
const SECRET = "test-secret";

// Create a small Express app with routes for different access rules.
const app = express();

// Only users with the ADMIN role can access this route.
app.get("/admin", requireRole(SECRET, "ADMIN"), (_req, res) => {
  res.status(200).json({ user: res.locals.user });
});

// Both ADMIN and ORGANIZER users can access this route.
app.get("/staff", requireRole(SECRET, "ADMIN", "ORGANIZER"), (_req, res) => {
  res.status(200).json({ user: res.locals.user });
});

// Any authenticated user can access this route, regardless of role.
app.get("/any", requireRole(SECRET), (_req, res) => {
  res.status(200).json({ user: res.locals.user });
});

// Create a test token with the given role and optional settings.
function tokenFor(role: string, options: jwt.SignOptions = {}, secret = SECRET) {
  return jwt.sign({ role }, secret, { subject: "user-1", expiresIn: 60, ...options });
}

// Test the authentication and role-checking middleware.
describe("requireRole", () => {
  // Requests without an Authorization header should be rejected.
  it("returns 401 without an Authorization header", async () => {
    const response = await request(app).get("/admin");

    expect(response.status).toBe(401);
  });

  // Requests must use the Bearer authentication scheme.
  it("returns 401 for a non-Bearer scheme", async () => {
    const response = await request(app).get("/admin").set("Authorization", `Basic ${tokenFor("ADMIN")}`);

    expect(response.status).toBe(401);
  });

  // Invalid tokens should be rejected.
  it("returns 401 for a garbage token", async () => {
    const response = await request(app).get("/admin").set("Authorization", "Bearer not-a-token");

    expect(response.status).toBe(401);
  });

  // Expired tokens should no longer allow access.
  it("returns 401 for an expired token", async () => {
    const token = tokenFor("ADMIN", { expiresIn: -10 });

    const response = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  // Tokens signed with a different secret should be rejected.
  it("returns 401 for a token signed with another secret", async () => {
    const token = tokenFor("ADMIN", {}, "other-secret");

    const response = await request(app).get("/admin").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  // Tokens with roles that are not recognized should be rejected.
  it("returns 401 when the role claim is unknown", async () => {
    const response = await request(app).get("/any").set("Authorization", `Bearer ${tokenFor("GUEST")}`);

    expect(response.status).toBe(401);
  });

  // Users with valid tokens but insufficient permissions should be rejected.
  it("returns 403 when the role is not allowed", async () => {
    const response = await request(app).get("/admin").set("Authorization", `Bearer ${tokenFor("ORGANIZER")}`);

    expect(response.status).toBe(403);
  });

  // Users with the required role should be allowed to access the route.
  it("lets an allowed role through and exposes the user", async () => {
    const response = await request(app).get("/admin").set("Authorization", `Bearer ${tokenFor("ADMIN")}`);

    expect(response.status).toBe(200);

    // Check if the middleware stored the correct user information.
    expect(response.body).toEqual({ user: { id: "user-1", role: "ADMIN" } });
  });

  // Users with any of the listed allowed roles should be able to access the route.
  it("allows any listed role", async () => {
    const response = await request(app).get("/staff").set("Authorization", `Bearer ${tokenFor("ORGANIZER")}`);

    expect(response.status).toBe(200);
  });

  // When no roles are specified, any authenticated user should be allowed.
  it("allows any logged-in role when none are listed", async () => {
    const response = await request(app).get("/any").set("Authorization", `Bearer ${tokenFor("ORGANIZER")}`);

    expect(response.status).toBe(200);
  });
});