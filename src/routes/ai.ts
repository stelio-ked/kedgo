import { Router } from "express";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { Type } from "@google/genai";
import { db } from "../db/index.js";
import { nearbyPlaces, aiPromptLogs } from "../db/schema.js";
import { sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";
import { geminiQuotaMiddleware } from "../middleware/geminiQuota.js";
import { generateContentWithRetry } from "../services/ai.js";
import { inferActivityType } from "../utils.js";

const router = Router();

router.post("/evaluate-prompt", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "O prompt não pode ser vazio." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;

    if (!userApiKey) {
      return res.json({
        isSpecific: false,
        reason: "Olá! Sou a KedIA, sua Arquiteta de Itinerários. Para que seu roteiro fique hiperpersonalizado, selecione ou responda os pontos essenciais abaixo:",
        suggestedQuestions: [
          {
            id: "destination_transport",
            category: "Destino e Logística Básica",
            question: "Qual o destino e como você planeja se locomover (carro, transporte público, a pé/Uber)?",
            options: ["Paris & Roma (Trem & Metrô)", "Tóquio & Kyoto (Trens JR / Metrô)", "Nova York (Metrô & A pé)", "Orlando & Miami (Carro Alugado)", "Gramado & Canela (A pé & Uber)"],
            placeholder: "Ex: Roma e Florença de trem de alta velocidade..."
          },
          {
            id: "duration_dates",
            category: "Destino e Logística Básica",
            question: "Quantos dias exatos durará a viagem e em qual época/mês do ano?",
            options: ["5 dias (Próximas semanas)", "7 dias (Férias de Julho)", "10 dias (Primavera/Outono)", "14 dias ou mais"],
            placeholder: "Ex: 10 dias em outubro de 2026..."
          },
          {
            id: "group_profile",
            category: "Perfil do Grupo",
            question: "Quantas pessoas irão viajar e qual o perfil do grupo?",
            options: ["Casal (Romântico)", "Família com crianças", "Grupo de Amigos", "Solo / Viajante Individual", "Família com Idosos"],
            placeholder: "Ex: Casal com 1 criança de 7 anos..."
          },
          {
            id: "budget_pace",
            category: "Orçamento e Estilo de Viagem",
            question: "Qual a faixa de orçamento e o ritmo desejado para os dias?",
            options: ["Moderado / Confortável (Ritmo Equilibrado)", "Econômico / Mochileiro (Ritmo Intenso)", "Luxo & Exclusivo (Ritmo Relaxado)", "Moderado (Ritmo Intenso - Ver o máximo)"],
            placeholder: "Ex: Orçamento moderado, ritmo relaxado sem correria..."
          },
          {
            id: "interests_mustsee",
            category: "Interesses e Experiências",
            question: "Quais são os pilares prioritários da viagem e há atrações obrigatórias?",
            options: ["Gastronomia & Vinhos + Museus", "Natureza, Praias & Paisagens", "História, Monumentos & Cultura", "Compras, Vida Noturna & Shows", "Parques Temáticos & Diversão"],
            placeholder: "Ex: Foco gastronômico, não abro mão do Museu do Louvre..."
          }
        ]
      });
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Prompt do Usuário: "${prompt}"`,
      config: {
        systemInstruction: `Você é a KedIA, Consultora Sênior de Viagens e Arquiteta de Itinerários hiperpersonalizados.
Sua missão é criar roteiros eficientes, realistas, financeiramente precisos e atualizados.
Antes de gerar o roteiro, avalie rigorosamente o prompt inicial do usuário de acordo com o [FASE 1: DIAGNÓSTICO DO VIAJANTE].

Critérios essenciais para um roteiro completo:
1. Destino e Logística Básica (cidades específicas, duração em dias, meio de transporte planejado).
2. Perfil do Grupo (casal, família, amigos, solo, presença de crianças/idosos).
3. Orçamento e Estilo de Viagem (faixa de custo: Econômico, Moderado ou Luxo; ritmo: Intenso, Equilibrado ou Relaxado).
4. Interesses e Experiências (gastronomia, cultura, natureza, compras, atrações obrigatórias e restrições).

REGRAS RÍGIDAS DE AVALIAÇÃO:
- Se qualquer um dos detalhes acima NÃO estiver 100% explícito no prompt inicial, MARQUE "isSpecific" COMO false!
- Quando "isSpecific" for false, estruture de 3 a 5 perguntas objetivas, gentis e inteligentes em português do Brasil organizadas pelos blocos do Diagnóstico do Viajante.
- Para cada pergunta, ofereça 4 opções práticas e inspiradoras de resposta rápida ("options"), além de um campo "category" e um "placeholder" com exemplo claro.

Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente a este schema:
{
  "isSpecific": boolean,
  "reason": string (resumo acolhedor da KedIA explicando os pontos que serão personalizados com as respostas),
  "suggestedQuestions": [
    {
      "id": string (ex: "destination_transport", "duration_dates", "group_profile", "budget_pace", "interests_mustsee"),
      "category": string (ex: "Destino e Logística Básica", "Perfil do Grupo", "Orçamento e Estilo", "Interesses e Experiências"),
      "question": string,
      "options": string[],
      "placeholder": string
    }
  ]
}`,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (err: any) {
    console.warn("Evaluation fallback triggered:", err?.message || err);
    // Graceful fallback to avoid blocking the user
    res.json({
      isSpecific: false,
      reason: "Olá! Sou a KedIA. Vamos calibrar os detalhes do seu roteiro para ficar perfeito! Responda às opções rápidas abaixo:",
      suggestedQuestions: [
        {
          id: "destination_transport",
          category: "Destino e Logística Básica",
          question: "Para quais cidades você deseja ir e como prefere se locomover?",
          options: ["Paris & Roma (Trem & Metrô)", "Tóquio & Kyoto (Trens JR / Metrô)", "Nova York (Metrô & A pé)", "Orlando & Miami (Carro Alugado)", "Gramado & Canela (A pé & Uber)"],
          placeholder: "Ex: Roma e Florença de trem..."
        },
        {
          id: "duration_dates",
          category: "Destino e Logística Básica",
          question: "Quantos dias de viagem e em que período/mês?",
          options: ["5 dias (Próximas semanas)", "7 dias (Férias de Julho)", "10 dias (Outubro)", "14 dias ou mais"],
          placeholder: "Ex: 7 dias em setembro de 2026..."
        },
        {
          id: "group_profile",
          category: "Perfil do Grupo",
          question: "Qual é o perfil de viajantes do grupo?",
          options: ["Casal (Romântico)", "Família com crianças", "Grupo de Amigos", "Solo / Individual", "Melhor Idade"],
          placeholder: "Ex: Casal..."
        },
        {
          id: "budget_pace",
          category: "Orçamento e Estilo de Viagem",
          question: "Qual o seu orçamento e ritmo desejado?",
          options: ["Moderado / Confortável (Equilibrado)", "Econômico (Intenso - Ver tudo)", "Luxo & Exclusivo (Relaxado)", "Moderado (Relaxado)"],
          placeholder: "Ex: Moderado, ritmo tranquilo..."
        },
        {
          id: "interests_mustsee",
          category: "Interesses e Experiências",
          question: "Quais são os pilares prioritários da viagem?",
          options: ["Gastronomia & Vinhos", "História, Museus & Monumentos", "Natureza, Praias & Trilhas", "Compras & Vida Noturna", "Parques & Lazer"],
          placeholder: "Ex: Bons restaurantes e museus..."
        }
      ]
    });
  }
});

router.post("/optimize-route", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { city, activities } = req.body;
    if (!city) {
      return res.status(400).json({ error: "O nome da cidade é obrigatório." });
    }
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: "Nenhuma atividade fornecida para otimização." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;

    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não está configurada no servidor (Settings > Secrets) nem no navegador." });
    }

    const minimalActivities = activities.map(act => ({
      id: act.id,
      time: act.time || "Não especificado",
      location: act.location || "Sem local específico",
      duration: act.duration || "Não especificada",
      notes: act.notes || "",
      latitude: act.latitude,
      longitude: act.longitude
    }));

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Cidade: "${city}"\nAtividades:\n${JSON.stringify(minimalActivities, null, 2)}`,
      config: {
        systemInstruction: `Você é um guia turístico e especialista em logística urbana de viagens.
O usuário fornecerá o nome de uma cidade de destino e uma lista de atividades que ele planeja realizar em um único dia.
Sua missão é reordenar essa lista de atividades para reduzir o tempo de deslocamento (proximidade geográfica) e criar um itinerário diário que faça sentido lógico das horas (manhã para tarde e noite, tempos de refeição adequados, etc.), considerando horários de funcionamento padrão da cidade.

Regras importantes:
1. Reordene as atividades pela lógica geográfica real da cidade (ex: agrupar atrações próximas, evitar ziguezagues).
2. Proponha novos horários ("time" no formato de 24h, exemplo "09:00", "11:30") progressivos e organizados para cada atividade, cuidando para que uma atividade não se sobreponha à outra considerando sua duração.
3. Se alguma atividade tiver coordenadas (latitude e longitude), leve-as em séria consideração.
4. Adicione opcionalmente uma pequena dica de logística, transporte ou deslocamento no campo "notes" de cada atividade de forma resumida e inteligente (em português do Brasil).
5. O resultado final deve conter TODOS os IDs de atividades originais enviados no mesmo array "optimizedOrderedIds" reordenado. Não adicione atividades fictícias que não estavam na lista.

Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente a este schema:
{
  "optimizedOrderedIds": [
    {
      "id": string (ID original correspondente),
      "time": string (novo horário otimizado ex "09:30"),
      "notes": string (inclui a dica ou preserva o campo notes original com a nova dica útil curta)
    }
  ],
  "explanation": "Breve explicação sobre os benefícios da otimização proposta nesta rota (em português)."
}`,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());

    const optimizedIds = result.optimizedOrderedIds || [];
    const mergedActivities: any[] = [];
    const placedIds = new Set<string>();

    for (const opt of optimizedIds) {
      const original = activities.find(a => a.id === opt.id);
      if (original) {
        mergedActivities.push({
          ...original,
          time: opt.time || original.time,
          notes: opt.notes ? opt.notes : original.notes
        });
        placedIds.add(original.id);
      }
    }

    for (const original of activities) {
      if (!placedIds.has(original.id)) {
        mergedActivities.push(original);
      }
    }

    mergedActivities.sort((a, b) => {
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return timeA.localeCompare(timeB);
    });

    res.json({
      success: true,
      activities: mergedActivities,
      explanation: result.explanation || "Rota reordenada com sucesso!"
    });
  } catch (err: any) {
    console.error("Route optimization error:", err);
    res.status(500).json({ error: "Erro ao otimizar rota com IA: " + err.message });
  }
});

