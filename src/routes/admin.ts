import { Router } from "express";
import { eq, inArray, sql, or, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, itineraries, travelers, accessLogs, promoCoupons } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { saveItineraryData, mapItineraryFromDb, shouldLogAccess } from "../services/itineraryStorage.js";
import { generateUniqueReferralCode } from "./referral.js";

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

// ─── Migração em Lote: Gerar códigos únicos para usuários existentes ─────────
router.post("/migrate-referral-codes", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  try {
    // Buscar todos os usuários sem código ou com códigos genéricos legados
    const usersToMigrate = await db
      .select({ id: users.id, email: users.email, referralCode: users.referralCode })
      .from(users)
      .where(or(
        isNull(users.referralCode),
        eq(users.referralCode, "KED10"),
        eq(users.referralCode, "KED1"),
        eq(users.referralCode, "")
      ));

    let updatedCount = 0;
    for (const u of usersToMigrate) {
      const uniqueCode = await generateUniqueReferralCode();
      await db.update(users).set({ referralCode: uniqueCode }).where(eq(users.id, u.id));
      updatedCount++;
    }

    // Garantir que o cupom promocional KED10 existe na tabela promoCoupons
    try {
      const [existingPromo] = await db
        .select()
        .from(promoCoupons)
        .where(eq(promoCoupons.code, "KED10"))
        .limit(1);

      if (!existingPromo) {
        await db.insert(promoCoupons).values({
          code: "KED10",
          description: "Cupom Promocional Oficial @KedPeloMundo (R$ 10 OFF)",
          discountCents: 1000,
          isActive: true,
        });
      }
    } catch (e: any) {
      console.warn("[Admin] Aviso ao semear cupom KED10:", e.message);
    }

    res.json({
      success: true,
      message: `Migração concluída com sucesso! ${updatedCount} usuários receberam seus códigos únicos de desconto.`,
      migratedUsers: updatedCount,
    });
  } catch (err: any) {
    console.error("[Admin Migration Error]", err.message);
    res.status(500).json({ error: "Erro na migração de códigos: " + err.message });
  }
});

// ─── Gestão de Cupons Promocionais do Admin ──────────────────────────────────
router.get("/coupons", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });
  try {
    const list = await db.select().from(promoCoupons).orderBy(sql`${promoCoupons.createdAt} DESC`);
    res.json({ coupons: list });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao listar cupons: " + err.message });
  }
});

router.post("/coupons", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });
  try {
    const { code, description, discountCents } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Código do cupom é obrigatório." });
    }

    const cleanCode = code.trim().toUpperCase();
    const discount = Number(discountCents) || 1000; // Padrão R$ 10,00

    const [newCoupon] = await db
      .insert(promoCoupons)
      .values({
        code: cleanCode,
        description: description || `Cupom Promocional ${cleanCode}`,
        discountCents: discount,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: promoCoupons.code,
        set: {
          description: description || sql`${promoCoupons.description}`,
          discountCents: discount,
          isActive: true,
        },
      })
      .returning();

    res.json({ success: true, coupon: newCoupon });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao salvar cupom: " + err.message });
  }
});

router.put("/coupons/:id/toggle", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });
  try {
    const couponId = Number(req.params.id);
    const [coupon] = await db.select().from(promoCoupons).where(eq(promoCoupons.id, couponId)).limit(1);
    if (!coupon) return res.status(404).json({ error: "Cupom não encontrado." });

    const [updated] = await db
      .update(promoCoupons)
      .set({ isActive: !coupon.isActive })
      .where(eq(promoCoupons.id, couponId))
      .returning();

    res.json({ success: true, coupon: updated });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao alternar status do cupom: " + err.message });
  }
});

export default router;
