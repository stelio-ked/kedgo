import React, { useState } from "react";
import { Sparkles, Bot, Compass, ArrowRight, CheckCircle2, RefreshCw, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KedGoLogo from "./KedGoLogo";

interface KedIAGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateItinerary: (payload: {
    destination: string;
    days: number;
    pace: string;
    budget: string;
    isRoadTrip: boolean;
  }) => void;
}

export const KedIAGuideModal: React.FC<KedIAGuideModalProps> = ({
  isOpen,
  onClose,
  onGenerateItinerary,
}) => {
  const [step, setStep] = useState<number>(1);
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(7);
  const [pace, setPace] = useState("equilibrado"); // 'tranquilo' | 'equilibrado' | 'intenso'
  const [budget, setBudget] = useState("moderado"); // 'economico' | 'moderado' | 'luxo'
  const [isRoadTrip, setIsRoadTrip] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsGenerating(true);
    setTimeout(() => {
      onGenerateItinerary({
        destination: destination || "Califórnia",
        days,
        pace,
        budget,
        isRoadTrip,
      });
      setIsGenerating(false);
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1E3A5F] to-[#162B48] p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#D95D39] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> KedIA Copiloto
              </span>
              <span className="text-[10px] font-extrabold text-amber-300">Co-criação em 35s</span>
            </div>

            <h3 className="text-xl font-black text-white">
              Monte seu Roteiro Inteligente
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Responda a 3 perguntas rápidas para a KedIA estruturar seus dias, hotéis e estimativas financeiras.
            </p>
          </div>

          {/* Form Wizard */}
          {isGenerating ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-[#1E3A5F]/10 text-[#1E3A5F] rounded-full flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-8 h-8 text-[#D95D39]" />
              </div>
              <h4 className="text-lg font-black text-slate-900">KedIA está estruturando seu roteiro...</h4>
              <p className="text-xs font-semibold text-slate-500">
                Calculando rotas, selecionando hospedagens e prevendo custos em BRL e USD...
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              
              {/* Step 1: Destination & Days */}
              {step === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Para onde você quer viajar?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Califórnia, Paris, Gramado, Tóquio..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-[#1E3A5F] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Quantos dias de viagem? ({days} dias)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={21}
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                      className="w-full accent-[#D95D39] cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!destination.trim()}
                    className="w-full py-3 bg-[#1E3A5F] hover:bg-[#162B48] text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>Próximo Passo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 2: Pace & Roadtrip */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Qual o ritmo desejado para a viagem?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'tranquilo', label: '🌿 Tranquilo' },
                        { id: 'equilibrado', label: '⚖️ Equilibrado' },
                        { id: 'intenso', label: '⚡ Intenso' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPace(p.id)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                            pace === p.id ? 'border-[#D95D39] bg-orange-50 text-[#D95D39]' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRoadTrip}
                        onChange={(e) => setIsRoadTrip(e.target.checked)}
                        className="w-4 h-4 accent-[#D95D39] rounded-sm"
                      />
                      <div className="text-xs font-bold text-slate-800">
                        🚗 Viagem no estilo Road Trip (troca de cidades de carro)
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-[#1E3A5F] hover:bg-[#162B48] text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Perfil Financeiro</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Budget & Generate */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Qual o seu perfil de orçamento?
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'economico', label: '🎒 Econômico' },
                        { id: 'moderado', label: '🏨 Moderado' },
                        { id: 'luxo', label: '💎 Luxo' },
                      ].map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBudget(b.id)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                            budget === b.id ? 'border-[#1E3A5F] bg-indigo-50 text-[#1E3A5F]' : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="flex-1 py-3 bg-[#D95D39] hover:bg-[#C86446] text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Gerar Roteiro com KedIA</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KedIAGuideModal;
