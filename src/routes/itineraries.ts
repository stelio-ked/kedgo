import { Router } from "express";
import { eq, inArray, and, or, sql, isNotNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { itineraries, travelers, users, accessLogs, destinations, itineraryDays, activities, flights, flightPassengers, costs, costCategories, documents, generalTips, notifications, transactionLogs } from "../db/schema.js";
import { authMiddleware, AuthRequest, formatDbError } from "../middleware/auth.js";
import { mapItineraryFromDb, saveItineraryData, shouldLogAccess } from "../services/itineraryStorage.js";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "No DB configuration." });
  try {
    const cleanEmail = (req.user?.email || "").trim().toLowerCase();
    let travelerItineraryIds: number[] = [];

    if (cleanEmail) {
      const linkedTravelers = await db.select({ itineraryId: travelers.itineraryId })
        .from(travelers)
        .where(and(
          isNotNull(travelers.email),
          eq(sql`LOWER(TRIM(${travelers.email}))`, cleanEmail)
        ));
      travelerItineraryIds = Array.from(new Set(linkedTravelers.map((t) => t.itineraryId)));
    }

    let whereClause;
    if (travelerItineraryIds.length > 0) {
      whereClause = or(
        eq(itineraries.ownerId, req.user.id),
        inArray(itineraries.id, travelerItineraryIds)
      );
    } else {
      whereClause = eq(itineraries.ownerId, req.user.id);
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
        transactionLogs: true,
        destinations: {
          with: { days: { with: { activities: true } } }
        }
      }
    });

    try {
      if (dbItineraries.length > 0) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const clientIp = typeof ip === 'string' ? ip : ip[0];
        const firstItinerary = dbItineraries[0];
        
        if (await shouldLogAccess(db, req.user.email, firstItinerary.id, accessLogs)) {
          await db.insert(accessLogs).values({
            itineraryId: firstItinerary.id,
            userEmail: req.user.email,
            status: "success",
            ipAddress: clientIp
          });
        }
      }
    } catch (err) {
      console.error("Erro ao registrar log de acesso para o itinerário:", err);
    }

    const response = dbItineraries.map((itinerary) => mapItineraryFromDb(itinerary));

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, req.user.id)
    });

    res.json({
      itineraries: response,
      favoriteItineraryId: userRecord?.favoriteItineraryId
    });
  } catch (error: any) {
    console.error("Fetch DB error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const { title, data } = req.body;

    // Trava do modo Trial/Starter: apenas 1 roteiro permitido (múltiplos roteiros exclusivos do KedGo Pro)
    const [userRecord] = await db
      .select({ planType: users.planType, isLifetimePro: users.isLifetimePro })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    const isPro = userRecord?.isLifetimePro || userRecord?.planType === "pro_lifetime" || userRecord?.planType === "pass";

    if (!isPro) {
      const userItineraries = await db
        .select({ id: itineraries.id })
        .from(itineraries)
        .where(eq(itineraries.ownerId, req.user.id));

      if (userItineraries.length >= 1) {
        return res.status(403).json({
          error: "O modo teste/gratuito permite gerenciar apenas 1 roteiro. Assine o KedGo Pro para criar roteiros ilimitados!",
          limitReached: true,
          planType: "starter"
        });
      }
    }

    const [itinerary] = await db.insert(itineraries).values({
      ownerId: req.user.id,
      title: title || "Nova Viagem",
      isShared: true,
    }).returning();

    if (data) {
      await saveItineraryData(db, itinerary.id, data);
    }

    res.json({ success: true, itinerary: { id: itinerary.id, title: itinerary.title, data: data || {} } });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: formatDbError(err) });
  }
});

