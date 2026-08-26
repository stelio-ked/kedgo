import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  MessageSquare,
  Sparkles,
  Ticket,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Star,
  Tag,
  Lightbulb,
  Bug,
  HelpCircle,
  Heart,
  FileText,
  Trash2,
  Check,
  Plus,
  Crown,
  Eye,
  Send,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SuperAdminOverviewProps {
  token?: string | null;
  currentUser?: { email?: string; name?: string; id?: number } | null;
  onClose?: () => void;
}

interface OverviewData {
  stats: {
    totalUsers: number;
    totalItineraries: number;
    totalTravelers: number;
    totalFeedbacks: number;
    pendingFeedbacks: number;
    totalCoupons: number;
    proUsersCount: number;
    foundersSold: number;
    foundersLimit: number;
  };
  users: {
    id: number;
    name: string;
    email: string;
    planType: string;
    isLifetimePro: boolean;
    isAnnualPro: boolean;
    referralCode: string;
    referralCount: number;
    referredBy?: string;
    createdAt: string;
    itinerariesCount: number;
    isSuperAdmin: boolean;
  }[];
  feedbacks: {
    id: number;
    userId?: number | null;
    userName: string;
    userEmail: string;
    type: "suggestion" | "bug" | "question" | "praise" | "other";
    subject: string;
    message: string;
    rating?: number | null;
    status: "pending" | "analyzing" | "resolved";
    adminNotes?: string | null;
    createdAt: string;
  }[];
  coupons: {
    id: number;
    code: string;
    description: string;
    discountCents: number;
    isActive: boolean;
    usageCount: number;
    createdAt: string;
  }[];
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({
  token,
  currentUser,
}) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "feedbacks" | "users" | "coupons">("feedbacks");

  // Feedback filters
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>("all");
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>("all");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<number | null>(null);

  // User search filter
  const [userSearch, setUserSearch] = useState("");

