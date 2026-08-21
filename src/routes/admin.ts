import { Router } from "express";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, itineraries, travelers, accessLogs } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { saveItineraryData, mapItineraryFromDb, shouldLogAccess } from "../services/itineraryStorage.js";

const router = Router();

router.put("/users/favorite", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const { itineraryId } = req.body;
    await db.update(users)
      .set({ favoriteItineraryId: itineraryId ? Number(itineraryId) : null })
      .where(eq(users.id, req.user.id));
    
    res.json({ success: true, favoriteItineraryId: itineraryId });
  } catch (error: any) {
    console.error("Favorite setting error:", error);
    res.status(500).json({ error: "Erro ao favoritar viagem." });
  }
});

router.post("/migrate-local", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) {
    return res.status(503).json({ error: "DATABASE_URL não configurada." });
  }
  
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Dados são obrigatórios." });
    }

    const user = req.user;
    
    await db.delete(itineraries).where(eq(itineraries.ownerId, user.id));

    const [itinerary] = await db.insert(itineraries).values({
      ownerId: user.id,
      title: 'Diário de Bordo (Migrado)',
      isShared: true, 
    }).returning();
    
    await saveItineraryData(db, itinerary.id, data);

    res.json({ success: true, message: "Dados relacionais migrados com sucesso", itinerary });
  } catch (error: any) {
    console.error("Migration error:", error);
    res.status(500).json({ status: "error", error: error.message });
  }
});

router.post("/traveler/validate", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Por favor, indique um endereço de e-mail válido." });
    }

    if (!db) {
      return res.status(503).json({ error: "Banco de dados remoto indisponível." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const linkedTravelers = await db.select().from(travelers).where(eq(sql`LOWER(TRIM(${travelers.email}))`, cleanEmail));

    if (linkedTravelers.length === 0) {
      return res.status(404).json({
        error: "Acesso Negado: Nenhum viajante cadastrado com este e-mail nos nossos roteiros."
      });
    }

    const itineraryIds = linkedTravelers.map((t) => t.itineraryId);

    const registeredUser = await db.select().from(users).where(eq(sql`LOWER(TRIM(${users.email}))`, cleanEmail)).limit(1);
    const hasPassword = registeredUser.length > 0 && !!registeredUser[0].passwordHash;

    let isFirstAccessInDb = true;
    try {
      const userLogs = await db.select()
        .from(accessLogs)
        .where(eq(sql`LOWER(TRIM(${accessLogs.userEmail}))`, cleanEmail));
      isFirstAccessInDb = userLogs.length === 0;
    } catch (err) {
      console.error("Erro ao carregar logs de acesso do viajante:", err);
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const clientIp = typeof ip === 'string' ? ip : ip[0];
    const firstItineraryId = itineraryIds.length > 0 ? itineraryIds[0] : null;

    try {
      if (await shouldLogAccess(db, cleanEmail, firstItineraryId, accessLogs)) {
        await db.insert(accessLogs).values({
          itineraryId: firstItineraryId,
          userEmail: cleanEmail,
          status: "success",
          ipAddress: clientIp
        });
      }
    } catch (err) {
      console.error("Erro ao registrar log de acesso para o viajante vinculado:", err);
    }

    const dbItineraries = await db.query.itineraries.findMany({
      where: inArray(itineraries.id, itineraryIds),
      with: {
        travelers: true,
        costs: true,
        costCategories: true,
        documents: true,
        flights: {
          with: {
            passengersList: true,
          },
        },
        generalTips: true,
        notifications: true,
        destinations: {
          with: {
            days: {
              with: { activities: true }
            }
          }
        }
      }
    });

    const response = dbItineraries.map((itinerary) => mapItineraryFromDb(itinerary));

    res.json({ success: true, email: cleanEmail, itineraries: response, hasPassword, isFirstAccess: isFirstAccessInDb });
  } catch (err: any) {
    console.error("Traveler validation error:", err);
    res.status(500).json({ error: "Erro interno ao buscar as viagens vinculadas: " + err.message });
  }
});

export default router;
