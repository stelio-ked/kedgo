import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Trash2, 
  Plane, 
  User, 
  ShieldCheck, 
  Plus, 
  X, 
  Sparkles,
  CheckCircle,
  WifiOff,
  Eye,
  ExternalLink,
  FileImage,
  AlertCircle,
  Maximize2,
  Minimize2,
  HelpCircle
} from "lucide-react";
import { TravelDocument, Destination, CostItem, Traveler } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import { canDeleteEntity, formatCostDate } from "../utils";
import KedInsuranceBanner from "./KedInsuranceBanner";

interface DocumentsTabProps {
  documents: TravelDocument[];
  onAddDocument: (doc: Omit<TravelDocument, "id" | "uploadedAt">) => void;
  onRemoveDocument: (id: string) => void;
  isOffline: boolean;
  destinations?: Destination[];
  costs?: CostItem[];
  travelers?: Traveler[];
  isReadOnly?: boolean;
  currentUser?: { email?: string; name?: string; isTraveler?: boolean } | null;
}

export default function DocumentsTab({
  documents,
  onAddDocument,
  onRemoveDocument,
  isOffline,
  destinations = [],
  costs = [],
  travelers = [],
  isReadOnly = false,
  currentUser,
}: DocumentsTabProps) {
  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
  const userRole = currentUserTraveler?.role || "Viajante";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<TravelDocument | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  // Form states
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<TravelDocument["type"]>("eticket");
  const [docPassenger, setDocPassenger] = useState("");
  const [docAirline, setDocAirline] = useState("");
  const [docFlightNum, setDocFlightNum] = useState("");
  const [docNotes, setDocNotes] = useState("");
  const [attachedFileName, setAttachedFileName] = useState("");
  const [attachedFileData, setAttachedFileData] = useState(""); // base64 representation

  const isRegularTraveler = userRole !== "Administrador" && userRole !== "Organizador";

  useEffect(() => {
    if (showAddForm) {
      const defaultName = currentUserTraveler?.name || currentUser?.name || currentUser?.email?.split('@')[0] || "";
      setDocPassenger(defaultName);
    }
  }, [showAddForm, currentUser, currentUserTraveler]);

  // Drag and drop states
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search Documents
  const filteredDocs = documents.filter((doc) => {
    // Privacy filter: Regular travelers can only see documents they uploaded themselves
    if (userRole !== "Administrador" && userRole !== "Organizador") {
      const docCreatorEmail = doc.createdByEmail?.toLowerCase().trim() || "";
      if (docCreatorEmail !== userEmailNormalized) {
        return false;
      }
    }

    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.airline && doc.airline.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedTypeFilter === "all") return matchesSearch;
    return doc.type === selectedTypeFilter && matchesSearch;
  });

  // Handle Drag-and-Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setAttachedFileName(file.name);
    
    // Convert to Base64 so it can be saved in LocalStorage (Offline Persistence)
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setAttachedFileData(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docPassenger.trim()) return;

    onAddDocument({
      title: docTitle.trim(),
      type: docType,
      passengerName: docPassenger.trim(),
      airline: docType === "eticket" && docAirline.trim() ? docAirline.trim() : undefined,
      flightNumber: docType === "eticket" && docFlightNum.trim() ? docFlightNum.trim() : undefined,
      notes: docNotes.trim() ? docNotes.trim() : undefined,
      fileName: attachedFileName || "documento_anexo.pdf",
      fileData: attachedFileData || undefined
    });

    // Reset Form
    setDocTitle("");
    setDocType("eticket");
    setDocPassenger("");
    setDocAirline("");
    setDocFlightNum("");
    setDocNotes("");
    setAttachedFileName("");
    setAttachedFileData("");
    setShowAddForm(false);
  };

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
          doc.text("Documento Oficial de Viagem • Gerado automaticamente pelo Cofre de Documentos", 15, 287);
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
        drawText("KedGo! — COFRE DE DOCUMENTOS OFICIAL", 20, 13, { fontStyle: "bold", color: "indigo" });
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
            } else if (catLabel === "FLIGHT") {
              doc.setTextColor(244, 63, 94); // Rose
              catLabel = "AVIAÇÃO";
            } else if (catLabel === "CAR") {
              doc.setTextColor(14, 165, 233); // Light Blue
              catLabel = "TRANSPORTE";
            } else if (catLabel === "ACTIVITY") {
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

  // Mock-download of a file
  const handleDownload = (doc: TravelDocument) => {
    if (doc.fileData) {
      // Real file download for user files!
      const link = document.createElement("a");
      link.href = doc.fileData;
      link.download = doc.fileName || "documento";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mock alert / generic download for preloaded files
      alert(`[Offline Vault] Descarregando comprovante "${doc.fileName}" com sucesso para uso offline no Aeroporto!`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Official Ked Seguro Viagem Banner */}
      <KedInsuranceBanner
        destinationCountry={destinations?.[0]?.country || "Internacional"}
        onImportPolicy={() => {
          setDocType("Seguro Viagem" as TravelDocument["type"]);
          setDocTitle("Apólice Ked Seguro Viagem");
          setShowAddForm(true);
        }}
      />

      {/* Search and Filters Hub */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Buscar e-tickets, passaportes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-xl focus:outline-hidden focus:border-indigo-400 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { value: "all", label: "Todos" },
            { value: "eticket", label: "E-Tickets de Voo" },
            { value: "passport", label: "Passaportes" },
            { value: "rg", label: "Documentos Pessoais" },
            { value: "other", label: "Outros" }
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setSelectedTypeFilter(btn.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedTypeFilter === btn.value
                  ? "bg-indigo-600 text-white border-indigo-650"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
              }`}
            >
              {btn.label}
            </button>
          ))}

          {!isReadOnly && (
            <button
              onClick={() => setShowAddForm(true)}
              className="md:ml-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 ml-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Importar Documento
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Offline Indicator Card + Instruction Card */}
        <div className="space-y-4 lg:col-span-1">
          {/* OFFLINE CAPABILITY BLOCK */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/35">
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              </span>
              <div>
                <h3 className="font-extrabold text-[15px] tracking-tight">Cofre Blindado Offline</h3>
                <p className="text-[10px] text-indigo-305 font-bold uppercase tracking-wider">Armazenamento Local Seguro</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-205 leading-relaxed font-semibold">
              Seus passaportes anexados, e-tickets e RGs ficam <strong className="text-white font-black bg-indigo-500/30 px-1.5 py-0.5 rounded">guardados com total segurança em memória local criptografada (IndexedDB)</strong> no seu dispositivo.
            </p>

            <div className="bg-slate-950/60 p-4 rounded-2xl space-y-2 border border-slate-800">
              <div className="flex gap-2 items-center text-xs">
                {isOffline ? (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-extrabold text-amber-300">Modo Sem Internet Ativo!</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-extrabold text-emerald-400 font-sans">Ambiente Sincronizado</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                Você e seus companheiros de viagem podem acessar os documentos com tranquilidade no portão de embarque ou alfândega mesmo sem sinal de rede (4G/Wi-Fi).
              </p>
            </div>
            
            <div className="text-[10px] text-indigo-200 leading-snug bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-900/40 flex items-start gap-1.5">
              <span className="shrink-0 text-amber-400">💡</span>
              <p className="text-slate-300 text-[10px] m-0 font-medium leading-relaxed">
                <strong className="text-white font-bold">Regra de privacidade ativa:</strong> Cada viajante realiza o upload de seus próprios arquivos. Para segurança do grupo, viajantes comuns não podem alterar ou excluir documentos de terceiros.
              </p>
            </div>
          </div>
          
          {/* TIPS AND OFFLINE PREPARATION CARD */}
          <div className="bg-white rounded-3xl p-5 border border-slate-105 shadow-xs space-y-4 font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-650 rounded-xl">
                <HelpCircle className="w-4 h-4 text-amber-655" />
              </span>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Passaporte Preparado</h4>
            </div>

            <div className="space-y-3.5 text-[11px] leading-relaxed text-slate-500 font-semibold">
              <div className="space-y-1">
                <p className="text-slate-800 font-bold flex items-center gap-1">
                  <span>💡</span> Identificação Facilitada
                </p>
                <p>Use títulos claros ao cadastrar passagens e RGs (ex: <i>"Voo Ida - Théo"</i> ou <i>"Passaporte - Gabi"</i>). Isso ajuda a filtrar e encontrar as mídias em poucos segundos no embarque.</p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-slate-150">
                <p className="text-slate-800 font-bold flex items-center gap-1">
                  <span>📱</span> Acesso no Portão de Embarque
                </p>
                <p>Fique tranquilo na alfândega ou em portões sem sinal 4G/Wi-Fi. Todo o cofre é sincronizado localmente direto na memória física do seu smartphone para visualização off-line instantânea.</p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-slate-150">
                <p className="text-indigo-600 font-black flex items-center gap-1">
                  <span>📄</span> Exportação de Itinerário Unificado
                </p>
                <p>O arquivo PDF consolidado com o resumo financeiro, reservas de hotéis e roteiro diário agora está centralizado na aba de <strong className="text-indigo-700">Configurações</strong> do seu painel!</p>
              </div>
            </div>
          </div>

          {/* Quick Stats of Vault */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3 font-sans text-xs">
            <h4 className="font-extrabold text-slate-800">Cifras do Cofre</h4>
            <div className="divide-y divide-slate-100 space-y-2.5">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500 font-semibold">Total de passagens aéreas (E-Tickets):</span>
                <strong className="text-slate-800 font-black">{documents.filter((d) => d.type === "eticket").length}</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-semibold">Documentações pessoais e RG:</span>
                <strong className="text-slate-800 font-black">{documents.filter((d) => d.type !== "eticket").length}</strong>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 font-semibold">Armazenamento Offline:</span>
                <strong className="text-emerald-600 font-black">100% Ativo</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Documents Grid */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Add Document Pop-in Form */}
          {showAddForm && (
            <motion.form 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-lg space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1 text-slate-800">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs font-black uppercase tracking-wider">Inserir Novo Documento ao Grupo</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Título Amigável (e.g. Pass passagem United)</label>
                  <input 
                    type="text" 
                    placeholder="E-ticket Voo Volta ou RG Amanda" 
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Tipo do Documento</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as TravelDocument["type"])}
                    className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl focus:outline-hidden"
                  >
                    <option value="eticket">E-Ticket / Passagem Aérea</option>
                    <option value="passport">Passaporte Original</option>
                    <option value="rg">RG / Identidade Pessoal</option>
                    <option value="other">Outros Comprovantes</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase font-sans">Nome do Passageiro Principal ou Proprietário</label>
                {isRegularTraveler ? (
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={docPassenger}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-xl font-bold cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed flex items-center gap-1">
                      <span>💡</span> Para garantir a segurança, viajantes comuns apenas realizam uploads em seu próprio nome.
                    </p>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    placeholder="Théo Silva ou Grupo Completo" 
                    value={docPassenger}
                    onChange={(e) => setDocPassenger(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl"
                    required
                  />
                )}
              </div>

              {docType === "eticket" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Companhia Aérea</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Azul, LATAM, United..." 
                      value={docAirline}
                      onChange={(e) => setDocAirline(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Código / Número do Vôo</label>
                    <input 
                      type="text" 
                      placeholder="e.g. LA 702" 
                      value={docFlightNum}
                      onChange={(e) => setDocFlightNum(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="text-xs">
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Comentários e Anotações Internas</label>
                <textarea 
                  placeholder="Selecione horários corretos, regras sobre bagagem despachada..." 
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 bg-slate-50/50 rounded-xl h-14"
                />
              </div>

              {/* DRAG AND DROP FILE INPUT FIELD */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragActive 
                    ? "border-indigo-500 bg-indigo-50/80" 
                    : "border-slate-250 hover:border-slate-350 bg-slate-50/30"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <div className="space-y-2">
                  <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                  
                  {attachedFileName ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800">Arquivo Anexado!</p>
                      <p className="text-[11px] text-indigo-650 font-mono mt-0.5">{attachedFileName}</p>
                      <button 
                        type="button"
                        onClick={() => {
                          setAttachedFileName("");
                          setAttachedFileData("");
                        }}
                        className="text-[10px] text-rose-500 underline mt-1 font-semibold block mx-auto"
                      >
                        Excluir e trocar arquivo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Arraste e solte o arquivo (PDF/Imagem) ou{" "}
                        <button 
                          type="button" 
                          onClick={triggerFileInput}
                          className="text-indigo-600 hover:underline font-bold"
                        >
                          selecione do computador
                        </button>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Capacidade offline de leitura automática</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Salvar no Cofre
                </button>
              </div>

            </motion.form>
          )}

          {/* Documents Grid listing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`p-2.5 rounded-xl shrink-0 ${
                      doc.type === "eticket" ? "bg-rose-50 text-rose-600" :
                      doc.type === "passport" ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {doc.type === "eticket" ? <Plane className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </span>
                    {!isReadOnly && (() => {
                      const isOwner = currentUser?.email && doc.createdByEmail && currentUser.email.toLowerCase().trim() === doc.createdByEmail.toLowerCase().trim();
                      const authorized = isOwner || canDeleteEntity(userRole, currentUser?.email, doc.createdByEmail);
                      return (
                        <button
                          disabled={!authorized}
                          onClick={() => authorized && onRemoveDocument(doc.id)}
                          className={`p-1 rounded-md transition-colors ml-auto ${
                            authorized 
                              ? "text-slate-350 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" 
                              : "text-slate-200 bg-slate-50 opacity-30 cursor-not-allowed"
                          }`}
                          title={authorized ? "Excluir do cofre" : "Sem permissão (apenas o próprio criador do arquivo ou Administrador)"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      );
                    })()}
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-800 text-[13px] leading-tight group-hover:text-indigo-600">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Passageiro: {doc.passengerName}
                    </p>
                  </div>

                  {/* Flight specifics */}
                  {doc.type === "eticket" && (doc.airline || doc.flightNumber) && (
                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 font-semibold space-y-1 border border-slate-100">
                      {doc.airline && <p>Cia: <strong className="text-slate-805">{doc.airline}</strong></p>}
                      {doc.flightNumber && <p>Nº Vôo: <strong className="text-slate-805 font-mono">{doc.flightNumber}</strong></p>}
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-[11px] text-slate-550 italic leading-snug">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-semibold">Salvo: {doc.uploadedAt}</span>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Acessar Offline
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-xs">
              <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs font-extrabold text-slate-700">Nenhum documento encontrado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tente utilizar outro termo de busca ou mude os filtros acima.</p>
            </div>
          )}

        </div>

      </div>

      {/* Modal de Visualização de Documentos Offline */}
      <AnimatePresence>
        {viewingDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-350 ${isMaximized ? "max-w-6xl h-[92vh] max-h-[92vh]" : "max-w-lg max-h-[90vh]"}`}
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-[14px] text-slate-800">Visualizar Documento Offline</h3>
                    <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide flex items-center gap-1 select-none">
                      ● Cofre Seguro Ativo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title={isMaximized ? "Restaurar tamanho" : "Maximizar visualização"}
                  >
                    {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setViewingDoc(null)}
                    className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all flex items-center justify-center cursor-pointer"
                    title="Fechar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                        {viewingDoc.type === "eticket" ? "Bilhete Eletrônico (E-Ticket)" :
                         viewingDoc.type === "passport" ? "Passaporte Oficial" :
                         viewingDoc.type === "rg" ? "Documento de Identificação" : "Outros Arquivos"}
                      </span>
                      <h4 className="text-[15px] font-extrabold text-slate-800 mt-1.5">{viewingDoc.title}</h4>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">Passageiro: {viewingDoc.passengerName}</p>
                    </div>
                  </div>

                  {viewingDoc.notes && (
                    <div className="text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-150 leading-relaxed font-medium italic">
                      <p className="text-[9px] font-extrabold text-slate-400 not-italic uppercase mb-1">Notas do Viajante</p>
                      "{viewingDoc.notes}"
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-400 font-semibold border-t border-dashed border-slate-200 pt-3">
                    <p>Arquivo: <strong className="text-slate-600 font-mono">{viewingDoc.fileName || "N/A"}</strong></p>
                    <p>Inserido em: <strong className="text-slate-600">{viewingDoc.uploadedAt}</strong></p>
                  </div>
                </div>

                {/* Exibição de Prévia Real ou Simulada de Contingência */}
                {viewingDoc.fileData ? (
                  // Se houver arquivo Base64 do usuário, renderiza igual o Cartão de Embarque
                  <div className="w-full flex-1 flex flex-col items-center justify-center p-1">
                    {viewingDoc.fileData.startsWith("data:application/pdf") || 
                     viewingDoc.fileData.includes("pdf") || 
                     (viewingDoc.fileName && viewingDoc.fileName.toLowerCase().endsWith(".pdf")) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                        <iframe 
                          src={viewingDoc.fileData} 
                          className={`w-full rounded-xl border border-slate-250 shadow-sm transition-all duration-300 ${isMaximized ? "h-[58vh]" : "h-[380px]"}`}
                          title={viewingDoc.fileName || "PDF"} 
                        />
                        <p className="text-slate-400 text-[10px] italic">Se o PDF não carregar automaticamente na pré-visualização, utilize o botão abaixo para baixar.</p>
                      </div>
                    ) : (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-900/5 flex flex-col items-center justify-center p-3 w-full animate-fadeIn">
                        <p className="text-[9px] text-slate-400 font-extrabold mb-2 uppercase tracking-wider flex items-center gap-1 select-none">
                          <CheckCircle className="w-3 h-3 text-emerald-500" /> Imagem Salva Offline
                        </p>
                        <img 
                          src={viewingDoc.fileData} 
                          alt={viewingDoc.title} 
                          className={`max-w-full object-contain rounded-xl shadow-md border border-slate-200 transition-all duration-300 ${isMaximized ? "max-h-[58vh]" : "max-h-[300px]"}`} 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  // Caso seja um documento pré-carregado que não possui fileData física
                  <div className="border border-slate-100 rounded-3xl overflow-hidden bg-slate-50 p-1 flex flex-col">
                    {viewingDoc.type === "eticket" ? (
                      /* Cartão de Embarque Simulador Lindo */
                      <div className="bg-indigo-900 text-white rounded-2xl overflow-hidden shadow-md flex flex-col relative" style={{ backgroundColor: '#1E3A8A' }}>
                        {/* Pontilhado de corte do bilhete */}
                        <div className="absolute right-1/4 top-0 bottom-0 border-l border-dashed border-white/20 select-none hidden sm:block pointer-events-none" />
                        
                        {/* Bolinhas laterais de ticket recortado */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white w-6 h-6 rounded-full border border-slate-100 select-none pointer-events-none" />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white w-6 h-6 rounded-full border border-slate-100 select-none pointer-events-none" />
                        
                        {/* Cabeçalho do Ticket */}
                        <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-white/10 rounded-lg text-white">
                              <Plane className="w-4 h-4 rotate-45" />
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider">{viewingDoc.airline || "Companhia Aérea"}</span>
                          </div>
                          <span className="text-[10px] font-mono bg-white/25 px-2 py-0.5 rounded-md font-bold tracking-widest">{viewingDoc.flightNumber || "FLIGHT"}</span>
                        </div>
                        
                        {/* Informação principal de Destino e Origem */}
                        <div className="p-5 flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <h5 className="text-[20px] font-black tracking-tighter">GRU</h5>
                            <p className="text-[9px] text-indigo-200 font-bold uppercase font-sans">São Paulo, BR</p>
                          </div>
                          
                          {/* Símbolo do Voo */}
                          <div className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full border-t border-dashed border-white/30 relative flex items-center justify-center">
                              <Plane className="w-3.5 h-3.5 rotate-90 text-indigo-300 absolute -top-1.5 bg-[#1E3A8A] px-0.5" />
                            </div>
                            <span className="text-[8px] text-indigo-200 font-bold uppercase tracking-wider">Voo Direto</span>
                          </div>
                          
                          <div className="space-y-0.5 text-right">
                            <h5 className="text-[20px] font-black tracking-tighter">IAD</h5>
                            <p className="text-[9px] text-indigo-200 font-bold uppercase font-sans">Washington, US</p>
                          </div>
                        </div>

                        {/* Dados Detalhados do Cupom de Voo */}
                        <div className="px-5 pb-5 grid grid-cols-3 sm:grid-cols-4 gap-4 border-t border-dashed border-white/10 pt-4 text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-indigo-200 font-extrabold uppercase">Passageiro</span>
                            <p className="font-extrabold text-[10px] truncate leading-tight">{viewingDoc.passengerName.split(" ")[0]}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-indigo-200 font-extrabold uppercase">Assentos</span>
                            <p className="font-extrabold text-[10px] font-mono">12A - 12H</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-indigo-200 font-extrabold uppercase">Status</span>
                            <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-emerald-500 rounded-md text-white select-none inline-block">Confirmado</span>
                          </div>
                          <div className="space-y-0.5 hidden sm:block">
                            <span className="text-[8px] text-indigo-200 font-extrabold uppercase">Segurança</span>
                            <p className="font-extrabold text-[10px] text-indigo-100 font-mono">OK-BOARD</p>
                          </div>
                        </div>

                        {/* Código de barras simulado off-line */}
                        <div className="bg-white text-slate-800 p-3 flex flex-col items-center justify-center gap-1 border-t border-indigo-200/20 select-none">
                          <div className="w-full flex items-center justify-between text-[8px] text-slate-400 font-bold px-2">
                            <span>VERIFICADO OFFLINE</span>
                            <span>COFRE DE DOCUMENTOS</span>
                          </div>
                          <div className="h-9 w-full flex items-stretch gap-[2px] opacity-90 px-2 mt-1">
                            {Array.from({ length: 48 }).map((_, i) => (
                              <div 
                                key={i} 
                                className="bg-slate-800 rounded-xs" 
                                style={{ flexGrow: i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2 }} 
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 font-bold tracking-widest mt-1">LA-4710A-OFFLINE</span>
                        </div>
                      </div>
                    ) : (
                      /* Passaporte Simulador Lindo */
                      <div className="bg-slate-800 text-white rounded-2xl overflow-hidden shadow-md flex flex-col relative" style={{ backgroundColor: '#13213C' }}>
                        {/* Brasão mock em ouro */}
                        <div className="px-5 py-4 border-b border-yellow-500/10 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-yellow-500" />
                            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Passaporte Oficial</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400">PASSPORT NO</span>
                        </div>

                        <div className="p-5 flex flex-col sm:flex-row gap-5">
                          {/* Foto Silhueta Passaporte */}
                          <div className="w-24 h-28 bg-[#1E293B] rounded-xl flex items-center justify-center border border-yellow-500/20 shadow-inner overflow-hidden relative shrink-0">
                            <User className="w-12 h-12 text-slate-500" />
                            {/* Carimbo de água dourado */}
                            <div className="absolute inset-0 border border-yellow-500/10 rounded-lg select-none pointer-events-none flex items-center justify-center rotate-12">
                              <span className="text-[7px] text-yellow-500/20 font-black tracking-widest border-2 border-yellow-500/20 px-1.5 py-0.5 rounded-md">EMBAIXADA BR</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 flex-1 text-[11px]">
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase font-bold block">Nome Completo</span>
                              <strong className="font-extrabold text-slate-100 text-[11px] block">{viewingDoc.passengerName}</strong>
                            </div>
                            <div>
                              <span className="text-[8px] text-slate-400 uppercase font-bold block">Status Doc</span>
                              <span className="text-[8px] font-extrabold bg-[#059669]/25 text-[#10B981] px-2 py-0.5 rounded-md inline-block select-none mt-0.5">Seguro-Ativo</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[8px] text-slate-400 uppercase font-bold block">Anotações Gerais</span>
                              <p className="text-[10px] text-slate-300 italic">{viewingDoc.notes || "Nenhum dado adicional inserido."}</p>
                            </div>
                          </div>
                        </div>

                        {/* Detalhes Técnicos de Máquina Legível */}
                        <div className="bg-[#0F172A] p-3 text-[9px] font-mono text-emerald-400 tracking-wider flex flex-col justify-center select-none border-t border-dashed border-yellow-500/15">
                          <p>P&lt;BRASTHEO&lt;SILVA&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</p>
                          <p>FZ886311&lt;6BRA8312128M3012128&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-white text-center rounded-b-2xl">
                      <p className="text-[10px] text-slate-400 font-extrabold flex items-center justify-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-indigo-500" /> Detalhes estruturais carregados off-line no cofre.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 select-none">
                {viewingDoc.fileData ? (
                  <a
                    href={viewingDoc.fileData}
                    download={viewingDoc.fileName || "documento_cofre"}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-indigo-200 cursor-pointer"
                  >
                    📥 Baixar Arquivo Anexo
                  </a>
                ) : (
                  <div />
                )}
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
