import { Router } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { feedbacks, users } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { sendEmail, buildAdminFeedbackNotificationEmail } from "../services/email.js";

const router = Router();

// ─── POST /api/feedbacks ─────────────────────────────────────────────────────
// Envia um novo feedback (viajante autenticado ou convidado)
router.post("/", async (req: any, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  try {
    const { type, subject, message, rating, itineraryId, userName, userEmail } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Por favor, escreva sua mensagem de feedback." });
    }

    let finalEmail = userEmail ? String(userEmail).trim().toLowerCase() : "";
    let finalName = userName ? String(userName).trim() : "Viajante Anônimo";
    let userId: number | null = null;

    // Se o usuário enviou Authorization token, recuperar dados do usuário
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const jwt = (await import("jsonwebtoken")).default;
        const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_me_in_prod";
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          userId = decoded.id;
          if (!finalEmail && decoded.email) finalEmail = decoded.email;
          if (finalName === "Viajante Anônimo" && decoded.name) finalName = decoded.name;
        }
      } catch {}
    }

    if (!finalEmail) {
      finalEmail = "anonimo@kedgo.pro";
    }

    const cleanType = ["suggestion", "bug", "question", "praise", "other"].includes(type)
      ? type
      : "suggestion";

    const [newFeedback] = await db
      .insert(feedbacks)
      .values({
        userId,
        userName: finalName,
        userEmail: finalEmail,
        type: cleanType,
        subject: subject && subject.trim() ? subject.trim() : `Feedback: ${cleanType}`,
        message: message.trim(),
        rating: rating && Number(rating) >= 1 && Number(rating) <= 5 ? Number(rating) : null,
        itineraryId: itineraryId ? Number(itineraryId) : null,
        status: "pending",
      })
      .returning();

    console.log(`[Feedback] Novo feedback recebido (${cleanType}) de ${finalEmail}: "${newFeedback.subject}"`);

    // Disparar e-mail de notificação em tempo real para o Super Admin
    try {
      const emailPayload = buildAdminFeedbackNotificationEmail({
        userName: finalName,
        userEmail: finalEmail,
        type: cleanType,
        subject: newFeedback.subject,
        message: newFeedback.message,
        rating: newFeedback.rating,
        createdAt: newFeedback.createdAt,
      });
      // Envia em background
      sendEmail(emailPayload).catch((err: any) => {
        console.warn("[Feedback Email Error] Falha ao enviar alerta de feedback:", err.message);
      });
    } catch (e: any) {
      console.warn("[Feedback Email Build Error]", e.message);
    }

    res.status(201).json({
      success: true,
      message: "Obrigado pelo seu feedback! Ele nos ajuda a tornar o KedGo! cada vez melhor.",
      feedback: newFeedback,
    });
  } catch (err: any) {
    console.error("[Feedback Error]", err.message);
    res.status(500).json({ error: "Erro ao registrar feedback: " + err.message });
  }
});

// ─── GET /api/feedbacks/my ───────────────────────────────────────────────────
// Lista os feedbacks enviados pelo próprio usuário logado
router.get("/my", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "Banco de dados indisponível." });

  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email?.toLowerCase().trim();

    if (!userId && !userEmail) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    const myFeedbacks = await db
      .select()
      .from(feedbacks)
      .where(userId ? eq(feedbacks.userId, userId) : eq(feedbacks.userEmail, userEmail!))
      .orderBy(desc(feedbacks.createdAt));

    res.json({ feedbacks: myFeedbacks });
  } catch (err: any) {
    console.error("[My Feedbacks Error]", err.message);
    res.status(500).json({ error: "Erro ao buscar seus feedbacks." });
  }
});

export default router;
