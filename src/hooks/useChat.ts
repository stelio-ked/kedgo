import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage } from "../types";

// Intervalo de fallback quando SSE não está disponível (ex: HTTP/1.0, proxy incompatível)
const POLLING_INTERVAL_MS = 5_000;

export function useChat(itineraryId: string | number, currentUserName?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastTimestampRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseFailed = useRef(false);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const isLocal = typeof itineraryId === "string" && itineraryId.startsWith("local-");

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const incomingIds = new Set(incoming.map((m) => m.id));
      const merged = [
        ...prev.filter((old) => !incomingIds.has(old.id)),
        ...incoming,
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return merged;
    });
    lastTimestampRef.current = incoming[incoming.length - 1].timestamp;
  }, []);

  // ─── Polling fallback ─────────────────────────────────────────────────────

  const fetchMessages = useCallback(async () => {
    if (isLocal) {
      try {
        const stored = localStorage.getItem(`meu_agente_chat_${itineraryId}`);
        if (stored) setMessages(JSON.parse(stored));
      } catch {}
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const since = lastTimestampRef.current
        ? `&since=${encodeURIComponent(lastTimestampRef.current)}`
        : "";
      const user = currentUserName
        ? `?username=${encodeURIComponent(currentUserName)}${since}`
        : since ? `?${since.slice(1)}` : "";

      const res = await fetch(`/api/messages/${encodeURIComponent(itineraryId)}${user}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      if (!data) return;

      const msgs: ChatMessage[] = Array.isArray(data) ? data : data.messages ?? [];
      mergeMessages(msgs);
      if (!Array.isArray(data)) setTypingUsers(data.typingUsers ?? []);
    } catch (e: any) {
      const isNetwork =
        e?.message?.includes("Failed to fetch") ||
        e?.message?.includes("NetworkError") ||
        e?.message?.includes("abort");
      if (!isNetwork) console.error("[useChat] fetchMessages error:", e);
    }
  }, [itineraryId, currentUserName, mergeMessages, isLocal]);

  // ─── SSE principal ────────────────────────────────────────────────────────

  const connectSSE = useCallback(() => {
    if (isLocal || sseFailed.current) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    // Fechar conexão anterior, se houver
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const url = `/api/chat/stream/${encodeURIComponent(itineraryId)}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    // Carga inicial de mensagens enviada pelo servidor ao conectar
    es.addEventListener("connected", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.messages?.length) mergeMessages(data.messages);
      } catch {}
    });

    // Nova mensagem em tempo real
    es.addEventListener("new_message", (e: MessageEvent) => {
      try {
        const msg: ChatMessage = JSON.parse(e.data);
        mergeMessages([msg]);
      } catch {}
    });

    // Atualização de quem está digitando
    es.addEventListener("typing", (e: MessageEvent) => {
      try {
        const { typingUsers: users } = JSON.parse(e.data);
        setTypingUsers(
          (users as string[]).filter(
            (u) => u.toLowerCase() !== (currentUserName || "").toLowerCase()
          )
        );
      } catch {}
    });

    // Heartbeat — apenas mantém a conexão; sem ação necessária
    es.addEventListener("heartbeat", () => {});

    es.onerror = () => {
      console.warn("[useChat] SSE error — switching to polling fallback.");
      es.close();
      eventSourceRef.current = null;
      sseFailed.current = true;

      // Inicia polling como fallback
      fetchMessages();
      pollingTimerRef.current = setInterval(fetchMessages, POLLING_INTERVAL_MS);
    };
  }, [itineraryId, currentUserName, mergeMessages, fetchMessages, isLocal]);

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  useEffect(() => {
    // Reset ao trocar de itinerário
    setMessages([]);
    setTypingUsers([]);
    lastTimestampRef.current = null;
    sseFailed.current = false;

    if (isLocal) {
      // Itinerários locais: sempre polling simples
      fetchMessages();
      pollingTimerRef.current = setInterval(fetchMessages, POLLING_INTERVAL_MS);
    } else if (typeof EventSource !== "undefined") {
      connectSSE();
    } else {
      // Browser sem suporte a EventSource (raro): polling
      sseFailed.current = true;
      fetchMessages();
      pollingTimerRef.current = setInterval(fetchMessages, POLLING_INTERVAL_MS);
    }

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [itineraryId, currentUserName]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Typing ───────────────────────────────────────────────────────────────

  const setTyping = async (isTyping: boolean) => {
    if (isLocal || !currentUserName) return;
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itineraryId, username: currentUserName, isTyping }),
      });
    } catch (e) {
      console.error("[useChat] setTyping error:", e);
    }
  };

  // ─── Enviar mensagem ──────────────────────────────────────────────────────

  const uploadFile = async (file: File | Blob, customFileName?: string): Promise<{ fileUrl: string; fileName: string; fileType: string; fileSize: number } | null> => {
    if (isLocal) {
      // Local fallback: usa FileReader para gerar data URL como antes
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            fileUrl: reader.result as string,
            fileName: customFileName || (file as File).name || "attachment",
            fileType: file.type,
            fileSize: file.size
          });
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      const token = localStorage.getItem("auth_token");
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file, customFileName || (file as File).name);

      const res = await fetch("/api/messages/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Erro ao fazer upload do arquivo.");
        return null;
      }

      const data = await res.json();
      return {
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize
      };
    } catch (e) {
      setError("Erro de rede ao enviar arquivo.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendMessage = async (payload: any) => {
    if (isLocal) {
      const stored = localStorage.getItem(`meu_agente_chat_${itineraryId}`);
      const localMsgs = stored ? JSON.parse(stored) : [];
      localMsgs.push({
        id: "msg-" + Math.random().toString(36).substring(7),
        itineraryId,
        timestamp: new Date().toISOString(),
        ...payload,
      });
      localStorage.setItem(`meu_agente_chat_${itineraryId}`, JSON.stringify(localMsgs));
      fetchMessages();
      return true;
    }

    try {
      const token = localStorage.getItem("auth_token");
      setIsUploading(true);
      setError(null);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itineraryId, ...payload }),
      });

      if (res.ok) {
        // SSE vai entregar a mensagem — sem necessidade de re-fetch manual
        return true;
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || "Erro ao enviar mensagem.");
        return false;
      }
    } catch (e) {
      setError("Erro de conexão ao enviar mensagem.");
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    messages,
    typingUsers,
    isUploading,
    error,
    sendMessage,
    uploadFile,
    setTyping,
    fetchMessages,
  };
}
