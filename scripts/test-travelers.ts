import { eq, sql } from "drizzle-orm";
async function run() {
  const { db } = await import("./src/db/index.js");
  const { travelers } = await import("./src/db/schema.js");
  const res = await db.select().from(travelers).where(eq(sql`LOWER(TRIM(${travelers.email}))`, "drfabricioferreiraof@gmail.com"));
  console.log(res);
}
run();
