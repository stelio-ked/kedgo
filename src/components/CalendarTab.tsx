import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Sparkles,
  Plane,
  Building2,
  Compass,
  Utensils,
  CalendarDays
} from "lucide-react";
import { Destination, ItineraryDay } from "../types";
import { sortActivitiesByTime } from "../utils";

interface CalendarTabProps {
  destinations: Destination[];
  setActiveTab: (tab: string) => void;
  setSelectedDestinationId: (id: string) => void;
}

interface CalendarDaySlot {
  date: Date;
  dateStrISO: string; // YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  destination: Destination | null;
  itineraryDay: ItineraryDay | null;
  keyStr: string;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTH_NAMES_UPPER = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
];

// Color palette generator for trip destinations
const DESTINATION_COLOR_CLASSES = [
  { bg: "bg-indigo-50 hover:bg-indigo-100/80 border-indigo-200 text-indigo-950", badge: "bg-indigo-600 text-white", dot: "bg-indigo-500", text: "text-indigo-700" },
  { bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-950", badge: "bg-emerald-600 text-white", dot: "bg-emerald-500", text: "text-emerald-700" },
  { bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950", badge: "bg-amber-600 text-white", dot: "bg-amber-500", text: "text-amber-700" },
  { bg: "bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-950", badge: "bg-rose-600 text-white", dot: "bg-rose-500", text: "text-rose-700" },
  { bg: "bg-sky-50 hover:bg-sky-100/80 border-sky-200 text-sky-950", badge: "bg-sky-600 text-white", dot: "bg-sky-500", text: "text-sky-700" },
  { bg: "bg-purple-50 hover:bg-purple-100/80 border-purple-200 text-purple-950", badge: "bg-purple-600 text-white", dot: "bg-purple-500", text: "text-purple-700" },
  { bg: "bg-teal-50 hover:bg-teal-100/80 border-teal-200 text-teal-950", badge: "bg-teal-600 text-white", dot: "bg-teal-500", text: "text-teal-700" },
];

export default function CalendarTab({
  destinations,
  setActiveTab,
  setSelectedDestinationId,
}: CalendarTabProps) {
  
  // Find initial month & year from destinations
  const initialDate = useMemo(() => {
    if (destinations && destinations.length > 0) {
      for (const dest of destinations) {
        if (dest.startDate) {
          const parts = dest.startDate.split("-").map(Number);
          if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return new Date(parts[0], parts[1] - 1, parts[2] || 1);
          }
        }
        if (dest.checkInDate) {
          const d = new Date(dest.checkInDate);
          if (!isNaN(d.getTime())) return d;
        }
        if (dest.dates) {
          const matchMonth = dest.dates.match(/(\d+)\s*([a-zçáõ]+)/i);
          if (matchMonth) {
            const m = matchMonth[2].toLowerCase();
            const map: any = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
            for (const key in map) {
              if (m.includes(key)) {
                return new Date(2026, map[key], parseInt(matchMonth[1], 10) || 1);
              }
            }
          }
        }
      }
    }
    return new Date(); // fallback to current date
  }, [destinations]);

  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<CalendarDaySlot | null>(null);

  // Sync viewDate when destinations change drastically
  useEffect(() => {
    setViewDate(initialDate);
  }, [initialDate]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToTripStart = () => {
    setViewDate(initialDate);
  };

  // Map destination ID to color class
  const destinationColorMap = useMemo(() => {
    const map = new Map<string, typeof DESTINATION_COLOR_CLASSES[0]>();
    destinations.forEach((dest, idx) => {
      map.set(dest.id, DESTINATION_COLOR_CLASSES[idx % DESTINATION_COLOR_CLASSES.length]);
    });
    return map;
  }, [destinations]);

  // Helper: map a date to destination
  const findDestinationForDate = (date: Date): Destination | null => {
    const targetISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0).getTime();

    // 1st pass: Exact startDate / endDate range
    for (const dest of destinations) {
      if (dest.startDate && dest.endDate) {
        const sParts = dest.startDate.split("-").map(Number);
        const eParts = dest.endDate.split("-").map(Number);
        if (sParts.length === 3 && eParts.length === 3) {
          const start = new Date(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0).getTime();
          const end = new Date(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59).getTime();
          if (targetTime >= start && targetTime <= end) {
            return dest;
          }
        }
      }
    }

    // 2nd pass: Check if any destination's day matches this date string
    const dStr = date.getDate().toString().padStart(2, "0");
    const dVal = date.getDate().toString();
    const monthStr = MONTH_NAMES[date.getMonth()];
    const query1 = `${dStr} de ${monthStr}`.toLowerCase();
    const query2 = `${dVal} de ${monthStr}`.toLowerCase();

    for (const dest of destinations) {
      if (dest.days) {
        const found = dest.days.find(d => {
          const lower = (d.dateStr || "").toLowerCase();
          return lower.includes(query1) || lower.includes(query2) || lower.includes(targetISO);
        });
        if (found) return dest;
      }
    }

    // 3rd pass: Friendly date range matching
    for (const dest of destinations) {
      if (dest.dates) {
        const match = dest.dates.match(/(\d+)\s*([a-zçáõ]+)\s*-\s*(\d+)\s*([a-zçáõ]+)/i);
        if (match) {
          const mapMonths: any = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
          let sMonth = currentMonth;
          let eMonth = currentMonth;
          for (const k in mapMonths) {
            if (match[2].toLowerCase().includes(k)) sMonth = mapMonths[k];
            if (match[4].toLowerCase().includes(k)) eMonth = mapMonths[k];
          }
          const sDay = parseInt(match[1], 10);
          const eDay = parseInt(match[3], 10);
          const start = new Date(currentYear, sMonth, sDay, 0, 0, 0).getTime();
          const end = new Date(currentYear, eMonth, eDay, 23, 59, 59).getTime();
          if (targetTime >= start && targetTime <= end) {
            return dest;
          }
        }
      }
    }

    return null;
  };

  // Helper: map a date to an exact ItineraryDay
  const findItineraryDayForDate = (date: Date, dest: Destination | null): ItineraryDay | null => {
    if (!dest || !dest.days || dest.days.length === 0) return null;

    const targetISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const dStr = date.getDate().toString().padStart(2, "0");
    const dVal = date.getDate().toString();
    const monthStr = MONTH_NAMES[date.getMonth()];
    const query1 = `${dStr} de ${monthStr}`.toLowerCase();
    const query2 = `${dVal} de ${monthStr}`.toLowerCase();

    // Look for day matching target date
    const day = dest.days.find((d) => {
      const lowerStr = (d.dateStr || "").toLowerCase();
      return lowerStr.includes(query1) || lowerStr.includes(query2) || lowerStr.includes(targetISO);
    });

    if (day) return day;

    // Fallback: If destination has startDate, calculate offset day index
    if (dest.startDate) {
      const sParts = dest.startDate.split("-").map(Number);
      if (sParts.length === 3) {
        const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        const diffTime = date.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < dest.days.length) {
          return dest.days[diffDays];
        }
      }
    }

    return null;
  };

  // Generate 42 calendar slots for current viewDate
  const calendarSlots = useMemo((): CalendarDaySlot[] => {
    const slots: CalendarDaySlot[] = [];
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Pad previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dest = findDestinationForDate(date);
      slots.push({
        date,
        dateStrISO: iso,
        dayOfMonth: daysInPrevMonth - i,
        isCurrentMonth: false,
        destination: dest,
        itineraryDay: findItineraryDayForDate(date, dest),
        keyStr: `prev-${iso}`
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dest = findDestinationForDate(date);
      slots.push({
        date,
        dateStrISO: iso,
        dayOfMonth: day,
        isCurrentMonth: true,
        destination: dest,
        itineraryDay: findItineraryDayForDate(date, dest),
        keyStr: `curr-${iso}`
      });
    }

    // Pad next month days to complete 42 slots (6 full weeks)
    const remainingSlots = 42 - slots.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dest = findDestinationForDate(date);
      slots.push({
        date,
        dateStrISO: iso,
        dayOfMonth: day,
        isCurrentMonth: false,
        destination: dest,
        itineraryDay: findItineraryDayForDate(date, dest),
        keyStr: `next-${iso}`
      });
    }

    return slots;
  }, [currentYear, currentMonth, destinations]);

  // Activity type icon helper
  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "flight":
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-black"><Plane className="w-3 h-3" /> Voo/Transfer</span>;
      case "hotel":
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black"><Building2 className="w-3 h-3" /> Hospedagem</span>;
      case "dinner":
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black"><Utensils className="w-3 h-3" /> Gastronomia</span>;
      case "tour":
      default:
        return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black"><Compass className="w-3 h-3" /> Passeio</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Calendar top headers */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-5">
        
        {/* Header Title + Dynamic Destinations Legend */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2 tracking-tight">
              <CalendarIcon className="w-5 h-5 text-indigo-650" />
              <span>Agenda Centralizada de Viagem</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Visão cronológica completa do mês de {MONTH_NAMES[currentMonth]} de {currentYear}
            </p>
          </div>

          {/* Dynamic Destination Legends */}
          <div className="flex flex-wrap items-center gap-2">
            {destinations && destinations.length > 0 ? (
              destinations.map((dest) => {
                const color = destinationColorMap.get(dest.id) || DESTINATION_COLOR_CLASSES[0];
                return (
                  <button
                    key={dest.id}
                    onClick={() => {
                      setSelectedDestinationId(dest.id);
                      if (dest.startDate) {
                        const p = dest.startDate.split("-").map(Number);
                        if (p.length === 3) setViewDate(new Date(p[0], p[1] - 1, p[2]));
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${color.bg}`}
                    title={`Ver parada em ${dest.city} (${dest.dates || ""})`}
                  >
                    <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                    <span>{dest.city}</span>
                    {dest.dates && <span className="text-[9px] opacity-70 font-mono">({dest.dates})</span>}
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-slate-400">Nenhum destino carregado</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Month Grid (2/3 of space) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Interactive Month Navigation Toolbar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 p-2 sm:p-2.5 rounded-2xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-black"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-800 tracking-wider">
                  {MONTH_NAMES_UPPER[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleJumpToTripStart}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-indigo-650 rounded-xl text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Pular para o início da viagem"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Início da Viagem</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-black"
                title="Próximo Mês"
              >
                <span className="hidden sm:inline">Próximo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider py-1">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* 42 Calendar Day Slots */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarSlots.map((slot) => {
                const isActive = selectedSlot?.keyStr === slot.keyStr;
                const destColor = slot.destination ? (destinationColorMap.get(slot.destination.id) || DESTINATION_COLOR_CLASSES[0]) : null;
                const hasActivities = slot.itineraryDay && slot.itineraryDay.activities && slot.itineraryDay.activities.length > 0;

                return (
                  <div
                    key={slot.keyStr}
                    onClick={() => setSelectedSlot(slot)}
                    className={`min-h-[64px] sm:min-h-[76px] p-2 rounded-2xl border text-left cursor-pointer flex flex-col justify-between transition-all select-none relative group ${
                      isActive 
                        ? "ring-2 ring-indigo-600 border-indigo-600 shadow-md bg-white z-10" 
                        : destColor 
                          ? `${destColor.bg} hover:shadow-xs` 
                          : "bg-white hover:bg-slate-50 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${
                        slot.isCurrentMonth ? "text-slate-800" : "text-slate-300 opacity-60"
                      }`}>
                        {slot.dayOfMonth}
                      </span>

                      {hasActivities && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title={`${slot.itineraryDay?.activities.length} atividades programadas`} />
                      )}
                    </div>
                    
                    {slot.destination ? (
                      <div className="space-y-0.5 mt-1">
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase truncate tracking-tight block px-1 py-0.5 rounded-md ${
                          destColor?.badge || "bg-indigo-600 text-white"
                        }`}>
                          {slot.destination.city}
                        </span>
                        {slot.itineraryDay && (
                          <span className="text-[7px] font-extrabold text-slate-500 line-clamp-1 hidden sm:block">
                            {slot.itineraryDay.activities.length} ativ.
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Activities Inspector (1/3 of space) */}
          <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-4 space-y-4">
            {selectedSlot ? (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl border border-slate-900 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Detalhes do Dia</span>
                    </p>
                    {selectedSlot.itineraryDay && (
                      <span className="px-2 py-0.5 bg-white/10 rounded-full text-[10px] font-black text-indigo-200">
                        Dia {selectedSlot.itineraryDay.dayNumber || "Programado"}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-black capitalize leading-snug">
                    {selectedSlot.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>

                  {selectedSlot.destination ? (
                    <div className="pt-1 flex items-center gap-1.5 text-xs text-indigo-200 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Destino: {selectedSlot.destination.city}{selectedSlot.destination.country ? `, ${selectedSlot.destination.country}` : ""}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 block pt-1">Nenhuma parada oficial marcada neste dia</span>
                  )}
                </div>

                {selectedSlot.itineraryDay && selectedSlot.itineraryDay.activities && selectedSlot.itineraryDay.activities.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Programação do Dia ({selectedSlot.itineraryDay.activities.length})
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3 max-h-[300px] overflow-y-auto">
                      <p className="text-xs font-black text-slate-900 leading-tight">
                        {selectedSlot.itineraryDay.title || "Dia de Atividades"}
                      </p>
                      
                      <div className="divide-y divide-slate-200/80 space-y-2.5 pt-1">
                        {sortActivitiesByTime(selectedSlot.itineraryDay.activities).map((act) => (
                          <div key={act.id} className="pt-2.5 text-[11px] space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="inline-block bg-slate-900 text-white font-black px-1.5 py-0.5 rounded-md font-mono text-[9px]">
                                {act.time || "Horário flexível"}
                              </span>
                              {getActivityTypeBadge(act.type || "tour")}
                            </div>
                            <p className="font-extrabold text-slate-800 leading-snug">{act.location}</p>
                            {act.notes && (
                              <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">
                                {act.notes}
                              </p>
                            )}
                            <div className="text-slate-400 text-[10px] flex items-center gap-2 pt-0.5">
                              {act.duration && <span>⏱ {act.duration}</span>}
                              {act.cost && <span>💰 {act.cost}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSlot.destination) {
                          setSelectedDestinationId(selectedSlot.destination.id);
                          setActiveTab("itinerary");
                        }
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Abrir no Diário de Roteiros</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-slate-200 rounded-3xl text-center space-y-2 bg-slate-50/50">
                    <AlertCircle className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-black text-slate-700">Sem atividades horárias neste dia</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      Você pode adicionar paradas, restaurantes ou atrações acessando o <strong>Diário de Roteiros</strong>.
                    </p>
                    {selectedSlot.destination && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDestinationId(selectedSlot.destination!.id);
                          setActiveTab("itinerary");
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-black text-indigo-650 hover:underline cursor-pointer"
                      >
                        <span>Ver parada em {selectedSlot.destination.city}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-slate-50/40 rounded-3xl border border-dashed border-slate-200 space-y-2">
                <CalendarIcon className="w-9 h-9 text-slate-300 animate-pulse" />
                <p className="text-xs font-black text-slate-800">Selecione uma data na agenda</p>
                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Clique em qualquer dia do mês para visualizar hospedagem, voos e os passeios programados pela KedIA.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