  // New Coupon State
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDesc, setNewCouponDesc] = useState("");
  const [newCouponDiscount, setNewCouponDiscount] = useState("10.00");
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const fetchOverview = async () => {
    if (!token) {
      setError("Sessão não autenticada. Faça login com a conta de Administrador.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rawText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error("Não foi possível carregar a visão geral. Verifique se o servidor está ativo.");
      }

      if (res.ok) {
        setData(json);
      } else {
        setError(json.error || "Acesso restrito ao Super Administrador (theoked25@gmail.com).");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  const handleUpdateFeedbackStatus = async (id: number, newStatus: string, notes?: string) => {
    if (!token) return;
    setUpdatingFeedbackId(id);
    try {
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, adminNotes: notes }),
      });
      if (res.ok) {
        fetchOverview();
        if (selectedFeedback && selectedFeedback.id === id) {
          setSelectedFeedback((prev: any) => ({ ...prev, status: newStatus, adminNotes: notes ?? prev.adminNotes }));
        }
      }
    } catch {
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!token || !confirm("Deseja realmente excluir este feedback?")) return;
    try {
      const res = await fetch(`/api/admin/feedbacks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (selectedFeedback?.id === id) setSelectedFeedback(null);
        fetchOverview();
      }
    } catch {}
  };

  const handleToggleCoupon = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchOverview();
    } catch {}
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim() || !token) return;
    setIsCreatingCoupon(true);
    try {
      const discountCents = Math.round(parseFloat(newCouponDiscount.replace(",", ".")) * 100) || 1000;
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCouponCode.trim().toUpperCase(),
          description: newCouponDesc.trim() || `Cupom Promocional ${newCouponCode.trim().toUpperCase()}`,
          discountCents,
        }),
      });
      if (res.ok) {
        setNewCouponCode("");
        setNewCouponDesc("");
        setNewCouponDiscount("10.00");
        fetchOverview();
      }
    } catch {
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "suggestion":
        return { label: "Sugestão", icon: Lightbulb, bg: "bg-amber-100 text-amber-800 border-amber-200" };
      case "bug":
        return { label: "Erro / Bug", icon: Bug, bg: "bg-rose-100 text-rose-800 border-rose-200" };
      case "question":
        return { label: "Dúvida", icon: HelpCircle, bg: "bg-blue-100 text-blue-800 border-blue-200" };
      case "praise":
        return { label: "Elogio", icon: Heart, bg: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      default:
        return { label: "Outro", icon: FileText, bg: "bg-slate-100 text-slate-800 border-slate-200" };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return { label: "Resolvido", bg: "bg-emerald-500 text-white" };
      case "analyzing":
        return { label: "Em Análise", bg: "bg-blue-500 text-white" };
      default:
        return { label: "Pendente", bg: "bg-amber-500 text-white animate-pulse" };
    }
  };

  const filteredFeedbacks = (data?.feedbacks || []).filter((f) => {
    if (feedbackTypeFilter !== "all" && f.type !== feedbackTypeFilter) return false;
    if (feedbackStatusFilter !== "all" && f.status !== feedbackStatusFilter) return false;
    if (feedbackSearch.trim()) {
      const q = feedbackSearch.toLowerCase();
      return (
        f.subject.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.userEmail.toLowerCase().includes(q) ||
        f.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredUsers = (data?.users || []).filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A5F] mb-3" />
        <p className="text-xs font-extrabold text-slate-600">Carregando dados da Visão Geral...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>Acesso Restrito ao Super Administrador</span>
        </div>
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] via-[#162B48] to-[#D95D39] text-white p-5 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-300" /> Super Admin • KedGo!
              </span>
              <span className="text-[10px] text-slate-300">
                theoked25@gmail.com
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Visão Geral do Aplicativo &amp; Feedbacks
            </h1>
            <p className="text-xs text-slate-200 mt-1 max-w-xl">
              Acompanhe o crescimento do app, cadastros dos amigos e responda aos feedbacks dos viajantes em tempo real.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold rounded-2xl transition cursor-pointer flex items-center gap-2 border border-white/15"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar Painel</span>
          </button>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Usuários Cadastrados</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats?.totalUsers || 0}</span>
            <span className="text-[9px] text-emerald-300 block font-semibold mt-0.5">
              {stats?.proUsersCount || 0} contas Pro / Vitalício
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Viagens Criadas</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats?.totalItineraries || 0}</span>
            <span className="text-[9px] text-slate-300 block font-semibold mt-0.5">
              {stats?.totalTravelers || 0} viajantes nos grupos
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Feedbacks Recebidos</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{stats?.totalFeedbacks || 0}</span>
            <span className="text-[9px] text-amber-200 block font-semibold mt-0.5">
              {stats?.pendingFeedbacks || 0} aguardando análise
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-xs">
            <span className="text-[10px] uppercase font-bold text-slate-300 block">Lote de Fundadores</span>
            <span className="text-xl sm:text-2xl font-black text-white">
              {stats?.foundersSold || 0} / {stats?.foundersLimit || 200}
            </span>
            <span className="text-[9px] text-emerald-300 block font-semibold mt-0.5">
              {(stats?.foundersLimit || 200) - (stats?.foundersSold || 0)} vagas restantes
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("feedbacks")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "feedbacks"
              ? "bg-[#1E3A5F] text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Feedbacks dos Viajantes</span>
          {(stats?.pendingFeedbacks || 0) > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {stats?.pendingFeedbacks}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "users"
              ? "bg-[#1E3A5F] text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Todos os Usuários ({data?.users.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "coupons"
              ? "bg-[#1E3A5F] text-white shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span>Cupons Promocionais ({data?.coupons.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: FEEDBACKS */}
      {activeTab === "feedbacks" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar feedbacks por assunto, texto ou e-mail..."
                value={feedbackSearch}
                onChange={(e) => setFeedbackSearch(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={feedbackTypeFilter}
                onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Tipos</option>
                <option value="suggestion">💡 Sugestões</option>
                <option value="bug">🐞 Erros / Bugs</option>
                <option value="question">❓ Dúvidas</option>
                <option value="praise">⭐ Elogios</option>
                <option value="other">📝 Outros</option>
              </select>

              {/* Status Filter */}
              <select
                value={feedbackStatusFilter}
                onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">🟡 Pendentes</option>
                <option value="analyzing">🔵 Em Análise</option>
                <option value="resolved">🟢 Resolvidos</option>
              </select>
            </div>
          </div>

          {/* Feedbacks Grid / List */}
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-700">Nenhum feedback encontrado</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Quando os amigos ou viajantes enviarem mensagens pelo formulário de configurações, elas aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFeedbacks.map((f) => {
                const typeBadge = getTypeBadge(f.type);
                const statusBadge = getStatusBadge(f.status);
                const TypeIcon = typeBadge.icon;
                const isUpdating = updatingFeedbackId === f.id;

                return (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${typeBadge.bg}`}
                          >
                            <TypeIcon className="w-3 h-3" />
                            {typeBadge.label}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </div>

                        {f.rating && (
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= f.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-800 line-clamp-1">{f.subject}</h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {f.message}
                      </p>

                      {f.adminNotes && (
                        <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 font-medium">
                          <strong>Anotação do Admin:</strong> {f.adminNotes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
                      <div>
                        <span className="font-bold text-slate-800 block">{f.userName}</span>
                        <span className="text-slate-400 block">{f.userEmail} • {new Date(f.createdAt).toLocaleString('pt-BR')}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        {f.status !== "analyzing" && (
                          <button
                            onClick={() => handleUpdateFeedbackStatus(f.id, "analyzing")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold transition cursor-pointer"
                          >
                            Em Análise
                          </button>
                        )}
                        {f.status !== "resolved" && (
                          <button
                            onClick={() => handleUpdateFeedbackStatus(f.id, "resolved")}
                            disabled={isUpdating}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Concluir
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFeedback(f.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Excluir feedback"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar usuário por nome, e-mail ou código de convite..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Plano</th>
                    <th className="py-3 px-4">Código Exclusivo</th>
                    <th className="py-3 px-4 text-center">Indicados</th>
                    <th className="py-3 px-4 text-center">Viagens</th>
                    <th className="py-3 px-4">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          {u.name}
                          {u.isSuperAdmin && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded-full font-bold">ADM</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {u.isLifetimePro ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">Pro Vitalício</span>
                        ) : u.isAnnualPro ? (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full">Pro Anual</span>
                        ) : u.planType === 'pass' ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">Passe Viagem</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Starter Grátis</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {u.referralCode || "—"}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {u.referralCount}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {u.itinerariesCount}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          {/* Create Coupon Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> Criar Novo Cupom Promocional
            </h3>
            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                placeholder="Código (ex: AMIGOS10)"
                value={newCouponCode}
                onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase"
              />
              <input
                type="text"
                placeholder="Descrição (ex: Desconto Grupo WhatsApp)"
                value={newCouponDesc}
                onChange={(e) => setNewCouponDesc(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 sm:col-span-2"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="R$ 10.00"
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(e.target.value)}
                  className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
                <button
                  type="submit"
                  disabled={isCreatingCoupon || !newCouponCode.trim()}
                  className="flex-1 px-4 py-2 bg-[#1E3A5F] hover:bg-[#162B48] text-white text-xs font-extrabold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isCreatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Criar Cupom</span>}
                </button>
              </div>
            </form>
          </div>

          {/* Coupons List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Desconto</th>
                    <th className="py-3 px-4 text-center">Usos</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.coupons || []).map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                        {c.code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">
                        {c.description || "Cupom Oficial"}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">
                        R$ {(c.discountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {c.usageCount}
                      </td>
                      <td className="py-3 px-4">
                        {c.isActive ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">Ativo</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Pausado</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            c.isActive
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {c.isActive ? "Pausar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOverview;
