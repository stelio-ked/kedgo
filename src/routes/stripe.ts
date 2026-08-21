import { Router } from "express";
import Stripe from "stripe";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, itineraries, foundersQuota } from "../db/schema.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { completeReferralForUser } from "./referral.js";

const router = Router();

// Initialize Stripe with secret key from environment or fallback
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeSecretKey);

function getAppUrl(req: any): string {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

// Helper to ensure founders quota row exists
async function getOrInitFoundersQuota() {
  try {
    let [quota] = await db.select().from(foundersQuota).limit(1);
    if (!quota) {
      [quota] = await db.insert(foundersQuota).values({
        totalLimit: 200,
        soldUnits: 38, // Initial seed for realism based on @KedPeloMundo early buyers
      }).returning();
    }
    return quota;
  } catch (err) {
    console.error("[Founders Quota DB Error]", err);
    return { id: 1, totalLimit: 200, soldUnits: 38 };
  }
}

// ─── GET /api/stripe/founders-status ─────────────────────────────────────────
router.get("/founders-status", async (req, res) => {
  try {
    const quota = await getOrInitFoundersQuota();
    const totalLimit = quota.totalLimit || 200;
    const soldUnits = Math.min(totalLimit, quota.soldUnits || 0);
    const remainingUnits = Math.max(0, totalLimit - soldUnits);
    const isAvailable = remainingUnits > 0;

    res.json({
      totalLimit,
      soldUnits,
      remainingUnits,
      isAvailable,
      percentageClaimed: Math.round((soldUnits / totalLimit) * 100),
    });
  } catch (err: any) {
    console.error("[Founders Status Error]", err.message);
    res.status(500).json({ error: "Erro ao consultar status do lote de fundadores." });
  }
});

// ─── POST /api/stripe/create-checkout-session ───────────────────────────────
router.post("/create-checkout-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && userId !== 0) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    const { plan, itineraryId, discountCode } = req.body; 
    // Normalized plan types: 'pass' | 'annual' | 'founders_lifetime' | 'pro_lifetime'
    let planType: 'pass' | 'annual' | 'founders_lifetime' = 'annual';
    if (plan === 'pass') planType = 'pass';
    else if (plan === 'founders_lifetime' || plan === 'pro_lifetime') planType = 'founders_lifetime';
    else planType = 'annual';

    // ─── Founders Limit Check ────────────────────────────────────────────────
    if (planType === 'founders_lifetime') {
      const quota = await getOrInitFoundersQuota();
      if ((quota.soldUnits || 0) >= (quota.totalLimit || 200)) {
        return res.status(400).json({
          error: "O Lote Especial de Fundadores (200 licenças) foi totalmente esgotado! Por favor, selecione a Assinatura Anual KedGo Pro ou o Passe Por Viagem.",
          isSoldOut: true,
        });
      }
    }

    // ─── Anti-Fraud / Server-Side Discount Validation ────────────────────────
    let validDiscount = false;
    let isCouponKed10 = false;
    let validatedDiscountCode = "";

    if (discountCode && typeof discountCode === "string") {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode === "KED10") {
        validDiscount = true;
        isCouponKed10 = true;
        validatedDiscountCode = "KED10";
      } else {
        const [referrer] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.referralCode, cleanCode))
          .limit(1);

        // Code exists in DB and is NOT self-referral
        if (referrer && referrer.id !== Number(userId)) {
          validDiscount = true;
          validatedDiscountCode = cleanCode;
        }
      }
    }

    const baseUrl = getAppUrl(req);

    // ─── Price & Title calculation ───────────────────────────────────────────
    let baseAmountCents = 7990; // Default Annual: R$ 79,90
    let planTitle = "KedGo! Pro Anual (1 Ano)";
    let planDescription = "Acesso ilimitado a todas as viagens, roteiros com IA, OCR de recibos e modo 100% offline.";

    if (planType === 'pass') {
      baseAmountCents = 2990; // R$ 29,90
      planTitle = "Passe KedGo! Por Viagem";
      planDescription = "Acesso total aos recursos avançados e inteligentes para 1 viagem.";
    } else if (planType === 'founders_lifetime') {
      baseAmountCents = 14990; // R$ 149,90
      planTitle = "Founders Pass Vitalício — Lote Limitado (200 Vagas)";
      planDescription = "Acesso vitalício irrestrito a todos os recursos atuais e futuros do KedGo! sem mensalidades.";
    }

    // Calculate discount:
    // KED10 = 10% de desconto
    // Referral code = R$ 10,00 de desconto
    let discountCents = 0;
    if (validDiscount) {
      if (isCouponKed10) {
        discountCents = Math.round(baseAmountCents * 0.10);
      } else {
        discountCents = 1000; // R$ 10,00
      }
    }

    const finalAmountCents = Math.max(1000, baseAmountCents - discountCents);

    const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
      currency: "brl",
      unit_amount: finalAmountCents,
      product_data: {
        name: planTitle,
        description: planDescription,
      },
    };

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: priceData,
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail || undefined,
      line_items,
      metadata: {
        userId: String(userId),
        planType,
        itineraryId: itineraryId ? String(itineraryId) : "",
        discountCode: validatedDiscountCode,
        isDiscountApplied: validDiscount ? "true" : "false",
      },
      success_url: `${baseUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}?checkout=cancel`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("[Stripe Create Session Error]", err.message);
    res.status(500).json({ error: "Erro ao iniciar checkout na Stripe: " + err.message });
  }
});

