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

      // Transform records back to expected JSON structure
      const response = dbItineraries.map((itinerary) => {
         return {
           id: itinerary.id,
           ownerId: itinerary.ownerId,
           title: itinerary.title,
           data: {
             travelers: itinerary.travelers,
             destinations: itinerary.destinations.map((d: any) => ({
                 id: d.id,
                 name: d.name,
                 lat: d.lat,
                 lng: d.lng,
                 hotelName: d.hotelName,
                 hotelLink: d.hotelLink,
                 hotelAddress: d.hotelAddress,
                 hotelCoords: (d.hotelCoordsLat && d.hotelCoordsLng) ? { lat: d.hotelCoordsLat, lng: d.hotelCoordsLng } : undefined,
                 checkInTime: d.checkInTime,
                 checkOutTime: d.checkOutTime,
                 checkInDate: d.checkInDate,
                 notes: d.notes,
                 days: d.days.map((day: any) => ({
                   id: day.id,
                   dayNumber: day.dayNumber,
                   dateStr: day.dateStr,
                   title: day.title,
                   activities: day.activities
                 })).sort((a: any, b: any) => a.dayNumber - b.dayNumber)
             })),
             costs: itinerary.costs,
             costCategories: itinerary.costCategories.map((cc: any) => {
               const prefix = `${itinerary.id}_`;
               const originalId = cc.id.toString().startsWith(prefix) ? cc.id.toString().slice(prefix.length) : cc.id;
               return {
                 ...cc,
                 id: originalId
               };
             }),
             documents: itinerary.documents,
             flights: itinerary.flights.map((f: any) => ({
                ...f,
                passengersList: (f as any).passengersList || []
             })),
             generalTips: itinerary.generalTips,
             notifications: itinerary.notifications
           }
         };
      });

  console.log("Success mapped! ", response.length);
}
run().catch(console.error);
