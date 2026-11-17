import { Pool } from "pg";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const server = createApp(pool).listen(port, () => {
  console.log(`API listening on port ${port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