// ─── GET /api/stripe/verify-session/:sessionId ──────────────────────────────
router.get("/verify-session/:sessionId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ error: "Session ID é obrigatório." });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      const userId = Number(session.metadata?.userId);
      const planType = session.metadata?.planType as 'pass' | 'annual' | 'founders_lifetime' | 'pro_lifetime';
      const itineraryId = session.metadata?.itineraryId;

      if (userId && !isNaN(userId) && userId > 0) {
        if (planType === "founders_lifetime" || planType === "pro_lifetime") {
          await db.update(users).set({ 
            planType: "founders_lifetime", 
            isLifetimePro: true 
          }).where(eq(users.id, userId));

          // Increment sold units in founders quota
          await db.update(foundersQuota).set({
            soldUnits: sql`${foundersQuota.soldUnits} + 1`,
            updatedAt: new Date(),
          });
        } else if (planType === "annual") {
          const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          await db.update(users).set({ 
            planType: "annual", 
            isAnnualPro: true, 
            annualExpiresAt: oneYearFromNow 
          }).where(eq(users.id, userId));
        } else if (planType === "pass") {
          await db.update(users).set({ planType: "pass" }).where(eq(users.id, userId));
          if (itineraryId && !isNaN(Number(itineraryId))) {
            await db.update(itineraries).set({ passPurchased: true }).where(eq(itineraries.id, Number(itineraryId)));
          }
        }
        // Ativar a indicação para o usuário que realizou a compra
        await completeReferralForUser(userId);
      }

      return res.json({ verified: true, paid: true, planType, message: "Pagamento verificado com sucesso!" });
    }

    res.json({ verified: true, paid: false, message: "Pagamento ainda pendente." });
  } catch (err: any) {
    console.error("[Stripe Verify Session Error]", err.message);
    res.status(500).json({ error: "Erro ao verificar pagamento: " + err.message });
  }
});

// ─── POST /api/stripe/webhook ────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }
  } catch (err: any) {
    console.error("[Stripe Webhook Signature Error]", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = Number(session.metadata?.userId);
    const planType = session.metadata?.planType as 'pass' | 'annual' | 'founders_lifetime' | 'pro_lifetime';
    const itineraryId = session.metadata?.itineraryId;

    if (userId && !isNaN(userId) && userId > 0) {
      try {
        if (planType === "founders_lifetime" || planType === "pro_lifetime") {
          await db.update(users).set({ 
            planType: "founders_lifetime", 
            isLifetimePro: true 
          }).where(eq(users.id, userId));

          await db.update(foundersQuota).set({
            soldUnits: sql`${foundersQuota.soldUnits} + 1`,
            updatedAt: new Date(),
          });
        } else if (planType === "annual") {
          const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          await db.update(users).set({ 
            planType: "annual", 
            isAnnualPro: true, 
            annualExpiresAt: oneYearFromNow 
          }).where(eq(users.id, userId));
        } else if (planType === "pass") {
          await db.update(users).set({ planType: "pass" }).where(eq(users.id, userId));
          if (itineraryId && !isNaN(Number(itineraryId))) {
            await db.update(itineraries).set({ passPurchased: true }).where(eq(itineraries.id, Number(itineraryId)));
          }
        }
        await completeReferralForUser(userId);
        console.log(`[Stripe Webhook] Plan ${planType} granted to user ID ${userId}`);
      } catch (err: any) {
        console.error("[Stripe Webhook DB Error]", err.message);
      }
    }
  }

  res.json({ received: true });
});

export default router;

