import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ArrowRight, 
  Loader2, 
  Compass, 
  HelpCircle, 
  CheckCircle2, 
  X,
  Compass as CompassIcon,
  Plane,
  AlertCircle,
  Key,
  Globe,
  Star,
  Zap,
  Camera,
  Luggage
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getAiHeaders } from "../utils/geminiClient";
import ApiKeyModal from "./ApiKeyModal";
import KedGoLogo from "./KedGoLogo";

interface AIPlannerWidgetProps {
  token: string | null;
  isOffline: boolean;
  onImportGeneratedItinerary: (title: string, payload: any) => void;
  setActiveTab: (tab: string) => void;
  isReadOnly?: boolean;
}

interface SuggestedQuestion {
  id: string;
  category?: string;
  question: string;
  options: string[];
  placeholder?: string;
}

interface EvaluationResult {
  isSpecific: boolean;
  reason: string;
  suggestedQuestions: SuggestedQuestion[];
}

// Step transition variants
const stepVariants = {
  enter: { opacity: 0, x: 40, scale: 0.97 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -40, scale: 0.97 }
};

const stepTransition = {
  type: "spring" as const,
  stiffness: 350,
  damping: 30,
  mass: 0.8
};

// Backdrop variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Modal variants
const modalVariants = {
  hidden: { scale: 0.88, opacity: 0, y: 30 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 28, mass: 0.7 }
  },
  exit: { 
    scale: 0.92, 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2, ease: "easeIn" }
  }
};

