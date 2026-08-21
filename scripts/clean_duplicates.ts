import { db } from "./src/db/index.js";
import { inArray } from "drizzle-orm";
import { travelers, destinations, itineraryDays, activities, costs, documents, flights, generalTips, notifications } from "./src/db/schema.js";

async function cleanDuplicates() {
  console.log("Cleaning travelers...");
  const tRows = await db.select().from(travelers);
  const seenTravelers = new Set();
  const travelersToDelete = [];
  
  for (const t of tRows) {
    const key = `${t.itineraryId}-${t.name}-${t.email}-${t.role}`;
    if (seenTravelers.has(key)) {
      travelersToDelete.push(t.id);
    } else {
      seenTravelers.add(key);
    }
  }
  if (travelersToDelete.length > 0) {
    console.log(`Deleting ${travelersToDelete.length} duplicate travelers...`);
    await db.delete(travelers).where(inArray(travelers.id, travelersToDelete));
  }


  console.log("Cleaning destinations...");
  const dRows = await db.select().from(destinations);
  const seenDestinations = new Set();
  const destinationsToDelete = [];
  const destKeepIdMap = new Map();

  for (const d of dRows) {
    const key = `${d.itineraryId}-${d.city}-${d.state}-${d.country}-${d.startDate}-${d.endDate}`;
    if (seenDestinations.has(key)) {
      destinationsToDelete.push(d.id);
    } else {
      seenDestinations.add(key);
      destKeepIdMap.set(key, d.id);
    }
  }

  if (destinationsToDelete.length > 0) {
    console.log(`Deleting ${destinationsToDelete.length} duplicate destinations...`);
    // Need to also clean days for destinations that will be deleted? The schema has onDelete: 'cascade', so it should handle it automatically if foreign key is set correctly.
    // Let's rely on CASCADE.
    await db.delete(destinations).where(inArray(destinations.id, destinationsToDelete));
  }
  
  // Wait, if we use cascade, the related itineraryDays will be deleted. BUT what about the ones that we KEEP? Did they ALSO duplicate their days?
  // Let's clean days without cascade first? Or wait... if a destination is duplicated, its days are probably pointing to the duplicated destination. So cascading will delete the duplicated days! This is perfect!
  // BUT what about days for the destination we KEPT? Did they get duplicated independently?
  
  console.log("Cleaning itinerary days...");
  const dsRows = await db.select().from(itineraryDays);
  const seenDays = new Set();
  const daysToDelete = [];
  
  for (const day of dsRows) {
    const key = `${day.destinationId}-${day.dayNumber}-${day.dateStr}-${day.title}`;
    if (seenDays.has(key)) {
      daysToDelete.push(day.id);
    } else {
      seenDays.add(key);
    }
  }
  if (daysToDelete.length > 0) {
    console.log(`Deleting ${daysToDelete.length} duplicate days...`);
    await db.delete(itineraryDays).where(inArray(itineraryDays.id, daysToDelete));
  }

  console.log("Cleaning activities...");
  const aRows = await db.select().from(activities);
  const seenActivities = new Set();
  const activitiesToDelete = [];
  
  for (const a of aRows) {
    const key = `${a.dayId}-${a.time}-${a.location}-${a.duration}-${a.cost}-${a.notes}`;
    if (seenActivities.has(key)) {
      activitiesToDelete.push(a.id);
    } else {
      seenActivities.add(key);
    }
  }
  if (activitiesToDelete.length > 0) {
    console.log(`Deleting ${activitiesToDelete.length} duplicate activities...`);
    await db.delete(activities).where(inArray(activities.id, activitiesToDelete));
  }

  console.log("Cleaning costs...");
  const cRows = await db.select().from(costs);
  const seenCosts = new Set();
  const costsToDelete = [];
  
  for (const c of cRows) {
    const key = `${c.itineraryId}-${c.category}-${c.description}-${c.totalCostBRL}`;
    if (seenCosts.has(key)) {
      costsToDelete.push(c.id);
    } else {
      seenCosts.add(key);
    }
  }
  if (costsToDelete.length > 0) {
    console.log(`Deleting ${costsToDelete.length} duplicate costs...`);
    await db.delete(costs).where(inArray(costs.id, costsToDelete));
  }

  console.log("Cleaning documents...");
  const docRows = await db.select().from(documents);
  const seenDocs = new Set();
  const docsToDelete = [];
  for (const d of docRows) {
    const key = `${d.itineraryId}-${d.type}-${d.title}-${d.passengerName}`;
    if (seenDocs.has(key)) {
      docsToDelete.push(d.id);
    } else {
      seenDocs.add(key);
    }
  }
  if (docsToDelete.length > 0) {
    console.log(`Deleting ${docsToDelete.length} duplicate documents...`);
    await db.delete(documents).where(inArray(documents.id, docsToDelete));
  }

  console.log("Cleaning flights...");
  const fRows = await db.select().from(flights);
  const seenF = new Set();
  const fToDelete = [];
  for (const f of fRows) {
    const key = `${f.itineraryId}-${f.flightCode}-${f.dateStr}-${f.departureCode}`;
    if (seenF.has(key)) {
      fToDelete.push(f.id);
    } else {
      seenF.add(key);
    }
  }
  if (fToDelete.length > 0) {
    console.log(`Deleting ${fToDelete.length} duplicate flights...`);
    await db.delete(flights).where(inArray(flights.id, fToDelete));
  }

  console.log("Cleaning generalTips...");
  const gtRows = await db.select().from(generalTips);
  const seenGt = new Set();
  const gtToDelete = [];
  for (const t of gtRows) {
    const key = `${t.itineraryId}-${t.category}-${t.title}`;
    if (seenGt.has(key)) {
      gtToDelete.push(t.id);
    } else {
      seenGt.add(key);
    }
  }
  if (gtToDelete.length > 0) {
    console.log(`Deleting ${gtToDelete.length} duplicate general tips...`);
    await db.delete(generalTips).where(inArray(generalTips.id, gtToDelete));
  }

  console.log("Cleaning notifications...");
  const nRows = await db.select().from(notifications);
  const seenN = new Set();
  const nToDelete = [];
  for (const n of nRows) {
    const key = `${n.itineraryId}-${n.type}-${n.title}-${n.time}`;
    if (seenN.has(key)) {
      nToDelete.push(n.id);
    } else {
      seenN.add(key);
    }
  }
  if (nToDelete.length > 0) {
    console.log(`Deleting ${nToDelete.length} duplicate notifications...`);
    await db.delete(notifications).where(inArray(notifications.id, nToDelete));
  }

  console.log("Finished cleaning up database.");
  process.exit(0);
}

cleanDuplicates().catch(console.error);