router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    const { title, data, ecoMode } = req.body;

    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inválido" });

    const [existing] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itinerário não encontrado" });
    
    if (existing.ownerId !== req.user.id) {
      const cleanEmail = req.user.email.trim().toLowerCase();
      const [isTraveler] = await db.select()
        .from(travelers)
        .where(and(
          eq(travelers.itineraryId, itineraryId), 
          eq(sql`LOWER(TRIM(${travelers.email}))`, cleanEmail)
        )).limit(1);
        
      if (!isTraveler) {
        return res.status(403).json({ error: "Não autorizado: Apenas o proprietário ou viajantes podem editar." });
      }
    }

    await db.transaction(async (tx) => {
      let updateData: any = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (ecoMode !== undefined) updateData.ecoMode = ecoMode;
      
      await tx.update(itineraries).set(updateData).where(eq(itineraries.id, itineraryId));

      if (data) {
        const isPayloadEmpty = (!data.destinations || data.destinations.length === 0) &&
          (!data.flights || data.flights.length === 0) &&
          (!data.costs || data.costs.length === 0) &&
          (!data.travelers || data.travelers.length <= 1);

        if (isPayloadEmpty) {
          const currentDestinations = await db.select().from(destinations).where(eq(destinations.itineraryId, itineraryId));
          const currentTravelers = await db.select().from(travelers).where(eq(travelers.itineraryId, itineraryId));
          if (currentDestinations.length > 0 || currentTravelers.length > 1) {
            console.warn(`[PUT /api/itineraries/${itineraryId}] Ignorando salvamento de payload vazio para proteger dados existentes.`);
            return res.json({ success: true, warning: "Payload vazio ignorado para preservar dados na nuvem." });
          }
        }

        let existingFlights: any[] = [];
        let existingDocuments: any[] = [];
        let existingCosts: any[] = [];
        let existingActivities: any[] = [];

        try {
          existingFlights = await tx.query.flights.findMany({
            where: eq(flights.itineraryId, itineraryId),
            with: { passengersList: true }
          });
          existingDocuments = await tx.select().from(documents).where(eq(documents.itineraryId, itineraryId));
          existingCosts = await tx.select().from(costs).where(eq(costs.itineraryId, itineraryId));
          const existingDestinations = await tx.select().from(destinations).where(eq(destinations.itineraryId, itineraryId));
          const existingDestIds = existingDestinations.map((d: any) => d.id);
          if (existingDestIds.length > 0) {
            const existingDays = await tx.select().from(itineraryDays).where(inArray(itineraryDays.destinationId, existingDestIds));
            const existingDayIds = existingDays.map((dy: any) => dy.id);
            if (existingDayIds.length > 0) {
              existingActivities = await tx.select().from(activities).where(inArray(activities.dayId, existingDayIds));
            }
          }
        } catch (fetchErr) {
          console.error("Erro ao recuperar registros existentes para preservar arquivos:", fetchErr);
        }

        try {
          const existingDestinations = await tx.select().from(destinations).where(eq(destinations.itineraryId, itineraryId));
          const existingDestIds = existingDestinations.map((d: any) => d.id);
          if (existingDestIds.length > 0) {
            const existingDays = await tx.select().from(itineraryDays).where(inArray(itineraryDays.destinationId, existingDestIds));
            const existingDayIds = existingDays.map((dy: any) => dy.id);
            if (existingDayIds.length > 0) {
              await tx.delete(activities).where(inArray(activities.dayId, existingDayIds));
            }
            await tx.delete(itineraryDays).where(inArray(itineraryDays.destinationId, existingDestIds));
          }
        } catch (err) {
          console.error("Erro ao deletar de forma explicita dias e atividades:", err);
        }

        try {
          const existingFlightsForDelete = await tx.select().from(flights).where(eq(flights.itineraryId, itineraryId));
          const existingFlightIds = existingFlightsForDelete.map((f: any) => f.id);
          if (existingFlightIds.length > 0) {
            await tx.delete(flightPassengers).where(inArray(flightPassengers.flightId, existingFlightIds));
          }
        } catch (err) {
          console.error("Erro ao deletar de forma explicita passageiros de voo:", err);
        }

        await tx.delete(travelers).where(eq(travelers.itineraryId, itineraryId));
        await tx.delete(destinations).where(eq(destinations.itineraryId, itineraryId));
        await tx.delete(costs).where(eq(costs.itineraryId, itineraryId));
        await tx.delete(costCategories).where(eq(costCategories.itineraryId, itineraryId));
        await tx.delete(documents).where(eq(documents.itineraryId, itineraryId));
        await tx.delete(flights).where(eq(flights.itineraryId, itineraryId));
        await tx.delete(generalTips).where(eq(generalTips.itineraryId, itineraryId));
        await tx.delete(notifications).where(eq(notifications.itineraryId, itineraryId));
        await tx.delete(transactionLogs).where(eq(transactionLogs.itineraryId, itineraryId));

        await saveItineraryData(tx, itineraryId, data, {
          existingFlights,
          existingDocuments,
          existingCosts,
          existingActivities
        });
      }
    });

    res.json({ success: true, message: "Itinerário atualizado com sucesso" });
  } catch (error: any) {
    console.error("Save error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/access_logs", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inválido" });

    const [existing] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itinerário não encontrado" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: "Não autorizado" });

    let logs = [];
    try {
      logs = await db.select().from(accessLogs).where(eq(accessLogs.itineraryId, itineraryId)).orderBy(sql`${accessLogs.attemptedAt} DESC`);
    } catch (err) {
      console.error("Erro ao carregar logs de acesso:", err);
    }
    res.json({ success: true, logs });
  } catch (error: any) {
    console.error("Access logs fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const itineraryId = parseInt(req.params.id);
    if (isNaN(itineraryId)) return res.status(400).json({ error: "ID inválido" });

    const [existing] = await db.select().from(itineraries).where(eq(itineraries.id, itineraryId)).limit(1);
    if (!existing) return res.status(404).json({ error: "Itinerário não encontrado" });
    if (existing.ownerId !== req.user.id) return res.status(403).json({ error: "Não autorizado" });

    await db.delete(itineraries).where(eq(itineraries.id, itineraryId));
    res.json({ success: true, message: "Itinerário excluído com sucesso" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
