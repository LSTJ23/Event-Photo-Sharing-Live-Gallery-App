
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthService, Role } from "./authController.js";

// Creates the Supabase authentication service.
export function createSupabaseAuthService(
  admin: SupabaseClient, // Shared admin client for database operations.
  env: NodeJS.ProcessEnv = process.env // Gets the environment variables.
): AuthService {
  // Get the Supabase URL and publishable key.
  const url = env.SUPABASE_URL;
  const publishableKey = env.SUPABASE_PUBLISHABLE_KEY;

  // Check if the required environment variables exist.
  if (!url || !publishableKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY. Copy backend/.env.example to backend/.env and fill them in."
    );
  }

  return {
    // Verifies the user's email and password through Supabase.
    async signIn(email, password) {
      // Create a separate client for this login attempt.
      const client = createClient(url, publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      // Send the login credentials to Supabase.
      const { data, error } = await client.auth.signInWithPassword({ email, password });

      if (error) {
        // Return null if the email or password is incorrect.
        if (error.code === "invalid_credentials") return null;

        // Throw other errors so they can be handled elsewhere.
        throw error;
      }

      // Make sure a valid session and email were returned.
      if (!data.session || !data.user.email) return null;

      // Return the user's ID, email, and authentication tokens.
      return {
        userId: data.user.id,
        email: data.user.email,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token
      };
    },

    // Retrieves the user's name and role from the profiles table.
    async getProfile(userId) {
      const { data, error } = await admin
        .from("profiles")
        .select("name, role")
        .eq("id", userId) // Find the profile matching the user's ID.
        .maybeSingle(); // Return one profile or null if none exists.

      // Handle database errors.
      if (error) throw error;

      // Return null if the user has no matching profile.
      if (!data) return null;

      // Return the user's profile information.
      return {
        name: data.name as string | null,
        role: data.role as Role
      };
    }
  };
}
