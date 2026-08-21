import { db } from "./src/db/index.js";
import { costs } from "./src/db/schema.js";

async function run() {
  const allCosts = await db.select().from(costs);
  console.log(allCosts.map(c => c.id));
  process.exit(0);
}

run();
