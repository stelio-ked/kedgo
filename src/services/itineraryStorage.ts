import { db } from "../db/index.js";
import {
  itineraries, travelers, destinations, itineraryDays, activities,
  costs, costCategories, documents, flights, generalTips, notifications, transactionLogs, flightPassengers
} from "../db/schema.js";
import { INITIAL_DESTINATIONS, INITIAL_COSTS, INITIAL_COST_CATEGORIES, INITIAL_FLIGHTS, INITIAL_DOCUMENTS, INITIAL_TIPS } from "../data/defaultData.js";
import { eq, inArray, and, sql } from "drizzle-orm";

export function mapItineraryFromDb(itinerary: any): any {
  const prefix = `${itinerary.id}_`;
  const strip = (id: string | undefined | null) => {
    if (!id) return '';
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  };

  return {
    id: itinerary.id,
    ownerId: itinerary.ownerId,
    title: itinerary.title,
    ecoMode: itinerary.ecoMode || false,
    data: {
      travelers: (itinerary.travelers || []).map((t: any) => ({
        ...t,
        id: strip(t.id)
      })),
      destinations: (itinerary.destinations || []).map((d: any) => ({
        id: strip(d.id),
        city: d.city,
        state: d.state,
        country: d.country,
        dates: d.dates,
        startDate: d.startDate,
        endDate: d.endDate,
        hotelName: d.hotelName,
        hotelLink: d.hotelLink,
        hotelAddress: d.hotelAddress,
        hotelCoords: (d.hotelCoordsLat && d.hotelCoordsLng) ? { lat: d.hotelCoordsLat, lng: d.hotelCoordsLng } : undefined,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        checkInDate: d.checkInDate,
        notes: d.notes,
        ratings: (() => {
          if (!d.ratings) return {};
          try {
            return typeof d.ratings === 'string' ? JSON.parse(d.ratings) : d.ratings;
          } catch {
            return {};
          }
        })(),
        days: (d.days || []).map((day: any) => ({
          id: strip(day.id),
          dayNumber: day.dayNumber,
          dateStr: day.dateStr,
          title: day.title,
          activities: (day.activities || []).map((act: any) => ({
            ...act,
            id: strip(act.id),
            dayId: strip(act.dayId)
          }))
        })).sort((a: any, b: any) => a.dayNumber - b.dayNumber)
      })),
      costs: (itinerary.costs || []).map((c: any) => ({
        ...c,
        id: strip(c.id),
        destinationId: c.destinationId ? strip(c.destinationId) : null
      })),
      costCategories: (itinerary.costCategories || []).map((cc: any) => ({
        ...cc,
        id: strip(cc.id)
      })),
      documents: (itinerary.documents || []).map((doc: any) => ({
        ...doc,
        id: strip(doc.id)
      })),
      flights: (itinerary.flights || []).map((f: any) => ({
        ...f,
        id: strip(f.id),
        passengersList: ((f as any).passengersList || []).map((p: any) => ({
          ...p,
          id: strip(p.id),
          flightId: strip(p.flightId)
        }))
      })),
      generalTips: (itinerary.generalTips || []).map((tip: any) => ({
        ...tip,
        id: strip(tip.id)
      })),
      notifications: (itinerary.notifications || []).map((n: any) => ({
        ...n,
        id: strip(n.id)
      })),
      transactionLogs: (itinerary.transactionLogs || []).map((log: any) => ({
        ...log,
        id: strip(log.id)
      }))
    }
  };
}

