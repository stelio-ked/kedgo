import { Router } from "express";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, itineraries } from "../db/schema.js";
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

// ─── POST /api/stripe/create-checkout-session ───────────────────────────────
router.post("/create-checkout-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId && userId !== 0) {
      return res.status(401).json({ error: "Não autenticado." });
    }

    const { plan, itineraryId, discountCode } = req.body; // 'pass' | 'pro_lifetime'
    const planType: 'pass' | 'pro_lifetime' = plan === 'pro_lifetime' ? 'pro_lifetime' : 'pass';

    // ─── Anti-Fraud / Server-Side Discount Validation ────────────────────────
    let validDiscount = false;
    let validatedDiscountCode = "";

    if (discountCode && typeof discountCode === "string") {
      const cleanCode = discountCode.trim().toUpperCase();
      if (cleanCode === "KED10") {
        validDiscount = true;
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
    const envPriceOrProd = planType === 'pro_lifetime'
      ? (process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PROD_PRO || "prod_V3nnOmP0jeKhV5")
      : (process.env.STRIPE_PRICE_PASS || process.env.STRIPE_PROD_PASS || "prod_V3nlXH3Awlz9LA");

    // Calculate line items
    let line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (envPriceOrProd && envPriceOrProd.startsWith('price_')) {
      line_items = [
        {
          price: envPriceOrProd,
          quantity: 1,
        },
      ];
    } else {
      const baseAmountCents = planType === 'pro_lifetime' ? 14990 : 2990;
      const discountCents = validDiscount ? 1000 : 0;
      const finalAmountCents = Math.max(1000, baseAmountCents - discountCents);

      const priceData: Stripe.Checkout.SessionCreateParams.LineItem.PriceData = {
        currency: "brl",
        unit_amount: finalAmountCents,
        product_data: {
          name: planType === 'pro_lifetime' ? "KedGo! Pro Vitalício" : "Passe KedGo!",
          description: planType === 'pro_lifetime'
            ? "Acesso vitalício e ilimitado a todos os recursos e roteiros com IA."
            : "Acesso total aos recursos inteligentes para 1 viagem.",
        },
      };

      if (envPriceOrProd && envPriceOrProd.startsWith('prod_')) {
        priceData.product = envPriceOrProd;
        delete priceData.product_data;
      }

      line_items = [
        {
          price_data: priceData,
          quantity: 1,
        },
      ];
    }

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
      const planType = session.metadata?.planType as 'pass' | 'pro_lifetime';
      const itineraryId = session.metadata?.itineraryId;

      if (userId && !isNaN(userId) && userId > 0) {
        if (planType === "pro_lifetime") {
          await db.update(users).set({ planType: "pro_lifetime", isLifetimePro: true }).where(eq(users.id, userId));
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
    const planType = session.metadata?.planType as 'pass' | 'pro_lifetime';
    const itineraryId = session.metadata?.itineraryId;

    if (userId && !isNaN(userId) && userId > 0) {
      try {
        if (planType === "pro_lifetime") {
          await db.update(users).set({ planType: "pro_lifetime", isLifetimePro: true }).where(eq(users.id, userId));
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
