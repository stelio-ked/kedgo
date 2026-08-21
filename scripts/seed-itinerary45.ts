/**
 * Script de Seed — Itinerário 45 (Copa EUA 🇺🇸 2026)
 *
 * ⚠️  Este script contém dados pessoais reais (nomes e e-mails dos viajantes).
 *     Execute MANUALMENTE quando necessário, nunca automaticamente no boot.
 *
 * Como executar:
 *   npx tsx scripts/seed-itinerary45.ts
 *
 * Pré-requisito: DATABASE_URL configurada no ambiente ou no .env local.
 */

import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db/index.js";
import {
  itineraries,
  travelers,
  destinations,
  costs,
  costCategories,
  documents,
  flights,
  flightPassengers,
  generalTips,
} from "../src/db/schema.js";
import {
  INITIAL_DESTINATIONS,
  INITIAL_COSTS,
  INITIAL_COST_CATEGORIES,
  INITIAL_FLIGHTS,
  INITIAL_DOCUMENTS,
  INITIAL_TIPS,
} from "../src/data/defaultData.js";
import { saveItineraryData } from "../src/services/itineraryStorage.js";

const ITINERARY_ID = 45;

async function seed() {
  if (!db) {
    console.error("❌ DATABASE_URL não configurada. Abortando.");
    process.exit(1);
  }

  console.log(`🔍 Verificando itinerário ${ITINERARY_ID}...`);

  const itin = await db.query.itineraries.findFirst({
    where: eq(itineraries.id, ITINERARY_ID),
    with: { travelers: true, destinations: true, flights: true },
  });

  if (!itin) {
    console.error(`❌ Itinerário ${ITINERARY_ID} não existe no banco. Crie-o primeiro.`);
    process.exit(1);
  }

  const needsRestore =
    !itin.travelers ||
    itin.travelers.length < 8 ||
    !itin.destinations ||
    itin.destinations.length < 2 ||
    !itin.flights ||
    itin.flights.length < 10;

  if (!needsRestore) {
    console.log(`✅ Itinerário ${ITINERARY_ID} já está completo (${itin.travelers.length} viajantes, ${itin.destinations.length} destinos, ${itin.flights.length} voos). Nada a fazer.`);
    process.exit(0);
  }

  console.log("🔄 Restaurando roteiro completo da Copa EUA 2026 (viajantes, destinos e voos)...");

  // ⚠️ DADOS PESSOAIS — Manter fora do servidor; usar somente neste seed manual.
  const travelersPayload = [
    { id: "t-1", name: "Theo Ked",         role: "Organizador", email: "theoked25@gmail.com" },
    { id: "t-2", name: "Karoll Ked",        role: "Viajante",    email: "karollineferreiraked@gmail.com" },
    { id: "t-3", name: "Gabi Ked",          role: "Viajante",    email: "gabiferreiraked@gmail.com" },
    { id: "t-4", name: "Lelê Ked",          role: "Viajante",    email: "leticiaferreiraked@gmail.com" },
    { id: "t-5", name: "César Ferreira",    role: "Viajante",    email: "carloscesarferreira53@gmail.com" },
    { id: "t-6", name: "Rogéria Ferreira",  role: "Viajante",    email: "rogeriaprof@gmail.com" },
    { id: "t-7", name: "Fabrício Ferreira", role: "Viajante",    email: "fabricioferrmed@hotmail.com" },
    { id: "t-8", name: "Neusa Chucre",      role: "Viajante",    email: "neusachucre2@gmail.com" },
  ];

  const restorationPayload = {
    travelers: travelersPayload,
    destinations: INITIAL_DESTINATIONS,
    costs: INITIAL_COSTS,
    costCategories: INITIAL_COST_CATEGORIES,
    flights: INITIAL_FLIGHTS,
    documents: INITIAL_DOCUMENTS,
    generalTips: INITIAL_TIPS,
  };

  await db.transaction(async (tx) => {
    // Limpar dados existentes antes de restaurar
    const existingFlights = await tx.select().from(flights).where(eq(flights.itineraryId, ITINERARY_ID));
    if (existingFlights.length > 0) {
      const flightIds = existingFlights.map((f) => f.id);
      await tx.delete(flightPassengers).where(inArray(flightPassengers.flightId, flightIds));
    }
    await tx.delete(travelers).where(eq(travelers.itineraryId, ITINERARY_ID));
    await tx.delete(destinations).where(eq(destinations.itineraryId, ITINERARY_ID));
    await tx.delete(costs).where(eq(costs.itineraryId, ITINERARY_ID));
    await tx.delete(costCategories).where(eq(costCategories.itineraryId, ITINERARY_ID));
    await tx.delete(documents).where(eq(documents.itineraryId, ITINERARY_ID));
    await tx.delete(flights).where(eq(flights.itineraryId, ITINERARY_ID));
    await tx.delete(generalTips).where(eq(generalTips.itineraryId, ITINERARY_ID));

    await saveItineraryData(tx, ITINERARY_ID, restorationPayload);
  });

  console.log(`✅ Itinerário ${ITINERARY_ID} restaurado com sucesso — ${travelersPayload.length} viajantes, destinos e 13 voos!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
