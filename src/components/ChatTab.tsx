import React, { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Mic, Image as ImageIcon, File as FileIcon, X, StopCircle, Lock, Users, Globe } from "lucide-react";
import { useChat } from "../hooks/useChat";
import { Traveler } from "../types";

export default function ChatTab({ 
  itineraryId, 
  currentUser,
  travelers = []
}: { 
  itineraryId: string | number, 
  currentUser: { name: string, id: number, email?: string },
  travelers?: Traveler[]
}) {
  const { messages, typingUsers, isUploading, error, sendMessage, uploadFile, setTyping } = useChat(itineraryId, currentUser.name);
  const [inputText, setInputText] = useState("");
  const [recipientName, setRecipientName] = useState<string>("Todos");
  
  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Pending attachment
  const [attachment, setAttachment] = useState<{
    fileData: string; // URL do arquivo estático (/uploads/...) ou Base64 em LocalMode
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const oldMessagesLengthRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Typing state tracking
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (val: string) => {
    setInputText(val);

    if (!val.trim()) {
      isTypingRef.current = false;
      setTyping(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setTyping(false);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (error) {
      alert(error);
    }
  }, [error]);

  const handleSend = async () => {
    if (!inputText.trim() && !attachment) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    setTyping(false);

    const payload = {
      senderName: currentUser.name || "Usuário",
      senderAvatar: "",
      recipientName: recipientName === "Todos" ? null : recipientName,
      content: inputText.trim(),
      ...attachment
    };

    const success = await sendMessage(payload);
    if (success) {
      setInputText("");
      setAttachment(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. O limite é 10MB.");
      return;
    }

    try {
      const res = await uploadFile(file);
      if (res) {
        setAttachment({
          fileData: res.fileUrl,
          fileName: res.fileName,
          fileType: res.fileType,
          fileSize: res.fileSize
        });
      }
    } catch (err) {
      console.error("Falha ao subir anexo:", err);
      alert("Erro ao enviar anexo.");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        try {
          const res = await uploadFile(audioBlob, "voice_message.webm");
          if (res) {
            setAttachment({
              fileData: res.fileUrl,
              fileName: res.fileName,
              fileType: res.fileType,
              fileSize: res.fileSize
            });
          }
        } catch (err) {
          console.error("Falha ao subir áudio gravado:", err);
          alert("Erro ao processar gravação de voz.");
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Permissão de microfone negada ou indisponível.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter messages to show:
  // - Public messages (no recipient or recipient === 'Todos')
  // - Private messages sent by ME
  // - Private messages received by ME
  const visibleMessages = messages.filter((msg) => {
    if (!msg.recipientName || msg.recipientName === "Todos") return true;
    const currentLower = (currentUser.name || "").trim().toLowerCase();
    const senderLower = (msg.senderName || "").trim().toLowerCase();
    const recipientLower = (msg.recipientName || "").trim().toLowerCase();
    return senderLower === currentLower || recipientLower === currentLower;
  });

  // Get normalized names and emails to identify the current user
  const currentNameNorm = (currentUser.name || "").trim().toLowerCase();
  const currentEmailNorm = (currentUser.email || "").trim().toLowerCase();

  // Combine names from the travelers array and the messages array to ensure all participants are visible
  const candidateNames: string[] = [];

  // Add from itinerary travelers
  travelers.forEach((t) => {
    if (t.name) {
      candidateNames.push(t.name);
    }
  });

  // Add from message histories
  messages.forEach((msg) => {
    if (msg.senderName) candidateNames.push(msg.senderName);
    if (msg.recipientName) candidateNames.push(msg.recipientName);
  });

  // Filter out the current user, placeholder names and invalid terms
  const filteredCandidates = candidateNames.filter((name) => {
    if (!name) return false;
    const nameNorm = name.trim().toLowerCase();

    // 1. Filter out self by name matching
    if (nameNorm === currentNameNorm) return false;

    // 2. Filter out self by email matching
    if (currentEmailNorm && nameNorm === currentEmailNorm) return false;

    // 3. Filter out "Você" placeholders and generic/system terms
    if (
      nameNorm === "você" || 
      nameNorm === "voce" || 
      nameNorm === "you" || 
      nameNorm === "usuário" || 
      nameNorm === "usuario" ||
      nameNorm === "todos"
    ) {
      return false;
    }

    return true;
  });

  // Intellectually deduplicate similar names (e.g., Stelio Ked vs Stelio de Oliveira Ked, Karolline vs Karoll Ked)
  const uniqueNames: string[] = [];
  
  // Sort candidates by length DESC so that longer, more complete names are preferred
  const sortedCandidates = Array.from(new Set(filteredCandidates))
    .sort((a, b) => b.length - a.length);

  for (const name of sortedCandidates) {
    const isDuplicate = uniqueNames.some((existing) => {
      const nameLower = name.toLowerCase().trim();
      const existingLower = existing.toLowerCase().trim();

      if (nameLower === existingLower) return true;

      // Word-based heuristics:
      const wordsName = nameLower.split(/\s+/).filter((w) => w.length > 1);
      const wordsExisting = existingLower.split(/\s+/).filter((w) => w.length > 1);

      if (wordsName.length === 0 || wordsExisting.length === 0) return false;

      // Check if one is a subset of the other's words
      const [shorter, longer] = wordsName.length < wordsExisting.length ? [wordsName, wordsExisting] : [wordsExisting, wordsName];
      const matchCount = shorter.filter((w) => longer.includes(w)).length;
      if (matchCount === shorter.length) return true;

      // Check if they share the same first name and last name: e.g., "Stelio ... Ked" vs "Stelio ... Ked"
      if (wordsName[0] === wordsExisting[0] && wordsName[wordsName.length - 1] === wordsExisting[wordsExisting.length - 1]) {
        return true;
      }

      // First name prefix matching of first 4 characters
      const firstName1 = wordsName[0];
      const firstName2 = wordsExisting[0];
      if (firstName1 && firstName2 && firstName1.substring(0, 4) === firstName2.substring(0, 4)) {
        const lastName1 = wordsName[wordsName.length - 1];
        const lastName2 = wordsExisting[wordsExisting.length - 1];
        if (lastName1 && lastName2 && lastName1 !== firstName1 && lastName2 !== firstName2) {
          if (lastName1.substring(0, 3) === lastName2.substring(0, 3)) {
            return true;
          }
        } else {
          // If at least one of them has no last name, treat them as high probability same person in a small group chat
          return true;
        }
      }

      return false;
    });

    if (!isDuplicate) {
      uniqueNames.push(name);
    }
  }

  // Map unique names back to a formatted traveler-like objects
  const otherTravelers = uniqueNames.map((name, index) => {
    const existing = travelers.find((t) => t.name?.trim().toLowerCase() === name.toLowerCase());
    return {
      id: existing?.id || `dynamic-${index}-${name.replace(/\s+/g, "-")}`,
      name: name
    };
  });

  // Helper to scroll to bottom
  const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentLength = visibleMessages.length;
    
    // 1. Initial Load: scroll to bottom instantly when we first load messages
    if (isInitialLoadRef.current && currentLength > 0) {
      scrollToBottom("auto");
      isInitialLoadRef.current = false;
      oldMessagesLengthRef.current = currentLength;
      return;
    }

    // 2. New message received (length increased)
    if (currentLength > oldMessagesLengthRef.current) {
      const lastMsg = visibleMessages[currentLength - 1];
      const isMe = lastMsg?.senderName?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase();
      
      if (isMe) {
        // If I sent the message, scroll to bottom smoothly
        scrollToBottom("smooth");
      } else {
        // If someone else sent a message, scroll only if already near bottom (within 200px)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        if (isNearBottom) {
          scrollToBottom("smooth");
        }
      }
    }
    
    oldMessagesLengthRef.current = currentLength;
  }, [visibleMessages, currentUser.name]);

  // Keep scroll at bottom if typing indicators appear and we were already near the bottom
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && typingUsers && typingUsers.length > 0) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
      if (isNearBottom) {
        scrollToBottom("smooth");
      }
    }
  }, [typingUsers]);

  return (
    <div className="flex flex-col h-[520px] sm:h-[580px] md:h-[620px] w-full max-w-4xl mx-auto rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 uppercase tracking-widest">Painel de Comunicação</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Mensagens do itinerário e envios privados para o grupo</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-xs font-black text-slate-600 border border-slate-200 w-fit">
          <Globe className="w-3.5 h-3.5 text-indigo-500" />
          <span>Usuário: <strong className="text-indigo-600 font-black">{currentUser.name}</strong></span>
        </div>
      </div>

      {/* Messages View */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
        {visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-slate-300" />
            </div>
            <p className="font-bold">Nenhuma mensagem acessível aqui.</p>
            <p className="text-xs">Digite uma mensagem pública ou privada abaixo para iniciar!</p>
          </div>
        )}
        
        {visibleMessages.map((msg, index) => {
          const senderName = msg.senderName || "Usuário";
          const isMe = senderName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
          const isPrivate = msg.recipientName && msg.recipientName !== "Todos";
          
          // Lógica de divisor de data (estilo WhatsApp)
          const msgDate = new Date(msg.timestamp);
          const prevMsg = index > 0 ? visibleMessages[index - 1] : null;
          const prevDate = prevMsg ? new Date(prevMsg.timestamp) : null;
          
          const isNewDay = !prevDate || 
            msgDate.getDate() !== prevDate.getDate() || 
            msgDate.getMonth() !== prevDate.getMonth() || 
            msgDate.getFullYear() !== prevDate.getFullYear();

          let dateLabel = "";
          if (isNewDay) {
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const isSameDay = (d1: Date, d2: Date) => 
              d1.getDate() === d2.getDate() && 
              d1.getMonth() === d2.getMonth() && 
              d1.getFullYear() === d2.getFullYear();

            if (isSameDay(msgDate, today)) {
              dateLabel = "Hoje";
            } else if (isSameDay(msgDate, yesterday)) {
              dateLabel = "Ontem";
            } else {
              dateLabel = msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
          }
          
          return (
            <React.Fragment key={msg.id}>
              {isNewDay && (
                <div className="flex justify-center my-4">
                  <span className="bg-slate-200/80 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider shadow-sm">
                    {dateLabel}
                  </span>
                </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 mb-1">
                  {!isMe && (
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-[10px] font-extrabold text-slate-500">{isMe ? "Você" : senderName}</span>
                  <span className="text-[9px] text-slate-300 font-bold">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {isPrivate && (
                    <span className={`text-[9px] flex items-center gap-1.5 px-1.5 py-0.5 rounded font-extrabold border uppercase tracking-wider ${
                      isMe
                        ? (msg.isRead 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-100')
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      <Lock className="w-2.5 h-2.5" />
                      <span>{isMe ? `Privado para ${msg.recipientName}` : "Privado para Você"}</span>
                      {isMe && (
                        <span className="normal-case font-black border-l pl-1.5 border-current">
                          {msg.isRead ? "✓✓ Lida" : "✓ Enviada"}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                
                <div className={`relative max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl ${
                  isMe 
                    ? (isPrivate ? 'bg-indigo-700 text-white rounded-tr-sm ring-1 ring-indigo-400' : 'bg-indigo-600 text-white rounded-tr-sm') 
                    : (isPrivate ? 'bg-rose-50 border border-rose-200 text-rose-950 rounded-tl-sm ring-1 ring-rose-100' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm')
                }`}>
                  {msg.content && <p className="text-sm font-medium break-words whitespace-pre-wrap">{msg.content}</p>}
                  
                  {msg.fileData && (
                    <div className={`mt-2 ${msg.content ? 'pt-2 border-t border-opacity-20 ' + (isMe ? 'border-white' : (isPrivate ? 'border-rose-200' : 'border-slate-200')) : ''}`}>
                      {msg.fileType?.startsWith('image/') ? (
                        <img src={msg.fileData} alt="attachment" className="rounded-xl max-h-60 object-contain bg-slate-100" />
                      ) : msg.fileType?.startsWith('video/') ? (
                        <video src={msg.fileData} controls className="rounded-xl max-h-60 max-w-full bg-slate-900" />
                      ) : msg.fileType?.startsWith('audio/') ? (
                        <audio src={msg.fileData} controls className="w-full max-w-[250px] scale-90 origin-left" />
                      ) : (
                        <a 
                          href={msg.fileData} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download={msg.fileName} 
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all ${isMe ? 'bg-indigo-800 hover:bg-indigo-900 text-white' : 'bg-white hover:bg-slate-50 border border-slate-200'} `}
                        >
                          <FileIcon className="w-4 h-4 text-emerald-500" />
                          <span className="truncate max-w-[150px]">{msg.fileName}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}


        {typingUsers && typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 pl-4 py-1.5 animate-pulse bg-indigo-50/50 rounded-xl w-fit">
            <span className="flex gap-0.5 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
            <span className="pr-3">
              {typingUsers.length === 1 
                ? `${typingUsers[0]} está digitando...` 
                : `${typingUsers.slice(0, -1).join(", ")} e ${typingUsers[typingUsers.length - 1]} estão digitando...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 relative">
        {/* Recipient Dropdown Selection */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
              {recipientName === "Todos" ? <Users className="w-3.5 h-3.5 text-indigo-500" /> : <Lock className="w-3.5 h-3.5 text-rose-500" />}
              Enviar para:
            </span>
            <div className="relative">
              <select
                value={recipientName || "Todos"}
                onChange={(e) => setRecipientName(e.target.value)}
                className={`pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold transition-all appearance-none cursor-pointer outline-none border ${
                  recipientName === "Todos"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/85 hover:border-indigo-300"
                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/85 hover:border-rose-300"
                }`}
              >
                <option value="Todos">👥 Todos (Grupo)</option>
                {otherTravelers.map((t) => (
                  <option key={t.id} value={t.name}>
                    🔒 {t.name} (Privado)
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {recipientName !== "Todos" && (
            <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 font-extrabold flex items-center gap-1.5 px-2.5 py-1 rounded-md animate-pulse">
              <Lock className="w-3 h-3" /> Sussurro Privado Ativo
            </span>
          )}
        </div>

        {/* Attachment preview or Uploading state */}
        {isUploading && !attachment && (
          <div className="absolute -top-14 left-4 bg-white border border-indigo-100 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm text-xs font-bold text-indigo-700 animate-pulse">
            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Enviando arquivo para o servidor...</span>
          </div>
        )}

        {attachment && (
          <div className="absolute -top-14 left-4 bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-bottom-2">
            {attachment.fileType.startsWith('image/') ? <ImageIcon className="w-4 h-4 text-indigo-500" /> : <FileIcon className="w-4 h-4 text-emerald-500" />}
            <span className="truncate max-w-[120px]">{attachment.fileName}</span>
            <button onClick={() => setAttachment(null)} className="ml-2 hover:bg-slate-100 p-1 rounded-full"><X className="w-3 h-3 text-slate-400" /></button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File picker */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          />
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()} 
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl flex items-center pr-2 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-shadow">
            <input
              type="text"
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                isRecording 
                  ? "Gravando áudio..." 
                  : (recipientName === "Todos" 
                      ? "Digite uma mensagem para todos..." 
                      : `Sussurrar mensagem privada para ${recipientName}...`)
              }
              disabled={isRecording || isUploading}
              className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium text-slate-800 disabled:opacity-50"
            />
            
            {/* Record Voice */}
            <div className="shrink-0 flex items-center">
              {isRecording ? (
                <button onClick={stopRecording} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full animate-pulse transition-colors">
                  <StopCircle className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={startRecording} disabled={isUploading || !!attachment} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors disabled:opacity-30">
                  <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={isUploading || (!inputText.trim() && !attachment)}
            className="w-10 h-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center rounded-full transition-colors shadow-sm"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
