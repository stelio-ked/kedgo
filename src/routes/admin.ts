import { Router } from "express";
import { eq, inArray, sql, or, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, itineraries, travelers, accessLogs, promoCoupons } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { saveItineraryData, mapItineraryFromDb, shouldLogAccess } from "../services/itineraryStorage.js";
import { generateUniqueReferralCode } from "./referral.js";

const router = Router();

// ─── Super Admin Helper ──────────────────────────────────────────────────────
export function isSuperAdmin(user?: { id?: number; email?: string; role?: string } | null): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  return user.role === "superadmin" || user.id === 1 || email === "theoked25@gmail.com";
}

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

router.post("/traveler/validate", authLimiter, async (req, res) => {
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

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }

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

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }

  try {
    const list = await db.select().from(promoCoupons).orderBy(sql`${promoCoupons.createdAt} DESC`);
    res.json({ coupons: list });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao listar cupons: " + err.message });
  }
});

router.post("/coupons", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Super Administrador." });
  }

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

// ─── GET /api/admin/overview (Visão Geral do App — Exclusivo Super Admin) ────
router.get("/overview", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Administrador Geral (theoked25@gmail.com)." });
  }

  try {
    const { feedbacks, foundersQuota } = await import("../db/schema.js");

    // 1. Estatísticas Gerais
    const allUsers = await db.select().from(users).orderBy(sql`${users.createdAt} DESC`);
    const allItineraries = await db.select().from(itineraries).orderBy(sql`${itineraries.createdAt} DESC`);
    const allFeedbacks = await db.select().from(feedbacks).orderBy(sql`${feedbacks.createdAt} DESC`);
    const allCoupons = await db.select().from(promoCoupons).orderBy(sql`${promoCoupons.createdAt} DESC`);
    const allTravelers = await db.select().from(travelers);
    const [founders] = await db.select().from(foundersQuota).limit(1);

    const proUsersCount = allUsers.filter(u => u.isLifetimePro || u.isAnnualPro || u.planType === 'founders_lifetime' || u.planType === 'pro_lifetime').length;
    const pendingFeedbacksCount = allFeedbacks.filter(f => f.status === 'pending').length;

    // Contagem de viagens por usuário
    const userItineraryCounts: Record<number, number> = {};
    for (const it of allItineraries) {
      userItineraryCounts[it.ownerId] = (userItineraryCounts[it.ownerId] || 0) + 1;
    }

    const usersFormatted = allUsers.map(u => {
      const userRole = u.role || (u.id === 1 || u.email.toLowerCase() === "theoked25@gmail.com" ? "superadmin" : "user");
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: userRole,
        planType: u.planType || "starter",
        isLifetimePro: u.isLifetimePro,
        isAnnualPro: u.isAnnualPro,
        referralCode: u.referralCode,
        referralCount: u.referralCount || 0,
        referredBy: u.referredBy,
        createdAt: u.createdAt,
        itinerariesCount: userItineraryCounts[u.id] || 0,
        isSuperAdmin: userRole === "superadmin" || u.id === 1 || u.email.toLowerCase() === "theoked25@gmail.com",
      };
    });

    res.json({
      success: true,
      stats: {
        totalUsers: allUsers.length,
        totalItineraries: allItineraries.length,
        totalTravelers: allTravelers.length,
        totalFeedbacks: allFeedbacks.length,
        pendingFeedbacks: pendingFeedbacksCount,
        totalCoupons: allCoupons.length,
        proUsersCount,
        foundersSold: founders?.soldUnits || 38,
        foundersLimit: founders?.totalLimit || 200,
      },
      users: usersFormatted,
      feedbacks: allFeedbacks,
      coupons: allCoupons,
      recentItineraries: allItineraries.slice(0, 20),
    });
  } catch (err: any) {
    console.error("[Super Admin Overview Error]", err.message);
    res.status(500).json({ error: "Erro ao carregar visão geral do app: " + err.message });
  }
});

// ─── PUT /api/admin/feedbacks/:id ────────────────────────────────────────────
// Atualiza o status e anotações do feedback pelo Super Admin
router.put("/feedbacks/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Administrador Geral." });
  }

  try {
    const feedbackId = Number(req.params.id);
    const { status, adminNotes } = req.body;

    const { feedbacks } = await import("../db/schema.js");

    const updates: Record<string, any> = {};
    if (status && ["pending", "analyzing", "resolved"].includes(status)) {
      updates.status = status;
    }
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }

    const [updated] = await db
      .update(feedbacks)
      .set(updates)
      .where(eq(feedbacks.id, feedbackId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Feedback não encontrado." });
    }

    res.json({ success: true, feedback: updated });
  } catch (err: any) {
    console.error("[Update Feedback Error]", err.message);
    res.status(500).json({ error: "Erro ao atualizar feedback: " + err.message });
  }
});

// ─── DELETE /api/admin/feedbacks/:id ─────────────────────────────────────────
router.delete("/feedbacks/:id", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({ error: "Acesso restrito ao Administrador Geral." });
  }

  try {
    const feedbackId = Number(req.params.id);
    const { feedbacks } = await import("../db/schema.js");

    await db.delete(feedbacks).where(eq(feedbacks.id, feedbackId));
    res.json({ success: true, message: "Feedback removido com sucesso." });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao remover feedback: " + err.message });
  }
});

export default router;