export async function saveItineraryData(
  tx: any,
  itineraryId: number,
  data: any,
  options: {
    existingFlights?: any[];
    existingDocuments?: any[];
    existingCosts?: any[];
    existingActivities?: any[];
  } = {}
) {
  const {
    existingFlights = [],
    existingDocuments = [],
    existingCosts = [],
    existingActivities = []
  } = options;

  const prefix = `${itineraryId}_`;
  const p = (id: string | number | undefined | null, prefixType: string) => {
    if (!id) return `${prefix}${prefixType}-${Math.random().toString(36).substring(7)}`;
    const strId = String(id);
    if (strId.startsWith(prefix)) return strId;
    return `${prefix}${strId}`;
  };

  const seenTravelers = new Set<string>();
  const seenCostCategories = new Set<string>();
  const seenDestinations = new Set<string>();
  const seenDays = new Set<string>();
  const seenActivities = new Set<string>();
  const seenCosts = new Set<string>();
  const seenDocuments = new Set<string>();
  const seenFlights = new Set<string>();
  const seenPassengers = new Set<string>();
  const seenTips = new Set<string>();
  const seenNotifications = new Set<string>();
  const seenLogs = new Set<string>();

  // 1. Travelers
  if (data.travelers && data.travelers.length > 0) {
    const travelersToInsert: any[] = [];
    data.travelers.forEach((t: any) => {
      let tId = p(t.id, 't');
      if (seenTravelers.has(tId)) {
        tId = `${prefix}t-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenTravelers.add(tId);

      travelersToInsert.push({
        id: tId,
        itineraryId,
        name: t.name || '',
        role: t.role || '',
        email: t.email || '',
        checkedActivities: t.checkedActivities || '',
        packingItems: t.packingItems || '',
        createdByEmail: t.createdByEmail || null
      });
    });
    if (travelersToInsert.length > 0) {
      await tx.insert(travelers).values(travelersToInsert);
    }
  }

  // 2. Cost Categories
  if (data.costCategories && data.costCategories.length > 0) {
    const costCategoriesToInsert: any[] = [];
    data.costCategories.forEach((c: any) => {
      let ccId = p(c.id, 'cc');
      if (seenCostCategories.has(ccId)) {
        ccId = `${prefix}cc-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenCostCategories.add(ccId);

      costCategoriesToInsert.push({
        id: ccId,
        itineraryId,
        label: c.label || '',
        color: c.color || '#94A3B8'
      });
    });
    if (costCategoriesToInsert.length > 0) {
      await tx.insert(costCategories).values(costCategoriesToInsert);
    }
  }

  // 3. Destinations, Days, and Activities
  if (data.destinations && data.destinations.length > 0) {
    const dbDestinationsValues: any[] = [];
    data.destinations.forEach((d: any) => {
      let dId = p(d.id, 'd');
      if (seenDestinations.has(dId)) {
        dId = `${prefix}d-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenDestinations.add(dId);

      dbDestinationsValues.push({
        id: dId,
        itineraryId,
        city: d.city || '',
        state: d.state || '',
        country: d.country || '',
        dates: d.dates || '',
        startDate: d.startDate || d.dates?.split(" - ")[0] || '',
        endDate: d.endDate || d.dates?.split(" - ")[1] || '',
        hotelName: d.hotelName || '',
        hotelLink: d.hotelLink || '',
        hotelAddress: d.hotelAddress || '',
        hotelCoordsLat: d.hotelCoords?.lat ?? null,
        hotelCoordsLng: d.hotelCoords?.lng ?? null,
        checkInTime: d.checkInTime || '',
        checkOutTime: d.checkOutTime || '',
        checkInDate: d.checkInDate || '',
        notes: d.notes || '',
        ratings: d.ratings ? (typeof d.ratings === 'object' ? JSON.stringify(d.ratings) : String(d.ratings)) : '',
        createdByEmail: d.createdByEmail || null
      });
    });
    await tx.insert(destinations).values(dbDestinationsValues);

    const daysToInsert: any[] = [];
    const activitiesToInsert: any[] = [];

    data.destinations.forEach((d: any, dIdx: number) => {
      if (d.days && d.days.length > 0) {
        d.days.forEach((day: any) => {
          let dayDbId = p(day.id, 'day');
          if (seenDays.has(dayDbId)) {
            dayDbId = `${prefix}day-${Math.random().toString(36).substring(7)}-dup`;
          }
          seenDays.add(dayDbId);

          daysToInsert.push({
            id: dayDbId,
            destinationId: dbDestinationsValues[dIdx].id,
            dayNumber: day.dayNumber || 0,
            dateStr: day.dateStr || '',
            title: day.title || ''
          });

          if (day.activities && day.activities.length > 0) {
            day.activities.forEach((act: any) => {
              let fileData = act.ticketFileData || '';
              if (fileData === "(large_preview_hidden_in_local_storage)") {
                const found = existingActivities.find((ea: any) => p(ea.id, 'act') === p(act.id, 'act'));
                if (found && found.ticketFileData && found.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
                  fileData = found.ticketFileData;
                }
              }

              let actDbId = p(act.id, 'act');
              if (seenActivities.has(actDbId)) {
                actDbId = `${prefix}act-${Math.random().toString(36).substring(7)}-dup`;
              }
              seenActivities.add(actDbId);

              activitiesToInsert.push({
                id: actDbId,
                dayId: dayDbId,
                time: act.time || '',
                type: act.type || null,
                location: act.location || '',
                duration: act.duration || '',
                cost: act.cost || '',
                mapsQuery: act.mapsQuery || '',
                websiteLink: act.websiteLink || '',
                parking: act.parking || '',
                notes: act.notes || '',
                ticketFileName: act.ticketFileName || '',
                ticketFileData: fileData,
                date: act.date || '',
                createdByEmail: act.createdByEmail || null
              });
            });
          }
        });
      }
    });

    if (daysToInsert.length > 0) {
      await tx.insert(itineraryDays).values(daysToInsert);
    }
    if (activitiesToInsert.length > 0) {
      const chunkSize = 20;
      for (let i = 0; i < activitiesToInsert.length; i += chunkSize) {
        const chunk = activitiesToInsert.slice(i, i + chunkSize);
        await tx.insert(activities).values(chunk);
      }
    }
  }

  // 4. Costs
  if (data.costs && data.costs.length > 0) {
    const costsToInsert: any[] = [];
    data.costs.forEach((c: any) => {
      let costId = p(c.id, 'c');
      if (seenCosts.has(costId)) {
        costId = `${prefix}c-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenCosts.add(costId);

      let receiptData = c.receiptData || null;
      if (receiptData === "(large_preview_hidden_in_local_storage)") {
        const found = existingCosts.find((ec: any) => p(ec.id, 'c') === p(c.id, 'c'));
        if (found && found.receiptData && found.receiptData !== "(large_preview_hidden_in_local_storage)") {
          receiptData = found.receiptData;
        }
      }

      costsToInsert.push({
        id: costId,
        itineraryId,
        category: c.category || '',
        description: c.description || '',
        notes: c.notes || '',
        link: c.link || '',
        totalCostBRL: Number(c.totalCostBRL) || 0,
        status: c.status || '',
        dateRange: c.dateRange || '',
        destinationId: c.destinationId ? p(c.destinationId, 'd') : null,
        isPersonal: c.isPersonal ?? false,
        createdByEmail: c.createdByEmail || null,
        receiptName: c.receiptName || null,
        receiptData
      });
    });
    if (costsToInsert.length > 0) {
      await tx.insert(costs).values(costsToInsert);
    }
  }

  // 5. Documents
  if (data.documents && data.documents.length > 0) {
    const docsToInsert: any[] = [];
    data.documents.forEach((doc: any) => {
      let docId = p(doc.id, 'doc');
      if (seenDocuments.has(docId)) {
        docId = `${prefix}doc-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenDocuments.add(docId);

      let fileData = doc.fileData || '';
      if (fileData === "(large_preview_hidden_in_local_storage)") {
        const found = existingDocuments.find((ed: any) => p(ed.id, 'doc') === p(doc.id, 'doc'));
        if (found && found.fileData && found.fileData !== "(large_preview_hidden_in_local_storage)") {
          fileData = found.fileData;
        }
      }

      docsToInsert.push({
        id: docId,
        itineraryId,
        type: doc.type || 'other',
        title: doc.title || '',
        airline: doc.airline || '',
        flightNumber: doc.flightNumber || '',
        passengerName: doc.passengerName || '',
        fileData,
        fileName: doc.fileName || '',
        notes: doc.notes || '',
        uploadedAt: doc.uploadedAt || new Date().toISOString(),
        createdByEmail: doc.createdByEmail || null
      });
    });
    if (docsToInsert.length > 0) {
      await tx.insert(documents).values(docsToInsert);
    }
  }

  // 6. Flights & Passengers
  if (data.flights && data.flights.length > 0) {
    const flightsToInsert = data.flights.map((f: any) => {
      let flightId = p(f.id, 'f');
      if (seenFlights.has(flightId)) {
        flightId = `${prefix}f-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenFlights.add(flightId);

      let fileData = f.ticketFileData || '';
      if (fileData === "(large_preview_hidden_in_local_storage)") {
        const found = existingFlights.find((ef: any) => p(ef.id, 'f') === p(f.id, 'f'));
        if (found && found.ticketFileData && found.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
          fileData = found.ticketFileData;
        }
      }
      return {
        id: flightId,
        itineraryId,
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
        isDeleted: f.isDeleted || false,
        gate: f.gate || '',
        locator: f.locator || '',
        passengers: f.passengers || '',
        seats: f.seats || '',
        ticketFileName: f.ticketFileName || '',
        ticketFileData: fileData,
        createdByEmail: f.createdByEmail || null
      };
    });

    await tx.insert(flights).values(flightsToInsert);

    const passengersToInsert: any[] = [];
    data.flights.forEach((f: any, idx: number) => {
      const flightDbId = flightsToInsert[idx].id;
      if (f.passengersList && Array.isArray(f.passengersList)) {
        f.passengersList.forEach((pass: any) => {
          let passId = p(pass.id, 'fp');
          if (seenPassengers.has(passId)) {
            passId = `${prefix}fp-${Math.random().toString(36).substring(7)}-dup`;
          }
          seenPassengers.add(passId);

          let fileData = pass.ticketFileData || null;
          if (fileData === "(large_preview_hidden_in_local_storage)") {
            const existingFlight = existingFlights.find((ef: any) => p(ef.id, 'f') === p(f.id, 'f'));
            const existingPassenger = existingFlight?.passengersList?.find((ep: any) => p(ep.id, 'fp') === p(pass.id, 'fp'));
            if (existingPassenger && existingPassenger.ticketFileData && existingPassenger.ticketFileData !== "(large_preview_hidden_in_local_storage)") {
              fileData = existingPassenger.ticketFileData;
            }
          }
          passengersToInsert.push({
            id: passId,
            flightId: flightDbId,
            name: pass.name || '',
            seat: pass.seat || '',
            ticketFileName: pass.ticketFileName || null,
            ticketFileData: fileData,
          });
        });
      }
    });

    if (passengersToInsert.length > 0) {
      await tx.insert(flightPassengers).values(passengersToInsert);
    }
  }

  // 7. General Tips
  if (data.generalTips && data.generalTips.length > 0) {
    const tipsToInsert: any[] = [];
    data.generalTips.forEach((tip: any) => {
      let gtId = p(tip.id, 'gt');
      if (seenTips.has(gtId)) {
        gtId = `${prefix}gt-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenTips.add(gtId);

      tipsToInsert.push({
        id: gtId,
        itineraryId,
        category: tip.category || '',
        title: tip.title || '',
        content: tip.content || ''
      });
    });
    if (tipsToInsert.length > 0) {
      await tx.insert(generalTips).values(tipsToInsert);
    }
  }

  // 8. Notifications
  if (data.notifications && data.notifications.length > 0) {
    const notificationsToInsert: any[] = [];
    data.notifications.forEach((n: any) => {
      let notifId = p(n.id, 'notif');
      if (seenNotifications.has(notifId)) {
        notifId = `${prefix}notif-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenNotifications.add(notifId);

      notificationsToInsert.push({
        id: notifId,
        itineraryId,
        title: n.title || '',
        description: n.description || '',
        time: n.time || '',
        read: n.read || false,
        type: n.type || 'system'
      });
    });
    if (notificationsToInsert.length > 0) {
      await tx.insert(notifications).values(notificationsToInsert);
    }
  }

  // 9. Transaction Logs
  if (data.transactionLogs && data.transactionLogs.length > 0) {
    const logsToInsert: any[] = [];
    data.transactionLogs.forEach((log: any) => {
      let logId = p(log.id, 'log');
      if (seenLogs.has(logId)) {
        logId = `${prefix}log-${Math.random().toString(36).substring(7)}-dup`;
      }
      seenLogs.add(logId);

      logsToInsert.push({
        id: logId,
        itineraryId,
        user: log.user || '',
        userEmail: log.userEmail || '',
        action: log.action || '',
        itemType: log.itemType || '',
        itemId: log.itemId ? p(log.itemId, 'item') : '',
        itemDesc: log.itemDesc || '',
        timestamp: log.timestamp || '',
      });
    });
    if (logsToInsert.length > 0) {
      await tx.insert(transactionLogs).values(logsToInsert);
    }
  }
}

// restoreItinerary45IfNeeded foi removida do boot automático.
// Execute manualmente via: npx tsx scripts/seed-itinerary45.ts

const recentAccessLogCache = new Map<string, number>();

export async function shouldLogAccess(db: any, email: string, itineraryId: number | null, accessLogsTable: any): Promise<boolean> {
  const normEmail = email.trim().toLowerCase();
  const key = `${normEmail}_${itineraryId || 0}`;
  const now = Date.now();
  const lastTime = recentAccessLogCache.get(key);
  if (lastTime && (now - lastTime < 15 * 60 * 1000)) {
    return false;
  }

  recentAccessLogCache.set(key, now);

  try {
    const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);
    const recentLogs = await db.select()
      .from(accessLogsTable)
      .where(
        and(
          eq(accessLogsTable.userEmail, normEmail),
          itineraryId ? eq(accessLogsTable.itineraryId, itineraryId) : sql`${accessLogsTable.itineraryId} IS NULL`,
          sql`${accessLogsTable.attemptedAt} > ${fifteenMinutesAgo}`
        )
      )
      .limit(1);

    if (recentLogs.length > 0) {
      return false;
    }
  } catch (err) {
    console.error("Error in shouldLogAccess check: ", err);
  }

  return true;
}
