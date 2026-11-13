import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only Supabase client. It uses the secret key, which bypasses
// row-level security, so it must never be imported by frontend code.
export function createSupabaseAdminClient(
  env: NodeJS.ProcessEnv = process.env
): SupabaseClient {
  const url = env.SUPABASE_URL;
  const secretKey = env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Copy backend/.env.example to backend/.env and fill them in."
    );
  }

  return createClient(url, secretKey, {
    auth: {
      // The API has no logged-in user session to store or refresh.
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
