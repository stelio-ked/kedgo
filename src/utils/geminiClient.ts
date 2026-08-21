/**
 * Utilidades do Cliente Gemini (Client-side)
 * Implementa estratégia de fallback inteligente direto do navegador usando Chave de API pessoal do usuário.
 */

// Chaves do localStorage
const VISITOR_GEMINI_KEY_STORAGE_NAME = "visitor_gemini_api_key";

/**
 * Obtém a chave de API cadastrada pelo visitante/usuário localmente.
 */
export function getVisitorApiKey(): string {
  return localStorage.getItem(VISITOR_GEMINI_KEY_STORAGE_NAME) || "";
}

/**
 * Cadastra ou remove a chave de API do visitante localmente.
 */
export function setVisitorApiKey(apiKey: string): void {
  const cleanKey = apiKey.trim();
  if (cleanKey) {
    localStorage.setItem(VISITOR_GEMINI_KEY_STORAGE_NAME, cleanKey);
  } else {
    localStorage.removeItem(VISITOR_GEMINI_KEY_STORAGE_NAME);
  }
}

/**
 * Verifica se o visitante possui uma chave de API configurada localmente.
 */
export function hasVisitorApiKey(): boolean {
  return !!getVisitorApiKey();
}

/**
 * Retorna os headers HTTP enriquecidos com a chave pessoal do Gemini do usuário (se cadastrada)
 */
export function getAiHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const visitorKey = getVisitorApiKey();
  const headers: Record<string, string> = { ...customHeaders };
  if (visitorKey) {
    headers["x-gemini-api-key"] = visitorKey;
  }
  return headers;
}

/**
 * Executa uma chamada direta de IA para o serviço de varredura utilizando a chave pessoal do visitante.
 * Fornece resiliência total caso o backend ou o servidor principal falhe ou fique sem cota.
 */
export async function scanNearbyPlacesClientSide(
  hotelName: string,
  hotelAddress: string,
  cityName: string
): Promise<any[]> {
  const apiKey = getVisitorApiKey();
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada no navegador.");
  }

  // Usamos gemini-1.5-flash ou gemini-2.5-flash, mas na chamada REST gemini-2.5-flash é super rápido e gratuito.
  // Vamos usar 'gemini-1.5-flash' para garantir retrocompatibilidade máxima em todas as chaves pessoais, ou 'gemini-2.5-flash'.
  // Vamos tentar primeiro 'gemini-2.5-flash' ou 'gemini-1.5-flash'.
  const modelName = "gemini-1.5-flash"; // Altamente compatível com todas as chaves de API do usuário
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const promptText = `Faça uma pesquisa detalhada de locais reais próximos ao ponto hoteleiro a seguir.
Hotel de Referência: ${hotelName}
Endereço do Hotel: ${hotelAddress}
Cidade/Localidade: ${cityName}

Sua tarefa é encontrar estabelecimentos reais e úteis localizados nos arredores (em um raio de caminhada ou uma viagem curta de até 1.5km do hotel).
Retorne rigorosamente 3 categorias de estabelecimentos:
1. Food (Restaurantes, lanchonetes, padarias, supermercados, mercados de conveniência)
2. Medical (Farmácias, clínicas, hospitais, drogarias)
3. Services (Caixas eletrônicos, lavanderias, postos de combustíveis, atrações turísticas)

Para cada uma dessas 3 categorias, encontre no mínimo 4 ou 5 estabelecimentos reais.
Para cada item do resultado, você deve fornecer o JSON exatamente neste formato:
{
  "category": "Food | Medical | Services",
  "name": "Nome real do estabelecimento",
  "address": "Endereço ou rua onde está localizado",
  "rating": "Avaliação em estrelas, ex: '4.5', ou null se não encontrar",
  "distance": "Distância aproximada a pé ou de carro saindo do hotel, ex: '150m a pé', '800m de carro'",
  "latitude": latitude aproximada em número decimal ou null,
  "longitude": longitude aproximada em número decimal ou null,
  "mapsLink": "Link do Google Maps pesquisando por esse estabelecimento"
}

O resultado final deve ser um ARRAY JSON válido com os itens de cada categoria.
Não adicione qualquer texto introdutório ou explicativo. Responda apenas com a estrutura JSON em conformidade com o formato requisitado (deve ser um Array de objetos JSON).`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const detailedMessage = errorJson?.error?.message || response.statusText;
      throw new Error(`Erro na API do Gemini: ${detailedMessage}`);
    }

    const resData = await response.json();
    const candidateText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!candidateText) {
      throw new Error("A IA retornou um resultado vazio.");
    }

    // Remover wraps de código markdown se houverem
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith("```")) {
      // Remover abertura (por exemplo, ```json ou ```)
      cleanJson = cleanJson.replace(/^```[a-zA-Z]*\s*/, "");
      // Remover fechamento (``` no final)
      cleanJson = cleanJson.replace(/\s*```$/, "");
    }

    const parsed = JSON.parse(cleanJson.trim());
    if (!Array.isArray(parsed)) {
      throw new Error("O resultado gerado pela IA pessoal não é um Array válido.");
    }

    return parsed;
  } catch (err: any) {
    console.error("Erro no scan client-side do Gemini:", err);
    throw err;
  }
}
