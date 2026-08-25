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
        reason: "Olá! Sou a KedIA, sua Arquiteta de Itinerários. Para calibrarmos perfeitamente a logística, origem, datas e ritmo da sua viagem, responda aos pontos rápidos abaixo:",
        suggestedQuestions: [
          {
            id: "origin_departure",
            category: "Origem e Ponto de Partida",
            question: "De qual cidade você irá partir (origem) e já tem aeroporto ou meio de preferência?",
            options: ["São Paulo (GRU / CGH)", "Rio de Janeiro (GIG / SDU)", "Belo Horizonte / Brasília", "Lisboa / Porto (Portugal)", "Outra cidade / Sem voo"],
            placeholder: "Ex: Saindo de São Paulo (Guarulhos)..."
          },
          {
            id: "duration_dates",
            category: "Datas e Duração Exata",
            question: "Quantos dias exatos durará a viagem e qual a data ou mês de partida?",
            options: ["15 dias (Roteiro Completo)", "10 dias", "7 dias (1 Semana)", "5 dias", "20 dias ou mais"],
            placeholder: "Ex: 15 dias a partir de 01 de Outubro de 2026..."
          },
          {
            id: "destination_transport",
            category: "Destinos e Deslocamento",
            question: "Quais cidades/regiões você deseja conhecer e como prefere se deslocar?",
            options: ["Marrakech e Cidades Históricas (Transfer & Trem)", "Paris & Roma (Trem de Alta Velocidade)", "Tóquio & Kyoto (Trens JR & Metrô)", "Orlando & Miami (Carro Alugado)", "Costa e Praias (Carro / Barco)"],
            placeholder: "Ex: Marrakech, Chefchaouen e deserto com transfer privativo..."
          },
          {
            id: "group_profile",
            category: "Perfil do Grupo",
            question: "Quantas pessoas irão viajar e qual o perfil do grupo?",
            options: ["Casal (Romântico)", "Família com crianças", "Grupo de Amigos", "Solo / Viajante Individual", "Melhor Idade"],
            placeholder: "Ex: Casal em lua de mel..."
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
            options: ["Gastronomia & Culinária Local + Museus", "Natureza, Deserto & Paisagens", "História, Monumentos & Cultura", "Compras, Mercados & Vida Noturna", "Parques & Aventura"],
            placeholder: "Ex: Foco gastronômico, souks tradicionais e noite no deserto..."
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
Antes de gerar o roteiro, avalie o prompt inicial do usuário de acordo com o [FASE 1: DIAGNÓSTICO DO VIAJANTE].

Critérios essenciais para um roteiro completo:
1. Origem de Partida e Transporte (cidade de onde o viajante vai sair, aeroporto, como vai se locomover).
2. Destinos e Duração Exata (duração em dias, datas/mês de partida, cidades e bases de hospedagem).
3. Perfil do Grupo (casal, família, amigos, solo, presença de crianças/idosos).
4. Orçamento e Estilo de Viagem (faixa de custo: Econômico, Moderado ou Luxo; ritmo: Intenso, Equilibrado ou Relaxado).
5. Interesses e Experiências (gastronomia, cultura, natureza, compras, atrações obrigatórias e restrições).

REGRAS RÍGIDAS DE AVALIAÇÃO:
- Sempre retorne "isSpecific": false para abrir a Fase 1 de Diagnóstico.
- Estruture de 4 a 6 perguntas objetivas, gentis e inteligentes em português do Brasil organizadas pelos blocos do Diagnóstico do Viajante, incluindo SEMPRE:
  * Origem de partida (cidade de saída para voos e logística).
  * Datas de início e duração exata em dias.
  * Cidades e locomoção.
  * Perfil e orçamento.
- Para cada pergunta, ofereça 4 a 5 opções práticas e inspiradoras de resposta rápida ("options"), além de um campo "category" e um "placeholder" com exemplo claro.

Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente a este schema:
{
  "isSpecific": boolean,
  "reason": string (resumo acolhedor da KedIA explicando os pontos que serão personalizados com as respostas),
  "suggestedQuestions": [
    {
      "id": string (ex: "origin_departure", "duration_dates", "destination_transport", "group_profile", "budget_pace", "interests_mustsee"),
      "category": string (ex: "Origem e Ponto de Partida", "Datas e Duração Exata", "Destinos e Deslocamento", "Perfil do Grupo", "Orçamento e Estilo", "Interesses e Experiências"),
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
          id: "origin_departure",
          category: "Origem e Ponto de Partida",
          question: "De qual cidade você irá partir?",
          options: ["São Paulo (GRU)", "Rio de Janeiro (GIG)", "Belo Horizonte / Brasília", "Lisboa / Porto", "Outra cidade"],
          placeholder: "Ex: Saindo de São Paulo..."
        },
        {
          id: "duration_dates",
          category: "Datas e Duração Exata",
          question: "Quantos dias exatos durará a viagem e em qual data ou mês?",
          options: ["15 dias", "10 dias", "7 dias", "5 dias", "20 dias ou mais"],
          placeholder: "Ex: 15 dias a partir de 01 de Outubro..."
        },
        {
          id: "destination_transport",
          category: "Destinos e Deslocamento",
          question: "Quais cidades você deseja conhecer e como prefere se locomover?",
          options: ["Cidades Históricas (Trem & Transfer)", "Metrópoles (Metrô & A pé)", "Costa e Praias (Carro Alugado)", "Região Serrana (Carro / Transfer)"],
          placeholder: "Ex: Roteiro cultural de trem..."
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
          options: ["Moderado (Equilibrado)", "Econômico (Intenso)", "Luxo (Relaxado)"],
          placeholder: "Ex: Moderado..."
        },
        {
          id: "interests_mustsee",
          category: "Interesses e Experiências",
          question: "Quais são os pilares prioritários da viagem?",
          options: ["Gastronomia & Culinária Local", "História, Museus & Monumentos", "Natureza & Paisagens", "Compras & Vida Noturna", "Aventura & Parques"],
          placeholder: "Ex: Foco em gastronomia e cultura..."
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
    const { prompt, answers, originCity: rawOriginCity, startDate: rawStartDate, durationDays: rawDurationDays } = req.body;
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

    // 1. Extract requested days from direct field, prompt or answers
    let requestedDays = 7;
    if (rawDurationDays && !isNaN(Number(rawDurationDays)) && Number(rawDurationDays) > 0) {
      requestedDays = Math.min(30, Math.max(1, Number(rawDurationDays)));
    } else {
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
    }

    // 2. Extract origin city
    let originCity = (rawOriginCity || "").trim();
    if (!originCity && answers) {
      if (typeof answers.origin_departure === "string" && answers.origin_departure.trim()) {
        originCity = answers.origin_departure.trim();
      }
    }
    if (!originCity) {
      const originMatch = prompt.match(/(?:saindo de|partindo de|origem[:\s]+)([a-zA-ZÀ-ÖØ-öø-ÿ\s\(\)]+?)(?:,|\.|\s+para|\s+com|\s+em|$)/i);
      if (originMatch) {
        originCity = originMatch[1].trim();
      }
    }
    if (!originCity) {
      originCity = "São Paulo (GRU)";
    }

    // 3. Extract and compute start date & end date
    let startDateObj: Date;
    if (rawStartDate && typeof rawStartDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)) {
      const [y, m, d] = rawStartDate.split("-").map(Number);
      startDateObj = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      // Try finding dates or months in prompt or answers
      const combinedText = `${prompt} ${Object.values(answers || {}).join(" ")}`.toLowerCase();
      const monthsMap: { [k: string]: number } = {
        "janeiro": 0, "jan": 0, "fevereiro": 1, "fev": 1, "março": 2, "marco": 2, "mar": 2,
        "abril": 3, "abr": 3, "maio": 4, "mai": 4, "junho": 5, "jun": 5,
        "julho": 6, "jul": 6, "agosto": 7, "ago": 7, "setembro": 8, "set": 8,
        "outubro": 9, "out": 9, "novembro": 10, "nov": 10, "dezembro": 11, "dez": 11
      };
      
      let foundMonth = 9; // default to October (outubro) 2026 as reference
      let foundDay = 1;
      let foundYear = 2026;

      const dateRegex = /(\d{1,2})[\s\/\.de]+([a-zçáõ]+)(?:[\s\/\.de]+(\d{4}))?/i;
      const matchDate = combinedText.match(dateRegex);
      if (matchDate) {
        foundDay = parseInt(matchDate[1], 10);
        const mKey = matchDate[2].substring(0, 3);
        if (monthsMap[mKey] !== undefined) foundMonth = monthsMap[mKey];
        if (matchDate[3]) foundYear = parseInt(matchDate[3], 10);
      } else {
        for (const [mName, mIdx] of Object.entries(monthsMap)) {
          if (combinedText.includes(mName)) {
            foundMonth = mIdx;
            break;
          }
        }
      }
      startDateObj = new Date(foundYear, foundMonth, foundDay, 12, 0, 0);
    }

    const endDateObj = new Date(startDateObj.getTime() + (requestedDays - 1) * 24 * 60 * 60 * 1000);
    const startDateISO = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(2, "0")}`;
    const endDateISO = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

    const shortMonths = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
    const fullMonths = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    const startFriendly = `${String(startDateObj.getDate()).padStart(2, "0")} ${shortMonths[startDateObj.getMonth()]}`;
    const endFriendly = `${String(endDateObj.getDate()).padStart(2, "0")} ${shortMonths[endDateObj.getMonth()]}`;
    const totalDateRangeStr = `${startFriendly} - ${endFriendly}`;

    const response = await generateContentWithRetry({
      model: "gemini-3.7-flash",
      contents: `Prompt original: "${prompt}"${parsedAnswersStr}\nOrigem selecionada: ${originCity}\nData de Início: ${startDateISO}\nDuração: ${requestedDays} dias (até ${endDateISO})`,
      config: {
        systemInstruction: `Você é a KedIA, Consultora Sênior de Viagens e Arquiteta de Itinerários hiperpersonalizados da plataforma KedGo.
Sua missão é executar a [FASE 2: ESTRUTURA DO ROTEIRO FINAL] com máxima excelência, logística fluida, realismo geográfico e financeiro rigoroso (SEM ALUCINAÇÕES DE PREÇO OU DATAS).

🚨 REGRAS ABSOLUTAS E INEGOCIÁVEIS DE ORIGEM, DATAS E DURAÇÃO (OBRIGATÓRIO):
- CIDADE DE ORIGEM DE PARTIDA: "${originCity}". O primeiro voo em "flights" (voo de ida) DEVE ter "departureCity": "${originCity}".
- DATA DE INÍCIO DA VIAGEM: ${startDateISO} (${startFriendly}).
- DATA DE TÉRMINO DA VIAGEM: ${endDateISO} (${endFriendly}).
- DURAÇÃO TOTAL EXATA: EXATAMENTE ${requestedDays} DIAS.
- O total de dias somados no array "days" de todos os destinos (entre todas as cidades) DEVE SER EXATAMENTE ${requestedDays} DIAS (Do Dia 1 até o Dia ${requestedDays}, numerados sequencialmente sem saltar).
- Se houver múltiplos destinos/cidades (ex: Marrakech, Fes, Casablanca), distribua os ${requestedDays} dias harmonicamente entre eles (ex: 5 dias Marrakech, 4 dias Fes, 3 dias Deserto de Merzouga, 3 dias Casablanca = 15 dias).
- NUNCA retorne menos dias do que o solicitado (${requestedDays} dias).

DIRETRIZES DA KEDIA PARA O ROTEIRO:

1. DURAÇÃO EXATA E QUANTIDADE DE DIAS:
   - O array de dias "days" DEVE conter rigorosamente ${requestedDays} dias no total (do Dia 1 ao Dia ${requestedDays}).
   - Cada dia deve ter "dateStr" no formato "Dia da semana, DD de Mês" correspondendo ao dia consecutivo real a partir de ${startDateISO}.

2. LOGÍSTICA DE BASES E AGRUPAMENTO GEOGRÁFICO:
   - Organize as atividades de cada dia por proximidade geográfica para eliminar ziguezagues e otimizar deslocamentos.
   - Para viagens de múltiplos destinos, crie uma entrada no array "destinations" para cada cidade/base de hospedagem com datas sequenciais coerentes.
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
   - No campo "notes" da atividade de almoço/jantar, detalhe nome do restaurante, tipo de culinária e faixa de preço.

5. DICAS DE INSIDER (1 a 3 POR DIA):
   - No campo "notes" das atividades principais, inclua dicas valiosas de insider (melhor horário para fotos, como evitar filas, vestimenta, ingressos antecipados).

6. LOGÍSTICA, CHECKLIST, APPS E ALERTAS (no array "generalTips"):
   - Inclua dicas categorizadas: "Ingressos Antecipados", "Aplicativos Recomendados", "Segurança & Golpes Comuns", "Clima & Etiqueta".

7. ESTIMATIVAS FINANCEIRAS E PREÇOS REAIS:
   - Valores honestos no array "costs" de acordo com o padrão escolhido.

Retorne EXCLUSIVAMENTE um objeto JSON válido correspondente a este schema:
{
  "destinations": [
    {
      "id": string (ex: "dest-1"),
      "city": string,
      "state": string,
      "country": string,
      "dates": string (ex: "${totalDateRangeStr}"),
      "startDate": string (formato YYYY-MM-DD, ex: "${startDateISO}"),
      "endDate": string (formato YYYY-MM-DD, ex: "${endDateISO}"),
      "hotelName": string,
      "hotelAddress": string,
      "checkInTime": string (ex: "15:00"),
      "checkOutTime": string (ex: "11:00"),
      "notes": string (estratégia da base de hospedagem e comodidades),
      "days": [
        {
          "id": string (ex: "day-1"),
          "dayNumber": number (numeração contínua de 1 até ${requestedDays}),
          "dateStr": string (ex: "Quinta, 01 de Outubro"),
          "title": string (ex: "Chegada + Manhã Histórica + Gastronomia Típica"),
          "activities": [
            {
              "id": string (ex: "act-1"),
              "time": string (formato 24h, ex: "09:00"),
              "type": "tour" | "dinner" | "flight" | "hotel" | "other",
              "location": string,
              "duration": string (ex: "2h"),
              "cost": string (ex: "Gratuito" ou "€ 17 / R$ 95"),
              "mapsQuery": string,
              "notes": string
            }
          ]
        }
      ]
    }
  ],
  "costs": [
    {
      "id": string,
      "category": "hotel" | "flight" | "car" | "activity" | "other",
      "description": string,
      "totalCostBRL": number,
      "status": "Pago" | "Pgto no local" | "Falta pagar"
    }
  ],
  "flights": [
    {
      "id": string,
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
      "id": string,
      "category": string,
      "title": string,
      "content": string
    }
  ],
  "summary": string (Resumo inspirador em 1 frase descrevendo o roteiro completo: Destino, total de dias, perfil e destaques)
}`,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    }, userApiKey);

    const text = response.text || "{}";
    const result = JSON.parse(text.trim());

    // Post-processing: Calibrate days, dates and ensure exactly requestedDays
    if (result && Array.isArray(result.destinations) && result.destinations.length > 0) {
      let currentTotalDays = 0;
      result.destinations.forEach((dest: any) => {
        if (Array.isArray(dest.days)) currentTotalDays += dest.days.length;
      });

      // If AI generated fewer days than requested, expand the last destination with full exploration days
      if (currentTotalDays < requestedDays && currentTotalDays > 0) {
        const lastDest = result.destinations[result.destinations.length - 1];
        if (lastDest && Array.isArray(lastDest.days) && lastDest.days.length > 0) {
          const sampleDay = lastDest.days[lastDest.days.length - 1];
          let nextDayNum = currentTotalDays + 1;
          while (currentTotalDays < requestedDays) {
            const newDay = {
              id: `day-${nextDayNum}-${Date.now()}`,
              dayNumber: nextDayNum,
              dateStr: "",
              title: `Exploração Completa e Experiências Locais em ${lastDest.city} (Dia ${nextDayNum})`,
              activities: [
                {
                  id: `act-${nextDayNum}-1`,
                  time: "09:30",
                  type: "tour",
                  location: `Passeios Culturais e Mirantes em ${lastDest.city}`,
                  duration: "3h",
                  cost: "Gratuito",
                  mapsQuery: `${lastDest.city} centro historico`,
                  notes: "Dica de Insider: Chegue cedo para aproveitar as ruelas e praças com iluminação matinal e sem filas."
                },
                {
                  id: `act-${nextDayNum}-2`,
                  time: "13:00",
                  type: "dinner",
                  location: `Almoço Tradicional em ${lastDest.city}`,
                  duration: "1h30",
                  cost: "R$ 85",
                  mapsQuery: `${lastDest.city} restaurante tipico`,
                  notes: "Gastronomia regional autêntica ($$ Moderado) com pratos típicos da região."
                },
                {
                  id: `act-${nextDayNum}-3`,
                  time: "15:30",
                  type: "tour",
                  location: `Mercados Locais, Souks e Galerias de ${lastDest.city}`,
                  duration: "2h30",
                  cost: "Gratuito",
                  mapsQuery: `${lastDest.city} souk market`,
                  notes: "Momento ideal para vivenciar o artesanato, aromas e especiarias da cidade."
                },
                {
                  id: `act-${nextDayNum}-4`,
                  time: "20:00",
                  type: "dinner",
                  location: `Jantar Especial com Música ao Vivo em ${lastDest.city}`,
                  duration: "2h",
                  cost: "R$ 120",
                  mapsQuery: `${lastDest.city} restaurante jantar`,
                  notes: "Experiência noturna acolhedora com ambiente memorável."
                }
              ]
            };
            lastDest.days.push(newDay);
            currentTotalDays++;
            nextDayNum++;
          }
        }
      }

      // Sequentially assign exact calendar dates to all days
      let globalDayIndex = 0;
      result.destinations.forEach((dest: any) => {
        if (Array.isArray(dest.days) && dest.days.length > 0) {
          const destStartDayIndex = globalDayIndex;
          const destStartObj = new Date(startDateObj.getTime() + destStartDayIndex * 24 * 60 * 60 * 1000);
          
          dest.days.forEach((day: any) => {
            const currentDayObj = new Date(startDateObj.getTime() + globalDayIndex * 24 * 60 * 60 * 1000);
            const dayOfWeek = weekdays[currentDayObj.getDay()];
            const dayNum = String(currentDayObj.getDate()).padStart(2, "0");
            const monthName = fullMonths[currentDayObj.getMonth()];
            day.dayNumber = globalDayIndex + 1;
            day.dateStr = `${dayOfWeek}, ${dayNum} de ${monthName}`;
            globalDayIndex++;
          });

          const destEndDayIndex = globalDayIndex - 1;
          const destEndObj = new Date(startDateObj.getTime() + destEndDayIndex * 24 * 60 * 60 * 1000);

          dest.startDate = `${destStartObj.getFullYear()}-${String(destStartObj.getMonth() + 1).padStart(2, "0")}-${String(destStartObj.getDate()).padStart(2, "0")}`;
          dest.endDate = `${destEndObj.getFullYear()}-${String(destEndObj.getMonth() + 1).padStart(2, "0")}-${String(destEndObj.getDate()).padStart(2, "0")}`;

          const dStartFmt = `${String(destStartObj.getDate()).padStart(2, "0")} ${shortMonths[destStartObj.getMonth()]}`;
          const dEndFmt = `${String(destEndObj.getDate()).padStart(2, "0")} ${shortMonths[destEndObj.getMonth()]}`;
          dest.dates = `${dStartFmt} - ${dEndFmt}`;
        }
      });
    }

    // Ensure departure flight matches origin city if missing
    if (result && Array.isArray(result.flights)) {
      if (result.flights.length === 0) {
        const destCity = result?.destinations?.[0]?.city || "Destino";
        result.flights.push({
          id: `flight-1-${Date.now()}`,
          airline: "Companhia Aérea Selecionada",
          flightCode: "VOO-101",
          departureCity: originCity,
          departureCode: originCity.includes("GRU") ? "GRU" : originCity.substring(0, 3).toUpperCase(),
          departureTime: "08:00",
          arrivalCity: destCity,
          arrivalCode: destCity.substring(0, 3).toUpperCase(),
          arrivalTime: "18:30",
          duration: "10h30",
          dateStr: startDateISO,
          status: "Confirmado"
        });
      } else {
        const firstFlight = result.flights[0];
        if (firstFlight && (!firstFlight.departureCity || firstFlight.departureCity.includes("São Paulo") || originCity)) {
          firstFlight.departureCity = originCity;
          firstFlight.dateStr = startDateISO;
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

    // Persist this generation session for template reuse with rich summary
    try {
      const userId = (req as AuthRequest).user?.id ?? null;
      const city = result?.destinations?.[0]?.city || "";
      const country = result?.destinations?.[0]?.country || "";
      const generatedTitle = `${city}${country ? `, ${country}` : ""} (${totalDateRangeStr})`.trim();
      
      // Compute a clean, rich summary combining AI output or fallback
      let summaryText = typeof result?.summary === "string" && result.summary.trim() ? result.summary.trim() : "";
      if (!summaryText) {
        summaryText = `${city}${country ? `, ${country}` : ""}: ${requestedDays} dias de roteiro com partida de ${originCity} (${totalDateRangeStr})`;
      }

      await db.insert(aiPromptLogs).values({
        userId,
        originalPrompt: prompt,
        questions: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        answers: answers && Object.keys(answers).length > 0 ? JSON.stringify(answers) : null,
        generatedTitle: generatedTitle || null,
        summary: summaryText,
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

// Returns up to 4 high-quality AI generation prompt templates with descriptive summaries
router.get("/prompt-templates", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const rows = await db
      .select({
        id: aiPromptLogs.id,
        originalPrompt: aiPromptLogs.originalPrompt,
        generatedTitle: aiPromptLogs.generatedTitle,
        summary: aiPromptLogs.summary,
      })
      .from(aiPromptLogs)
      .where(eq(aiPromptLogs.success, true))
      .orderBy(sql`RANDOM()`)
      .limit(6);

    // Build curated templates with rich labels and clean reference texts
    const dbTemplates = rows
      .filter((row) => (row.summary && row.summary.trim()) || (row.generatedTitle && row.generatedTitle.trim()) || (row.originalPrompt && row.originalPrompt.length > 5))
      .map((row) => {
        let label = row.summary?.trim() || "";
        if (!label) {
          if (row.generatedTitle?.includes("Dubrovnik")) {
            label = "Dubrovnik: 5 dias na Costa da Croácia com história e praias";
          } else if (row.generatedTitle?.includes("Los Angeles")) {
            label = "Los Angeles & Califórnia: 5 dias com praias, cinema e pontos turísticos";
          } else if (row.generatedTitle?.includes("Paris")) {
            label = "Paris: 4 dias com arte, monumentos históricos e bistrôs charmosos";
          } else if (row.generatedTitle) {
            label = row.generatedTitle;
          } else {
            label = row.originalPrompt.slice(0, 65);
          }
        }
        return {
          id: row.id,
          label,
          summary: label,
          text: row.originalPrompt,
        };
      });

    // Default premium fallback templates to guarantee 4 high-value options
    const fallbackTemplates = [
      {
        id: -1,
        label: "Dubrovnik & Costa Croata: 5 dias com praias, muralhas medievais e gastronomia mediterrânea",
        summary: "Dubrovnik & Costa Croata: 5 dias com praias, muralhas medievais e gastronomia mediterrânea",
        text: "Quero uma viagem de 5 dias pela Croácia conhecendo Dubrovnik e arredores, com foco em história medieval, passeios de barco e gastronomia local em ritmo equilibrado."
      },
      {
        id: -2,
        label: "Paris & Roma: 7 dias em casal com museus icônicos, bistrôs charmosos e monumentos históricos",
        summary: "Paris & Roma: 7 dias em casal com museus icônicos, bistrôs charmosos e monumentos históricos",
        text: "7 dias divididos entre Paris e Roma em casal, com foco em arte, passeios a pé, alta gastronomia italiana/francesa e hospedagem bem localizada."
      },
      {
        id: -3,
        label: "Tóquio & Quioto: 10 dias no Japão com templos, tecnologia, gastronomia e deslocamento por trem-bala",
        summary: "Tóquio & Quioto: 10 dias no Japão com templos, tecnologia, gastronomia e deslocamento por trem-bala",
        text: "10 dias no Japão visitando Tóquio e Quioto, com foco em cultura tradicional, culinária autêntica, passeios modernos e logística de trem JR."
      },
      {
        id: -4,
        label: "Los Angeles & Costa da Califórnia: 6 dias de carro com praias, cinema e mirantes",
        summary: "Los Angeles & Costa da Califórnia: 6 dias de carro com praias, cinema e mirantes",
        text: "6 dias em Los Angeles e costa da Califórnia (Santa Monica, Malibu, Hollywood) com carro alugado, praias e atrações icônicas."
      }
    ];

    // Combine distinct DB templates with fallbacks up to 4
    const combined: any[] = [];
    const seen = new Set<string>();

    for (const t of [...dbTemplates, ...fallbackTemplates]) {
      const key = t.label.toLowerCase().slice(0, 25);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(t);
      }
      if (combined.length >= 4) break;
    }

    res.json({ templates: combined });
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
