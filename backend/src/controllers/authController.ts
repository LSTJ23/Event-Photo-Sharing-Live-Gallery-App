import type { Request, Response } from "express";

// Defines the two roles that a user can have in the application.
export type Role = "ADMIN" | "ORGANIZER";

// Stores the user's login session information.
export interface Session {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

// Stores the user's profile information from the database.
export interface Profile {
  name: string | null;
  role: Role;
}

// This interface defines the functions needed for authentication.
export interface AuthService {
  // This function verifies the user's email and password and returns a session if successful.
  signIn(email: string, password: string): Promise<Session | null>;

  // This function retrieves the user's profile information from the database.
  getProfile(userId: string): Promise<Profile | null>;
}

// This function creates a login handler using the provided authentication service.
export function createLoginHandler(auth: AuthService) {
  // This function handles incoming login requests and sends the appropriate response.
  return async (request: Request, response: Response) => {
    // Extracts the email and password from the request body.
    const { email, password } = (request.body ?? {}) as {
      email?: unknown;
      password?: unknown;
    };

    // Validates that both email and password are provided and are strings.
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return response.status(400).json({ error: "Email and password are required." });
    }

    try {
      // Calls the signIn function to verify the user's credentials.
      const session = await auth.signIn(email.toLowerCase().trim(), password);

      // If signIn returns null, the email or password is incorrect.
      if (!session) {
        return response.status(401).json({ error: "Invalid email or password." });
      }

      // Retrieves the user's profile using their ID from the login session.
      const profile = await auth.getProfile(session.userId);

      // If no profile exists, the account has no assigned role.
      if (!profile) {
        return response.status(403).json({ error: "This account has no role assigned." });
      }

      // Returns HTTP 200 with the user's session tokens and profile information.
      return response.status(200).json({
        message: "Login successful",
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        user: {
          id: session.userId,
          name: profile.name,
          email: session.email,
          role: profile.role // "ADMIN" or "ORGANIZER"
        }
      });
    } catch {
      
      // Returns HTTP 500 if an unexpected error occurs during the login process.
      return response.status(500).json({ error: "Internal server error during login." });
    }
  };
}
