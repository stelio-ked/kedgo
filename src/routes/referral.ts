import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, referrals, referralInvites } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { sendEmail, buildReferralInviteEmail } from "../services/email.js";

const router = Router();

/**
 * Conclui a indicação quando um usuário convidado compra um produto (Passe ou Pro).
 * Atualiza o status da indicação para 'completed', incrementa o referralCount do indicador
 * e concede o Pro Vitalício se o indicador atingir 10 indicados efetivos.
 */
export async function completeReferralForUser(referredUserId: number) {
  try {
    if (!referredUserId) return;

    // Buscar indicação pendente (signup) para este usuário convidado
    const [ref] = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.referredUserId, referredUserId), eq(referrals.status, "signup")))
      .limit(1);

    if (!ref) return;

    // Transicionar status para 'completed'
    await db.update(referrals).set({ status: "completed" }).where(eq(referrals.id, ref.id));

    // Buscar todas as indicações concluídas do indicador
    const completedRefs = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.referrerId, ref.referrerId), eq(referrals.status, "completed")));

    const completedCount = completedRefs.length;

    // Atualizar indicador
    const [referrer] = await db.select().from(users).where(eq(users.id, ref.referrerId)).limit(1);
    if (referrer) {
      const updates: Record<string, any> = { referralCount: completedCount };

      if (completedCount >= 10 && !referrer.isLifetimePro) {
        updates.isLifetimePro = true;
        updates.planType = "pro_lifetime";
      }

      await db.update(users).set(updates).where(eq(users.id, ref.referrerId));
    }

    console.log(`[Referral] Indicação concluída para usuário ${referredUserId}! Indicador ${ref.referrerId} agora possui ${completedCount} indicados efetivos.`);
  } catch (err: any) {
    console.error("[Referral Completion Error]", err.message);
  }
}

// ─── GET /api/referral/stats ─────────────────────────────────────────────────
// Retorna dados reais de referral + convites por e-mail pendentes
router.get("/stats", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    // Buscar dados do usuário
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    // Gerar referralCode se ainda não existe ou se era KED1
    let referralCode = user.referralCode;
    if (!referralCode || referralCode === "KED1") {
      referralCode = "KED10";
      await db.update(users).set({ referralCode: "KED10" }).where(eq(users.id, userId));
    }

    // Buscar todos os referrals deste usuário (como referrer) — usuários que já se cadastraram
    const userReferrals = await db
      .select({
        id: referrals.id,
        referredUserId: referrals.referredUserId,
        status: referrals.status,
        rewardApplied: referrals.rewardApplied,
        createdAt: referrals.createdAt,
        referredName: users.name,
        referredEmail: users.email,
        referredPlanType: users.planType,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.referrerId, userId));

    // Auto-correção / Cálculo de indicados efetivos (somente quem comprou produto)
    let completedCount = 0;
    for (const r of userReferrals) {
      let currentStatus = r.status;
      if (currentStatus === "signup" && r.referredPlanType && r.referredPlanType !== "starter") {
        currentStatus = "completed";
        await db.update(referrals).set({ status: "completed" }).where(eq(referrals.id, r.id));
        r.status = "completed";
      }
      if (currentStatus === "completed") {
        completedCount++;
      }
    }

    // Sincronizar referralCount do indicador se necessário
    if (user.referralCount !== completedCount) {
      const updates: Record<string, any> = { referralCount: completedCount };
      if (completedCount >= 10 && !user.isLifetimePro) {
        updates.isLifetimePro = true;
        updates.planType = "pro_lifetime";
      }
      await db.update(users).set(updates).where(eq(users.id, userId));
    }

    // Buscar e-mails de convite que ainda não se cadastraram
    // (não estão na tabela users)
    const emailInvites = await db
      .select()
      .from(referralInvites)
      .where(eq(referralInvites.referrerId, userId));

    // Filtrar convites cujo e-mail já se cadastrou (já aparece em userReferrals)
    const registeredEmails = new Set(
      userReferrals.map(r => r.referredEmail?.toLowerCase()).filter(Boolean)
    );
    const pendingEmailInvites = emailInvites.filter(
      inv => !registeredEmails.has(inv.inviteeEmail.toLowerCase())
    );

    // Montar lista unificada: registrados primeiro, depois convites por e-mail pendentes
    const referralsList = [
      ...userReferrals.map(r => ({
        id: r.id,
        inviteId: null as number | null,
        name: r.referredName || "Convidado",
        email: r.referredEmail ? r.referredEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "",
        emailFull: null as string | null, // não retornamos e-mail completo de cadastrados
        status: r.status as string,
        date: r.createdAt,
        canResend: false, // já tem conta, não faz sentido reenviar
      })),
      ...pendingEmailInvites.map(inv => ({
        id: inv.id,
        inviteId: inv.id,
        name: "Aguardando cadastro",
        email: inv.inviteeEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        emailFull: inv.inviteeEmail, // precisamos para reenviar
        status: "invited",
        date: inv.sentAt,
        canResend: true,
      })),
    ];

    res.json({
      referralCode,
      completedReferrals: completedCount,
      totalReferrals: userReferrals.length,
      isLifetimePro: user.isLifetimePro ?? false,
      planType: user.planType ?? "starter",
      referrals: referralsList,
    });
  } catch (err: any) {
    console.error("[Referral Stats Error]", err.message);
    res.status(500).json({ error: "Erro ao buscar dados de indicação." });
  }
});

