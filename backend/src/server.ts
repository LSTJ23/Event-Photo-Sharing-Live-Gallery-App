import { Pool } from "pg";
import { createApp } from "./app.js";
import { createSupabaseAuthService } from "./authService.js";
import { createSupabaseAdminClient } from "./supabase.js";

const port = Number(process.env.PORT ?? 3001);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const auth = createSupabaseAuthService(createSupabaseAdminClient());
const server = createApp(pool, { auth }).listen(port, () => {
  console.log(`API listening on port ${port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);