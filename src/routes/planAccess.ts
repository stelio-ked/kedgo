import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

const router = Router();

const TRIAL_DURATION_DAYS = 15;

router.get("/status", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId && userId !== 0) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (userId === 0) {
      // Traveler mode — pass-through access
      return res.json({
        planType: "pass",
        isLifetimePro: false,
        isTrial: false,
        trialDaysRemaining: 15,
        trialExpired: false,
        isPro: false,
        isPass: true,
        canCreateItinerary: true,
        canUseAI: true,
        canExportPdf: true,
        maxDocuments: 999,
      });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const isPro = user.isLifetimePro || user.planType === "pro_lifetime";
    const isPass = user.planType === "pass";
    const isStarter = !isPro && !isPass;

    const startDate = user.trialStartedAt || user.createdAt || new Date();
    const now = new Date();
    const msDiff = now.getTime() - new Date(startDate).getTime();
    const daysElapsed = Math.floor(msDiff / (1000 * 60 * 60 * 24));
    const trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
    const trialExpired = isStarter && trialDaysRemaining <= 0;

    res.json({
      planType: user.planType ?? "starter",
      isLifetimePro: isPro,
      isTrial: isStarter,
      trialDaysRemaining,
      trialExpired,
      isPro,
      isPass,
      canCreateItinerary: !trialExpired,
      canUseAI: !trialExpired,
      canExportPdf: isPro || isPass,
      maxDocuments: isPro || isPass ? 999 : (trialExpired ? 0 : 3),
    });
  } catch (err: any) {
    console.error("[Plan Status Error]", err.message);
    res.status(500).json({ error: "Erro ao consultar status do plano." });
  }
});

export default router;
