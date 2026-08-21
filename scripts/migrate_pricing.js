import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) return null;
  let url = rawUrl.trim().replace(/^["']|["']$/g, "");
  if (url.startsWith("//")) {
    url = "postgresql:" + url;
  } else if (url.startsWith("postgres://")) {
    url = "postgresql://" + url.substring("postgres://".length);
  } else if (url.startsWith("postgres:") && !url.startsWith("postgres://")) {
    url = "postgresql://" + url.substring("postgres:".length).replace(/^\/*/, "");
  } else if (url.startsWith("postgresql:") && !url.startsWith("postgresql://")) {
    url = "postgresql://" + url.substring("postgresql:".length).replace(/^\/*/, "");
  } else if (!url.startsWith("postgresql://") && url.includes("@")) {
    url = "postgresql://" + url.replace(/^\/*/, "");
  }
  return url;
}

const dbUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (!dbUrl) {
  console.log("No DATABASE_URL found.");
  process.exit(0);
}

const pool = new Pool({
  connectionString: dbUrl,
  connectionTimeoutMillis: 15000,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log("Applying database migrations for new pricing strategy...");
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_annual_pro BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_expires_at TIMESTAMP;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS active_trip_pass_id INTEGER;
      
      CREATE TABLE IF NOT EXISTS founders_quota (
        id SERIAL PRIMARY KEY,
        total_limit INTEGER NOT NULL DEFAULT 200,
        sold_units INTEGER NOT NULL DEFAULT 38,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      INSERT INTO founders_quota (id, total_limit, sold_units) 
      VALUES (1, 200, 38)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log("Migration executed successfully!");
  } catch(e) {
    console.error("Migration error:", e.message);
  } finally {
    await pool.end();
  }
}

main();
