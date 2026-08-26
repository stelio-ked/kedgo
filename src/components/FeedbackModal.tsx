import React, { useState } from "react";
import {
  MessageSquarePlus,
  Lightbulb,
  Bug,
  HelpCircle,
  Heart,
  FileText,
  Star,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type FeedbackType = "suggestion" | "bug" | "question" | "praise" | "other";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name?: string; email?: string; id?: number } | null;
  itineraryId?: string | number | null;
  token?: string | null;
}

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: React.FC<{ className?: string }>; color: string; bg: string; border: string; desc: string }[] = [
  {
    id: "suggestion",
    label: "Sugestão",
    icon: Lightbulb,
    color: "text-amber-600",
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-200",
    desc: "Ideia de melhoria ou novo recurso",
  },
  {
    id: "bug",
    label: "Erro / Bug",
    icon: Bug,
    color: "text-rose-600",
    bg: "bg-rose-50 hover:bg-rose-100",
    border: "border-rose-200",
    desc: "Algo que não funcionou como esperado",
  },
  {
    id: "question",
    label: "Dúvida",
    icon: HelpCircle,
    color: "text-blue-600",
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-200",
    desc: "Ajuda para entender uma função",
  },
  {
    id: "praise",
    label: "Elogio",
    icon: Heart,
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-200",
    desc: "O que você mais gostou no app",
  },
  {
    id: "other",
    label: "Outro",
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-50 hover:bg-slate-100",
    border: "border-slate-200",
    desc: "Qualquer outro comentário ou recado",
  },
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  itineraryId,
  token,
}) => {
  const [selectedType, setSelectedType] = useState<FeedbackType>("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [customName, setCustomName] = useState(currentUser?.name || "");
  const [customEmail, setCustomEmail] = useState(currentUser?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: selectedType,
          subject: subject.trim() || `Feedback: ${selectedType}`,
          message: message.trim(),
          rating,
          itineraryId: itineraryId ? Number(itineraryId) : null,
          userName: customName.trim() || currentUser?.name || "Viajante",
          userEmail: customEmail.trim() || currentUser?.email || "anonimo@kedgo.pro",
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setResult({ success: true, message: json.message || "Feedback enviado com sucesso!" });
        setMessage("");
        setSubject("");
        setTimeout(() => {
          onClose();
          setResult(null);
        }, 2200);
      } else {
        setResult({ success: false, message: json.error || "Erro ao enviar feedback." });
      }
    } catch {
      setResult({ success: false, message: "Erro de conexão. Tente novamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col my-auto"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#1E3A5F] via-[#162B48] to-[#D95D39] p-4 sm:p-5 text-white shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition cursor-pointer z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-md">
                <MessageSquarePlus className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Opinião dos Viajantes
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Enviar Feedback
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-slate-200 mt-1 leading-relaxed">
              Sua opinião é fundamental! Envie sugestões de novos recursos, dúvidas, relatos de erros ou elogios diretamente para a equipe do <strong>KedGo!</strong>.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Feedback Type Selector */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
                Qual o tipo do seu feedback?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEEDBACK_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20`
                          : `${t.bg} ${t.border} text-slate-700 hover:border-slate-300`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-amber-300" : t.color}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                      <span className={`text-xs font-extrabold block ${isSelected ? "text-white" : "text-slate-800"}`}>
                        {t.label}
                      </span>
                      <span className={`text-[9px] block leading-tight mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {t.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Satisfaction Rating */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">Sua experiência geral</span>
                <span className="text-[10px] text-slate-500 font-medium">Como você avalia o KedGo! até agora?</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (hoverRating !== null ? star <= hoverRating : star <= rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assunto / Título
              </label>
              <input
                type="text"
                placeholder="Ex: Sugestão para o scanner de passagens, Dúvida no rateio..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Mensagem detalhada <strong className="text-rose-500">*</strong></span>
                <span className="text-[10px] font-normal text-slate-400">Seja o mais específico possível</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Conte com detalhes o que aconteceu, sua ideia ou sua dúvida..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white resize-none"
              />
            </div>

            {/* User Identification (if not logged in) */}
            {!currentUser?.email && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu Nome</label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu E-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Result Message */}
            {result && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  result.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{result.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 px-4 bg-[#1E3A5F] hover:bg-[#162B48] text-white rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackModal;
