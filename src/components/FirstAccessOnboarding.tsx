import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Compass,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  PenTool,
  CheckCircle2,
  HelpCircle,
  Wand2,
  Globe,
  Plane,
  Zap,
  Key
} from "lucide-react";
import { getAiHeaders } from "../utils/geminiClient";
import ApiKeyModal from "./ApiKeyModal";

interface FirstAccessOnboardingProps {
  token: string | null;
  isOffline: boolean;
  onImportGeneratedItinerary: (title: string, payload: any) => Promise<void> | void;
  onCreateManualItinerary: (title: string) => Promise<void> | void;
  currentUser?: { name?: string; email?: string } | null;
}

interface SuggestedQuestion {
  id: string;
  question: string;
  options: string[];
}

interface EvaluationResult {
  isSpecific: boolean;
  reason: string;
  suggestedQuestions: SuggestedQuestion[];
}

export default function FirstAccessOnboarding({
  token,
  isOffline,
  onImportGeneratedItinerary,
  onCreateManualItinerary,
  currentUser
}: FirstAccessOnboardingProps) {
  const [activeMode, setActiveMode] = useState<"ai" | "manual">("ai");

  // AI Flow State
  const [prompt, setPrompt] = useState("");
  const [step, setStep] = useState<"input" | "questions" | "generating">("input");
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Manual Flow State
  const [manualTitle, setManualTitle] = useState("");

  // AI quota state
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const AI_LIMIT = 20;

  // Dynamic templates from DB (fallback to static)
  const staticTemplates = [
    { label: "7 dias em Paris & Roma", text: "7 dias em Paris e Roma com atrações culturais, gastronomia e orçamento moderado." },
    { label: "10 dias no Japão", text: "10 dias no Japão visitando Tóquio e Quioto com ritmo equilibrado." },
    { label: "Férias em Gramado", text: "Final de semana romântico em Gramado e Canela com passeios e restaurantes." },
    { label: "5 dias em Nova York", text: "5 dias em Nova York conhecendo atrações principais, Broadway e parques." }
  ];
  const [quickTemplates, setQuickTemplates] = useState(staticTemplates);

  // Loading Messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = [
    "Analisando os melhores destinos e atrações...",
    "Selecionando hotéis e pontos imperdíveis...",
    "Estruturando atividades práticas e prazerosas dia a dia...",
    "Otimizando distâncias de transporte e rotas...",
    "Calculando estimativas financeiras reais e dicas locais..."
  ];

  useEffect(() => {
    let interval: any;
    if (step === "generating") {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [step]);


  // Fetch dynamic templates from DB on mount (fallback to static if empty)
  useEffect(() => {
    if (!token) return;
    fetch("/api/gemini/prompt-templates", {
      headers: getAiHeaders({ "Authorization": `Bearer ${token}` })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.templates && data.templates.length >= 2) {
          setQuickTemplates(data.templates);
        }
      })
      .catch(() => {/* silently use static fallback */ });
  }, [token]);

  const handleEvaluatePrompt = async (promptText: string) => {
    const textToUse = promptText || prompt;
    if (!textToUse.trim()) {
      setError("Por favor, informe seu destino ou ideia de viagem.");
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
        body: JSON.stringify({ prompt: textToUse })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Falha ao analisar plano com a IA.");
      }

      const result = await response.json();
      setEvaluation(result);

      if (result.isSpecific) {
        await handleGenerateItinerary(textToUse, result, {});
      } else {
        setStep("questions");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao comunicar com a IA.");
      setStep("input");
    }
  };

  const handleGenerateItinerary = async (
    promptText: string,
    evalObj: EvaluationResult | null,
    finalAnswers: Record<string, string>
  ) => {
    try {
      const response = await fetch("/api/gemini/generate-itinerary", {
        method: "POST",
        headers: getAiHeaders({
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }),
        body: JSON.stringify({
          prompt: promptText,
          answers: finalAnswers
        })
      });

      // Capture AI usage quota from response headers
      const remaining = response.headers.get("X-AI-Remaining");
      if (remaining !== null) {
        setAiRemaining(parseInt(remaining, 10));
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Houve uma falha ao gerar o roteiro com a IA.");
      }

      const payload = await response.json();
      const city = payload?.destinations?.[0]?.city || "Nova Viagem";
      const country = payload?.destinations?.[0]?.country || "";
      const dates = payload?.destinations?.[0]?.dates || "";
      const title = `Viagem: ${city}${country ? `, ${country}` : ""} ${dates ? `(${dates})` : ""}`;

      await onImportGeneratedItinerary(title, payload);
    } catch (err: any) {
      setError(err.message || "Houve uma falha ao gerar o roteiro. Tente novamente.");
      setStep(evalObj?.isSpecific ? "input" : "questions");
    }
  };

  const triggerQuestionsGeneration = async () => {
    const finalAnswersObj = { ...answers };
    evaluation?.suggestedQuestions.forEach((q) => {
      if (!finalAnswersObj[q.id] && customInputs[q.id]) {
        finalAnswersObj[q.id] = customInputs[q.id];
      }
    });

    setStep("generating");
    setLoadingMsgIdx(2);
    await handleGenerateItinerary(prompt, evaluation, finalAnswersObj);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      setError("Por favor, digite um nome para a sua viagem.");
      return;
    }
    onCreateManualItinerary(manualTitle.trim());
  };

  const userName = currentUser?.name ? currentUser.name.split(" ")[0] : "Viajante";

  return (
    <div className="max-w-3xl mx-auto my-6 px-4 py-4 animate-fadeIn">
      {/* Header Greeting Banner */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-black tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>Primeiro Acesso ao KEDGO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Olá, <span className="text-indigo-650">{userName}</span>! Vamos criar sua viagem?
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-lg mx-auto leading-relaxed">
          Escolha como deseja começar. Você pode pedir para nossa IA montar tudo automaticamente ou estruturar manualmente do zero.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl max-w-md mx-auto mb-8 border border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveMode("ai"); setError(""); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${activeMode === "ai"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <Wand2 className="w-4 h-4" />
          <span>Gerar com IA (Recomendado)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveMode("manual"); setError(""); }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${activeMode === "manual"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
        >
          <PenTool className="w-4 h-4 text-slate-500" />
          <span>Criar Manualmente</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold text-center animate-fadeIn space-y-2">
          <p>{error}</p>
          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100/50 text-rose-900 rounded-xl text-[11px] font-extrabold shadow-xs transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Configurar Chave Própria Grátis (Uso Ilimitado)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE A: AI GENERATOR FLOW */}
      {activeMode === "ai" && (
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {step === "generating" ? (
            /* AI GENERATION ANIMATED LOADING STATE */
            <div className="py-12 text-center space-y-6 animate-fadeIn">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-indigo-600/10 animate-ping" />
                <div className="relative w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg text-white">
                  <Compass className="w-10 h-10 animate-spin-slow" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900">
                  Criando seu roteiro inteligente...
                </h3>
                <p className="text-xs font-semibold text-indigo-650 animate-pulse min-h-[24px]">
                  {loadingMessages[loadingMsgIdx]}
                </p>
              </div>

              <div className="max-w-xs mx-auto bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          ) : step === "questions" && evaluation ? (
            /* CLARIFYING QUESTIONS STATE */
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1.5">
                <span className="inline-flex p-2.5 bg-amber-50 text-amber-700 rounded-full mb-1">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <h3 className="text-lg font-black text-slate-900">Para personalizar ainda melhor...</h3>
                <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
                  Sua ideia é ótima! Responda às perguntas rápidas abaixo para ajustarmos os detalhes:
                </p>
              </div>

              <div className="space-y-5 max-w-xl mx-auto">
                {evaluation.suggestedQuestions.map((q) => (
                  <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-black text-slate-800">{q.question}</label>

                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`px-3 py-2 text-xs font-extrabold rounded-xl border transition-all cursor-pointer ${answers[q.id] === opt
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Ou digite outra resposta..."
                      value={customInputs[q.id] || ""}
                      onChange={(e) => {
                        setCustomInputs(prev => ({ ...prev, [q.id]: e.target.value }));
                        setAnswers(prev => ({ ...prev, [q.id]: e.target.value }));
                      }}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="flex-1 py-3 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl cursor-pointer"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={triggerQuestionsGeneration}
                  className="flex-1 py-3 text-xs font-black text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-95 rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✨ Gerar Meu Roteiro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* INITIAL PROMPT INPUT STATE */
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>Descreva a viagem dos seus sonhos</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: 7 dias em Paris e Roma com foco em gastronomia, arte e hospedagem charmosa..."
                    className="w-full p-4 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 resize-none leading-relaxed placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                  Ou selecione uma sugestão rápida:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickTemplates.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPrompt(item.text);
                        handleEvaluatePrompt(item.text);
                      }}
                      className="p-3 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <span className="text-xs font-black text-slate-700 group-hover:text-indigo-700 line-clamp-1">{item.label}</span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Usage Badge */}
              {aiRemaining !== null && (
                <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black border ${aiRemaining > 5
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : aiRemaining > 0
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}>
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {aiRemaining > 0
                      ? `${aiRemaining} de ${AI_LIMIT} usos de IA disponíveis hoje`
                      : "Limite diário de IA atingido. Tente novamente amanhã."}
                  </span>
                </div>
              )}

              {/* Submit AI Button */}
              <button
                type="button"
                onClick={() => handleEvaluatePrompt(prompt)}
                disabled={!prompt.trim() || aiRemaining === 0}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2.5 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>✨ Gerar Roteiro Completo com IA</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE B: MANUAL ITINERARY CREATION */}
      {activeMode === "manual" && (
        <form onSubmit={handleManualSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto">
              <PenTool className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Planejar do Zero</h3>
            <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto">
              Dê um nome para a sua primeira viagem. Você poderá adicionar destinos, voos e atividades no seu próprio ritmo!
            </p>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Viagem</label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Ex: Eurotrip 2026, Férias em Família..."
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>

          <div className="max-w-md mx-auto">
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <span>Criar Roteiro Manualmente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Gemini AI BYOK API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
      />
    </div>
  );
}
