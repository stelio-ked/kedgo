import { eq, sql, inArray, or } from "drizzle-orm";
async function run() {
  const { db } = await import("./src/db/index.js");
  const { travelers, itineraries } = await import("./src/db/schema.js");
  
  const cleanEmail = "drfabricioferreiraof@gmail.com";
  const linkedTravelers = await db.select({ itineraryId: travelers.itineraryId })
        .from(travelers)
        .where(eq(sql`LOWER(TRIM(${travelers.email}))`, cleanEmail));
  const travelerItineraryIds = linkedTravelers.map((t) => t.itineraryId);
  
  let whereClause;
  if (travelerItineraryIds.length > 0) {
    whereClause = or(eq(itineraries.ownerId, 6), inArray(itineraries.id, travelerItineraryIds));
  } else {
    whereClause = eq(itineraries.ownerId, 6);
  }

  try {
      const dbItineraries = await db.query.itineraries.findMany({
        where: whereClause,
        with: {
          travelers: true,
          costs: true,
          costCategories: true,
          documents: true,
          flights: {
            with: { passengersList: true }
          },
          generalTips: true,
          notifications: true,
          destinations: {
            with: { days: { with: { activities: true } } }
          }
        }
      });
      console.log("Success! Found", dbItineraries.length);
  } catch(e) {
      console.error(e);
  }
}
run();