// ─── POST /api/referral/invite ───────────────────────────────────────────────
// Envia convite por e-mail real e salva o convite na tabela referral_invites
router.post("/invite", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Por favor, informe um e-mail válido." });
    }

    // Buscar dados do remetente
    const [referrer] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!referrer) return res.status(404).json({ error: "Usuário não encontrado" });

    // Não pode convidar a si mesmo
    if (referrer.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({ error: "Você não pode convidar a si mesmo." });
    }

    // Verificar se o convidado já tem conta
    const [existingInvitee] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existingInvitee) {
      return res.status(400).json({ error: "Este e-mail já possui uma conta no KedGo!" });
    }

    // Gerar referralCode se ainda não existe ou se era KED1
    let referralCode = referrer.referralCode;
    if (!referralCode || referralCode === "KED1") {
      referralCode = "KED10";
      await db.update(users).set({ referralCode: "KED10" }).where(eq(users.id, userId));
    }

    // Salvar o convite na tabela referral_invites (upsert: atualiza sentAt se já existir)
    try {
      await db
        .insert(referralInvites)
        .values({
          referrerId: userId,
          inviteeEmail: email.toLowerCase(),
          referralCode,
        })
        .onConflictDoUpdate({
          target: [referralInvites.referrerId, referralInvites.inviteeEmail],
          set: { sentAt: sql`NOW()`, referralCode },
        });
    } catch (insertErr: any) {
      console.warn("[Referral Invite - Insert Warning]", insertErr.message);
    }

    // Montar URL de convite
    const appUrl = (process.env.APP_URL || "https://crm-ked-kedgo.crl0uj.easypanel.host").replace(/\/$/, "");
    const inviteUrl = `${appUrl}?ref=${referralCode}`;

    // Montar e enviar e-mail
    const emailPayload = buildReferralInviteEmail({
      referrerName: referrer.name || "Um amigo",
      inviteeEmail: email,
      referralCode,
      inviteUrl,
    });

    let sent = false;
    try {
      const result = await sendEmail(emailPayload);
      sent = result.sent;
    } catch (sendErr: any) {
      console.warn("[Referral Email Warning]", sendErr.message);
      sent = false;
    }

    res.json({
      success: true,
      sent,
      message: sent
        ? `Convite enviado com sucesso para ${email}!`
        : `Convite registrado! O e-mail será entregue em breve.`,
    });
  } catch (err: any) {
    console.error("[Referral Invite Error]", err.message);
    res.status(500).json({ error: "Erro ao enviar convite." });
  }
});

// ─── POST /api/referral/resend ────────────────────────────────────────────────
// Reenvia convite por e-mail para um convite pendente (inviteId)
router.post("/resend", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Não autenticado" });

    const { inviteId } = req.body;
    if (!inviteId) return res.status(400).json({ error: "ID do convite não informado." });

    // Buscar o convite e verificar que pertence ao usuário
    const [invite] = await db
      .select()
      .from(referralInvites)
      .where(and(eq(referralInvites.id, inviteId), eq(referralInvites.referrerId, userId)))
      .limit(1);

    if (!invite) return res.status(404).json({ error: "Convite não encontrado." });

    // Verificar se o convidado ainda não tem conta
    const [existingInvitee] = await db
      .select()
      .from(users)
      .where(eq(users.email, invite.inviteeEmail))
      .limit(1);

    if (existingInvitee) {
      // Já se cadastrou — remover o invite pendente
      await db.delete(referralInvites).where(eq(referralInvites.id, inviteId));
      return res.status(400).json({ error: "Este convidado já se cadastrou no KedGo!" });
    }

    // Buscar dados do remetente
    const [referrer] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!referrer) return res.status(404).json({ error: "Usuário não encontrado" });

    const appUrl = (process.env.APP_URL || "https://crm-ked-kedgo.crl0uj.easypanel.host").replace(/\/$/, "");
    const inviteUrl = `${appUrl}?ref=${invite.referralCode}`;

    const emailPayload = buildReferralInviteEmail({
      referrerName: referrer.name || "Um amigo",
      inviteeEmail: invite.inviteeEmail,
      referralCode: invite.referralCode,
      inviteUrl,
    });

    // Atualizar sentAt
    await db
      .update(referralInvites)
      .set({ sentAt: sql`NOW()` })
      .where(eq(referralInvites.id, inviteId));

    let sent = false;
    try {
      const result = await sendEmail(emailPayload);
      sent = result.sent;
    } catch (sendErr: any) {
      console.warn("[Referral Resend Email Warning]", sendErr.message);
    }

    res.json({
      success: true,
      sent,
      message: sent
        ? `Convite reenviado para ${invite.inviteeEmail}!`
        : `Convite registrado novamente. O e-mail será entregue em breve.`,
    });
  } catch (err: any) {
    console.error("[Referral Resend Error]", err.message);
    res.status(500).json({ error: "Erro ao reenviar convite." });
  }
});

// ─── GET /api/referral/validate/:code ────────────────────────────────────────
// Valida se um código de referral ou cupom promocional existe (público, sem auth)
router.get("/validate/:code", async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ valid: false });

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode === "KED10" || cleanCode === "KED1") {
      return res.json({
        valid: true,
        referrerName: "KedGo Promocional (KED10)",
        isPromo: true,
      });
    }

    const [referrer] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.referralCode, cleanCode))
      .limit(1);

    if (!referrer) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      referrerName: referrer.name || "Um amigo",
    });
  } catch (err: any) {
    console.error("[Referral Validate Error]", err.message);
    res.json({ valid: false });
  }
});

export default router;
