import { GoogleGenAI } from "@google/genai";

// Modelos atuais da Gemini API (agosto 2026) - via SKILL gemini-interactions-api
// Referência: gemini-2.5-* e anteriores são LEGADOS/DEPRECADOS
export const AI_MODELS = {
  primary: "gemini-3.7-flash",       // Principal: rápido, balanceado, multimodal, 1M tokens
  fallback1: "gemini-3.5-flash-lite", // Mais rápido/leve, alto volume, tarefas simples
  fallback2: "gemini-3.7-flash",      // Redundante para garantir disponibilidade
} as const;

// Cache de clientes por API key para evitar instâncias desnecessárias
const clientCache = new Map<string, GoogleGenAI>();

export function getGenAIClient(customApiKey?: string): GoogleGenAI {
  const key = customApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || "";
  if (!key) throw new Error("Nenhuma API Key do Gemini configurada.");

  if (clientCache.has(key)) return clientCache.get(key)!;

  const client = new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  clientCache.set(key, client);
  return client;
}

function isRateLimitError(err: any): boolean {
  const msg = err?.message || JSON.stringify(err) || "";
  return (
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.toLowerCase().includes("quota") ||
    msg.toLowerCase().includes("rate limit")
  );
}

function isOverloadedError(err: any): boolean {
  const msg = err?.message || JSON.stringify(err) || "";
  return (
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.toLowerCase().includes("high demand") ||
    msg.toLowerCase().includes("overloaded")
  );
}

export async function generateContentWithRetry(
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  customApiKey?: string,
  retries = 3,
  initialDelay = 1500
) {
  const client = getGenAIClient(customApiKey);
  let lastError: any;

  // 1. Tenta o modelo solicitado com backoff exponencial
  for (let i = 0; i < retries; i++) {
    try {
      return await client.models.generateContent(params);
    } catch (err: any) {
      lastError = err;

      // Se for overload/503, vai direto para fallback sem esperar
      if (isOverloadedError(err)) break;

      // Se for rate limit da chave do servidor, lança erro customizado imediatamente
      if (isRateLimitError(err) && !customApiKey?.trim()) break;

      // Para erros transitórios, aplica backoff antes de tentar de novo
      if (i < retries - 1) {
        const sleepDelay = initialDelay * Math.pow(1.5, i);
        await new Promise((resolve) => setTimeout(resolve, sleepDelay));
      }
    }
  }

  // 2. Fallback: tenta modelo alternativo mais leve (gemini-3.5-flash-lite)
  const fallbackModel = AI_MODELS.fallback1;
  if (params.model !== fallbackModel) {
    try {
      console.warn(`[AI] Modelo ${params.model} indisponível, tentando fallback: ${fallbackModel}`);
      return await client.models.generateContent({
        ...params,
        model: fallbackModel,
      });
    } catch (fallbackErr: any) {
      lastError = fallbackErr;
    }
  }

  // 3. Todos os modelos falharam — lança erro explicativo
  if (isRateLimitError(lastError)) {
    const customError = new Error(
      "Limite de requisições do Gemini atingido. Aguarde alguns minutos ou configure sua própria chave gratuita do Google AI Studio (aistudio.google.com) nas configurações para uso ilimitado."
    );
    (customError as any).status = 429;
    throw customError;
  }

  if (isOverloadedError(lastError)) {
    const customError = new Error(
      "Os servidores do Gemini estão sobrecarregados no momento. Tente novamente em alguns minutos."
    );
    (customError as any).status = 503;
    throw customError;
  }

  throw lastError;
}
