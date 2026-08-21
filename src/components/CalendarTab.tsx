import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronRight, HelpCircle, AlertCircle } from "lucide-react";
import { Destination, ItineraryDay } from "../types";
import { sortActivitiesByTime, parseRangeToDates } from "../utils";

interface CalendarTabProps {
  destinations: Destination[];
  setActiveTab: (tab: string) => void;
  setSelectedDestinationId: (id: string) => void;
}

interface CalendarDaySlot {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  destination: Destination | null;
  itineraryDay: ItineraryDay | null;
  keyStr: string;
}

export default function CalendarTab({
  destinations,
  setActiveTab,
  setSelectedDestinationId,
}: CalendarTabProps) {
  // Calendar focuses around July 2026 as represented by "30 jun" and "21 jul" trip dates
  const year = 2026;
  const month = 6; // July (0-indexed represents July corresponds to index 6)
  
  const [selectedSlot, setSelectedSlot] = useState<CalendarDaySlot | null>(null);

  // Generate Calendar slots for July 2026 plus leading/trailing padding days
  const getCalendarSlots = (): CalendarDaySlot[] => {
    const slots: CalendarDaySlot[] = [];
    
    // First day of July 2026 is a Wednesday (index 3, since Sun=0, Mon=1, Tue=2, Wed=3)
    const firstDayOfJuly = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfJuly.getDay(); // 3 (Wednesday)

    // Number of days in July 2026
    const daysInJuly = 31;

    // Days in June to pad front
    // June 2026 ends on Tuesday 30.
    const daysInJune = 30;

    // Pad Front with last few days of June
    // startDayOfWeek is 3, so we want June 28, 29, 30 if starts on Wed
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInJune - i);
      slots.push({
        date,
        dayOfMonth: daysInJune - i,
        isCurrentMonth: false,
        destination: findDestinationForDate(date),
        itineraryDay: findItineraryDayForDate(date),
        keyStr: `june-${daysInJune - i}`
      });
    }

    // Add July days
    for (let day = 1; day <= daysInJuly; day++) {
      const date = new Date(year, month, day);
      slots.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        destination: findDestinationForDate(date),
        itineraryDay: findItineraryDayForDate(date),
        keyStr: `july-${day}`
      });
    }

    // Pad Back with August leading days to complete full 6 weeks layout (42 slots)
    const remainingSlots = 42 - slots.length;
    for (let day = 1; day <= remainingSlots; day++) {
      const date = new Date(year, month + 1, day);
      slots.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: false,
        destination: findDestinationForDate(date),
        itineraryDay: findItineraryDayForDate(date),
        keyStr: `august-${day}`
      });
    }

    return slots;
  };

  // Helper: map dates to destinations represented in mock range
  const findDestinationForDate = (date: Date): Destination | null => {
    // Convert date of search to absolute timestamp at noon to skip hours issues
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).getTime();

    // 1st pass: Does any destination explicitly have an ItineraryDay for this date?
    const dStr = date.getDate().toString().padStart(2, "0");
    const dVal = date.getDate().toString();
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthStr = months[date.getMonth()];
    const query1 = `${dStr} de ${monthStr}`.toLowerCase();
    const query2 = `${dVal} de ${monthStr}`.toLowerCase();

    for (const dest of destinations) {
      if (dest.days) {
        const foundDay = dest.days.find(d => {
          const lower = d.dateStr.toLowerCase();
          return lower.includes(query1) || lower.includes(query2);
        });
        if (foundDay) return dest;
      }
    }

    // 2nd pass: Fallback to Friendly Date Range checking
    for (const dest of destinations) {
      if (!dest.dates) continue;
      const { startDate, endDate } = parseRangeToDates(dest.dates, year);
      
      const sParts = startDate.split("-").map(Number);
      const eParts = endDate.split("-").map(Number);
      
      const start = new Date(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0).getTime();
      const end = new Date(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59).getTime();

      if (targetTime >= start && targetTime <= end) {
        return dest;
      }
    }
    return null;
  };

  // Helper: map dates to exact itinerary days
  const findItineraryDayForDate = (date: Date): ItineraryDay | null => {
    const dest = findDestinationForDate(date);
    if (!dest || !dest.days) return null;
    
    // Look for day matching target date
    const dStr = date.getDate().toString().padStart(2, "0");
    const dVal = date.getDate().toString();
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthStr = months[date.getMonth()];
    
    const query1 = `${dStr} de ${monthStr}`.toLowerCase();
    const query2 = `${dVal} de ${monthStr}`.toLowerCase();

    const day = dest.days.find((d) => {
      const lowerStr = d.dateStr.toLowerCase();
      return lowerStr.includes(query1) || lowerStr.includes(query2);
    });
    return day || null;
  };

  const slots = getCalendarSlots();

  // Color mappings per city
  const getBgClass = (cityName: string | undefined): string => {
    if (!cityName) return "bg-white hover:bg-slate-50 border-slate-100";
    switch (cityName) {
      case "Washington": return "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900";
      case "New York": return "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900";
      case "Philadelphia": return "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900";
      case "Atlantic City": return "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900";
      case "Chantilly": return "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900";
      default: return "bg-slate-100 hover:bg-slate-150 border-slate-205 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Calendar top headers */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
              <CalendarIcon className="w-5 h-5 text-indigo-650" /> Agenda Centralizada de Viagem
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Visão cronológica completa do mês de Julho de 2026</p>
          </div>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-200 rounded-xs" /> Washington</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-200 rounded-xs" /> New York</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-sky-200 rounded-xs" /> Philadelphia</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-200 rounded-xs" /> Atlantic City</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Month Grid (2/3 of space) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-center font-extrabold text-xs text-slate-700 bg-slate-50 p-2 rounded-xl">
              JULHO 2026
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 h-72">
              {slots.map((slot) => {
                const isActive = selectedSlot?.keyStr === slot.keyStr;
                return (
                  <div
                    key={slot.keyStr}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-1.5 rounded-xl border text-left cursor-pointer flex flex-col justify-between transition-all ${
                      isActive ? "ring-2 ring-slate-900 border-slate-900" : ""
                    } ${getBgClass(slot.destination?.city)}`}
                  >
                    <span className={`text-[10px] font-bold ${slot.isCurrentMonth ? "opacity-100" : "opacity-30"}`}>
                      {slot.dayOfMonth}
                    </span>
                    
                    {slot.destination && (
                      <span className="text-[7px] font-black uppercase truncate tracking-snug block">
                        {slot.destination.city.substring(0, 7)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Activities Inspector (1/3 of space) */}
          <div className="lg:col-span-1 border-l border-slate-50 pl-2 space-y-4">
            {selectedSlot ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-950 space-y-1.5">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Lente da Agenda</p>
                  <p className="text-sm font-black">
                    {selectedSlot.date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  {selectedSlot.destination ? (
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-300 font-bold">
                      <MapPin className="w-3.5 h-3.5" /> Parada: {selectedSlot.destination.city}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Nenhuma parada programada</span>
                  )}
                </div>

                {selectedSlot.itineraryDay ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Roteiro Diário</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3 max-h-[220px] overflow-y-auto">
                      <p className="text-xs font-extrabold text-slate-800">{selectedSlot.itineraryDay.title}</p>
                      
                      <div className="divide-y divide-slate-150 space-y-2">
                        {sortActivitiesByTime(selectedSlot.itineraryDay.activities).map((act) => (
                          <div key={act.id} className="pt-2 text-[11px] space-y-1">
                            <span className="inline-block bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-sm font-mono text-[9px] mr-1.5">
                              {act.time}
                            </span>
                            <span className="font-bold text-slate-800">{act.location}</span>
                            <p className="text-slate-400 text-[10px] flex items-center gap-1 pl-8">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              Duração: {act.duration} | Investimento: {act.cost}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (selectedSlot.destination) {
                          setSelectedDestinationId(selectedSlot.destination.id);
                          setActiveTab("itinerary");
                        }
                      }}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1"
                    >
                      Navegar p/ Diário de Bordo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-slate-205 rounded-2xl text-center text-slate-400 text-xs">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-extrabold">Sem atividades diárias</p>
                    <p className="text-[10px] text-slate-450 leading-relaxed mt-1">
                      No dia {selectedSlot.dayOfMonth}, não há atividades horárias salvas no banco. Sinta-se livre para criá-las acessando o <strong>Diário de Bordo</strong> no menu de abas.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CalendarIcon className="w-10 h-10 text-slate-300 mb-3 animate-spin duration-3000" />
                <p className="text-xs font-extrabold text-slate-700">Selecione uma data</p>
                <p className="text-[11px] text-slate-450 mt-1 max-w-xs leading-relaxed">
                  Toque em qualquer casinha do calendário para ver onde o grupo estará hospedado, as atividades marcadas e dicas locais para organizarmos nosso itinerário ideal.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
