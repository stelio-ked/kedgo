import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Plane, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Compass, 
  Building,
  ExternalLink,
  Map,
  CheckCircle2,
  Bell,
  Copy,
  Check,
  DollarSign,
  Users,
  Award,
  TrendingUp,
  Camera,
  Share2,
  ChevronRight,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Destination, FlightInfo, Traveler, CostItem } from "../types";
import { parseRangeToDates } from "../utils";

interface TripCountdownProps {
  destinations: Destination[];
  flights?: FlightInfo[];
  travelers?: Traveler[];
  costs?: CostItem[];
  title?: string;
  currentUser?: { email?: string; name?: string; isTraveler?: boolean } | null;
  onRateDestination?: (destinationId: string, rating: number) => void;
}

export default function TripCountdown({ 
  destinations = [],
  flights = [],
  travelers = [],
  costs = [],
  title,
  currentUser,
  onRateDestination
}: TripCountdownProps) {
  const [firstDest, setFirstDest] = useState<Destination | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"summary" | "countdown">("countdown");
  const [hoverRatings, setHoverRatings] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    status: "upcoming" | "ongoing" | "completed" | "none";
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: "none"
  });

  // Calculate if all flights are finalized
  const totalFlights = flights.length;
  const finishedFlightsCount = flights.filter(
    f => f.status === "Finalizado" || f.status === "Cancelado"
  ).length;
  const allFlightsFinalized = totalFlights > 0 && finishedFlightsCount === totalFlights;

  // Calculate Activities Progress & City Ratings
  const allCheckedIds = new Set<string>();
  travelers.forEach(t => {
    if (t.checkedActivities) {
      t.checkedActivities.split(",").forEach(rawId => {
        const clean = rawId.trim().replace(/^act-/, "");
        if (clean) allCheckedIds.add(clean);
      });
    }
  });

  let totalActivities = 0;
  let completedActivities = 0;
  let totalTripRatingSum = 0;
  let totalTripRatingVotes = 0;

  const userKey = currentUser?.email?.toLowerCase().trim() || currentUser?.name || "anonymous";

  const destProgress = destinations.map(dest => {
    let dTotal = 0;
    let dCompleted = 0;
    (dest.days || []).forEach(day => {
      (day.activities || []).forEach(act => {
        dTotal++;
        totalActivities++;
        const cleanActId = String(act.id).replace(/^act-/, "");
        if (allCheckedIds.has(cleanActId)) {
          dCompleted++;
          completedActivities++;
        }
      });
    });
    const pct = dTotal > 0 ? Math.round((dCompleted / dTotal) * 100) : 100;

    // Rating calculations for this destination
    const ratings = dest.ratings || {};
    const ratingValues = Object.values(ratings);
    const votesCount = ratingValues.length;
    const avgRating = votesCount > 0 ? (ratingValues.reduce((a, b) => a + b, 0) / votesCount) : 0;
    const myRating = ratings[userKey] || 0;

    ratingValues.forEach(val => {
      totalTripRatingSum += val;
      totalTripRatingVotes++;
    });

    return {
      id: dest.id,
      city: dest.city,
      total: dTotal,
      completed: dCompleted,
      percentage: pct,
      ratings,
      votesCount,
      avgRating,
      myRating
    };
  });

  const overallActivityPercentage = totalActivities > 0 
    ? Math.round((completedActivities / totalActivities) * 100) 
    : 100;

  const overallTripAvgRating = totalTripRatingVotes > 0 
    ? (totalTripRatingSum / totalTripRatingVotes).toFixed(1) 
    : null;

  // Financial Stats
  const totalCost = costs.reduce((sum, c) => sum + (c.totalCostBRL || 0), 0);
  const travelersCount = Math.max(1, travelers.length);
  const costPerPerson = totalCost / travelersCount;

  useEffect(() => {
    if (!destinations || destinations.length === 0) {
      setFirstDest(null);
      setTimeLeft(prev => ({ ...prev, status: "none" }));
      return;
    }

    const sorted = [...destinations].sort((a, b) => {
      const getVal = (d: Destination) => {
        if (d.startDate) return d.startDate;
        if (d.checkInDate) return d.checkInDate.split('T')[0];
        const parsed = parseRangeToDates(d.dates || "");
        return parsed.startDate;
      };
      return getVal(a).localeCompare(getVal(b));
    });

    const first = sorted[0];
    setFirstDest(first);

    let startDateStr = first.startDate;
    let endDateStr = first.endDate;

    if (!startDateStr || !endDateStr) {
      const parsed = parseRangeToDates(first.dates || "");
      startDateStr = startDateStr || parsed.startDate;
      endDateStr = endDateStr || parsed.endDate;
    }

    const checkInHour = first.checkInTime || "15:00";
    const checkOutHour = first.checkOutTime || "11:00";

    const checkInDateTime = new Date(`${startDateStr}T${checkInHour}:00`);
    const checkOutDateTime = new Date(`${endDateStr}T${checkOutHour}:00`);

    const updateTimer = () => {
      const now = new Date();

      if (isNaN(checkInDateTime.getTime())) {
        setTimeLeft(prev => ({ ...prev, status: "none" }));
        return;
      }

      if (now < checkInDateTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "upcoming" });
        const diff = checkInDateTime.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft({ days, hours, minutes, seconds, status: "upcoming" });
      } else if (now >= checkInDateTime && now <= checkOutDateTime) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "ongoing" });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, status: "completed" });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);

  }, [destinations]);

  // Default to summary mode if all flights are finalized or trip is completed
  useEffect(() => {
    if (allFlightsFinalized || timeLeft.status === "completed") {
      setViewMode("summary");
    }
  }, [allFlightsFinalized, timeLeft.status]);

  const handleCopySummary = () => {
    const tripTitle = title || "Minha Viagem";
    const formattedCost = totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const formattedPerPerson = costPerPerson.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    
    const citiesRatingText = destProgress.map(dp => {
      const ratingStr = dp.avgRating > 0 ? `⭐ ${dp.avgRating.toFixed(1)}/5 (${dp.votesCount} ${dp.votesCount === 1 ? 'voto' : 'votos'})` : `⭐ Sem avaliações`;
      return `  • ${dp.city}: ${dp.percentage}% atividades (${dp.completed}/${dp.total}) | ${ratingStr}`;
    }).join('\n');

    const overallRatingStr = overallTripAvgRating ? `⭐ Média Geral das Cidades: ${overallTripAvgRating}/5.0 (${totalTripRatingVotes} avaliações)` : `⭐ Média Geral: Sem avaliações ainda`;

    const summaryText = `✈️ ROTEIRO FINALIZADO — ${tripTitle}
🎯 Conclusão das Atividades: ${overallActivityPercentage}% (${completedActivities}/${totalActivities})
${overallRatingStr}
💰 Custo Total Unificado: ${formattedCost}
👥 Valor por Viajante (${travelersCount} pessoas): ${formattedPerPerson}
🌆 Avaliação & Detalhamento dos Destinos:
${citiesRatingText}
✈️ Voos Concluídos: ${finishedFlightsCount}/${totalFlights}
✨ Compartilhado via Minhas Viagens`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (timeLeft.status === "none" && !allFlightsFinalized) {
    return null;
  }

  // -------------------------------------------------------------
  // RENDER SUMMARY / SOCIAL CARD MODE
  // -------------------------------------------------------------
  if (viewMode === "summary" || (allFlightsFinalized && viewMode !== "countdown")) {
    return (
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative border border-amber-500/20">
        {/* Background Decorative Art */}
        <div className="absolute top-0 right-0 p-8 opacity-10 select-none pointer-events-none">
          <Compass className="w-80 h-80 transform rotate-12 text-amber-300 animate-spin-slow" />
        </div>
        <div className="absolute bottom-[-30px] left-[10%] p-4 opacity-[0.05] select-none pointer-events-none">
          <Award className="w-96 h-96 transform -rotate-12 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Top Header Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0 shadow-lg">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-amber-300 font-black uppercase tracking-widest block">Destaque da Viagem</span>
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Finalizado
                  </span>
                </div>
                <h2 className="font-black text-white text-lg md:text-xl uppercase tracking-wide">
                  {title || "Resumo da Viagem"}
                </h2>
              </div>
            </div>

            {/* View Mode Switcher & Copy Button */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {firstDest && (
                <div className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setViewMode("summary")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      viewMode === "summary"
                        ? "bg-amber-500 text-slate-950 font-black shadow-md"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    📊 Resumo
                  </button>
                  <button
                    onClick={() => setViewMode("countdown")}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      viewMode === "countdown"
                        ? "bg-indigo-600 text-white font-black shadow-md"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    ✈️ Próxima Escala
                  </button>
                </div>
              )}

              <button
                onClick={handleCopySummary}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                title="Copiar resumo para compartilhar"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Card Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Activity Percentage Gauge & Destinations */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5 backdrop-blur-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-amber-300 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    Aproveitamento do Roteiro
                  </span>
                  <span className="text-xs text-slate-300 font-bold">
                    {completedActivities} / {totalActivities} Atividades
                  </span>
                </div>

                {/* Main Progress Display */}
                <div className="flex items-center gap-5 bg-slate-900/60 p-4 rounded-xl border border-white/5">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-white/10"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-amber-400"
                        strokeDasharray={`${overallActivityPercentage}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black font-mono text-amber-300 leading-none">
                        {overallActivityPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">
                      {overallActivityPercentage === 100
                        ? "Roteiro 100% Concluído! 🎉"
                        : "Atividades Realizadas com Sucesso!"}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium">
                      Atividades marcadas e validadas pelos viajantes do grupo durante a viagem.
                    </p>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-white/10 rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 via-orange-400 to-emerald-400 h-full rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: `${overallActivityPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Destinations Mini Breakdown & Ratings */}
                {destProgress.length > 0 && (
                  <div className="pt-2 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                        Avaliações & Detalhamento por Destino
                      </span>
                      {overallTripAvgRating && (
                        <span className="text-[10px] text-amber-300 font-extrabold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          Média Geral: {overallTripAvgRating}/5.0
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {destProgress.map(dp => (
                        <div key={dp.id} className="bg-white/5 border border-white/10 p-3 rounded-2xl space-y-2 backdrop-blur-xs">
                          {/* City Name & Activities Progress */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="font-extrabold text-white text-xs truncate" title={dp.city}>
                                {dp.city}
                              </span>
                            </div>
                            <span className="font-mono text-amber-300 font-black text-xs shrink-0">
                              {dp.percentage}% ({dp.completed}/{dp.total})
                            </span>
                          </div>

                          {/* Star Rating Section */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-300 text-xs flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {dp.avgRating > 0 ? dp.avgRating.toFixed(1) : "—"}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {dp.votesCount > 0 ? `(${dp.votesCount} ${dp.votesCount === 1 ? 'voto' : 'votos'})` : '(sem nota)'}
                              </span>
                            </div>

                            {/* Interactive Star Buttons */}
                            {onRateDestination && (
                              <div className="flex items-center gap-0.5" title="Sua nota para esta cidade">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const activeLevel = hoverRatings[dp.id] !== undefined 
                                    ? hoverRatings[dp.id] 
                                    : dp.myRating;
                                  const isFilled = star <= activeLevel;
                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => onRateDestination(dp.id, star)}
                                      onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [dp.id]: star }))}
                                      onMouseLeave={() => setHoverRatings(prev => {
                                        const copy = { ...prev };
                                        delete copy[dp.id];
                                        return copy;
                                      })}
                                      className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                                      aria-label={`Avaliar ${dp.city} com ${star} estrelas`}
                                    >
                                      <Star
                                        className={`w-3.5 h-3.5 ${
                                          isFilled
                                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                            : "text-slate-500 fill-slate-800/80 hover:text-amber-300"
                                        }`}
                                      />
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Unified Financials & Highlights */}
            <div className="lg:col-span-5 bg-gradient-to-b from-white/10 to-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between space-y-5 backdrop-blur-md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <DollarSign className="w-5 h-5 p-1 bg-emerald-500/20 rounded-lg border border-emerald-500/30" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                    Custos Unificados da Viagem
                  </span>
                </div>

                {/* Unified Cost Highlights */}
                <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 space-y-3">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                      Investimento Total
                    </span>
                    <span className="text-2xl md:text-3xl font-black text-amber-300 font-mono">
                      {totalCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Por Viajante ({travelersCount}):</span>
                    <span className="font-black text-emerald-400 font-mono text-sm">
                      {costPerPerson.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  </div>
                </div>

                {/* Key Trip Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase">Grupo</span>
                      <span className="font-black text-white">{travelersCount} Viajantes</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase">Cidades</span>
                      <span className="font-black text-white">{destinations.length} Destinos</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase">Voos</span>
                      <span className="font-black text-white">{finishedFlightsCount}/{totalFlights} Trechos</span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase">Média Cidades</span>
                      <span className="font-black text-amber-300">
                        {overallTripAvgRating ? `${overallTripAvgRating} ★` : "Sem notas"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[8px] text-slate-400 font-bold block uppercase">Status</span>
                      <span className="font-black text-emerald-300">Concluído</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Print & Share Footnote */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-200/90 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Tire um print para postar e guardar de recordação!
                </span>
                <span className="font-mono font-bold text-amber-300">#MinhasViagens</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TRADITIONAL / COUNTDOWN & NEXT DESTINATION VIEW
  // -------------------------------------------------------------
  if (!firstDest) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden relative border border-indigo-500/10">
      {/* Background World Map / Plane Art overlay */}
      <div className="absolute top-0 right-0 p-8 opacity-5 select-none pointer-events-none">
        <Compass className="w-64 h-64 transform rotate-12 text-white animate-spin-slow" />
      </div>
      <div className="absolute bottom-[-20px] left-[20%] p-4 opacity-[0.03] select-none pointer-events-none">
        <Plane className="w-80 h-80 transform -rotate-45 text-white" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header Ribbon & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[9px] text-orange-400 font-extrabold uppercase tracking-widest block mb-0.5">Destaque da Viagem</span>
              <h2 className="font-extrabold text-white text-base md:text-lg uppercase tracking-wide">
                Visualização de Próxima Viagem
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode("summary")}
                className="px-3 py-1 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                📊 Resumo
              </button>
              <button
                onClick={() => setViewMode("countdown")}
                className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-black shadow-md transition-all cursor-pointer"
              >
                ✈️ Próxima Escala
              </button>
            </div>

            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-350 font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Horário Local: de Brasília</span>
            </div>
          </div>
        </div>

        {/* Content Columns: Host Info vs Countdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Destination Showcase - 7 Cols */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/20 text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                Primeira Escala
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
                {firstDest.city}
              </h3>
              <p className="text-xs text-slate-350 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{firstDest.city}, {firstDest.state && `${firstDest.state}, `}{firstDest.country}</span>
              </p>
            </div>

            {/* Accommodation card under first destination */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Local de Hospedagem</span>
                  <h4 className="font-bold text-sm text-white truncate">
                    {firstDest.hotelName || "A definir pousada / hotel"}
                  </h4>
                  {firstDest.hotelAddress && (
                    <p className="text-[11px] text-slate-300 font-medium line-clamp-1">
                      {firstDest.hotelAddress}
                    </p>
                  )}
                </div>
              </div>

              {/* Badges / metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-white/5 text-[10px]">
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase font-bold tracking-wider">Período</span>
                  <span className="font-extrabold text-[#FEE2E2] flex items-center gap-1 mt-0.5 font-mono">
                    <Calendar className="w-3 h-3 text-rose-400 shrink-0" />
                    {firstDest.dates}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[8px] uppercase font-bold tracking-wider">Horário Check-In</span>
                  <span className="font-extrabold text-emerald-400 mt-0.5 block">
                    {firstDest.checkInTime || "15:00"}h
                  </span>
                </div>
                {firstDest.hotelLink && (
                  <div className="col-span-2 md:col-span-1 flex items-end">
                    <a
                      href={firstDest.hotelLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-center py-1 px-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/20 rounded-lg text-indigo-300 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer truncate"
                    >
                      <Map className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>Ver no Local</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-80" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Big Countdown Timer - 5 Cols */}
          <div className="lg:col-span-5 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden backdrop-blur-xs min-h-[190px]">
            {timeLeft.status === "upcoming" && (
              <>
                <div className="text-center space-y-1">
                  <span className="text-[9px] text-orange-400 font-black uppercase tracking-widest inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Bell className="w-2.5 h-2.5 text-orange-400 animate-bounce" /> Contagem Regressiva para Check-In
                  </span>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-wider py-1">
                    Faltas apenas para o embarque / estadia:
                  </p>
                </div>

                {/* Display Grid */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 md:w-15 md:h-15 bg-white text-slate-900 rounded-xl flex flex-col items-center justify-center shadow-lg">
                      <span className="text-xl md:text-2xl font-black font-mono leading-none">{timeLeft.days}</span>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Dias</span>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-indigo-400 animate-pulse font-mono">:</span>

                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 md:w-15 md:h-15 bg-white text-slate-900 rounded-xl flex flex-col items-center justify-center shadow-lg">
                      <span className="text-xl md:text-2xl font-black font-mono leading-none">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Horas</span>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-indigo-400 animate-pulse font-mono">:</span>

                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 md:w-15 md:h-15 bg-white text-slate-900 rounded-xl flex flex-col items-center justify-center shadow-lg">
                      <span className="text-xl md:text-2xl font-black font-mono leading-none">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Min</span>
                    </div>
                  </div>

                  <span className="text-lg font-bold text-indigo-500/40 animate-pulse font-mono">:</span>

                  <div className="flex flex-col items-center">
                    <div className="w-13 h-13 md:w-15 md:h-15 bg-indigo-500/25 border border-indigo-400/25 text-indigo-300 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-xl md:text-2xl font-black font-mono leading-none">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                      <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Seg</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium">
                  Até o dia {firstDest.dates.split("-")[0].trim() || "de início"} às {firstDest.checkInTime || "15:00"}h
                </div>
              </>
            )}

            {timeLeft.status === "ongoing" && (
              <div className="space-y-3 py-4 w-full">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
                  <CheckCircle2 className="w-6 h-6 animate-spin-slow" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-400">A Viagem Começou! 🎉</h4>
                  <p className="text-[11px] text-slate-300 max-w-xs font-medium mx-auto">
                    Você já está no período de hospedagem / escala em <span className="text-white font-bold">{firstDest.city}</span>!
                  </p>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold bg-white/5 py-1 px-2.5 rounded-lg inline-block select-none">
                  Aproveite cada momento! ✈️
                </div>
              </div>
            )}

            {(timeLeft.status === "completed" || allFlightsFinalized) && (
              <div className="space-y-3 py-4 text-slate-300">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-300">Roteiro Concluído! ✈️</h4>
                  <p className="text-[11px] text-slate-300 font-medium max-w-[240px] mx-auto">
                    Todos os trechos e estadas foram finalizados com sucesso.
                  </p>
                </div>
                <button
                  onClick={() => setViewMode("summary")}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Ver Card Resumo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