router.post("/generate-itinerary", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt, answers } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "O prompt não pode ser vazio." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;

    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não está configurada no servidor (Settings > Secrets) nem no navegador." });
    }

    let parsedAnswersStr = "";
    if (answers && Object.keys(answers).length > 0) {
      parsedAnswersStr = "\nPerguntas adicionais respondidas:\n" + 
        Object.entries(answers).map(([key, val]) => `- ${key}: ${val}`).join("\n");
    }

    // Extract requested days from prompt or answers
    let requestedDays = 7;
    const promptMatch = prompt.match(/(\d+)\s*dias?/i);
    if (promptMatch) {
      requestedDays = parseInt(promptMatch[1], 10);
    }
    if (answers) {
      for (const val of Object.values(answers)) {
        if (typeof val === "string") {
          const match = val.match(/(\d+)\s*dias?/i);
          if (match) {
            requestedDays = parseInt(match[1], 10);
          }
        }
      }
    }

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Prompt original: "${prompt}"${parsedAnswersStr}`,
      config: {
        systemInstruction: `Você é a KedIA, Consultora Sênior de Viagens e Arquiteta de Itinerários hiperpersonalizados da plataforma KedGo.
Sua missão é executar a [FASE 2: ESTRUTURA DO ROTEIRO FINAL] com máxima excelência, logística fluida, realismo geográfico e financeiro rigoroso (SEM ALUCINAÇÕES DE PREÇO OU DATAS).

