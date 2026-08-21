import { db } from "./src/db/index.js";
import { users, itineraries, travelers, destinations, itineraryDays, activities, costs, documents, flights, generalTips, notifications } from "./src/db/schema.js";
import { eq } from "drizzle-orm";
import { INITIAL_TRAVELERS, INITIAL_DESTINATIONS, INITIAL_COSTS, INITIAL_FLIGHTS, INITIAL_TIPS, INITIAL_DOCUMENTS, INITIAL_NOTIFICATIONS } from "./src/data/defaultData.js";

async function seed() {
  console.log("Starting seed...");
  try {
    const email = "theoked25@gmail.com";
    const name = "Théo (Você)";
    
    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
        const [newUser] = await db.insert(users).values({ email, name }).returning();
        user = newUser;
    }

    // Delete existing
    await db.delete(itineraries).where(eq(itineraries.ownerId, user.id));

    // Create Itinerary
    const [itinerary] = await db.insert(itineraries).values({
      ownerId: user.id,
      title: 'Diário de Bordo (Histórico Oficial)',
      isShared: true, 
    }).returning();
    
    // Insert Travelers
    if (INITIAL_TRAVELERS && INITIAL_TRAVELERS.length > 0) {
      await db.insert(travelers).values(INITIAL_TRAVELERS.map(t => ({
        id: t.id || Math.random().toString(),
        itineraryId: itinerary.id,
        name: t.name || '',
        role: t.role || '',
        email: t.email || ''
      })));
    }

    // Insert Destinations
    if (INITIAL_DESTINATIONS && INITIAL_DESTINATIONS.length > 0) {
      const dbDestinationsValues = INITIAL_DESTINATIONS.map((d: any) => ({
        id: d.id || Math.random().toString(),
        itineraryId: itinerary.id,
        city: d.city || '',
        state: d.state || '',
        country: d.country || '',
        dates: d.dates || '',
        hotelName: d.hotelName || '',
        hotelLink: d.hotelLink || '',
        hotelAddress: d.hotelAddress || '',
        hotelCoordsLat: d.hotelCoords?.lat ?? null,
        hotelCoordsLng: d.hotelCoords?.lng ?? null,
        checkInTime: d.checkInTime || '',
        checkOutTime: d.checkOutTime || '',
        checkInDate: d.checkInDate || '',
        notes: d.notes || ''
      }));
      await db.insert(destinations).values(dbDestinationsValues);

      const daysToInsert: any[] = [];
      const activitiesToInsert: any[] = [];

      INITIAL_DESTINATIONS.forEach((d: any) => {
        if (d.days && d.days.length > 0) {
          d.days.forEach((day: any) => {
              const dayDbId = day.id || Math.random().toString();
              daysToInsert.push({
                id: dayDbId,
                destinationId: d.id,
                dayNumber: day.dayNumber || 0,
                dateStr: day.dateStr || '',
                title: day.title || ''
              });
              
              if (day.activities && day.activities.length > 0) {
                day.activities.forEach((act: any) => {
                    activitiesToInsert.push({
                      id: act.id || Math.random().toString(),
                      dayId: dayDbId,
                      time: act.time || '',
                      location: act.location || '',
                      duration: act.duration || '',
                      cost: act.cost || '',
                      mapsQuery: act.mapsQuery || '',
                      websiteLink: act.websiteLink || '',
                      parking: act.parking || '',
                      notes: act.notes || '',
                      ticketFileName: act.ticketFileName || '',
                      ticketFileData: act.ticketFileData || '',
                      date: act.date || ''
                    });
                });
              }
          });
        }
      });

      if (daysToInsert.length > 0) await db.insert(itineraryDays).values(daysToInsert);
      
      if (activitiesToInsert.length > 0) {
          const chunkSize = 20;
          for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
            const chunk = activitiesToInsert.slice(i, i + chunkSize);
            await db.insert(activities).values(chunk);
          }
      }
    }

    // Insert Costs
    if (INITIAL_COSTS && INITIAL_COSTS.length > 0) {
        await db.insert(costs).values(INITIAL_COSTS.map((c: any) => ({
          id: c.id || Math.random().toString(),
          itineraryId: itinerary.id,
          category: c.category || '',
          description: c.description || '',
          notes: c.notes || '',
          link: c.link || '',
          totalCostBRL: Number(c.totalCostBRL) || 0,
          status: c.status || '',
          dateRange: c.dateRange || '',
          destinationId: c.destinationId || ''
        })));
    }

    // Insert Documents
    if (INITIAL_DOCUMENTS && INITIAL_DOCUMENTS.length > 0) {
        await db.insert(documents).values(INITIAL_DOCUMENTS.map((doc: any) => ({
          id: doc.id || Math.random().toString(),
          itineraryId: itinerary.id,
          type: doc.type || 'other',
          title: doc.title || '',
          airline: doc.airline || '',
          flightNumber: doc.flightNumber || '',
          passengerName: doc.passengerName || '',
          fileData: doc.fileData || '',
          fileName: doc.fileName || '',
          notes: doc.notes || '',
          uploadedAt: doc.uploadedAt || new Date().toISOString()
        })));
    }

    // Insert Flights
    if (INITIAL_FLIGHTS && INITIAL_FLIGHTS.length > 0) {
        await db.insert(flights).values(INITIAL_FLIGHTS.map((f: any) => ({
          id: f.id || Math.random().toString(),
          itineraryId: itinerary.id,
          airline: f.airline || '',
          logoUrl: f.logoUrl || '',
          flightCode: f.flightCode || '',
          departureCity: f.departureCity || '',
          departureCode: f.departureCode || '',
          departureTime: f.departureTime || '',
          arrivalCity: f.arrivalCity || '',
          arrivalCode: f.arrivalCode || '',
          arrivalTime: f.arrivalTime || '',
          duration: f.duration || '',
          dateStr: f.dateStr || '',
          arrivalDateStr: f.arrivalDateStr || '',
          status: f.status || 'Confirmado',
          gate: f.gate || '',
          locator: f.locator || ''
        })));
    }

    // Insert Tips
    if (INITIAL_TIPS && INITIAL_TIPS.length > 0) {
        await db.insert(generalTips).values(INITIAL_TIPS.map((tip: any) => ({
          id: tip.id || Math.random().toString(),
          itineraryId: itinerary.id,
          category: tip.category || '',
          title: tip.title || '',
          content: tip.content || ''
        })));
    }

    // Insert Notifications
    if (INITIAL_NOTIFICATIONS && INITIAL_NOTIFICATIONS.length > 0) {
        await db.insert(notifications).values(INITIAL_NOTIFICATIONS.map((n: any) => ({
          id: n.id || Math.random().toString(),
          itineraryId: itinerary.id,
          title: n.title || '',
          description: n.description || '',
          time: n.time || '',
          read: n.read || false,
          type: n.type || 'system'
        })));
    }

    console.log("Migration seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
  }
}

seed();
