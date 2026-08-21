import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_test_")) {
  console.error("❌ ERRO: STRIPE_SECRET_KEY deve começar com sk_test_");
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function testEndToEnd() {
  console.log("==================================================");
  console.log("🚀 TESTANDO INTEGRAÇÃO STRIPE NO MODO SANDBOX (TESTE)");
  console.log("==================================================\n");

  // Teste 1: Passe KedGo!
  try {
    console.log("1️⃣ Criando Checkout Session para: PASSE KEDGO! (R$ 29,90)...");
    const sessionPass = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: 2990,
            product_data: {
              name: "Passe KedGo!",
              description: "Acesso total aos recursos inteligentes para 1 viagem.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: "1",
        planType: "pass",
      },
      success_url: "https://crm-ked-kedgo.crl0uj.easypanel.host?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://crm-ked-kedgo.crl0uj.easypanel.host?checkout=cancel",
    });

    console.log("   ✅ Sessão criada com sucesso!");
    console.log("   🆔 Session ID:", sessionPass.id);
    console.log("   🔗 URL para pagar com cartão de teste (4242 4242 4242 4242):");
    console.log("   ->", sessionPass.url, "\n");
  } catch (err: any) {
    console.error("   ❌ Erro ao criar sessão do Passe KedGo!:", err.message, "\n");
  }

  // Teste 2: KedGo! Pro Vitalício
  try {
    console.log("2️⃣ Criando Checkout Session para: KEDGO! PRO VITALÍCIO (R$ 149,90)...");
    const sessionPro = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "brl",
            unit_amount: 14990,
            product_data: {
              name: "KedGo! Pro Vitalício",
              description: "Acesso vitalício e ilimitado a todos os recursos e roteiros com IA.",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: "1",
        planType: "pro_lifetime",
      },
      success_url: "https://crm-ked-kedgo.crl0uj.easypanel.host?checkout=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://crm-ked-kedgo.crl0uj.easypanel.host?checkout=cancel",
    });

    console.log("   ✅ Sessão criada com sucesso!");
    console.log("   🆔 Session ID:", sessionPro.id);
    console.log("   🔗 URL para pagar com cartão de teste (4242 4242 4242 4242):");
    console.log("   ->", sessionPro.url, "\n");
  } catch (err: any) {
    console.error("   ❌ Erro ao criar sessão do Pro Vitalício:", err.message, "\n");
  }

  console.log("==================================================");
  console.log("✨ Teste de integração de API finalizado!");
  console.log("==================================================");
}

testEndToEnd();
