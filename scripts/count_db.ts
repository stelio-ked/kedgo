import { db } from "./src/db/index.js";
import { travelers, destinations, itineraryDays, activities, costs, documents, flights, generalTips, notifications } from "./src/db/schema.js";

async function run() {
  const tables = { travelers, destinations, itineraryDays, activities, costs, documents, flights, generalTips, notifications };
  
  for (const [name, table] of Object.entries(tables)) {
    const all = await db.select().from(table);
    console.log(`Table ${name} has ${all.length} rows.`);
  }
  process.exit(0);
}

run();
