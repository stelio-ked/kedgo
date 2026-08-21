import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";
import { db } from "../db/index.js";
import { apiUsageLogs, aiPromptLogs, users } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const MAX_PRO_CALLS_PER_DAY = 30; // Proteção contra bots para plano Pro

export const geminiQuotaMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Se o usuário estiver fornecendo a própria chave gratuita do Google AI Studio (BYOK),
  // o custo de tokens para o proprietário do servidor é ZERO. Uso 100% liberado e ilimitado!
  const customUserApiKey = (req.headers["x-gemini-api-key"] as string)?.trim();
  if (customUserApiKey) {
    res.setHeader("X-AI-Mode", "personal-key");
    res.setHeader("X-AI-Remaining", "999");
    res.setHeader("X-AI-Limit", "unlimited");
    return next();
  }

  if (!req.user || req.user.id === 0) return next();

  const userId = req.user.id;
  const itineraryId = req.body?.itineraryId || req.query?.itineraryId || null;
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    // Buscar perfil do usuário para verificar plano
    const [userRecord] = await db
      .select({ planType: users.planType, isLifetimePro: users.isLifetimePro })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const isPro = userRecord?.isLifetimePro || userRecord?.planType === "pro_lifetime" || userRecord?.planType === "pass";

    if (!isPro) {
      // Regra para Starter (convidado/gratuito):
      // Tem direito a gerar 1 roteiro completo com IA (ou seja, 1 chamada de generate-itinerary bem-sucedida).
      // evaluate-prompt é apenas a etapa de perguntas/avaliação e NÃO consome nem bloqueia o 1º roteiro.
      const isGeneratingItinerary = req.path.includes("generate-itinerary");

      // Contar quantos roteiros já foram gerados com sucesso por este usuário
      const successfulGenerations = await db
        .select({ id: aiPromptLogs.id })
        .from(aiPromptLogs)
        .where(and(eq(aiPromptLogs.userId, userId), eq(aiPromptLogs.success, true)));

      const totalItinerariesGenerated = successfulGenerations.length;

      // Se já gerou 1 roteiro com IA e tenta gerar outro:
      if (totalItinerariesGenerated >= 1 && (isGeneratingItinerary || req.path.includes("evaluate-prompt"))) {
        return res.status(403).json({
          error: "Você atingiu o limite gratuito de 1 roteiro com IA. Assine o KedGo Pro para roteiros ilimitados ou cadastre sua própria chave gratuita do Google AI Studio nas Configurações!",
          limitReached: true,
          planType: "starter"
        });
      }
    } else {
      // Regra de segurança para Pro no servidor: 30 requisições/dia
      const existing = await db.query.apiUsageLogs.findFirst({
        where: and(
          eq(apiUsageLogs.userId, userId),
          eq(apiUsageLogs.dateString, dateStr)
        )
      });
      const currentDayCount = existing?.callCount ?? 0;
      if (currentDayCount >= MAX_PRO_CALLS_PER_DAY) {
        return res.status(429).json({ 
          error: `Limite diário de segurança da IA atingido (${MAX_PRO_CALLS_PER_DAY} usos/dia). Tente novamente amanhã ou utilize sua própria chave gratuita do Google Gemini nas Configurações.`
        });
      }
    }

    // Registrar no log diário de uso
    const existing = await db.query.apiUsageLogs.findFirst({
      where: and(
        eq(apiUsageLogs.userId, userId),
        eq(apiUsageLogs.dateString, dateStr)
      )
    });

    if (existing) {
      await db.update(apiUsageLogs).set({
        callCount: existing.callCount + 1,
        updatedAt: new Date()
      }).where(eq(apiUsageLogs.id, existing.id));
    } else {
      await db.insert(apiUsageLogs).values({
        userId,
        itineraryId,
        dateString: dateStr,
        callCount: 1,
      });
    }

    const limit = isPro ? MAX_PRO_CALLS_PER_DAY : 1;
    const remaining = isPro 
      ? Math.max(0, MAX_PRO_CALLS_PER_DAY - ((existing?.callCount ?? 0) + 1))
      : 1;
    res.setHeader("X-AI-Remaining", remaining);
    res.setHeader("X-AI-Limit", limit);
  } catch (error) {
    console.warn("Failed to update API usage logs:", error);
  }
  next();
};
