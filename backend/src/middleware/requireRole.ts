import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

// Define the roles that users can have.
export type Role = "ADMIN" | "ORGANIZER";

// Store the authenticated user's ID and role.
export interface AuthUser {
  id: string;
  role: Role;
}

// Check if the provided value is a valid user role.
function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "ORGANIZER";
}

// Check the user's token and role before allowing access to a route.
export function requireRole(secret: string, ...allowed: Role[]): RequestHandler {
  return (request, response, next) => {
    // Get the authentication scheme and token from the Authorization header.
    const [scheme, token] = (request.headers.authorization ?? "").split(" ");

    // Return an error if the token is missing or does not use Bearer authentication.
    if (scheme !== "Bearer" || !token) {
      return response.status(401).json({ error: "Authentication required." });
    }

    let payload: jwt.JwtPayload | string;
    try {
      // Verify the token using the secret key and HS256 algorithm.
      payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch {
      // Return an error if the token is invalid or has expired.
      return response.status(401).json({ error: "Invalid or expired token." });
    }

    // Check if the token contains a valid user ID and role.
    if (typeof payload === "string" || typeof payload.sub !== "string" || !isRole(payload.role)) {
      return response.status(401).json({ error: "Invalid or expired token." });
    }

    // Check if the user's role is allowed to access this route.
    // If no roles were specified, any authenticated user is allowed.
    if (allowed.length > 0 && !allowed.includes(payload.role)) {
      return response.status(403).json({ error: "You do not have permission to do this." });
    }

    // Store the authenticated user's information for the route handler.
    const user: AuthUser = { id: payload.sub, role: payload.role };
    response.locals.user = user;

    // Continue to the next middleware or route handler.
    next();
  };
}