export default function AIPlannerWidget({
  token,
  isOffline,
  onImportGeneratedItinerary,
  setActiveTab,
  isReadOnly = false
}: AIPlannerWidgetProps) {

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"input" | "questions" | "generating" | "success">("input");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  
  // Evaluation results state
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Custom user inputs for questions
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  // Loading messages rotation
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = [
    "KedIA estruturando estratégia de bases e bairros ideais...",
    "Agrupando atrações por proximidade geográfica (Manhã, Tarde e Noite)...",
    "Pesquisando recomendações gastronômicas reais próximas...",
    "Consultando dicas de insider para fotos e para evitar filas...",
    "Calculando estimativas financeiras reais por pessoa...",
    "Verificando ingressos antecipados, aplicativos recomendados e alertas locais..."
  ];

  // Progress percentage for generating
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    let interval: any;
    if (step === "generating") {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Smooth progress bar
  useEffect(() => {
    let interval: any;
    if (step === "generating") {
      setProgressPct(0);
      interval = setInterval(() => {
        setProgressPct((prev) => {
          if (prev >= 92) return prev;
          const increment = prev < 30 ? 4 : prev < 60 ? 2.5 : prev < 80 ? 1.5 : 0.5;
          return Math.min(prev + increment, 92);
        });
      }, 500);
    } else if (step === "success") {
      setProgressPct(100);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleReset = () => {
    setStep("input");
    setPrompt("");
    setAnswers({});
    setCustomInputs({});
    setEvaluation(null);
    setError("");
    setProgressPct(0);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Por favor, descreva um pouco os seus planos de viagem.");
      return;
    }
    setError("");
    setStep("generating");
    setLoadingMsgIdx(0);

    try {
      const response = await fetch("/api/gemini/evaluate-prompt", {
        method: "POST",
        headers: getAiHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }),
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Não foi possível avaliar os dados do prompt com a IA.");
      }

      const result = await response.json();
      setEvaluation(result);

      if (result.isSpecific) {
        // Safe to go straight to itinerary generation
        await handleGenerate(result, {});
      } else {
        setStep("questions");
      }
    } catch (err: any) {
      setError(err.message || "Erro de rede ao falar com o servidor.");
      setStep("input");
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const handleCustomInputChange = (questionId: string, val: string) => {
    setCustomInputs((prev) => ({
      ...prev,
      [questionId]: val
    }));
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val
    }));
  };

  const triggerGenerationWithAnswers = async () => {
    // Fill any missing answers with custom inputs if available, else blank
    const finalAnswersObj = { ...answers };
    evaluation?.suggestedQuestions.forEach((q) => {
      if (!finalAnswersObj[q.id] && customInputs[q.id]) {
        finalAnswersObj[q.id] = customInputs[q.id];
      }
    });

    setStep("generating");
    setLoadingMsgIdx(2); // Start ahead in messages
    await handleGenerate(evaluation, finalAnswersObj);
  };

  const handleGenerate = async (evalObj: EvaluationResult | null, finalAnswers: Record<string, string>) => {
    try {
      const response = await fetch("/api/gemini/generate-itinerary", {
        method: "POST",
        headers: getAiHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }),
        body: JSON.stringify({
          prompt,
          answers: finalAnswers
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Houve uma falha na geração do roteiro com a IA.");
      }

      const payload = await response.json();
      
      // Compute a clean title for the new itinerary based on generated context
      const city = payload?.destinations?.[0]?.city || "Novo Destino";
      const country = payload?.destinations?.[0]?.country || "";
      const dates = payload?.destinations?.[0]?.dates || "Data a Definir";
      const title = `Roteiro IA: ${city}${country ? `, ${country}` : ""} (${dates})`;

      // Import directly into current user state
      onImportGeneratedItinerary(title, payload);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "Houve uma falha ao gerar a viagem. Tente novamente.");
      setStep(evalObj?.isSpecific ? "input" : "questions");
    }
  };

  const handleGoToTrip = () => {
    setIsOpen(false);
    setActiveTab("itinerary");
    handleReset();
  };

  if (isReadOnly) return null;

  return (
    <>
      {/* Floating Action Button for AI Copilot — with pulse ring */}
      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
        {/* Pulse ring behind button */}
        {!isOffline && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 animate-pulseRing" />
        )}
        <motion.button
          onClick={() => {
            if (isOffline) {
              alert("A Consultora KedIA necessita de uma conexão ativa com a internet.");
              return;
            }
            setIsOpen(true);
          }}
          disabled={isOffline}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className={`relative p-4 rounded-full shadow-xl transition-all flex items-center justify-center ${
            isOffline 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
              : "bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 text-white hover:shadow-2xl cursor-pointer animate-fabPulse"
          }`}
          title="KedIA - Arquiteta de Roteiros"
        >
          <Sparkles className="w-6 h-6" />
        </motion.button>
      </div>

      {/* AI Wizard Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              {/* Modal Top Header */}
              <motion.div 
                className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50/70 rounded-t-3xl shrink-0"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-1 rounded-full bg-white shadow-xs border border-amber-900/10"
                    whileHover={{ rotate: 12, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <KedGoLogo variant="mark" size={36} />
                  </motion.div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                      <span>KedIA</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-black">Arquiteta de Itinerários</span>
                    </h4>
                    <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">Consultoria de Viagem Hiperpersonalizada</p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </motion.div>

              {/* Steps Area with AnimatePresence for transitions */}
              <div className="p-6 grow overflow-y-auto space-y-6">
                {error && (
                  <motion.div 
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2 text-rose-800 text-xs font-semibold"
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{error}</span>
                    </div>
                    <div className="flex justify-end pt-1">
                      <motion.button
                        type="button"
                        onClick={() => setShowApiKeyModal(true)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-100/50 text-rose-900 rounded-xl text-[11px] font-extrabold shadow-xs transition-all cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-600" />
                        <span>Configurar Chave Própria Grátis</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {/* STEP 1: INITIAL INPUT */}
                  {step === "input" && (
                    <motion.form
                      key="step-input"
                      onSubmit={handleEvaluate}
                      className="space-y-4"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={stepTransition}
                    >
                      {/* Hero banner */}
                      <motion.div 
                        className="bg-gradient-to-br from-amber-500/10 via-pink-500/10 to-indigo-600/10 border border-indigo-100 rounded-2xl p-5 mb-2 space-y-3 relative overflow-hidden"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-400/15 rounded-full animate-orbFloat1" />
                        <div className="absolute -bottom-6 -left-3 w-16 h-16 bg-pink-400/15 rounded-full animate-orbFloat2" />
                        
                        <div className="relative">
                          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <motion.span
                              animate={{ rotate: [0, 15, -15, 0] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            >
                              <Sparkles className="w-4 h-4 text-indigo-600" />
                            </motion.span>
                            Olá! Sou a KedIA, sua Arquiteta de Itinerários
                          </h3>
                          <p className="text-[11px] text-slate-600 font-semibold leading-relaxed mt-1">
                            Conte para onde quer viajar e sua ideia inicial. Vou realizar um diagnóstico estruturado do seu perfil antes de traçar a logística perfeita, gastronomia e dicas de insider!
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.35 }}
                      >
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest block">
                          Ideia inicial da viagem:
                        </label>
                        <textarea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Ex: Quero fazer uma viagem de 10 dias pela Turquia em casal, passando por Istambul e Capadócia, com foco em cultura, gastronomia local e voo de balão em ritmo moderado."
                          rows={5}
                          className="w-full text-sm font-semibold p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none placeholder:text-slate-400 text-slate-800 transition-all shadow-xs"
                        />
                      </motion.div>

                      <motion.div 
                        className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs font-bold text-indigo-950 flex items-start gap-2.5 leading-relaxed"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.35 }}
                      >
                        <CompassIcon className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Fase 1 (Diagnóstico):</strong> A KedIA fará perguntas rápidas sobre logística, orçamento e ritmo para garantir que o roteiro final seja matematicamente e geograficamente impecável.
                        </span>
                      </motion.div>

                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.015, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.3 }}
                        className="w-full cursor-pointer bg-indigo-600 text-white font-black text-xs py-3.5 rounded-2xl hover:bg-indigo-750 transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>Iniciar Diagnóstico com KedIA</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    </motion.form>
                  )}

                  {/* STEP 2: REFINING QUESTIONS (FASE 1: DIAGNÓSTICO) */}
                  {step === "questions" && evaluation && (
                    <motion.div
                      key="step-questions"
                      className="space-y-6"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={stepTransition}
                    >
                      <motion.div 
                        className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl space-y-1"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.35 }}
                      >
                        <p className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-amber-600" /> [Fase 1: Diagnóstico do Viajante]
                        </p>
                        <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                          {evaluation.reason || "Por favor, responda aos tópicos abaixo para calibrar a logística exata, ritmo e estilo da viagem."}
                        </p>
                      </motion.div>

                      <div className="space-y-4">
                        {evaluation.suggestedQuestions.map((q, idx) => (
                          <motion.div 
                            key={q.id} 
                            className="space-y-2.5 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl"
                            initial={{ opacity: 0, y: 15, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              delay: 0.15 + idx * 0.08, 
                              type: "spring", 
                              stiffness: 350, 
                              damping: 28 
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-black">
                                  {idx + 1}
                                </span>
                                {q.question}
                              </p>
                              {q.category && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-600 shrink-0">
                                  {q.category}
                                </span>
                              )}
                            </div>

                            {/* Quick selection pills */}
                            {q.options && q.options.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {q.options.map((opt) => {
                                  const selected = answers[q.id] === opt;
                                  return (
                                    <motion.button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleSelectOption(q.id, opt)}
                                      whileHover={{ scale: 1.04 }}
                                      whileTap={{ scale: 0.96 }}
                                      animate={selected ? { scale: [1, 1.06, 1] } : {}}
                                      transition={{ duration: 0.2 }}
                                      className={`py-1.5 px-3 rounded-xl text-[11px] font-extrabold border cursor-pointer transition-all ${
                                        selected
                                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-400"
                                      }`}
                                    >
                                      {opt}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Manual Text option */}
                            <input
                              type="text"
                              placeholder={q.placeholder || "Ou digite sua resposta específica..."}
                              value={customInputs[q.id] || ""}
                              onChange={(e) => handleCustomInputChange(q.id, e.target.value)}
                              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-205 outline-none bg-white focus:border-indigo-600 transition-colors"
                            />
                          </motion.div>
                        ))}
                      </div>

                      <motion.div 
                        className="flex flex-col sm:flex-row gap-3 pt-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.35 }}
                      >
                        <motion.button
                          type="button"
                          onClick={triggerGenerationWithAnswers}
                          whileHover={{ scale: 1.015, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 cursor-pointer bg-indigo-600 text-white font-black text-xs py-3.5 rounded-2xl hover:bg-indigo-750 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>Confirmar Diagnóstico & Gerar Roteiro (Fase 2) ✨</span>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setAnswers({});
                            triggerGenerationWithAnswers();
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="py-3.5 px-5 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-2xl transition-all border border-slate-200/60"
                        >
                          Pular diagnóstico
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* STEP 3: GENERATING SCREEN — Premium loading */}
                  {step === "generating" && (
                    <motion.div
                      key="step-generating"
                      className="py-10 flex flex-col items-center justify-center text-center space-y-6"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={stepTransition}
                    >
                      {/* Floating Stamp & Orbiting Elements Animation */}
                      <div className="relative w-36 h-36 flex items-center justify-center select-none">
                        {/* Background glowing ambient pulse */}
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-br from-[#BD5738]/25 via-amber-500/20 to-[#1E3A5F]/25 rounded-full blur-2xl"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.9, 0.6] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                        />

                        {/* Orbiting Ring Visual Guide */}
                        <div className="absolute inset-1 rounded-full border border-dashed border-amber-300/40 pointer-events-none animate-spin" style={{ animationDuration: '24s' }} />
                        
                        {/* Orbiting Decorative Travel Elements */}
                        <motion.div
                          className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50"
                          animate={{ 
                            x: [0, 48, 0, -48, 0], 
                            y: [-48, 0, 48, 0, -48],
                            scale: [0.8, 1.2, 0.8],
                          }}
                          transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                        />
                        <motion.div
                          className="absolute p-1 bg-white text-[#BD5738] rounded-full shadow-md border border-amber-200/60"
                          animate={{ 
                            x: [36, -15, -36, 15, 36], 
                            y: [15, 42, -15, -42, 15],
                            scale: [1, 0.85, 1],
                          }}
                          transition={{ repeat: Infinity, duration: 5.5, ease: "linear" }}
                        >
                          <Camera className="w-3 h-3" />
                        </motion.div>
                        <motion.div
                          className="absolute p-1 bg-white text-[#1E3A5F] rounded-full shadow-md border border-slate-200"
                          animate={{ 
                            x: [-32, 32, -32], 
                            y: [32, -32, 32],
                            scale: [0.9, 1.15, 0.9],
                          }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        >
                          <Luggage className="w-3 h-3" />
                        </motion.div>

                        {/* Sparkle badge */}
                        <motion.div
                          className="absolute text-amber-500"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.6, 1, 0.6],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                          style={{ top: '8%', right: '15%' }}
                        >
                          <Sparkles className="w-4 h-4 fill-amber-400" />
                        </motion.div>
                        
                        {/* Central @kedpelomundo Stamp Logo */}
                        <motion.div 
                          className="relative z-10 p-1 bg-white rounded-full shadow-xl border-2 border-amber-900/15"
                          animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 3, -3, 0]
                          }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                          <KedGoLogo variant="stamp" size={72} showSlogan={false} />
                        </motion.div>

                        {/* Orbiting Airplane */}
                        <motion.div 
                          className="absolute z-20"
                          animate={{ 
                            x: [0, 40, 0, -40, 0],
                            y: [-36, 0, 36, 0, -36],
                            rotate: [-15, 45, 165, 225, 345]
                          }}
                          transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                        >
                          <div className="p-1.5 bg-[#1E3A5F] text-amber-300 rounded-full shadow-md">
                            <Plane className="w-3.5 h-3.5" />
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Text area */}
                      <div className="space-y-3 max-w-sm">
                        <motion.h4 
                          className="text-base font-black text-slate-800"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          Criando sua obra de arte de viagem...
                        </motion.h4>

                        {/* Rotating messages */}
                        <div className="h-7 overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.p
                              key={loadingMsgIdx}
                              initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                              exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                              transition={{ duration: 0.45, ease: "easeOut" }}
                              className="text-xs font-black text-indigo-600 leading-relaxed"
                            >
                              {loadingMessages[loadingMsgIdx]}
                            </motion.p>
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full max-w-xs space-y-2">
                        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600"
                            style={{ backgroundSize: "200% 100%" }}
                            initial={{ width: "0%" }}
                            animate={{ 
                              width: `${progressPct}%`,
                              backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
                            }}
                            transition={{ 
                              width: { duration: 0.5, ease: "easeOut" },
                              backgroundPosition: { repeat: Infinity, duration: 2, ease: "linear" }
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Isso pode levar de 15 a 35 segundos
                          </p>
                          <p className="text-[10px] text-indigo-600 font-black">
                            {Math.round(progressPct)}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: SUCCESS — Celebration */}
                  {step === "success" && (
                    <motion.div
                      key="step-success"
                      className="py-10 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden"
                      variants={stepVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={stepTransition}
                    >
                      {/* Confetti-like decorative particles */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[
                          { color: "bg-amber-400", left: "10%", delay: "0s" },
                          { color: "bg-pink-400", left: "25%", delay: "0.1s" },
                          { color: "bg-indigo-400", left: "40%", delay: "0.2s" },
                          { color: "bg-emerald-400", left: "55%", delay: "0.15s" },
                          { color: "bg-rose-400", left: "70%", delay: "0.25s" },
                          { color: "bg-blue-400", left: "85%", delay: "0.05s" },
                          { color: "bg-purple-400", left: "15%", delay: "0.3s" },
                          { color: "bg-orange-400", left: "60%", delay: "0.12s" },
                        ].map((particle, i) => (
                          <div
                            key={i}
                            className={`absolute w-2 h-2 ${particle.color} rounded-full animate-confetti`}
                            style={{ left: particle.left, top: "20%", animationDelay: particle.delay }}
                          />
                        ))}
                      </div>

                      {/* Success icon with bounce */}
                      <motion.div 
                        className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/15 relative"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 15,
                          delay: 0.1
                        }}
                      >
                        <CheckCircle2 className="w-12 h-12" />
                        
                        {/* Sparkle accents */}
                        <motion.div 
                          className="absolute -top-1 -right-1"
                          animate={{ rotate: [0, 180, 360], scale: [0.8, 1.2, 0.8] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </motion.div>
                        <motion.div 
                          className="absolute -bottom-1 -left-1"
                          animate={{ rotate: [0, -180, -360], scale: [1, 0.7, 1] }}
                          transition={{ repeat: Infinity, duration: 2.5, delay: 0.3 }}
                        >
                          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                        </motion.div>
                      </motion.div>

                      <motion.div 
                        className="space-y-2 max-w-sm"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <h4 className="text-lg font-black text-slate-800">Roteiro Gerado com Sucesso! 🎉</h4>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Nossa inteligência artificial desenhou um itinerário maravilhoso para sua viagem, completo com hotéis, voos, custos e passeios recomendados.
                        </p>
                      </motion.div>

                      {/* Progress complete */}
                      <motion.div 
                        className="w-full max-w-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                      >
                        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full bg-emerald-500"
                            initial={{ width: "92%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>

                      <motion.button
                        type="button"
                        onClick={handleGoToTrip}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 20 }}
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Abrir Diário de Roteiros</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini AI BYOK API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </>
  );
}
