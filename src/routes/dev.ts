import { Router } from "express";
import { simulatedEmails } from "./auth.js";

const router = Router();

router.get("/last-emails", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.json([]);
    }
    const filtered = simulatedEmails.filter(
      (m) => m.to.toLowerCase() === String(email).toLowerCase()
    );
    res.json(filtered);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/last-emails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const index = simulatedEmails.findIndex((m) => m.id === id);
    if (index !== -1) {
      simulatedEmails.splice(index, 1);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/simulate-purchase", async (req, res) => {
  try {
    const { userEmail, planType } = req.body;
    if (!userEmail) return res.status(400).json({ error: "userEmail é obrigatório" });

    const targetPlan = planType === "pass" ? "pass" : "pro_lifetime";
    const isPro = targetPlan === "pro_lifetime";

    const { db } = await import("../db/index.js");
    const { users } = await import("../db/schema.js");
    const { eq } = await import("drizzle-orm");

    const [updatedUser] = await db
      .update(users)
      .set({
        planType: targetPlan,
        isLifetimePro: isPro,
      })
      .where(eq(users.email, userEmail.toLowerCase().trim()))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuário não encontrado no banco de dados." });
    }

    const { completeReferralForUser } = await import("./referral.js");
    await completeReferralForUser(updatedUser.id);

    res.json({
      success: true,
      message: `Compra simulada com sucesso! Usuário ${userEmail} atualizado para ${targetPlan}.`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        planType: updatedUser.planType,
        isLifetimePro: updatedUser.isLifetimePro,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
