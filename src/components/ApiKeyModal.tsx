import React, { useState, useEffect } from "react";
import { Key, X, Check, ExternalLink, ShieldCheck, Sparkles, Trash2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getVisitorApiKey, setVisitorApiKey } from "../utils/geminiClient";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getVisitorApiKey());
      setSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    setVisitorApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleRemove = () => {
    setVisitorApiKey("");
    setApiKey("");
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const hasKey = !!getVisitorApiKey();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 font-sans"
        >
          {/* Header */}
          <div className="relative p-6 sm:p-7 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
                <Key className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Sua Chave Gemini AI</h2>
                <p className="text-xs text-indigo-100 font-medium">Uso gratuito e ilimitado sem fila no servidor</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-7 space-y-5">
            {/* Status card */}
            <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              hasKey
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-indigo-50/70 border-indigo-100 text-indigo-950"
            }`}>
              <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${hasKey ? "text-emerald-600" : "text-indigo-600"}`} />
              <div className="space-y-1">
                <p className="font-bold text-xs">
                  {hasKey ? "✅ Chave Ativa no seu Navegador" : "Por que usar sua própria chave?"}
                </p>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {hasKey
                    ? "Todas as gerações de roteiro, OCR e pesquisas de locais agora usam sua chave direta, sem limitações ou espera por cota do servidor."
                    : "O Google AI Studio oferece cotas gratuitas mensais para qualquer conta Google. Ao cadastrar sua chave aqui, você ganha uso livre sem consumir tokens compartilhados."}
                </p>
              </div>
            </div>

            {/* Input field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                API Key do Google AI Studio:
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-3 pr-11 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* How to get a free key */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Não tem uma chave ainda? É grátis em 1 clique:</span>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl transition-all shrink-0 cursor-pointer"
              >
                <span>Obter no Google</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {hasKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-3 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
                  title="Remover Chave"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remover</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saved}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Salvo com Sucesso!</span>
                  </>
                ) : (
                  <span>Salvar Chave</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default ApiKeyModal;
