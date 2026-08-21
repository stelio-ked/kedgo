import { Router, Request, Response } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { chatMessages } from "../db/schema.js";
import { authMiddleware, AuthRequest, JWT_SECRET } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import { chatUpload } from "../middleware/upload.js";

const router = Router();

// ─── Rota de Upload do Chat (Multipart) ──────────────────────────────────────

router.post("/upload", authMiddleware, (req: AuthRequest, res: Response) => {
  chatUpload.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    // Retorna a URL estática para acessar o arquivo
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
  });
});


// ─── Estado em memória ────────────────────────────────────────────────────────

/** Participantes digitando por itinerário: { itineraryId: { username: lastTimestamp } } */
const typingParticipants: Record<number, Record<string, number>> = {};

/** Conexões SSE ativas por itinerário: { itineraryId: Set<Response> } */
const sseConnections = new Map<number, Set<Response>>();

// ─── Helpers SSE ─────────────────────────────────────────────────────────────

function addSseClient(itineraryId: number, res: Response) {
  if (!sseConnections.has(itineraryId)) {
    sseConnections.set(itineraryId, new Set());
  }
  sseConnections.get(itineraryId)!.add(res);
}

function removeSseClient(itineraryId: number, res: Response) {
  sseConnections.get(itineraryId)?.delete(res);
  if (sseConnections.get(itineraryId)?.size === 0) {
    sseConnections.delete(itineraryId);
  }
}

function broadcastToItinerary(itineraryId: number, event: string, data: unknown) {
  const clients = sseConnections.get(itineraryId);
  if (!clients || clients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      // cliente desconectado silenciosamente
    }
  }
}

// ─── SSE Stream ──────────────────────────────────────────────────────────────

/**
 * GET /stream/:itineraryId?token=<jwt>
 *
 * Abre uma conexão Server-Sent Events para o itinerário especificado.
 * O token JWT é passado como query param pois EventSource não suporta headers.
 *
 * Eventos emitidos:
 *   - `connected`    : confirmação de conexão com lista inicial de mensagens
 *   - `new_message`  : nova mensagem inserida por qualquer participante
 *   - `typing`       : atualização da lista de usuários digitando
 *   - `heartbeat`    : pulso a cada 25s para manter a conexão viva
 */
router.get("/stream/:itineraryId", async (req: Request, res: Response) => {
  if (!db) {
    res.status(503).json({ error: "DATABASE_URL não configurada." });
    return;
  }

  // Autenticação via query param (limitação do EventSource nativo)
  const token = req.query.token as string;
  if (!token) {
    res.status(401).json({ error: "Token não fornecido." });
    return;
  }

  let user: any;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: "Token inválido." });
    return;
  }

  const itId = parseInt(req.params.itineraryId);
  if (isNaN(itId)) {
    res.status(400).json({ error: "itineraryId inválido." });
    return;
  }

  // Configurar headers SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // desabilita buffer do nginx/easypanel
  res.flushHeaders();

  // Registrar cliente
  addSseClient(itId, res);
  console.log(`[SSE] Cliente conectado: ${user.email} → itinerário ${itId} (total: ${sseConnections.get(itId)?.size})`);

  // Enviar mensagens iniciais
  try {
    const msgs = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.itineraryId, itId))
      .orderBy(chatMessages.timestamp);

    res.write(`event: connected\ndata: ${JSON.stringify({ messages: msgs })}\n\n`);
  } catch (err: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`);
  }

  // Heartbeat a cada 25s para evitar que proxies/load balancers fechem a conexão ociosa
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  // Limpeza quando o cliente desconectar
  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(itId, res);
    console.log(`[SSE] Cliente desconectado: ${user.email} → itinerário ${itId} (restam: ${sseConnections.get(itId)?.size ?? 0})`);
  });
});

// ─── GET mensagens (carregamento inicial / compatibilidade) ───────────────────

router.get("/:itineraryId", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const itId = parseInt(req.params.itineraryId);
    if (isNaN(itId)) return res.json({ messages: [], typingUsers: [] });

    const username = (req.query.username || "").toString().trim();

    // Marcar mensagens do usuário como lidas
    if (username) {
      const lowerUser = username.toLowerCase();
      const unreadMsgs = await db
        .select()
        .from(chatMessages)
        .where(and(eq(chatMessages.itineraryId, itId), eq(chatMessages.isRead, false)));

      const idsToUpdate = unreadMsgs
        .filter((m) => m.recipientName && m.recipientName.trim().toLowerCase() === lowerUser)
        .map((m) => m.id);

      if (idsToUpdate.length > 0) {
        await db.update(chatMessages).set({ isRead: true }).where(inArray(chatMessages.id, idsToUpdate));
      }
    }

    const sinceStr = req.query.since as string;
    let baseWhere = eq(chatMessages.itineraryId, itId);
    if (sinceStr) {
      baseWhere = and(baseWhere, sql`${chatMessages.timestamp} > ${new Date(sinceStr)}`) as any;
    }

    const msgs = await db.select().from(chatMessages).where(baseWhere).orderBy(chatMessages.timestamp);

    // Calcular quem está digitando
    const now = Date.now();
    const typingUsers: string[] = [];
    if (typingParticipants[itId]) {
      for (const [user, timestamp] of Object.entries(typingParticipants[itId])) {
        if (now - timestamp < 4000) {
          if (user.trim().toLowerCase() !== username.toLowerCase()) typingUsers.push(user);
        } else {
          delete typingParticipants[itId][user];
        }
      }
    }

    res.json({ messages: msgs, typingUsers });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST typing (atualiza estado + broadcast SSE) ───────────────────────────

router.post("/typing", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { itineraryId, username, isTyping } = req.body;
    const itId = parseInt(itineraryId);
    if (isNaN(itId) || !username) {
      return res.status(400).json({ error: "Parâmetros inválidos." });
    }

    if (!typingParticipants[itId]) typingParticipants[itId] = {};

    if (isTyping) {
      typingParticipants[itId][username] = Date.now();
    } else {
      delete typingParticipants[itId][username];
    }

    // Calcular lista atual de quem digita e broadcast via SSE
    const now = Date.now();
    const typingUsers = Object.entries(typingParticipants[itId] || {})
      .filter(([, ts]) => now - ts < 4000)
      .map(([u]) => u);

    broadcastToItinerary(itId, "typing", { typingUsers });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ─── POST nova mensagem (insert + broadcast SSE) ─────────────────────────────

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  if (!db) return res.status(503).json({ error: "DATABASE_URL não configurada." });
  try {
    const { itineraryId, senderName, senderAvatar, recipientName, content, fileData, fileName, fileType, fileSize } = req.body;
    const itId = parseInt(itineraryId);
    if (isNaN(itId)) return res.status(400).json({ error: "Você precisa sincronizar a viagem na nuvem para usar o chat." });

    const [msg] = await db
      .insert(chatMessages)
      .values({
        id: "msg-" + Math.random().toString(36).substring(7),
        itineraryId: itId,
        senderName,
        senderAvatar,
        recipientName,
        content,
        fileData,
        fileName,
        fileType,
        fileSize,
      })
      .returning();

    // Broadcast imediato para todos os clientes SSE conectados neste itinerário
    broadcastToItinerary(itId, "new_message", msg);

    res.json({ success: true, message: msg });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
