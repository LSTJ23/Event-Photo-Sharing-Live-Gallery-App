import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Next.js only inlines NEXT_PUBLIC_ variables when they are read directly like this.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy frontend/.env.example to frontend/.env.local and fill them in."
    );
  }
  if (!client) client = createClient(supabaseUrl, supabasePublishableKey);
  return client;
}
