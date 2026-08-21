import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(`ALTER TABLE "flight_passengers" ADD COLUMN IF NOT EXISTS "ticket_file_name" text;`);
    await pool.query(`ALTER TABLE "flight_passengers" ADD COLUMN IF NOT EXISTS "ticket_file_data" text;`);
    console.log("Migration successful");
  } catch(e) {
    console.error("Error migrating:", e.message);
  } finally {
    await pool.end();
  }
}
main();
