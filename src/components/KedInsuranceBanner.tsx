import React from "react";
import { ShieldCheck, ExternalLink, FileCheck, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";

interface KedInsuranceBannerProps {
  destinationCountry?: string;
  onImportPolicy?: () => void;
}

export const KedInsuranceBanner: React.FC<KedInsuranceBannerProps> = ({
  destinationCountry = "Internacional",
  onImportPolicy,
}) => {
  const isSchengen = ["França", "Itália", "Espanha", "Alemanha", "Portugal", "Europa", "Amsterdã", "Holanda", "Grécia", "Suíça"].some(c => 
    destinationCountry.toLowerCase().includes(c.toLowerCase())
  );

  const affiliateUrl = "https://seguroviagem.srv.br/?ag=kedpelomundo";

  return (
    <div className="bg-gradient-to-r from-[#1E3A5F] via-[#162B48] to-[#1E3A5F] text-white rounded-3xl p-5 md:p-6 shadow-xl border border-white/10 relative overflow-hidden my-4">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D95D39]/15 rounded-full blur-3xl transform translate-x-12 -translate-y-12" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        
        {/* Left Info */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ked Seguro Viagem Oficial
            </span>
            {isSchengen && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Obrigatório no Destino
              </span>
            )}
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Viaje 100% Protegido sem Perrengue Médico
          </h3>

          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {isSchengen ? (
              <>O <strong>Tratado de Schengen</strong> exige cobertura médica mínima de €30.000 para este destino. Cotar com a chancela do <strong>KedPeloMundo</strong> garante suporte 24h e sincronização direta no Cofre Offline do app.</>
            ) : (
              <>Evite despesas médicas altíssimas no exterior. Cotar o <strong>Ked Seguro Viagem</strong> garante a melhor cobertura com sincronização direta de comprovantes no Cofre Offline do KedGo!.</>
            )}
          </p>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-5 bg-[#D95D39] hover:bg-[#C86446] text-white rounded-2xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-center"
          >
            <span>Cotar Ked Seguro Viagem</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {onImportPolicy && (
            <button
              onClick={onImportPolicy}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-white/15"
            >
              <FileCheck className="w-4 h-4 text-emerald-300" />
              <span>Importar Apólice para o Cofre</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default KedInsuranceBanner;
