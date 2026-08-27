import rateLimit from "express-rate-limit";

/**
 * Limitador para rotas de autenticação (Login, Cadastro, Recuperação e Troca de Senha)
 * Previne ataques de força bruta e credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 25, // máximo de 25 tentativas por janela por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas de autenticação a partir deste endereço IP. Por favor, aguarde alguns minutos antes de tentar novamente.",
  },
});

/**
 * Limitador para envio de e-mails, convites e feedbacks
 * Previne abuso de servidor SMTP e inclusão em listas de spam.
 */
export const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 6, // máximo de 6 disparos por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Limite temporário de envio de mensagens atingido. Por favor, aguarde um minuto para enviar novamente.",
  },
});

/**
 * Limitador para chamadas de Inteligência Artificial (Google Gemini)
 * Previne ataques de negação de serviço (DoS) e estouro de custos de API.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo de 20 chamadas por minuto por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições de Inteligência Artificial em sequência. Aguarde um instante para continuar.",
  },
});
