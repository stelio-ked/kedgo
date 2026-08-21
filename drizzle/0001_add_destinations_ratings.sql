-- Migration: Add 'ratings' column to destinations table
-- Gerado para substituir o ALTER TABLE raw executado no boot do servidor.
-- Execute via: npx drizzle-kit migrate

ALTER TABLE "destinations" ADD COLUMN IF NOT EXISTS "ratings" text;