🚨 REGRA ABSOLUTA E INEGOCIÁVEL DE DURAÇÃO (OBRIGATÓRIO):
- O usuário especificou EXATAMENTE ${requestedDays} DIAS de viagem!
- O total de dias gerados somados em todos os destinos (no array "days" de cada destino, totalizando entre todos os destinos) DEVE SER EXATAMENTE ${requestedDays} DIAS (Do Dia 1 até o Dia ${requestedDays}, numerados sequencialmente de 1 a ${requestedDays}).
- NUNCA retorne menos dias do que o solicitado (ex: se pediu 10 dias, retorne rigorosamente 10 dias de programação completa).
- Se houver múltiplas cidades (ex: Dubrovnik, Split, Zagreb), divida os ${requestedDays} dias proporcionalmente entre elas (ex: 3 dias Dubrovnik, 3 dias Split, 4 dias Zagreb).

DIRETRIZES DA KEDIA PARA O ROTEIRO:

1. DURAÇÃO EXATA E QUANTIDADE DE DIAS:
   - Identifique a quantidade exata de dias informada no prompt ou no diagnóstico (ex: "7 dias", "10 dias").
   - O array de dias "days" DEVE conter exatamente essa quantidade de dias somados entre todos os destinos (do Dia 1 ao último dia, sem saltar números).
   - Se o usuário especificou época/datas (ex: "julho de 2026"), calibre as datas em startDate e endDate nos destinos.

