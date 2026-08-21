import React, { useState, useEffect } from "react";
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Tag, 
  Link as LinkIcon, 
  FileText, 
  TrendingUp, 
  Receipt,
  Users,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Pencil,
  Lock,
  UploadCloud,
  Eye,
  Sparkles
} from "lucide-react";
import { CostItem, Traveler, CostCategory } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

import CostCategoriesModal from "./CostCategoriesModal";
import MapsSelectorModal from "./MapsSelectorModal";
import { canDeleteEntity, formatCostDate } from "../utils";
import { getAiHeaders } from "../utils/geminiClient";

interface CostsTabProps {
  costs: CostItem[];
  costCategories: CostCategory[];
  setCostCategories: (categories: CostCategory[]) => void;
  travelers: Traveler[];
  onAddCost: (cost: Omit<CostItem, "id">) => void;
  onRemoveCost: (id: string) => void;
  onUpdateCostStatus: (id: string, status: CostItem["status"]) => void;
  onEditCost: (id: string, cost: Omit<CostItem, "id">) => void;
  isReadOnly?: boolean;
  currentUser?: { email?: string; name?: string; isTraveler?: boolean } | null;
}

export default function CostsTab({
  costs,
  costCategories,
  setCostCategories,
  travelers,
  onAddCost,
  onRemoveCost,
  onUpdateCostStatus,
  onEditCost,
  isReadOnly = false,
  currentUser = null,
}: CostsTabProps) {
  const sortedCategories = [...costCategories].sort((a, b) => {
    if (a.id === "other" || a.label.toLowerCase() === "outros") return 1;
    if (b.id === "other" || b.label.toLowerCase() === "outros") return -1;
    return a.label.localeCompare(b.label);
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [mapModalTarget, setMapModalTarget] = useState<{ title: string; query: string } | null>(null);
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<CostItem["category"]>("hotel");
  const [newNotes, setNewNotes] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newCostBRL, setNewCostBRL] = useState("");
  const [newStatus, setNewStatus] = useState<CostItem["status"]>("Pago");
  const [newDates, setNewDates] = useState("");
  
  // Separation of group/personal state
  const [newIsPersonal, setNewIsPersonal] = useState(false);
  const [newReceiptName, setNewReceiptName] = useState("");
  const [newReceiptData, setNewReceiptData] = useState("");

  // AI OCR States
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0); // 0 to 100
  const [ocrStep, setOcrStep] = useState(0); // 1 = loading, 2 = Gemini processing, 3 = finalizing, 4 = complete
  const [ocrPreviewData, setOcrPreviewData] = useState<{
    description: string;
    category: string;
    totalCostBRL: string;
    notes: string;
    isEditingForm: boolean;
  } | null>(null);

  // Receipt viewing modal states
  const [viewReceiptData, setViewReceiptData] = useState<string | null>(null);
  const [viewReceiptName, setViewReceiptName] = useState<string | null>(null);

  // Currency Converter states
  const [viewCurrency, setViewCurrency] = useState<"BRL" | "LOCAL">("BRL");
  const [localCurrencyName, setLocalCurrencyName] = useState("USD");
  const [localExchangeRate, setLocalExchangeRate] = useState<number>(5.5);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  useEffect(() => {
    if (localCurrencyName.length === 3 && localCurrencyName !== "BRL") {
      const fetchRate = async () => {
        setIsFetchingRate(true);
        try {
          const res = await fetch(`https://open.er-api.com/v6/latest/${localCurrencyName}`);
          if (res.ok) {
            const data = await res.json();
            if (data.rates && data.rates.BRL) {
              setLocalExchangeRate(Number(data.rates.BRL.toFixed(4)));
            }
          }
        } catch (error) {
          console.error("Failed to fetch exchange rate", error);
        } finally {
          setIsFetchingRate(false);
        }
      };

      const timer = setTimeout(fetchRate, 800);
      return () => clearTimeout(timer);
    }
  }, [localCurrencyName]);

  // Helper to format currency
  const formatCurrency = (valBRL: number) => {
    if (viewCurrency === "LOCAL" && localExchangeRate > 0) {
      const converted = valBRL / localExchangeRate;
      return `${localCurrencyName} ${converted.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return valBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Receipt Upload & AI OCR Scanner Handler
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditingForm = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    setOcrError("");
    setOcrPreviewData(null);
    setOcrProgress(5);
    setOcrStep(1); // 1 = lendo imagem

    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 3;
      if (currentProgress > 90) {
        currentProgress = 90;
      }
      setOcrProgress(currentProgress);
      
      if (currentProgress < 30) {
        setOcrStep(1); // 1 = processando arquivo
      } else if (currentProgress < 70) {
        setOcrStep(2); // 2 = analisando com o Gemini AI
      } else {
        setOcrStep(3); // 3 = finalizando e formatando
      }
    }, 400);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const fullURI = reader.result as string;
          const base64String = fullURI.split(",")[1];
          if (!base64String) {
            throw new Error("Falha ao processar arquivo de imagem.");
          }

          // Save local receipt copy depending on form
          if (isEditingForm) {
            setEditReceiptName(file.name);
            setEditReceiptData(fullURI);
          } else {
            setNewReceiptName(file.name);
            setNewReceiptData(fullURI);
          }

          setOcrStep(2); // Analisando com Gemini 3.5

          // Call server AI OCR endpoint
          const token = localStorage.getItem("auth_token");
          const response = await fetch("/api/gemini/ocr-receipt", {
            method: "POST",
            headers: getAiHeaders({
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }),
            body: JSON.stringify({
              imageBase64: base64String,
              mimeType: file.type
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Não foi possível analisar este cupom. Verifique se o formato está correto.");
          }

          const data = await response.json();
          
          let normalizedCategory: CostItem["category"] = "other";
          if (data.category) {
            const catLower = data.category.toLowerCase();
            if (catLower.includes("hotel") || catLower.includes("hosped") || catLower.includes("alberg") || catLower.includes("stay")) normalizedCategory = "hotel";
            else if (catLower.includes("flight") || catLower.includes("voo") || catLower.includes("passag") || catLower.includes("air")) normalizedCategory = "flight";
            else if (catLower.includes("car") || catLower.includes("transp") || catLower.includes("combust") || catLower.includes("alug") || catLower.includes("uber") || catLower.includes("taxi")) normalizedCategory = "car";
            else if (catLower.includes("activ") || catLower.includes("ingress") || catLower.includes("laz") || catLower.includes("aliment") || catLower.includes("rest") || catLower.includes("comid") || catLower.includes("bar")) normalizedCategory = "activity";
          }

          clearInterval(progressInterval);
          setOcrProgress(100);
          setOcrStep(4); // Pronto para revisão!

          // Save extracted result to preview state so user can edit before final application
          setOcrPreviewData({
            description: data.description || "Despesa Escaneada",
            category: normalizedCategory,
            totalCostBRL: (data.totalCostBRL || 0).toString(),
            notes: data.notes || "",
            isEditingForm: isEditingForm
          });

          setIsOcrLoading(false);
        } catch (err: any) {
          clearInterval(progressInterval);
          setIsOcrLoading(false);
          setOcrStep(0);
          console.error("AI OCR Error (onload):", err);
          setOcrError(err.message || "Erro de conexão ao processar comanda.");
        }
      };

      reader.onerror = () => {
        clearInterval(progressInterval);
        setIsOcrLoading(false);
        setOcrStep(0);
        setOcrError("Falha na leitura mecânica do arquivo local.");
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      clearInterval(progressInterval);
      setIsOcrLoading(false);
      setOcrStep(0);
      console.error("AI OCR Error (outer):", err);
      setOcrError(err.message || "Erro de conexão ao processar comanda.");
    }
  };

  // Editing state variables
  const [editingCost, setEditingCost] = useState<CostItem | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editCat, setEditCat] = useState<CostItem["category"]>("hotel");
  const [editNotes, setEditNotes] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editCostBRL, setEditCostBRL] = useState("");
  const [editStatus, setEditStatus] = useState<CostItem["status"]>("Pago");
  const [editDates, setEditDates] = useState("");
  const [editIsPersonal, setEditIsPersonal] = useState(false);
  const [editReceiptName, setEditReceiptName] = useState("");
  const [editReceiptData, setEditReceiptData] = useState("");

  const numTravelers = Math.max(1, travelers.length);

  // Divide costs between group and personal
  const groupCosts = costs.filter(c => !c.isPersonal);
  const userPersonalCosts = costs.filter(
    c => c.isPersonal && currentUser?.email && c.createdByEmail?.toLowerCase().trim() === currentUser.email.toLowerCase().trim()
  );

  const userEmailNormalized = currentUser?.email?.toLowerCase().trim() || "";
  
  const currentUserTraveler = userEmailNormalized 
    ? travelers.find(t => t.email?.toLowerCase().trim() === userEmailNormalized)
    : undefined;
    
  const userRole = currentUserTraveler?.role || "Viajante";
  const hasFinancePermission = ["Organizador", "Co-piloto", "Finanças"].includes(userRole);
  
  // They can manage costs if they are not in read-only mode (app owner) or they have a privileged role
  const canManageCosts = !isReadOnly || hasFinancePermission;

  const visibleCosts = costs.filter(c => {
    if (!c.isPersonal) return true;
    if (!userEmailNormalized) return false;
    return c.createdByEmail?.toLowerCase().trim() === userEmailNormalized;
  });

  const totalPersonalBRL = userPersonalCosts.reduce((acc, c) => acc + c.totalCostBRL, 0);

  // Math totals (group despesas ONLY)
  const totalUSD = 0; // if any
  const totalBRL = groupCosts.reduce((acc, current) => acc + current.totalCostBRL, 0);
  const perPersonBRL = totalBRL / numTravelers;

  // Breakdown by Status (group despesas ONLY)
  const paidBRL = groupCosts.filter((c) => c.status === "Pago").reduce((acc, c) => acc + c.totalCostBRL, 0);
  const payAtLocationBRL = groupCosts.filter((c) => c.status === "Pgto no local").reduce((acc, c) => acc + c.totalCostBRL, 0);
  const unpaidBRL = groupCosts.filter((c) => c.status === "Falta pagar").reduce((acc, c) => acc + c.totalCostBRL, 0);

  // Group costs by category for Recharts Pie Chart (group despesas ONLY)
  const categoriesMap: Record<string, { label: string; value: number; color: string }> = {};
  costCategories.forEach(cat => {
    categoriesMap[cat.id] = { label: cat.label, value: 0, color: cat.color };
  });

  groupCosts.forEach((c) => {
    if (categoriesMap[c.category]) {
      categoriesMap[c.category].value += c.totalCostBRL;
    } else {
      if (!categoriesMap["other"]) {
        categoriesMap["other"] = { label: "Outros gastos", value: 0, color: "#94A3B8" };
      }
      categoriesMap["other"].value += c.totalCostBRL;
    }
  });

  const chartData = Object.entries(categoriesMap)
    .map(([key, info]) => ({
      name: info.label,
      value: info.value,
      color: info.color,
      key
    }))
    .filter((item) => item.value > 0);

  const personalPaid = userPersonalCosts.filter(c => c.status === "Pago").reduce((acc, c) => acc + c.totalCostBRL, 0);
  const personalPayLocal = userPersonalCosts.filter(c => c.status === "Pgto no local").reduce((acc, c) => acc + c.totalCostBRL, 0);
  const personalUnpaid = userPersonalCosts.filter(c => c.status === "Falta pagar").reduce((acc, c) => acc + c.totalCostBRL, 0);

  const barChartData = [
    {
      name: "Grupo (Rateável)",
      "Pago": paidBRL,
      "Pgto no Local": payAtLocationBRL,
      "Falta Pagar": unpaidBRL,
    },
    {
      name: "Pessoal (Individual)",
      "Pago": personalPaid,
      "Pgto no Local": personalPayLocal,
      "Falta Pagar": personalUnpaid,
    }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-2xl shadow-xl text-[11px] font-sans">
          <p className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400">{data.name}</p>
          <p className="font-black text-xs text-indigo-300 mt-1">
            {formatCurrency(data.value)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
            {totalBRL > 0 ? ((data.value / totalBRL) * 100).toFixed(1) : 0}% do total (Grupo)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl text-[11px] font-sans space-y-1.5 min-w-[180px]">
          <p className="font-extrabold uppercase tracking-widest text-[9px] text-slate-400">{label}</p>
          <div className="border-t border-slate-800 pt-1.5 space-y-1">
            {payload.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-black text-white">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-1.5 flex justify-between font-black text-xs text-indigo-300">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const startEditing = (item: CostItem) => {
    setEditingCost(item);
    setEditDesc(item.description);
    setEditCat(item.category);
    setEditNotes(item.notes || "");
    setEditLink(item.link || "");
    setEditCostBRL(item.totalCostBRL.toString());
    setEditStatus(item.status);
    setEditDates(item.dateRange || "");
    setEditIsPersonal(item.isPersonal || false);
    setEditReceiptName(item.receiptName || "");
    setEditReceiptData(item.receiptData || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCost || !editDesc.trim() || !editCostBRL) return;

    onEditCost(editingCost.id, {
      category: editCat,
      description: editDesc.trim(),
      notes: editNotes.trim() || undefined,
      link: editLink.trim() || undefined,
      totalCostBRL: parseFloat(editCostBRL) || 0,
      status: editStatus,
      dateRange: editDates.trim() || undefined,
      isPersonal: editIsPersonal,
      createdByEmail: editingCost.createdByEmail || currentUser?.email || undefined,
      receiptName: editReceiptName || undefined,
      receiptData: editReceiptData || undefined
    });

    setEditingCost(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newCostBRL) return;

    onAddCost({
      category: newCat,
      description: newDesc.trim(),
      notes: newNotes.trim() || undefined,
      link: newLink.trim() || undefined,
      totalCostBRL: parseFloat(newCostBRL) || 0,
      status: newStatus,
      dateRange: newDates.trim() || undefined,
      isPersonal: newIsPersonal,
      createdByEmail: currentUser?.email || undefined,
      receiptName: newReceiptName || undefined,
      receiptData: newReceiptData || undefined
    });

    // Reset fields
    setNewDesc("");
    setNewCat("hotel");
    setNewNotes("");
    setNewLink("");
    setNewCostBRL("");
    setNewStatus("Pago");
    setNewDates("");
    setNewIsPersonal(false);
    setNewReceiptName("");
    setNewReceiptData("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
      {/* FINANCIAL OVERVIEW STRIP */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">RESUMO FINANCEIRO UNIFICADO ({numTravelers} VIAJANTES)</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">Dados correlacionados diretamente de sua planilha de viagens</p>
          </div>
          
          {/* Currency Switcher */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-1 border-r border-slate-200 pr-2">
               <span className="text-[10px] font-bold text-slate-500">1</span>
               <select
                 value={localCurrencyName} 
                 onChange={e => setLocalCurrencyName(e.target.value)}
                 className="w-16 px-1 py-0.5 text-xs font-bold text-center border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
               >
                 <option value="USD">USD</option>
                 <option value="EUR">EUR</option>
                 <option value="GBP">GBP</option>
                 <option value="ARS">ARS</option>
                 <option value="CLP">CLP</option>
                 <option value="COP">COP</option>
                 <option value="MXN">MXN</option>
                 <option value="PYG">PYG</option>
                 <option value="UYU">UYU</option>
                 <option value="CAD">CAD</option>
                 <option value="AUD">AUD</option>
                 <option value="JPY">JPY</option>
               </select>
               <span className="text-[10px] font-bold text-slate-400">= R$</span>
               <div className="relative">
                 <input 
                   type="number" 
                   step="0.0001" 
                   value={localExchangeRate} 
                   onChange={e => setLocalExchangeRate(parseFloat(e.target.value) || 0)}
                   className="w-20 px-1 py-0.5 text-xs font-bold border border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                   disabled={isFetchingRate}
                 />
                 {isFetchingRate && (
                   <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                 )}
               </div>
            </div>
            <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
               <button onClick={() => setViewCurrency("BRL")} className={`px-3 py-1 text-[10px] font-bold rounded-md ${viewCurrency === 'BRL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>BRL</button>
               <button onClick={() => setViewCurrency("LOCAL")} className={`px-3 py-1 text-[10px] font-bold rounded-md ${viewCurrency === 'LOCAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{localCurrencyName || "LOC"}</button>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${currentUser ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
          <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-805 font-bold uppercase tracking-wider">Custo Total Global</p>
              <p className="text-2xl font-black text-slate-800 mt-1">
                {formatCurrency(totalBRL)}
              </p>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">Soma de passagens e hotéis</p>
            </div>
            <span className="text-2xl text-emerald-500 font-black">{viewCurrency === 'LOCAL' ? localCurrencyName || '$' : 'R$'}</span>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-indigo-805 font-bold uppercase tracking-wider">Parceiro Financeiro / Pessoa</p>
              <p className="text-2xl font-black text-indigo-750 mt-1">
                {formatCurrency(perPersonBRL)}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Dividido igualmente por {numTravelers} aventureiros</p>
            </div>
            <Users className="w-8 h-8 text-indigo-400 shrink-0" />
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">Status Geral do Grupo</p>
              <div className="flex flex-col gap-0.5 mt-1 text-[11px] font-bold text-slate-650">
                <span className="text-emerald-700">Pago: {formatCurrency(paidBRL)}</span>
                <span className="text-amber-700">Pgto no Local: {formatCurrency(payAtLocationBRL)}</span>
                {unpaidBRL > 0 && <span className="text-rose-600">Pendente: {formatCurrency(unpaidBRL)}</span>}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500 shrink-0" />
          </div>

          {currentUser && (
            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Suas Despesas Pessoais</p>
                <p className="text-2xl font-black text-amber-900 mt-1">
                  {formatCurrency(totalPersonalBRL)}
                </p>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">Sem rateio • Visível apenas a você</p>
              </div>
              <Lock className="w-7 h-7 text-amber-500 shrink-0 animate-pulse" />
            </div>
          )}
        </div>

        {/* Dynamic Horizontal Chart Distribution (Image 2 styles) */}
        <div>
          <span className="text-[11px] block font-bold text-slate-500 uppercase tracking-wide mb-1.5">Distribuição do Fluxo Financeiro</span>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {paidBRL > 0 && (
              <div 
                className="bg-emerald-400 h-full transition-all" 
                style={{ width: `${(paidBRL / totalBRL) * 100}%` }}
                title={`PAGO: ${((paidBRL / totalBRL) * 100).toFixed(1)}%`}
              />
            )}
            {payAtLocationBRL > 0 && (
              <div 
                className="bg-amber-400 h-full transition-all" 
                style={{ width: `${(payAtLocationBRL / totalBRL) * 100}%` }}
                title={`PAGAMENTO NO LOCAL: ${((payAtLocationBRL / totalBRL) * 100).toFixed(1)}%`}
              />
            )}
            {unpaidBRL > 0 && (
              <div 
                className="bg-rose-500 h-full transition-all" 
                style={{ width: `${(unpaidBRL / totalBRL) * 100}%` }}
                title={`FALTA PAGAR: ${((unpaidBRL / totalBRL) * 100).toFixed(1)}%`}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-xs" /> Pago ({((paidBRL / totalBRL) * 100 || 0).toFixed(0)}%)</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-400 rounded-xs" /> Pgto no local ({((payAtLocationBRL / totalBRL) * 100 || 0).toFixed(0)}%)</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-xs" /> Falta pagar ({((unpaidBRL / totalBRL) * 100 || 0).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* CHARTS & ANALYTICS DOUBLE COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PIE CHART FOR EXPENSE DISTRIBUTION */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Gastos por Categoria</h3>
            </div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Distribuição relativa de despesas do roteiro</p>
          </div>

          {costs.length > 0 ? (
            <>
              <div className="relative w-full h-44 flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={chartData.map(d => ({ ...d, fill: d.color }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                    />
                    <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center select-none pointer-events-none">
                  <span className="text-[8px] uppercase font-black text-slate-400 tracking-widest block">Total</span>
                  <span className="text-sm font-black text-slate-800">
                    {totalBRL.toLocaleString("pt-BR", { notation: "compact", compactDisplay: "short" })}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-[140px] overflow-y-auto">
                {chartData.map((item) => (
                  <div key={item.key} className="flex items-center justify-between text-[11px] text-slate-605 font-bold px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[110px]" title={item.name}>{item.name}</span>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-black text-slate-800">
                        {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold ml-1">
                        ({totalBRL > 0 ? ((item.value / totalBRL) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Nenhuma despesa</p>
              <p className="text-[10px] text-slate-400 max-w-[180px] font-medium leading-normal">
                Adicione despesas na planilha abaixo para ver o gráfico
              </p>
            </div>
          )}
        </div>

        {/* BAR CHART COMPARISON (PERSONAL VS. GROUP COSTS) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Custos Pessoais vs. Grupo</h3>
            </div>
            <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Comparativo de sub-totais por tipo e status</p>
          </div>

          {costs.length > 0 ? (
            <>
              <div className="relative w-full h-44 flex items-center justify-center my-2 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barChartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94A3B8" 
                      fontSize={11} 
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94A3B8" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `R$ ${val}`}
                    />
                    <Tooltip isAnimationActive={false} content={<CustomBarTooltip />} cursor={{ fill: '#F8FAFC' }} />
                    <Legend 
                      verticalAlign="top" 
                      height={32}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{value}</span>}
                    />
                    <Bar isAnimationActive={false} dataKey="Pago" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="Pgto no Local" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                    <Bar isAnimationActive={false} dataKey="Falta Pagar" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px] font-bold">
                <div className="p-2.5 rounded-xl bg-indigo-50/40 border border-indigo-100/30">
                  <span className="text-[9px] uppercase font-bold text-indigo-500 block">Total do Grupo</span>
                  <span className="text-sm font-black text-indigo-950 block mt-0.5">{formatCurrency(totalBRL)}</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Rateado por {numTravelers} pessoas</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-100/30">
                  <span className="text-[9px] uppercase font-bold text-amber-600 block">Seus Gastos Pessoais</span>
                  <span className="text-sm font-black text-amber-950 block mt-0.5">{formatCurrency(totalPersonalBRL)}</span>
                  <span className="text-[9px] text-slate-400 font-medium block mt-0.5">Sem interferência no grupo</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Comparativo Indisponível</p>
              <p className="text-[10px] text-slate-400 max-w-[180px] font-medium leading-normal">
                Insira registros de passagens e despesas para visualizar o comparativo de rateio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SPREADSHEET CARD GRID LISTING */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Estruturação de Despesas & Ingressos</h3>
            <p className="text-[11px] text-slate-400 font-medium">Controle de passagens aéreas e hotelaria por status</p>
          </div>
          {canManageCosts && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" /> Categorias
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Despesa
              </button>
            </div>
          )}
        </div>

        {/* Add Cost Form */}
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleFormSubmit}
            className="bg-slate-50 border border-slate-205 p-5 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <p className="text-xs font-black text-indigo-950 uppercase tracking-widest">Preencher nova despesa estruturada</p>
              {currentUser && (
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase">Criado por: {currentUser.name || currentUser.email}</span>
              )}
            </div>

            {/* AI OCR Scanner Box */}
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <UploadCloud className="w-4 h-4 animate-bounce" />
                </div>
                <div className="text-left">
                  <span className="text-[11px] block font-extrabold text-indigo-950 uppercase tracking-wide">Escanear Comanda / Nota Fiscal com IA OCR</span>
                  <span className="text-[10px] text-slate-500 font-semibold leading-normal block">Preenchimento automático inteligente com tradução (qualidade Gemini 3.5 Flash)</span>
                </div>
              </div>

              <div className="w-full max-w-xs pt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleReceiptUpload(e, false)}
                  className="hidden"
                  id="ocr-receipt-upload"
                  disabled={isOcrLoading}
                />
                <label
                  htmlFor="ocr-receipt-upload"
                  className={`inline-flex items-center justify-center w-full gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isOcrLoading
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-sm"
                  }`}
                >
                  <Receipt className={`w-3.5 h-3.5 ${isOcrLoading ? "animate-spin" : ""}`} />
                  {isOcrLoading ? `Processando cupom (${ocrProgress}%)...` : "Selecionar Foto da Nota / Cupom"}
                </label>
              </div>

              {/* Progress Bar & Stage Indicator */}
              {isOcrLoading && (
                <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs text-left animate-pulse">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                      Extraindo Dados do Cupom...
                    </span>
                    <span className="font-black text-indigo-600">{ocrProgress}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-350"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[9px] font-extrabold pb-0.5 text-center">
                    <span className={`px-1.5 py-1 rounded-md border ${ocrStep === 1 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-150'}`}>
                      1. Ler Arquivo
                    </span>
                    <span className={`px-1.5 py-1 rounded-md border ${ocrStep === 2 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-150'}`}>
                      2. Gemini Vision
                    </span>
                    <span className={`px-1.5 py-1 rounded-md border ${ocrStep === 3 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-150'}`}>
                      3. Moeda / Câmbio
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-center italic">
                    {ocrStep === 1 && "📸 Lendo o arquivo de imagem local..."}
                    {ocrStep === 2 && "⚡ Gemini AI está extraindo os campos de gastos..."}
                    {ocrStep === 3 && "💱 Convertendo moedas do exterior para BRL..."}
                  </p>
                </div>
              )}

              {ocrError && (
                <div className="bg-red-50 text-red-700 text-[10px] font-bold p-2.5 rounded-xl border border-red-200 w-full text-center">
                  ⚠️ {ocrError}
                </div>
              )}

              {newReceiptName && (
                <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                  ✓ Nota carregada: <span className="font-extrabold">{newReceiptName}</span>
                </div>
              )}
            </div>

            {/* AI OCR Interactive Preview / Revision Section */}
            {ocrPreviewData && ocrPreviewData.isEditingForm === false && (
              <div className="bg-indigo-50/40 border-2 border-indigo-150 p-4 rounded-2xl space-y-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-indigo-150 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">Revisão IA de Dados Extraídos</span>
                  </div>
                  <span className="text-[9px] bg-indigo-100/80 text-indigo-750 font-extrabold px-2 py-0.5 rounded-full uppercase border border-indigo-200/50">
                    Ajuste antes de salvar
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 font-medium leading-normal">
                  Identificamos estes gastos na imagem automaticamente. Sinta-se livre para ajustar qualquer um dos campos abaixo antes de carregar no formulário principal de gastos:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-405 block mb-1 uppercase tracking-wider">Descrição Extraída</label>
                    <input 
                      type="text" 
                      value={ocrPreviewData.description}
                      onChange={e => setOcrPreviewData({ ...ocrPreviewData, description: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-405 block mb-1 uppercase tracking-wider">Classificação de Categoria</label>
                    <select
                      value={ocrPreviewData.category}
                      onChange={e => setOcrPreviewData({ ...ocrPreviewData, category: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-bold text-slate-800 focus:outline-hidden"
                    >
                      {sortedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-405 block mb-1 uppercase tracking-wider">Custo Calculado (BRL R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={ocrPreviewData.totalCostBRL}
                      onChange={e => setOcrPreviewData({ ...ocrPreviewData, totalCostBRL: e.target.value })}
                      className="w-full px-3 py-1.5 border border-indigo-200 rounded-xl bg-white font-black text-indigo-950 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-405 block mb-1 uppercase tracking-wider">Notas Internas adicionais</label>
                    <input 
                      type="text" 
                      value={ocrPreviewData.notes}
                      onChange={e => setOcrPreviewData({ ...ocrPreviewData, notes: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-xl bg-white font-semibold text-slate-655 focus:outline-hidden"
                      placeholder="Comentários sobre a nota/comanda"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-indigo-150 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOcrPreviewData(null);
                      setOcrStep(0);
                    }}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-bold transition-all bg-white shadow-xs cursor-pointer"
                  >
                    Descartar Nota
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDesc(ocrPreviewData.description);
                      setNewCat(ocrPreviewData.category as CostItem["category"]);
                      setNewCostBRL(ocrPreviewData.totalCostBRL);
                      setNewNotes(ocrPreviewData.notes);
                      setOcrPreviewData(null);
                      setOcrStep(0);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    ✓ Confirmar e Preencher
                  </button>
                </div>
              </div>
            )}

            {/* Expense Type Switcher */}
            <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Tipo de Enquadramento da Despesa</span>
                <span className="text-[11px] text-slate-500 font-semibold mt-0.5 leading-normal block">
                  {newIsPersonal 
                    ? "Esta é uma despesa pessoal: não afeta os totais do grupo e só estará visível para você." 
                    : "Esta é uma despesa do grupo: o valor total será dividido de forma rateada igualmente por todos."}
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setNewIsPersonal(false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !newIsPersonal 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" /> Grupo (Ratear)
                </button>
                <button
                  type="button"
                  onClick={() => setNewIsPersonal(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    newIsPersonal 
                      ? "bg-indigo-600 text-white shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-700" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" /> Pessoal
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Descrição da Despesa</label>
                <input 
                  type="text" 
                  placeholder="e.g. Hotel Moca NYC" 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Categoria</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as CostItem["category"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                >
                  {sortedCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="flex justify-between items-end mb-0.5">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase">Valor Total (BRL R$)</label>
                  {!newIsPersonal && Number(newCostBRL) > 0 && travelers.length > 0 && (
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                      Rateio: R$ {(Number(newCostBRL) / travelers.length).toFixed(2)} p/ pessoa
                    </span>
                  )}
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={newCostBRL}
                  onChange={(e) => setNewCostBRL(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Período / Data Estadia</label>
                <input 
                  type="date" 
                  value={newDates}
                  onChange={(e) => setNewDates(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Status do Pagamento</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as CostItem["status"])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                >
                  <option value="Pago">Pago</option>
                  <option value="Pgto no local">Pagar no local (Ganha milhas/débito)</option>
                  <option value="Falta pagar">Falta pagar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Notas Adicionais</label>
                <input 
                  type="text" 
                  placeholder="e.g. Latam / Código localizador" 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase">Link Hotel / Comprovante</label>
                <input 
                  type="url" 
                  placeholder="https://maps.app..." 
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-705 font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md"
              >
                Adicionar Despesa
              </button>
            </div>
          </motion.form>
        )}

        {/* Expenses List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-extrabold uppercase border-b border-slate-200 text-[10px]">
                <th className="py-2.5 px-3">Local / Hospedagem</th>
                <th className="py-2.5 px-3">Período</th>
                <th className="py-2.5 px-3">Notas</th>
                <th className="py-2.5 px-3 text-right">Valor Total ({viewCurrency === 'LOCAL' ? localCurrencyName || 'LOC' : 'BRL'})</th>
                <th className="py-2.5 px-3 text-right">Por Pessoa ({numTravelers})</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-2 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleCosts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="shrink-0 text-slate-400">
                        <Receipt className="w-3.5 h-3.5 text-indigo-500" />
                      </span>
                      <span>{item.description}</span>
                      {item.isPersonal ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                          <Lock className="w-2.5 h-2.5" /> Pessoal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-50 text-slate-500 border border-slate-200 uppercase">
                          <Users className="w-2.5 h-2.5" /> Grupo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {item.link && (
                        <button 
                          onClick={() => {
                            setMapModalTarget({
                              title: item.description || "Link de Finanças",
                              query: item.link!
                            });
                          }}
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer bg-transparent border-0 p-0"
                        >
                          <LinkIcon className="w-2.5 h-2.5" /> Ver link original
                        </button>
                      )}
                      {item.receiptData && (
                        <button
                          onClick={() => {
                            setViewReceiptData(item.receiptData!);
                            setViewReceiptName(item.receiptName || "comprovante_fiscal.png");
                          }}
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                        >
                          <Eye className="w-2.5 h-2.5" /> Ver Nota Anexada
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-semibold">{formatCostDate(item.dateRange)}</td>
                  <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate" title={item.notes}>
                    {item.notes || "—"}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-800 text-right">
                    {formatCurrency(item.totalCostBRL)}
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-650 text-right">
                    {item.isPersonal ? (
                      <span className="text-[10px] font-bold text-slate-400 italic">Individual</span>
                    ) : (
                      formatCurrency(item.totalCostBRL / numTravelers)
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {!canManageCosts ? (
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border inline-block whitespace-nowrap ${
                        item.status === "Pago" 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                          : item.status === "Pgto no local"
                          ? "bg-amber-50 text-amber-705 border-amber-250" 
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {item.status}
                      </span>
                    ) : (
                      <select
                        value={item.status}
                        onChange={(e) => onUpdateCostStatus(item.id, e.target.value as CostItem["status"])}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-hidden ${
                          item.status === "Pago" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100" 
                            : item.status === "Pgto no local"
                            ? "bg-amber-50 text-amber-705 border-amber-250 hover:bg-amber-100" 
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        <option value="Pago">Pago</option>
                        <option value="Pgto no local">Pgto Local</option>
                        <option value="Falta pagar">Falta Pagar</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {canManageCosts && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(item)}
                          className="p-1 px-2 text-indigo-650 hover:text-indigo-805 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-extrabold text-[10px] uppercase border border-indigo-100/50"
                          title="Editar despesa"
                        >
                          <Pencil className="w-3 h-3" />
                          Editar
                        </button>
                        {(() => {
                          const authorized = canDeleteEntity(userRole, currentUser?.email, item.createdByEmail);
                          return (
                            <button
                              onClick={() => authorized && onRemoveCost(item.id)}
                              disabled={!authorized}
                              className={`p-1.5 transition-colors rounded-lg ${
                                authorized 
                                  ? "text-slate-400 hover:text-rose-650 hover:bg-rose-50 cursor-pointer" 
                                  : "text-slate-200 bg-slate-50 opacity-40 cursor-not-allowed"
                              }`}
                              title={authorized ? "Excluir item" : "Sem permissão de exclusão (apenas Criador ou Administrador)"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {costs.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            Nenhuma despesa adicionada ainda.
          </div>
        )}

      </div>

      {/* EDIT MODAL / DIALOG */}
      <AnimatePresence>
        {editingCost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Editar Despesa</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajustar os parâmetros de custos do grupo</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCost(null)}
                  className="text-slate-450 hover:text-slate-655 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                {/* AI OCR Scanner Box for Editing */}
                <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-dashed border-indigo-200 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                    <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wide">Recarregar Nota Fiscal com IA OCR</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleReceiptUpload(e, true)}
                    className="hidden"
                    id="ocr-edit-receipt-upload"
                    disabled={isOcrLoading}
                  />
                  <label
                    htmlFor="ocr-edit-receipt-upload"
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isOcrLoading
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500 shadow-sm"
                    }`}
                  >
                    <Receipt className={`w-3.5 h-3.5 ${isOcrLoading ? "animate-spin" : ""}`} />
                    {isOcrLoading ? `Lendo cupom (${ocrProgress}%)...` : "Escanear nova comanda"}
                  </label>

                  {/* Progress Bar & Stage Indicator for Edit Modal */}
                  {isOcrLoading && (
                    <div className="w-full bg-white border border-slate-200 rounded-lg p-2.5 space-y-2 text-left animate-pulse">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-extrabold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                          Escaneando Nota...
                        </span>
                        <span className="font-black text-indigo-600">{ocrProgress}%</span>
                      </div>
                      
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-350"
                          style={{ width: `${ocrProgress}%` }}
                        />
                      </div>

                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center italic">
                        {ocrStep === 1 && "📸 Lendo o arquivo de imagem..."}
                        {ocrStep === 2 && "⚡ Analisando com Gemini 3.5..."}
                        {ocrStep === 3 && "💱 Ajustando valores ao câmbio BRL..."}
                      </p>
                    </div>
                  )}

                  {editReceiptName && (
                    <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5">
                      ✓ Anexo: {editReceiptName}
                    </div>
                  )}
                </div>

                {/* AI OCR Review Box for Editing Modal */}
                {ocrPreviewData && ocrPreviewData.isEditingForm === true && (
                  <div className="bg-indigo-50/50 border border-indigo-200 p-3 rounded-xl space-y-3 shadow-xs text-left">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        <span className="text-[10px] font-black text-indigo-950 uppercase tracking-wider">Revisar Campos Extraídos</span>
                      </div>
                      <span className="text-[8px] bg-indigo-100 text-indigo-805 px-1.5 py-0.5 rounded-md font-bold uppercase">IA OCR</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 block mb-0.5 uppercase">Descrição</label>
                        <input 
                          type="text" 
                          value={ocrPreviewData.description}
                          onChange={e => setOcrPreviewData({ ...ocrPreviewData, description: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white font-bold text-slate-800 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 block mb-0.5 uppercase">Categoria</label>
                        <select
                          value={ocrPreviewData.category}
                          onChange={e => setOcrPreviewData({ ...ocrPreviewData, category: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white font-bold text-slate-800 focus:outline-hidden"
                        >
                          {sortedCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 block mb-0.5 uppercase">Valor Total (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={ocrPreviewData.totalCostBRL}
                          onChange={e => setOcrPreviewData({ ...ocrPreviewData, totalCostBRL: e.target.value })}
                          className="w-full px-2 py-1 border border-indigo-200 rounded-lg bg-white font-black text-indigo-950 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-extrabold text-slate-400 block mb-0.5 uppercase">Notas/Comentários</label>
                        <input 
                          type="text" 
                          value={ocrPreviewData.notes}
                          onChange={e => setOcrPreviewData({ ...ocrPreviewData, notes: e.target.value })}
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg bg-white font-semibold text-slate-600 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1.5 border-t border-indigo-100 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setOcrPreviewData(null);
                          setOcrStep(0);
                        }}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-lg font-bold transition-all bg-white cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditDesc(ocrPreviewData.description);
                          setEditCat(ocrPreviewData.category as CostItem["category"]);
                          setEditCostBRL(ocrPreviewData.totalCostBRL);
                          setEditNotes(ocrPreviewData.notes);
                          setOcrPreviewData(null);
                          setOcrStep(0);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black transition-all cursor-pointer flex items-center gap-1"
                      >
                        ✓ Aplicar Alterações
                      </button>
                    </div>
                  </div>
                )}

                {/* Expense Type Switcher */}
                <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center gap-2">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Enquadramento</span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {editIsPersonal ? "Despesa Individual" : "Gasto Rateado em Grupo"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditIsPersonal(false)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                        !editIsPersonal ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Grupo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditIsPersonal(true)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                        editIsPersonal ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      Pessoal
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Descrição da Despesa</label>
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Categoria</label>
                    <select
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value as CostItem["category"])}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      {sortedCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Status do Pagamento</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as CostItem["status"])}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Pago">Pago</option>
                      <option value="Pgto no local">Pagar no local (Ganha milhas/débito)</option>
                      <option value="Falta pagar">Falta pagar</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-end mb-0.5">
                      <label className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">Valor Total (BRL R$)</label>
                      {!editIsPersonal && Number(editCostBRL) > 0 && travelers.length > 0 && (
                        <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-sm">
                          Rateio: R$ {(Number(editCostBRL) / travelers.length).toFixed(2)} p/ pessoa
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={editCostBRL}
                      onChange={(e) => setEditCostBRL(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Período / Data Estadia</label>
                    <input
                      type="date"
                      value={editDates}
                      onChange={(e) => setEditDates(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Notas Adicionais</label>
                    <input
                      type="text"
                      placeholder="e.g. Latam / Código localizador"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 block mb-0.5 uppercase tracking-wider">Link Hotel / Comprovante</label>
                    <input
                      type="url"
                      placeholder="https://maps.app..."
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCost(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Viewer Overlay Modal */}
      <AnimatePresence>
        {viewReceiptData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-emerald-500" /> Comprovante Fiscal / Cupom
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold truncate max-w-xs">{viewReceiptName}</p>
                </div>
                <button
                  onClick={() => {
                    setViewReceiptData(null);
                    setViewReceiptName(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-lg font-black p-1 hover:bg-slate-100 rounded-lg px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-950 min-h-[300px]">
                <img
                  src={viewReceiptData}
                  alt="Cupom Fiscal"
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 text-xs">
                <a
                  href={viewReceiptData}
                  download={viewReceiptName || "nota_fiscal.png"}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer bg-white shadow-sm"
                >
                  Download Arquivo
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setViewReceiptData(null);
                    setViewReceiptName(null);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer"
                >
                  Fechar Visualização
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCategoriesModal && (
        <CostCategoriesModal
          categories={costCategories}
          onUpdate={setCostCategories}
          onClose={() => setShowCategoriesModal(false)}
        />
      )}

      {mapModalTarget && (
        <MapsSelectorModal
          isOpen={!!mapModalTarget}
          onClose={() => setMapModalTarget(null)}
          title={mapModalTarget.title}
          query={mapModalTarget.query}
        />
      )}
    </div>
  );
}
