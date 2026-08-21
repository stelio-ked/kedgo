import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

export const normalizeDatabaseUrl = (rawUrl?: string): string | null => {
  if (!rawUrl || !rawUrl.trim()) return null;
  let url = rawUrl.trim().replace(/^["']|["']$/g, ""); // Remove enclosing quotes if any

  // Fix common URL format issues
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
};

// We only initialize connection if DATABASE_URL is provided by user environment.
export const createPool = () => {
  const normalizedUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!normalizedUrl) {
    console.warn(
      "DATABASE_URL is not set. Database features will be unavailable.",
    );
    return null;
  }

  const isSslDisabled =
    normalizedUrl.includes("sslmode=disable") ||
    normalizedUrl.includes("ssl=false") ||
    normalizedUrl.includes("localhost") ||
    normalizedUrl.includes("127.0.0.1");

  try {
    return new Pool({
      connectionString: normalizedUrl,
      connectionTimeoutMillis: 10000,
      ssl: isSslDisabled ? false : { rejectUnauthorized: false },
    });
  } catch (err) {
    console.error("Failed to initialize PostgreSQL pool:", err);
    return null;
  }
};

export const pool = createPool();

if (pool) {
  pool.on("error", (err) => {
    console.error("Unexpected error on idle SQL pool client:", err);
  });
}

// Export db instance
// You can use `db` in your API routes if initialized.
export const db = pool ? drizzle(pool, { schema }) : null;