2. LOGÍSTICA DE BASES E AGRUPAMENTO GEOGRÁFICO:
   - Organize as atividades de cada dia por proximidade geográfica para eliminar ziguezagues e otimizar deslocamentos.
   - Para viagens de 7+ dias com múltiplos destinos, divida harmonicamente entre as cidades no array "destinations".
   - Cada dia deve ter divisão lógica das atividades entre MANHÃ (manhã/início do dia), TARDE (almoço e passeios da tarde) e NOITE (jantar e atrações noturnas).

3. CLASSIFICAÇÃO OBRIGATÓRIA E INTELIGENTE DE CADA ATIVIDADE (CAMPO "type"):
   - TODA e qualquer atividade no array "activities" DEVE ter o campo "type" preenchido com EXATAMENTE um destes 5 valores:
     * "tour": para TODOS os passeios turísticos, atrações, museus, monumentos, caminhadas históricas, mirantes, parques, praças, praias, castelos, templos, igrejas/catedrais, tours guiados, espetáculos, shoppings/compras e pontos turísticos. NUNCA cadastre atrações turísticas como "other"!
     * "dinner": para TODAS as paradas gastronômicas, almoços, jantares, restaurantes, cafés, bistrôs, confeitarias, bares, pubs, padarias, degustações e experiências culinárias. NUNCA cadastre restaurantes ou paradas para comer como "other"!
     * "flight": para voos, traslados/transfers, viagens de trem, metrô, balsas/ferries, ônibus rodoviários, retirada/devolução de carro alugado e deslocamentos logísticos.
     * "hotel": para momentos de check-in, check-out, chegada ao hotel ou acomodação/hospedagem.
     * "other": APENAS E EXCLUSIVAMENTE para tempo livre/descanso não programado (ex: "Tarde livre para compras pessoais" ou "Descanso no hotel").

4. GASTRONOMIA REAL E RECOMENDAÇÕES PRÓXIMAS:
   - Para cada dia, inclua pelo menos 1 a 2 opções gastronômicas reais próximas às atrações visitadas (sempre com type: "dinner").
   - No campo "notes" da atividade de almoço/jantar, detalhe:
     * Nome do restaurante / bistrô
     * Tipo de culinária
     * Faixa de preço (ex: $$ Econômico, $$$ Moderado ou $$$$ Alta Gastronomia)
     * Se exige reserva antecipada.

5. DICAS DE INSIDER (1 a 3 POR DIA):
   - No campo "notes" das atividades principais de cada dia, inclua dicas valiosas de insider:
     * Melhor horário para fotos com luz ideal e sem multidões
     * Como furar ou evitar filas (ex: compra online de ingresso, entrada prioritária)
     * Dicas de vestimenta (ex: ombros cobertos em templos/igrejas) ou passes de transporte ideais.

6. LOGÍSTICA, CHECKLIST, APPS E ALERTAS (no array "generalTips"):
   - Inclua dicas estruturadas categorizadas:
     * "Ingressos Antecipados": lista de atrações que exigem compra prévia obrigatória.
     * "Aplicativos Recomendados": apps locais essenciais (transporte, mapas offline, delivery, câmbio).
     * "Segurança & Golpes Comuns": pegadinhas turísticas comuns no destino e como evitá-las.
     * "Clima & Etiqueta": dicas de vestimenta, moeda, gorjetas e feriados que impactam o roteiro.

