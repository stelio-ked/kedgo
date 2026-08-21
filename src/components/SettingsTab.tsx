import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  User, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  CheckCircle,
  Activity as ActivityIcon,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { Traveler, Destination, CostItem } from "../types";
import { jsPDF } from "jspdf";
import SettingsPassword from "./SettingsPassword";
import { formatCostDate } from "../utils";

interface AccessLog {
  id: number;
  itineraryId: number;
  userEmail: string;
  status: string;
  attemptedAt: string;
  ipAddress: string | null;
}

interface SettingsTabProps {
  itineraryId: string | number;
  isTravelerMode?: boolean;
  currentUser?: { email?: string; name?: string } | null;
  travelers?: Traveler[];
  destinations?: Destination[];
  costs?: CostItem[];
  ecoMode?: boolean;
  onToggleEcoMode?: () => void;
  isAdmin?: boolean;
}

export default function SettingsTab({ 
  itineraryId, 
  isTravelerMode, 
  currentUser, 
  travelers = [],
  destinations = [],
  costs = [],
  ecoMode = false,
  onToggleEcoMode,
  isAdmin: isAdminProp
}: SettingsTabProps) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";
  const isUserAdminRole = ["administrador", "organizador", "criador", "proprietário", "admin"].includes(userRole.toLowerCase().trim());
  const calculatedIsAdmin = !isTravelerMode && !!currentUser && (isUserAdminRole || userRole !== "Viajante" || !currentUserTraveler);
  const isAdmin = isAdminProp !== undefined ? isAdminProp : calculatedIsAdmin;

  const fetchLogs = async () => {
    if (!itineraryId) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/itineraries/${encodeURIComponent(itineraryId)}/access_logs`, { headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao buscar logs");
      }
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLogs();
    }
  }, [itineraryId, userRole]);

  const exportConsolidatedPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        // Simple margins and tracking
        let y = 20;
        let pageNum = 1;

        // Header decorator drawn on every page
        const drawPageDecorator = (targetPageNum: number) => {
          // Top colorful accent line
          doc.setFillColor(79, 70, 229); // Indigo
          doc.rect(0, 0, 210, 4, "F");

          // Running header
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(156, 163, 175); // gray-400
          doc.text("KedGo! — ROTEIRO & PLANILHA DE CUSTOS UNIFICADOS", 15, 10);
          doc.text(`Pág. ${targetPageNum}`, 195, 10, { align: "right" });

          // Running footer line
          doc.setDrawColor(241, 245, 249); // slate-100
          doc.setLineWidth(0.5);
          doc.line(15, 282, 195, 282);

          // Footer text
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text("Documento Oficial de Viagem • Gerado automaticamente pelo Painel do App", 15, 287);
          doc.text("Guarde este documento com segurança offline", 195, 287, { align: "right" });
        };

        const checkPageSpace = (heightNeeded: number) => {
          if (y + heightNeeded > 270) {
            doc.addPage();
            pageNum += 1;
            drawPageDecorator(pageNum);
            y = 25;
          }
        };

        const drawText = (
          text: string, 
          x: number, 
          fontSize: number, 
          options: { 
            fontStyle?: "normal" | "bold" | "italic" | "bolditalic"; 
            color?: "indigo" | "slate" | "emerald" | "rose" | "gray" | "dark" | "orange"; 
            maxWidth?: number;
            align?: "left" | "center" | "right";
          } = {}
        ) => {
          doc.setFont("helvetica", options.fontStyle || "normal");
          doc.setFontSize(fontSize);

          if (options.color === "indigo") doc.setTextColor(79, 70, 229);
          else if (options.color === "slate") doc.setTextColor(71, 85, 105);
          else if (options.color === "emerald") doc.setTextColor(16, 185, 129);
          else if (options.color === "rose") doc.setTextColor(244, 63, 94);
          else if (options.color === "orange") doc.setTextColor(217, 119, 6);
          else if (options.color === "gray") doc.setTextColor(156, 163, 175);
          else doc.setTextColor(15, 23, 42); // slate-900

          const maxW = options.maxWidth || (210 - x - 15);
          const lines = doc.splitTextToSize(text, maxW);
          const lineHeight = fontSize * 0.3527 * 1.35;
          const blockHeight = lines.length * lineHeight;

          checkPageSpace(blockHeight);
          
          lines.forEach((line: string) => {
            let drawX = x;
            if (options.align === "right") {
              drawX = x + maxW;
            } else if (options.align === "center") {
              drawX = x + (maxW / 2);
            }
            doc.text(line, drawX, y + (fontSize * 0.3527), { align: options.align });
            y += lineHeight;
          });
        };

        // Set up first page base decorator
        drawPageDecorator(pageNum);
        y = 18;

        // MAIN BRAND HEADER
        doc.setFillColor(248, 250, 252); // slate-50 background bar
        doc.roundedRect(15, y, 180, 28, 3, 3, "F");
        
        doc.setDrawColor(79, 70, 229); // indigo left border strip
        doc.setLineWidth(1.5);
        doc.line(15, y, 15, y + 28);

        y += 5;
        drawText("KedGo! — PLANO DE VIAGEM OFICIAL", 20, 13, { fontStyle: "bold", color: "indigo" });
        drawText("Roteiro de Viagem e Plano de Custos Consolidados", 20, 9, { fontStyle: "bold", color: "slate" });
        const dateString = new Date().toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        drawText(`Relatório compilado em: ${dateString}`, 20, 7.5, { fontStyle: "italic", color: "gray" });
        
        y = 52; // Push down

        // SECTION 1: GLOBAL TOTALS
        drawText("1. RESUMO GERAL DA TRIP", 15, 11, { fontStyle: "bold", color: "indigo" });
        y += 2;
        doc.setDrawColor(226, 232, 240); // slate-200 line
        doc.setLineWidth(0.5);
        doc.line(15, y, 195, y);
        y += 4;

        const totalDests = destinations?.length || 0;
        const numTravelers = travelers?.length || 8;
        const totalCostBRL = costs?.reduce((sum, c) => sum + c.totalCostBRL, 0) || 0;
        const perPersonBRL = totalCostBRL / numTravelers;

        // Box 1: Destinos
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, y, 56, 20, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("CIDADES PARADAS", 20, y + 6);
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(`${totalDests} Paradas`, 20, y + 14);

        // Box 2: Total Estimado
        doc.roundedRect(77, y, 56, 20, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("CUSTO ESTIMADO GLOBAL", 82, y + 6);
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(totalCostBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }), 82, y + 14);

        // Box 3: Por Pessoa
        doc.roundedRect(139, y, 56, 20, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text("DIVISÃO POR INTEGRANTE", 144, y + 6);
        doc.setFontSize(11);
        doc.setTextColor(79, 70, 229);
        doc.text(perPersonBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }), 144, y + 14);

        y += 26;

        // SECTION 2: ITINERÁRIO COMPLETO
        drawText("2. DIÁRIOS DE BORDO & ROTEIRO", 15, 11, { fontStyle: "bold", color: "indigo" });
        y += 2;
        doc.line(15, y, 195, y);
        y += 4;

        if (!destinations || destinations.length === 0) {
          drawText("Nenhuma cidade ou destino cadastrado até o momento.", 15, 9, { fontStyle: "italic", color: "gray" });
        } else {
          destinations.forEach((dest, dIndex) => {
            checkPageSpace(35); // check if there is minimal room for a city header

            // Draw nice colored header block for each Destination
            doc.setFillColor(241, 245, 249); // slate-100 background
            doc.roundedRect(15, y, 180, 16, 2, 2, "F");
            doc.setDrawColor(203, 213, 225); // slate-300 border
            doc.setLineWidth(0.3);
            doc.roundedRect(15, y, 180, 16, 2, 2, "D");

            // Text fields inside the Destination header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(15, 23, 42);
            doc.text(`${dIndex + 1}. ${dest.city.toUpperCase()}, ${dest.state || ""} (${dest.country || ""})`, 19, y + 6.5);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(79, 70, 229);
            doc.text(`Período: ${dest.dates}`, 19, y + 12);

            // If hotel details exist, show them right-aligned
            if (dest.hotelName) {
              doc.setFont("helvetica", "bold");
              doc.setTextColor(71, 85, 105);
              doc.setFontSize(8);
              doc.text(`Hospedagem: ${dest.hotelName}`, 190, y + 6.5, { align: "right" });
              
              const checkInOutText = [
                dest.checkInTime ? `In: ${dest.checkInTime}` : "",
                dest.checkOutTime ? `Out: ${dest.checkOutTime}` : ""
              ].filter(Boolean).join(" | ");

              if (checkInOutText) {
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(7.5);
                doc.text(checkInOutText, 190, y + 12, { align: "right" });
              }
            }

            y += 21; // Space below header

            // Now list days of the city
            if (!dest.days || dest.days.length === 0) {
              drawText("• Nenhuma diária ou atividade cadastrada para este destino.", 20, 8.5, { fontStyle: "italic", color: "gray" });
              y += 4;
            } else {
              dest.days.forEach((day) => {
                checkPageSpace(20);
                // Draw Day banner
                doc.setFillColor(248, 250, 252);
                doc.rect(15, y, 180, 6, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(8.5);
                doc.setTextColor(15, 23, 42);
                doc.text(`Dia ${day.dayNumber}: ${day.dateStr} — ${day.title || "Programação Livre"}`, 18, y + 4.5);
                y += 9;

                // Run activities for this day
                if (!day.activities || day.activities.length === 0) {
                  drawText("• Sem compromissos ou passeios agendados.", 22, 8, { fontStyle: "italic", color: "gray" });
                  y += 2;
                } else {
                  day.activities.forEach((act) => {
                    checkPageSpace(18);
                    
                    // Draw small dot
                    doc.setFillColor(79, 70, 229);
                    doc.circle(22, y + 2, 0.8, "F");

                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(8.5);
                    doc.setTextColor(15, 23, 42);
                    
                    const timing = act.time ? `[${act.time}] ` : "";
                    const duration = act.duration ? ` (${act.duration})` : "";
                    const costLabel = act.cost ? ` [Custo: ${act.cost}]` : "";
                    
                    doc.text(`${timing}${act.location}${duration}`, 25, y + 2.8);
                    
                    if (act.cost) {
                      doc.setFont("helvetica", "bold");
                      doc.setFontSize(7.5);
                      doc.setTextColor(16, 185, 129); // Emerald for costs
                      doc.text(costLabel, 190, y + 2.8, { align: "right" });
                    }
                    
                    y += 4.5;
                    
                    // Draw notes if they exist
                    if (act.notes) {
                      drawText(`Notas: ${act.notes}`, 25, 7.5, { fontStyle: "italic", color: "slate" });
                    }
                    
                    // Draw extra space
                    y += 2;
                  });
                }
                y += 3; // Space between days
              });
            }
            y += 6; // Space between destinations
          });
        }

        // SECTION 3: PLANILHA DE CUSTOS
        checkPageSpace(40);
        y += 4;
        drawText("3. PLANILHA DE CUSTOS DETALHADOS", 15, 11, { fontStyle: "bold", color: "indigo" });
        y += 2;
        doc.setDrawColor(226, 232, 240);
        doc.line(15, y, 195, y);
        y += 4;

        if (!costs || costs.length === 0) {
          drawText("Nenhum item adicionado à Planilha de Custos.", 15, 9, { fontStyle: "italic", color: "gray" });
        } else {
          // Table Header
          doc.setFillColor(241, 245, 249);
          doc.rect(15, y, 180, 7, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          doc.text("CATEGORIA", 18, y + 4.8);
          doc.text("DESCRIÇÃO", 45, y + 4.8);
          doc.text("PERÍODO", 115, y + 4.8);
          doc.text("STATUS", 152, y + 4.8);
          doc.text("VALOR (BRL)", 192, y + 4.8, { align: "right" });

          y += 9.5;

          // Table Rows
          costs.forEach((cost, cIdx) => {
            checkPageSpace(12);

            // Small separator line between items
            if (cIdx > 0) {
              doc.setDrawColor(241, 245, 249);
              doc.setLineWidth(0.2);
              doc.line(15, y - 2.5, 195, y - 2.5);
            }

            // Category Badge
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            
            let catLabel = cost.category.toUpperCase();
            if (catLabel === "HOTEL") {
              doc.setTextColor(79, 70, 229); // Indigo
              catLabel = "HOSPEDAGEM";
            } else if (catLabel === "flight") {
              doc.setTextColor(244, 63, 94); // Rose
              catLabel = "AVIAÇÃO";
            } else if (catLabel === "car") {
              doc.setTextColor(14, 165, 233); // Light Blue
              catLabel = "TRANSPORTE";
            } else if (catLabel === "activity") {
              doc.setTextColor(16, 185, 129); // Emerald
              catLabel = "PASSEIO/ATIV";
            } else {
              doc.setTextColor(100, 116, 139); // Gray
              catLabel = "OUTROS";
            }
            doc.text(catLabel, 18, y + 1.5);

            // Description with wrapping capability to prevent clipping
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            
            const descLines: string[] = doc.splitTextToSize(cost.description, 65);
            doc.text(descLines, 45, y + 1.5);

            // DateRange / Period
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text(formatCostDate(cost.dateRange), 115, y + 1.5);

            // Status colors
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            if (cost.status === "Pago") {
              doc.setTextColor(16, 185, 129); // Green
              doc.text("PAGO", 152, y + 1.5);
            } else if (cost.status === "Pgto no local") {
              doc.setTextColor(217, 119, 6); // Orange
              doc.text("RESTR. LOCAL", 152, y + 1.5);
            } else {
              doc.setTextColor(239, 68, 68); // Red
              doc.text("FALTA PAGAR", 152, y + 1.5);
            }

            // Value BRL
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(15, 23, 42);
            doc.text(cost.totalCostBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), 192, y + 1.5, { align: "right" });

            // Calculate space used by descLines
            const rowHeight = Math.max(descLines.length * 4, 7);
            y += rowHeight;
          });

          // Split total categories for clarity
          checkPageSpace(35);
          y += 4;
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(15, y, 180, 18, 2, 2, "F");

          const paidSum = costs.filter((c) => c.status === "Pago").reduce((sum, c) => sum + c.totalCostBRL, 0);
          const unPaidSum = costs.filter((c) => c.status === "Falta pagar").reduce((sum, c) => sum + c.totalCostBRL, 0);
          const onSiteSum = costs.filter((c) => c.status === "Pgto no local").reduce((sum, c) => sum + c.totalCostBRL, 0);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          doc.text("RESUMO DOS MEIOS DE PAGAMENTO:", 18, y + 6);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(16, 185, 129);
          doc.text(`Efetuados: ${paidSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 18, y + 12);

          doc.setTextColor(217, 119, 6);
          doc.text(`No Local: ${onSiteSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 75, y + 12);

          doc.setTextColor(239, 68, 68);
          doc.text(`Pendentes: ${unPaidSum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, 130, y + 12);
          y += 24;
        }

        // Save document
        doc.save(`KK_TUR_ROTEIRO_CONSOLIDADO.pdf`);
      } catch (err) {
        console.error("Erro ao exportar PDF:", err);
        alert("Houve um problema ao compilar o PDF consolidado. Por favor, tente novamente.");
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      
      {/* GRID SECTION: User Profiling Card & Unified Export Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Profile and Role Settings Info */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-105 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100 flex items-center justify-center">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-800 text-[15px] tracking-tight">Sua Conta & Credenciais</h3>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Identificação do Grupo</p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-50">
              <span className="font-semibold text-slate-500">E-mail de Acesso</span>
              <span className="font-bold text-slate-800 truncate max-w-[200px]">{currentUser?.email || "Visitante"}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-50">
              <span className="font-semibold text-slate-500">Nome de Perfil</span>
              <span className="font-bold text-slate-800">{currentUser?.name || currentUserTraveler?.name || "Sem Nome"}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Atribuição de Cargo</span>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                isAdmin 
                  ? "bg-rose-50 text-rose-700 border border-rose-100" 
                  : userRole === "Organizador" 
                  ? "bg-amber-50 text-amber-700 border border-amber-100" 
                  : "bg-indigo-50 text-indigo-700 border border-indigo-100"
              }`}>
                {userRole}
              </span>
            </div>
            
            {/* Show Password Reset block for all logged-in users, including linked travelers */}
            {currentUser?.email && (
              <SettingsPassword email={currentUser.email} />
            )}
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80 space-y-1.5 text-[11px] leading-relaxed text-slate-600 font-medium select-none">
            <span className="font-black text-slate-800 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Sincronização em Nuvem Ativa
            </span>
            <p>Seus logins e alterações são automaticamente salvos nas instâncias do Firebase de forma 100% segura para os outros {travelers.length > 0 ? travelers.length - 1 : 0} viajantes do grupo.</p>
          </div>
        </div>

        {/* CONSOLIDATED PDF EXPORT CARD (MOVED HERE AS REQUESTED) */}
        <div className="lg:col-span-7 bg-indigo-900 text-white rounded-3xl p-6 shadow-md space-y-4 flex flex-col justify-between relative overflow-hidden" style={{ minHeight: "230px" }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-800/30 rounded-full blur-2xl pointer-events-none select-none" />
          
          <div className="space-y-3.5 relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-white/10 text-white rounded-2xl border border-white/10">
                <Sparkles className="w-5 h-5 text-indigo-305" />
              </span>
              <div>
                <h4 className="font-extrabold text-[15px] tracking-tight">Exportação Unificada</h4>
                <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Documento Consolidado da Trip</p>
              </div>
            </div>

            <p className="text-xs text-indigo-100 leading-relaxed font-medium">
              Obtenha um documento em formato <strong className="text-white font-heavy">PDF altamente estruturado</strong> contendo todo o roteiro atualizado, cidades, atividades agendadas, diários de bordo e o detalhamento da planilha financeira da viagem de forma integrada.
            </p>
            
            <p className="text-[11px] text-indigo-200 font-medium">
              Perfeito para imprimir em folha física ou salvar localmente para acessar na alfândega ou em portões sem conexão 4G/Wi-Fi.
            </p>
          </div>

          <div className="pt-3 relative z-10 select-none">
            <button
              onClick={exportConsolidatedPDF}
              disabled={isGeneratingPdf}
              className={`w-full py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 text-indigo-950 shadow-md ${
                isGeneratingPdf 
                  ? "bg-slate-350 cursor-not-allowed text-slate-600" 
                  : "bg-white hover:bg-indigo-50 active:scale-98"
              }`}
            >
              {isGeneratingPdf ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-indigo-900/50 border-t-indigo-900 rounded-full animate-spin" />
                  <span>Gerando PDF Consolidado...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Gerar PDF Consolidado</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ECO MODE SECTION */}
      {isAdmin && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2 mb-2">
                <Sparkles className={`w-5 h-5 ${ecoMode ? "text-emerald-500" : "text-slate-400"}`} />
                Modo Econômico de Inteligência Artíficial (IA)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Reduz a frequência de chamadas automáticas e prioriza cache. Ideal para economizar cota do plano API em viagens longas. O modo está <strong>{ecoMode ? "ativo" : "inativo"}</strong>.
              </p>
            </div>
            {onToggleEcoMode && (
              <button
                onClick={onToggleEcoMode}
                className={`flex items-center justify-center shrink-0 w-14 h-8 rounded-full transition-colors cursor-pointer border ${
                  ecoMode ? "bg-emerald-500 border-emerald-600" : "bg-slate-200 border-slate-300"
                }`}
              >
                <div 
                  className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    ecoMode ? "translate-x-3" : "-translate-x-3"
                  }`} 
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ACCESS LOG HISTORY SECTION */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-105 p-6 md:p-8">
        
        {isAdmin ? (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  Histórico de Acesso do Sistema
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Exclusivo para Administradores. Monitore quais usuários acessaram ou tentaram visualizar as informações sigilosas do roteiro.
                </p>
              </div>
              <button 
                onClick={fetchLogs}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-705 font-bold rounded-xl transition-colors text-xs disabled:opacity-50 select-none border border-slate-200"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Atualizar Histórico
              </button>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Usuário / E-mail</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Data e Hora</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right">IP (Aprox.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs font-bold">
                        Nenhum registro de acesso encontrado ainda.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-650">
                              <User className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-extrabold text-slate-700">{log.userEmail}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {new Date(log.attemptedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                              <ShieldCheck className="w-3.5 h-3.5" /> Autorizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider">
                              <ShieldAlert className="w-3.5 h-3.5" /> Negado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 text-right font-mono font-bold">
                          {log.ipAddress || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 max-w-lg mx-auto">
            <span className="p-3 bg-slate-50 text-slate-400 rounded-3xl border border-dashed border-slate-200">
              <Shield className="w-7 h-7" />
            </span>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-800 text-sm">Histórico de Auditoria Segura</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                As métricas de acesso do servidor e controle de IP do roteiro são dados sigilosos monitorados exclusivamente por usuários com permissão de <strong className="text-indigo-600">Administrador</strong> do grupo de viagem.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-500" /> Seu cargo atual: {userRole}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
