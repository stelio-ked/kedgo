import { db } from "./src/db/index.js";
import { costs } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  const allCosts = await db.select().from(costs).where(eq(costs.itineraryId, 45));
  console.log(`Itinerary 45 has ${allCosts.length} costs.`);
  for (const c of allCosts.slice(0, 5)) {
    console.log(c.id, c.description, c.category);
  }
  process.exit(0);
}

run();