7. ESTIMATIVAS FINANCEIRAS E PREÇOS REAIS:
   - Valores honestos no array "costs" de acordo com o padrão escolhido (Econômico, Moderado ou Luxo).
   - Não infle preços arbitrariamente.

Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente a este schema:
{
  "destinations": [
    {
      "id": string (ex: "dest-1"),
      "city": string,
      "state": string,
      "country": string,
      "dates": string (ex: "01 out. - 07 out."),
      "startDate": string (formato YYYY-MM-DD, ex: 2026-10-01),
      "endDate": string (formato YYYY-MM-DD, ex: 2026-10-07),
      "hotelName": string,
      "hotelAddress": string,
      "checkInTime": string (ex: "15:00"),
      "checkOutTime": string (ex: "11:00"),
      "notes": string (estratégia da base de hospedagem e comodidades),
      "days": [
        {
          "id": string (ex: "day-1"),
          "dayNumber": number (numeração contínua de 1 até o total de dias),
          "dateStr": string (ex: "Quinta, 01 de Outubro"),
          "title": string (ex: "Manhã Histórica + Tarde no Rio Sena e Gastronomia"),
          "activities": [
            {
              "id": string (ex: "act-1"),
              "time": string (formato 24h, ex: "09:00"),
              "type": "tour" | "dinner" | "flight" | "hotel" | "other" (CLASSIFICAÇÃO OBRIGATÓRIA: use "tour" para atrações/museus/passeios/pontos turísticos, "dinner" para restaurantes/cafés/refeições, "flight" para voos/trens/transfers, "hotel" para check-in/hospedagem, "other" para tempo livre),
              "location": string,
              "duration": string (ex: "2h"),
              "cost": string (ex: "Gratuito" ou "€ 17 / R$ 95"),
              "mapsQuery": string (termo para busca exata no Google Maps),
              "notes": string (detalhes da atividade + Dica de Insider ou Recomendação Gastronômica com tipo de culinária e faixa de preço)
            }
          ]
        }
      ]
    }
  ],
  "costs": [
    {
      "id": string (ex: "cost-1"),
      "category": "hotel" | "flight" | "car" | "activity" | "other",
      "description": string,
      "totalCostBRL": number,
      "status": "Pago" | "Pgto no local" | "Falta pagar"
    }
  ],
  "flights": [
    {
      "id": string (ex: "flight-1"),
      "airline": string,
      "flightCode": string,
      "departureCity": string,
      "departureCode": string,
      "departureTime": string,
      "arrivalCity": string,
      "arrivalCode": string,
      "arrivalTime": string,
      "duration": string,
      "dateStr": string (YYYY-MM-DD),
      "status": "Confirmado"
    }
  ],
  "generalTips": [
    {
      "id": string (ex: "tip-1"),
      "category": string (ex: "Ingressos Antecipados", "Aplicativos Recomendados", "Segurança & Golpes Comuns", "Clima & Etiqueta"),
      "title": string,
      "content": string
    }
  ]
}`,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());

    // Safeguard: Ensure total days generated matches requestedDays
    if (result && Array.isArray(result.destinations) && result.destinations.length > 0) {
      let currentTotalDays = 0;
      result.destinations.forEach((dest: any) => {
        if (Array.isArray(dest.days)) currentTotalDays += dest.days.length;
      });

      if (currentTotalDays < requestedDays && currentTotalDays > 0) {
        const lastDest = result.destinations[result.destinations.length - 1];
        if (lastDest && Array.isArray(lastDest.days) && lastDest.days.length > 0) {
          const lastDay = lastDest.days[lastDest.days.length - 1];
          let nextDayNum = currentTotalDays + 1;
          while (currentTotalDays < requestedDays) {
            const clonedDay = JSON.parse(JSON.stringify(lastDay));
            clonedDay.id = `day-${nextDayNum}-${Date.now()}`;
            clonedDay.dayNumber = nextDayNum;
            clonedDay.title = `Dia de Exploração Completa / Experiências Locais em ${lastDest.city} (Dia ${nextDayNum})`;
            lastDest.days.push(clonedDay);
            currentTotalDays++;
            nextDayNum++;
          }
        }
      }
    }

    // Sanitize and ensure every activity has a proper, valid type classification
    if (result && Array.isArray(result.destinations)) {
      result.destinations.forEach((dest: any) => {
        if (Array.isArray(dest.days)) {
          dest.days.forEach((day: any) => {
            if (Array.isArray(day.activities)) {
              day.activities.forEach((act: any) => {
                const validTypes = ["tour", "dinner", "flight", "hotel", "other"];
                if (!act.type || !validTypes.includes(act.type) || act.type === "other") {
                  act.type = inferActivityType(act.location, act.notes);
                }
              });
            }
          });
        }
      });
    }

    // Persist this generation session for template reuse
    try {
      const userId = (req as AuthRequest).user?.id ?? null;
      const city = result?.destinations?.[0]?.city || "";
      const country = result?.destinations?.[0]?.country || "";
      const dates = result?.destinations?.[0]?.dates || "";
      const generatedTitle = `${city}${country ? `, ${country}` : ""} ${dates ? `(${dates})` : ""}`.trim();

      await db.insert(aiPromptLogs).values({
        userId,
        originalPrompt: prompt,
        questions: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        answers: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        generatedTitle: generatedTitle || null,
        success: true,
      });
    } catch (logErr) {
      console.warn("Failed to save AI prompt log:", logErr);
    }

    res.json(result);
  } catch (err: any) {
    console.error("Generation error:", err);
    res.status(500).json({ error: "Erro ao gerar roteiro estruturado com IA: " + err.message });
  }
});

// Returns up to 4 random successful AI generation prompts to power the "quick templates" UI
router.get("/prompt-templates", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: aiPromptLogs.id,
        originalPrompt: aiPromptLogs.originalPrompt,
        generatedTitle: aiPromptLogs.generatedTitle,
      })
      .from(aiPromptLogs)
      .where(eq(aiPromptLogs.success, true))
      .orderBy(sql`RANDOM()`)
      .limit(4);

    // Build label from generatedTitle or truncate prompt
    const templates = rows.map((row) => ({
      label: row.generatedTitle || row.originalPrompt.slice(0, 40),
      text: row.originalPrompt,
    }));

    res.json({ templates });
  } catch (err: any) {
    console.error("prompt-templates error:", err);
    res.json({ templates: [] });
  }
});

router.post("/ocr-flight", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "O arquivo de imagem não pode ser vazio." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não configurada no servidor nem no navegador." });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Analise cuidadosamente este bilhete de voo ou confirmação de embarque.
Extraia todas as informações dos trechos de voo (segmentos de voo) presentes no documento.
Extraia campos cruciais como airline, flightCode, departureCity, departureCode, departureTime, arrivalCity, arrivalCode, arrivalTime, duration, dateStr, arrivalDateStr, gate, locator, passengers, seats, passengersList.
Retorne estritamente um JSON que contém um array de voos.`,
    };

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Você é um especialista em OCR e extração estruturada de dados de cartões de embarque, recibos de viagem e de passagens aéreas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  airline: { type: Type.STRING },
                  flightCode: { type: Type.STRING },
                  departureCity: { type: Type.STRING },
                  departureCode: { type: Type.STRING },
                  departureTime: { type: Type.STRING },
                  arrivalCity: { type: Type.STRING },
                  arrivalCode: { type: Type.STRING },
                  arrivalTime: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  dateStr: { type: Type.STRING },
                  arrivalDateStr: { type: Type.STRING },
                  gate: { type: Type.STRING },
                  locator: { type: Type.STRING },
                  passengers: { type: Type.STRING },
                  seats: { type: Type.STRING },
                  passengersList: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        seat: { type: Type.STRING },
                      },
                      required: ["name"],
                    },
                  },
                },
                required: [
                  "airline",
                  "flightCode",
                  "departureCity",
                  "departureCode",
                  "departureTime",
                  "arrivalCity",
                  "arrivalCode",
                  "arrivalTime",
                  "dateStr",
                ],
              },
            },
          },
          required: ["flights"],
        },
        temperature: 0.1,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (err: any) {
    console.error("Flight OCR Scan error:", err);
    res.status(500).json({ error: "Erro ao escanear bilhete com IA OCR: " + err.message });
  }
});

