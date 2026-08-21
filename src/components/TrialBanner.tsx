import React from "react";
import { Sparkles, Clock, AlertTriangle, ArrowRight, Zap } from "lucide-react";

interface TrialBannerProps {
  trialDaysRemaining: number;
  trialExpired: boolean;
  onOpenCheckout: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({
  trialDaysRemaining,
  trialExpired,
  onOpenCheckout,
}) => {
  if (trialExpired) {
    return (
      <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
          <span>
            <strong>Seu período de teste gratuito de 15 dias expirou.</strong> Faça upgrade para liberar o acesso total ao KedGo!
          </span>
        </div>
        <button
          onClick={onOpenCheckout}
          className="ml-3 px-3.5 py-1 bg-white text-rose-700 hover:bg-amber-100 font-extrabold text-xs rounded-lg transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
        >
          <span>Liberar Acesso Pro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#1E3A5F] via-[#2A4D7C] to-[#D95D39] text-white px-4 py-2 shadow-sm flex items-center justify-between text-xs font-medium">
      <div className="flex items-center gap-2">
        <div className="p-1 bg-amber-400/20 rounded-md">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
        </div>
        <span>
          Modo Teste Gratuito:{" "}
          <strong className="text-amber-300 font-extrabold">
            {trialDaysRemaining} {trialDaysRemaining === 1 ? "dia restante" : "dias restantes"}
          </strong>{" "}
          de acesso ilimitado às ferramentas.
        </span>
      </div>
      <button
        onClick={onOpenCheckout}
        className="ml-3 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-lg transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
      >
        <Sparkles className="w-3 h-3 text-slate-900" />
        <span>Desbloquear KedGo Pro</span>
      </button>
    </div>
  );
};

export default TrialBanner;
