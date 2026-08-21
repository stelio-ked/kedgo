import React from "react";
import { Lock, Sparkles, X, Check, ShieldCheck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KedGoLogo from "./KedGoLogo";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout: () => void;
  featureName?: string;
}

export const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({
  isOpen,
  onClose,
  onOpenCheckout,
  featureName = "esta funcionalidade",
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#1E3A5F] via-[#162B48] to-[#D95D39] p-6 text-white text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
                <Lock className="w-8 h-8 text-amber-300" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white tracking-tight">
              Seu Período de Teste Expirou
            </h3>
            <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
              Para utilizar <strong>{featureName}</strong> e ter acesso completo aos roteiros inteligentes, faça seu upgrade para o <strong>KedGo! Pro</strong> ou adquira o Passe Avulso.
            </p>
          </div>

          {/* Benefits */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              O que você libera no Pro:
            </p>
            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Criar roteiros ilimitados com IA</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Cofre de documentos offline ilimitado</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Planilha de Finanças e Divisão de Custos</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>Exportação completa em PDF oficial</span>
              </li>
            </ul>

            {/* CTA Buttons */}
            <div className="pt-3 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckout();
                }}
                className="w-full py-3 bg-gradient-to-r from-[#1E3A5F] to-[#D95D39] hover:from-[#162B48] hover:to-[#c44e2b] text-white font-extrabold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Desbloquear Acesso Completo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-bold transition cursor-pointer"
              >
                Continuar navegando
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TrialExpiredModal;