router.post("/ocr-receipt", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "O arquivo de imagem não pode ser vazio." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não configurada no servidor nem no navegador." });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: imageBase64,
      },
    };

    const textPart = {
      text: `Analise cuidadosamente esta nota fiscal, cupom fiscal, recibo de viagem ou comanda de restaurante.
Faça a transcrição dos itens principais e traduza tudo para o português.
Extraia: description, category, totalCostBRL (number), notes.
Retorne estritamente um JSON que contém estes campos.`,
    };

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: "Você é um especialista em OCR, tradução de idiomas e extração estruturada de dados de cupons fiscais, recibos, despesas de viagem e comandas de restaurante de todo o mundo.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            totalCostBRL: { type: Type.NUMBER },
            notes: { type: Type.STRING },
          },
          required: ["description", "category", "totalCostBRL", "notes"],
        },
        temperature: 0.1,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (err: any) {
    console.error("Receipt OCR Scan error:", err);
    res.status(500).json({ error: "Erro ao escanear comanda com IA OCR: " + err.message });
  }
});

router.post("/monitor-flight", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { flightCode, airline, departureCode, arrivalCode, currentStatus, forceCheckInOpen } = req.body;
    
    if (!flightCode) {
      return res.status(400).json({ error: "O código do voo é obrigatório." });
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não configurada no servidor nem no navegador." });
    }

    const promptText = `Você é um monitor automático inteligente integrado a um app de viagens. Seu objetivo é simular e retornar de forma realista/criativa o status de monitoramento do voo.
Voo de Referência: Voo ${flightCode} operado por ${airline || "N/A"} saindo de ${departureCode || "N/A"} com destino a ${arrivalCode || "N/A"}.
O status atual cadastrado na viagem é: "${currentStatus || "Confirmado"}".

As opções de status válidas são estritamente: "Confirmado", "Atrasado", "Cancelado", "Embarque", "Check-in aberto" ou "Finalizado".
${forceCheckInOpen ? "IMPORTANTE: Você DEVE OBRIGATORIAMENTE mudar o status do voo para 'Check-in aberto'." : ""}

Forneça a saída estritamente em formato JSON.`;

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: { parts: [{ text: promptText }] },
      config: {
        systemInstruction: "Você é um robô perito de status de aeroporto e voos simulados do assistente de viagem.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              description: "Novo status do voo." 
            },
            previousStatus: { type: Type.STRING },
            statusChanged: { type: Type.BOOLEAN },
            gate: { type: Type.STRING },
            message: { type: Type.STRING },
          },
          required: ["status", "previousStatus", "statusChanged", "message"],
        },
        temperature: 0.7,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());
    res.json(result);
  } catch (err: any) {
    console.error("Flight Monitoring error:", err);
    res.status(500).json({ error: "Erro ao monitorar status do voo com Gemini: " + err.message });
  }
});

