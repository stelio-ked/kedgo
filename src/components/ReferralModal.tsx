import React, { useState, useEffect, useCallback } from "react";
import {
  Gift,
  Copy,
  Check,
  Send,
  X,
  Sparkles,
  Trophy,
  CheckCircle2,
  MessageCircle,
  Loader2,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReferralEntry {
  id: number;
  inviteId: number | null;
  name: string;
  email: string;
  emailFull: string | null;
  status: string; // 'signup' | 'completed' | 'invited' | 'pending'
  date: string | Date;
  canResend: boolean;
}

interface ReferralData {
  referralCode: string;
  completedReferrals: number;
  totalReferrals: number;
  isLifetimePro: boolean;
  referrals: ReferralEntry[];
}

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name?: string; email?: string; id?: number } | null;
  token?: string | null;
  isLifetimePro?: boolean;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  token,
  isLifetimePro: propIsLifetimePro = false,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralData | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendResult, setResendResult] = useState<{ id: number; success: boolean; message: string } | null>(null);

  const fetchStats = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/referral/stats", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetchStats();
  }, [isOpen, token, fetchStats]);

  if (!isOpen) return null;

  const rawCode = data?.referralCode;
  const referralCode = (!rawCode || rawCode === "KED1") ? "KED10" : rawCode;
  const completedReferrals = data?.completedReferrals ?? 0;
  const isLifetimePro = data?.isLifetimePro ?? propIsLifetimePro;
  const referralsList: ReferralEntry[] = data?.referrals || [];
  const targetCount = 10;
  const progressPercent = Math.min(100, Math.round((completedReferrals / targetCount) * 100));

  const baseUrl = window.location.origin;
  const shareLink = `${baseUrl}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSendEmailInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !token) return;
    setEmailSending(true);
    setEmailResult(null);

    try {
      const res = await fetch("/api/referral/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmailResult({ success: true, message: json.message || "Convite enviado!" });
        setInviteEmail("");
        // Refresh list to show new pending invite
        setTimeout(fetchStats, 500);
      } else {
        setEmailResult({ success: false, message: json.error || "Erro ao enviar convite." });
      }
    } catch {
      setEmailResult({ success: false, message: "Erro de conexão. Tente novamente." });
    } finally {
      setEmailSending(false);
      setTimeout(() => setEmailResult(null), 5000);
    }
  };

  const handleResend = async (entry: ReferralEntry) => {
    if (!token || !entry.inviteId) return;
    setResendingId(entry.id);
    setResendResult(null);

    try {
      const res = await fetch("/api/referral/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteId: entry.inviteId }),
      });
      const json = await res.json();
      setResendResult({
        id: entry.id,
        success: res.ok,
        message: json.message || json.error || "Erro ao reenviar.",
      });
      if (res.ok) setTimeout(fetchStats, 500);
    } catch {
      setResendResult({ id: entry.id, success: false, message: "Erro de conexão." });
    } finally {
      setResendingId(null);
      setTimeout(() => setResendResult(null), 5000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `✈️ Olá! Estou organizando viagens no KedGo! e quero te dar R$ 10,00 de desconto no seu Passe KedGo! ou no KedGo! Pro. Acesse pelo meu link: ${shareLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { dot: "bg-emerald-500", label: "Ativo", labelClass: "text-emerald-600 bg-emerald-50 border-emerald-200" };
      case "signup":
        return { dot: "bg-blue-400", label: "Cadastrado", labelClass: "text-blue-600 bg-blue-50 border-blue-200" };
      case "invited":
        return { dot: "bg-amber-400 animate-pulse", label: "Convite Enviado", labelClass: "text-amber-600 bg-amber-50 border-amber-200" };
      default:
        return { dot: "bg-slate-400", label: "Pendente", labelClass: "text-slate-500 bg-slate-50 border-slate-200" };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans max-h-[92vh] flex flex-col my-auto"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-[#1E3A5F] via-[#162B48] to-[#D95D39] p-4 sm:p-5 text-white overflow-hidden shrink-0">
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition cursor-pointer z-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-white/10 rounded-xl backdrop-blur-md">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-amber-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                Programa Indique &amp; Ganhe
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Créditos do Indique um Amigo
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-slate-200 mt-1 leading-relaxed">
              Convide seus amigos para usar o <strong>KedGo!</strong>. Quando 10 amigos se cadastrarem e realizarem a compra de um produto, você ganha <strong>Acesso VITALÍCIO ao KedGo! Pro</strong> de graça!
            </p>

            {/* Status Card */}
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs font-semibold">
              <div>
                <span className="text-slate-300 block text-[10px] uppercase">Indicados Efetivos</span>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300 mt-1" />
                ) : (
                  <span className="text-base sm:text-lg font-black text-amber-300">{completedReferrals} / {targetCount}</span>
                )}
              </div>
              <div>
                <span className="text-slate-300 block text-[10px] uppercase">Recompensa</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 flex items-center gap-1">
                  {isLifetimePro || completedReferrals >= targetCount ? (
                    <><CheckCircle2 className="w-4 h-4" /> Pro Vitalício Ativo!</>
                  ) : (
                    <><Trophy className="w-4 h-4 text-amber-300" /> KedGo! Pro Vitalício</>
                  )}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-black/30 h-2 rounded-full mt-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Body Content — Scrollable */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
            {/* Promo Box */}
            <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3.5 text-amber-900 space-y-2">
              <div className="flex items-start gap-2 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Todos saem ganhando!</strong> Seus amigos ganham <span className="text-amber-700 font-extrabold">R$ 10,00 de desconto</span> no cadastro:
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/80 border border-amber-200 rounded-xl p-2.5">
                  <span className="font-extrabold text-slate-800 block">🎫 Passe KedGo!</span>
                  <span className="text-slate-600 text-[10px]">Acesso total para 1 viagem específica.</span>
                </div>
                <div className="bg-white/80 border border-amber-200 rounded-xl p-2.5">
                  <span className="font-extrabold text-slate-800 block">⭐ KedGo! Pro</span>
                  <span className="text-slate-600 text-[10px]">Acesso vitalício e ilimitado a todas as viagens.</span>
                </div>
              </div>
            </div>

            {/* Referral List — always shown, with empty state */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                  Seus convidados
                  {!loading && (
                    <span className="ml-1 bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {referralsList.length}
                    </span>
                  )}
                </label>
                {!loading && (
                  <button
                    onClick={fetchStats}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Atualizar
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : referralsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-5 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <Gift className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Nenhum convidado ainda</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Envie convites abaixo para começar!</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {referralsList.map((r) => {
                    const cfg = getStatusConfig(r.status);
                    const isResending = resendingId === r.id;
                    const thisResendResult = resendResult?.id === r.id ? resendResult : null;
                    return (
                      <div key={`${r.status}-${r.id}`} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-700 block truncate leading-tight">{r.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate leading-tight">{r.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${cfg.labelClass}`}>
                              {cfg.label}
                            </span>
                            {r.canResend && (
                              <button
                                onClick={() => handleResend(r)}
                                disabled={isResending}
                                title="Reenviar convite"
                                className="p-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition cursor-pointer disabled:opacity-50"
                              >
                                {isResending ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3 h-3" />
                                )}
                              </button>
                            )}
                            {r.status === "completed" && (
                              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" title="Comprou um produto" />
                            )}
                            {r.status === "signup" && (
                              <Clock className="w-3.5 h-3.5 text-blue-400" title="Cadastrado, aguardando compra" />
                            )}
                          </div>
                        </div>
                        {thisResendResult && (
                          <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${thisResendResult.success ? "text-emerald-600" : "text-red-500"}`}>
                            {thisResendResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {thisResendResult.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status legend */}
              {!loading && referralsList.length > 0 && (
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Convite enviado
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" /> Cadastrado
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Comprou produto ✓
                  </span>
                </div>
              )}
            </div>

            {/* Send via Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Convidar por E-mail
              </label>
              <form onSubmit={handleSendEmailInvite} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Insira o e-mail do amigo..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={emailSending || !inviteEmail.trim()}
                  className="px-4 py-2.5 bg-[#1E3A5F] hover:bg-[#162B48] text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailSending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{emailSending ? "Enviando..." : "Enviar"}</span>
                </button>
              </form>
              {emailResult && (
                <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-1 ${emailResult.success ? "text-emerald-600" : "text-red-600"}`}>
                  {emailResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {emailResult.message}
                </p>
              )}
            </div>

            {/* Share Link Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ou compartilhe seu link de convite exclusivo
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="pt-1 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>Código: <strong className="text-slate-900 font-mono">{referralCode}</strong></span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ReferralModal;
