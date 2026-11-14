import jwt from "jsonwebtoken";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthService, Role } from "./controllers/authController.js";

// Sets the JWT expiration time to 12 hours.
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 12;

// Creates an authentication service that checks users in Supabase and generates JWTs.
export function createSupabaseAuthService(
  admin: SupabaseClient,
  env: NodeJS.ProcessEnv = process.env
): AuthService {
  // Gets the JWT secret from the environment variables.
  const secret = env.JWT_SECRET;

  // Prevents the application from running without a JWT secret.
  if (!secret) {
    throw new Error("Missing JWT_SECRET. Copy backend/.env.example to backend/.env and fill it in.");
  }

  return {
    // Checks whether the username and email match a user in the database.
    async signIn(username, email) {
      const { data, error } = await admin
        .from("users")
        .select("id, name, username, email, role")
        .eq("username", username)
        .eq("email", email)
        .maybeSingle();

      // Handles database errors and returns null if no user is found.
      if (error) throw error;
      if (!data) return null;

      // Organizes the database result into a user object.
      const user = {
        id: data.id as string,
        name: data.name as string | null,
        username: data.username as string,
        email: data.email as string,
        role: data.role as Role
      };

      // Generates a JWT containing the user's role and ID.
      const accessToken = jwt.sign({ role: user.role }, secret, {
        subject: user.id,
        expiresIn: TOKEN_LIFETIME_SECONDS
      });

      // Returns the user information and generated access token.
      return { user, accessToken };
    }
  };
}