router.post("/nearby-search", authMiddleware, geminiQuotaMiddleware, async (req: AuthRequest, res) => {
  try {
    const { itineraryId, destinationId, hotelName, hotelAddress, city, refresh } = req.body;
    
    if (!itineraryId || !destinationId) {
      return res.status(400).json({ error: "O ID do roteiro e ID do destino são obrigatórios." });
    }

    const hName = hotelName || "";
    const hAddr = hotelAddress || hName || "";
    const cityName = city || "";

    if (!hAddr) {
      return res.status(400).json({ error: "É necessário que a hospedagem tenha nome ou endereço preenchido para realizar a busca das proximidades." });
    }

    if (!refresh) {
      const cached = await db.select().from(nearbyPlaces).where(eq(nearbyPlaces.destinationId, destinationId));
      if (cached && cached.length > 0) {
        return res.json({ success: true, places: cached, cached: true });
      }
    }

    const userApiKey = (req.headers["x-gemini-api-key"] as string)?.trim() || process.env.GEMINI_API_KEY;
    if (!userApiKey) {
      return res.status(503).json({ error: "Chave Gemini API não configurada no servidor nem no navegador." });
    }

    const promptText = `Faça uma pesquisa detalhada de locais reais próximos ao ponto hoteleiro: ${hName}, ${hAddr}, ${cityName}.
Retorne 3 categorias: Food, Medical, Services.
Responda apenas em formato JSON Array.`;

    let text = "[]";
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3.7-flash",
        contents: { parts: [{ text: promptText }] },
        config: {
          systemInstruction: "Você é um crawler de inteligência geográfica que pesquisa dados de locais reais no Google Search para viajantes.",
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                rating: { type: Type.STRING },
                distance: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER },
                mapsLink: { type: Type.STRING }
              },
              required: ["category", "name", "address", "distance"]
            }
          },
          temperature: 0.3,
        },
      }, userApiKey);
      text = response.text || "[]";
    } catch (apiError: any) {
      text = JSON.stringify([
        { category: "Food", name: "Restaurante e Bistrô Local", address: "Ao redor do centro", rating: "4.5", distance: "200m a pé" },
        { category: "Food", name: "Mercado Principal", address: "Av. Central, 50", rating: "4.2", distance: "350m a pé" },
        { category: "Medical", name: "Farmácia 24h", address: "Rua do Comércio", rating: "4.0", distance: "450m a pé" },
        { category: "Services", name: "Caixa Eletrônico", address: "Dentro da Conveniência", rating: "4.5", distance: "350m a pé" }
      ]);
    }

    let parsedPlaces = [];
    try {
      parsedPlaces = JSON.parse(text.trim());
    } catch (e) {
      throw new Error("Resposta da IA estruturada incorretamente.");
    }

    if (Array.isArray(parsedPlaces)) {
      await db.delete(nearbyPlaces).where(eq(nearbyPlaces.destinationId, destinationId));

      for (const p of parsedPlaces) {
        if (!p.name) continue;
        const finalMapsLink = p.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${cityName || hAddr}`)}`;
        
        await db.insert(nearbyPlaces).values({
          id: crypto.randomUUID(),
          itineraryId: Number(itineraryId),
          destinationId: String(destinationId),
          category: p.category || "pontos_importantes",
          name: p.name,
          address: p.address || null,
          rating: p.rating ? String(p.rating) : null,
          distance: p.distance || null,
          latitude: p.latitude ? parseFloat(String(p.latitude)) : null,
          longitude: p.longitude ? parseFloat(String(p.longitude)) : null,
          mapsLink: finalMapsLink,
        });
      }
    }

    const results = await db.select().from(nearbyPlaces).where(eq(nearbyPlaces.destinationId, destinationId));
    res.json({ success: true, places: results, cached: false });
  } catch (err: any) {
    console.error("Nearby Search AI error:", err);
    res.status(500).json({ error: "Erro ao varrer arredores com IA: " + err.message });
  }
});

