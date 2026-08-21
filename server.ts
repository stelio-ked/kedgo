import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import fs from "fs";

import { db, pool } from "./src/db/index.js";
import { users } from "./src/db/schema.js";

import authRouter from "./src/routes/auth.js";
import devRouter from "./src/routes/dev.js";
import itinerariesRouter from "./src/routes/itineraries.js";
import chatRouter from "./src/routes/chat.js";
import aiRouter from "./src/routes/ai.js";
import adminRouter from "./src/routes/admin.js";
import referralRouter from "./src/routes/referral.js";
import planAccessRouter from "./src/routes/planAccess.js";
import stripeRouter from "./src/routes/stripe.js";

async function startServer() {
  if (pool) {
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'starter';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_pro BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_annual_pro BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_expires_at TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS active_trip_pass_id INTEGER;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP DEFAULT NOW();
        
        ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS pass_purchased BOOLEAN DEFAULT FALSE;
        ALTER TABLE activities ADD COLUMN IF NOT EXISTS type TEXT;

        CREATE TABLE IF NOT EXISTS founders_quota (
          id SERIAL PRIMARY KEY,
          total_limit INTEGER NOT NULL DEFAULT 200,
          sold_units INTEGER NOT NULL DEFAULT 38,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        INSERT INTO founders_quota (id, total_limit, sold_units) 
        VALUES (1, 200, 38)
        ON CONFLICT (id) DO NOTHING;

        CREATE TABLE IF NOT EXISTS referrals (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          referred_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'pending',
          reward_applied BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS referral_invites (
          id SERIAL PRIMARY KEY,
          referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
          invitee_email TEXT NOT NULL,
          referral_code TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT NOW() NOT NULL,
          UNIQUE(referrer_id, invitee_email)
        );

        CREATE TABLE IF NOT EXISTS ai_prompt_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          original_prompt TEXT NOT NULL,
          questions TEXT,
          answers TEXT,
          generated_title TEXT,
          success BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Database connection ready & columns verified.");
    } catch (err) {
      console.error("Error during startup DB check:", err);
    }
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health and Diagnostic Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Servidor online com Postgres suportado!",
    });
  });

  app.get("/api/ping-db", async (req, res) => {
    if (!db) {
      return res.status(503).json({
        error: "DATABASE_URL não configurada no painel de Segredos (Settings > Secrets).",
      });
    }

    try {
      const allUsers = await db.select().from(users).limit(1);
      res.json({
        status: "ok",
        message: "Conectado ao PostgreSQL com sucesso!",
        testQuery: allUsers,
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ status: "error", error: error.message });
    }
  });

  // Mount Modular Routes
  app.use("/api/auth", authRouter);
  app.use("/api/dev", devRouter);
  app.use("/api/itineraries", itinerariesRouter);
  app.use("/api/messages", chatRouter);
  app.use("/api/chat", chatRouter); // inclui SSE em GET /api/chat/stream/:itineraryId

  app.use("/api/gemini", aiRouter);
  app.use("/api", adminRouter);
  app.use("/api/referral", referralRouter);
  app.use("/api/plan", planAccessRouter);
  app.use("/api/stripe", stripeRouter);

  // Servir arquivos de uploads locais
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Serve Frontend / Vite Middleware
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.join(process.cwd(), "dist");
  const distIndexHtml = path.join(distPath, "index.html");

  if (!isProd || !fs.existsSync(distIndexHtml)) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Could not start Vite middleware, falling back to static files:", e);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
          if (fs.existsSync(distIndexHtml)) {
            res.sendFile(distIndexHtml);
          } else {
            res.status(200).send("App is loading...");
          }
        });
      }
    }
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send("Erro ao carregar o aplicativo.");
          }
        });
      } else {
        res.status(200).send("App is initializing...");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
