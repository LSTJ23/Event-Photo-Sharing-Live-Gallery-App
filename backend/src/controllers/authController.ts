import type { Request, Response } from "express";

// Defines the available user roles.
export type Role = "ADMIN" | "ORGANIZER";

// Stores the user's information.
export interface User {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: Role;
}

// Stores the result of a successful login.
export interface LoginResult {
  user: User;
  accessToken: string;
}

// Defines the authentication function required by the login handler.
export interface AuthService {
  // Returns null if no user matches the username and email.
  signIn(username: string, email: string): Promise<LoginResult | null>;
}

// Creates a login handler using the provided authentication service.
export function createLoginHandler(auth: AuthService) {
  return async (request: Request, response: Response) => {
    // Gets the username and email from the request body.
    const { username, email } = (request.body ?? {}) as {
      username?: unknown;
      email?: unknown;
    };

    // Checks if both fields contain valid, non-empty strings.
    if (typeof username !== "string" || typeof email !== "string" || !username.trim() || !email.trim()) {
      return response.status(400).json({ error: "Username and email are required." });
    }

    try {
      // Converts both values to lowercase and removes extra spaces before login.
      const result = await auth.signIn(username.toLowerCase().trim(), email.toLowerCase().trim());

      // Returns 401 if no matching user is found.
      if (!result) {
        return response.status(401).json({ error: "Invalid username or email." });
      }

      // Returns the access token and user information after successful login.
      return response.status(200).json({
        message: "Login successful",
        access_token: result.accessToken,
        user: result.user
      });
    } catch {
      // Returns 500 if an unexpected server error occurs.
      return response.status(500).json({ error: "Internal server error during login." });
    }
  };
}