router.get("/nearby-places", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { destinationId } = req.query;
    if (!destinationId) {
      return res.status(400).json({ error: "O destinationId é obrigatório" });
    }

    const results = await db.select().from(nearbyPlaces).where(eq(nearbyPlaces.destinationId, String(destinationId)));
    res.json({ places: results });
  } catch (err: any) {
    console.error("Get nearby places error:", err);
    res.status(500).json({ error: "Erro ao recuperar locais próximos salvos: " + err.message });
  }
});

router.post("/save-places", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { itineraryId, destinationId, places } = req.body;
    if (!destinationId || !places || !Array.isArray(places)) {
      return res.status(400).json({ error: "Parâmetros inválidos para salvar locais." });
    }

    await db.delete(nearbyPlaces).where(eq(nearbyPlaces.destinationId, String(destinationId)));

    for (const p of places) {
      if (!p.name) continue;
      const finalMapsLink = p.mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${p.address || ""}`)}`;
      await db.insert(nearbyPlaces).values({
        id: crypto.randomUUID(),
        itineraryId: Number(itineraryId) || 0,
        destinationId: String(destinationId),
        category: p.category || "pontos_importantes",
        name: p.name,
        address: p.address || null,
        rating: p.rating ? String(p.rating) : null,
        distance: p.distance || null,
        latitude: p.latitude ? parseFloat(String(p.latitude)) : null,
        longitude: p.longitude ? parseFloat(String(p.longitude)) : null,
        mapsLink: finalMapsLink,
      });
    }

    const results = await db.select().from(nearbyPlaces).where(eq(nearbyPlaces.destinationId, String(destinationId)));
    res.json({ success: true, places: results });
  } catch (err: any) {
    console.error("Save places error:", err);
    res.status(500).json({ error: "Erro ao salvar locais no banco: " + err.message });
  }
});

export default router;
