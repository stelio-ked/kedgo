import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Copy, 
  Check, 
  Compass, 
  ExternalLink,
  Smartphone,
  Navigation,
  X
} from "lucide-react";

interface MapsSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  query: string;
  latitude?: number;
  longitude?: number;
}

// Inline SVGs for consistent loading without network/hotlinking errors
function GoogleMapsSvg() {
  return (
    <svg className="w-7 h-7 mb-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1"/>
      <path d="M12 4C9.2 4 7 6.2 7 9c0 3.8 5 11 5 11s5-7.2 5-11c0-2.8-2.2-5-5-5zm0 7.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335" />
      <circle cx="12" cy="9" r="2.2" fill="#ffffff" />
      <path d="M8 12.5l2-1.5 2.5 2 3-2 1.5 1" stroke="#34A853" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

function AppleMapsSvg() {
  return (
    <svg className="w-7 h-7 mb-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="#1d4ed8" />
      <path d="M5 19V7l5.5 2.5L16.5 7v12l-6-2.5L5 19z" fill="#3b82f6" opacity="0.3" />
      <path d="M5 19V7l5.5 2.5M16.5 7v12l-6-2.5M5.5 19l5-2.5 6 2.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 7.5L15 13.5l-6-1.5 4.5-4.5z" fill="#ef4444" />
      <path d="M9 12L13.5 7.5l-1.5 6L9 12z" fill="#cbd5e1" />
    </svg>
  );
}

function WazeSvg() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#33b3e4" />
      <path d="M12 5.5c-3.1 0-5.7 2.3-5.7 5.5 0 1.7.9 3.2 2.2 4.1l-.4 1.6c-.1.3.2.5.4.4l1.9-.6c.5.2 1.1.2 1.6.2 3.1 0 5.7-2.3 5.7-5.5s-2.6-5.7-5.7-5.7z" fill="#ffffff" />
      <circle cx="10" cy="11" r="1" fill="#000000" />
      <circle cx="14" cy="11" r="1" fill="#000000" />
      <path d="M11 13.5c.5.4 1.5.4 2 0" stroke="#000000" strokeWidth="1" strokeLinecap="round" />
      <circle cx="9.5" cy="17.5" r="1.3" fill="#000000" />
      <circle cx="9.5" cy="17.5" r="0.6" fill="#ffffff" />
      <circle cx="14.5" cy="17.5" r="1.3" fill="#000000" />
      <circle cx="14.5" cy="17.5" r="0.6" fill="#ffffff" />
    </svg>
  );
}

export default function MapsSelectorModal({
  isOpen,
  onClose,
  title,
  query,
  latitude,
  longitude
}: MapsSelectorModalProps) {
  const [copied, setCopied] = useState<"address" | "link" | null>(null);

  if (!isOpen) return null;

  // Detect query type and support relative / non-protocol shortlinks
  const isUrl = (str: string) => {
    try {
      if (!str) return false;
      const s = str.trim().toLowerCase();
      return s.startsWith("http://") || s.startsWith("https://") || s.includes("maps.app.goo.gl") || s.includes("goo.gl/maps");
    } catch {
      return false;
    }
  };

  const getAbsoluteUrl = (str: string) => {
    if (!str) return "";
    const trimmed = str.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  // Helper to remove emojis and clean parameters for clean search parsing
  const cleanSearchQuery = (str: string) => {
    if (!str) return "";
    // Safely remove emojis using Unicode properties without stripping letters or numbers
    let clean = str.replace(/\p{Extended_Pictographic}/gu, "");
    // Replace double spaces and trim
    clean = clean.replace(/\s+/g, " ").trim();
    return clean;
  };

  const isQueryUrl = isUrl(query);
  const absoluteQuery = isQueryUrl ? getAbsoluteUrl(query) : query;
  const hasCoords = typeof latitude === "number" && typeof longitude === "number";

  // Check if it is a shortened/unstable Google Maps URL that might trigger "Link não suportado" or "Dynamic Link Not Found"
  const isShortMapsUrl = isQueryUrl && (
    absoluteQuery.includes("maps.app.goo.gl") || 
    absoluteQuery.includes("goo.gl/maps") ||
    absoluteQuery.includes("maps.google")
  );

  // Clean textual fallbacks for mapping clients that don't support direct shortlinks
  const cleanTitle = cleanSearchQuery(title);
  const searchText = isQueryUrl ? cleanTitle : cleanSearchQuery(query || title);

  // 1. Google Maps:
  // - If we have coordinates: target them directly.
  // - If it's an unstable short maps link: query by name/text for 100% stability, avoiding "Link não suportado".
  // - Otherwise: search for text.
  const gmapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : isShortMapsUrl
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`
      : isQueryUrl
        ? absoluteQuery
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchText)}`;

  // 2. Apple Maps:
  // - If we have coordinates: search lat/lng & pass the description title.
  // - If query is a URL: we MUST fallback to the textual title description, otherwise Apple Maps fails.
  // - Otherwise: search text.
  const appleMapsUrl = hasCoords
    ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(cleanTitle)}`
    : `https://maps.apple.com/?q=${encodeURIComponent(searchText)}`;

  // 3. Waze:
  // - If we have coordinates: navigate directly.
  // - If query is a URL: search text.
  // - Otherwise: search text.
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(searchText)}`;

  const handleCopy = async (textToCopy: string, type: "address" | "link") => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Falha ao copiar dados", err);
    }
  };

  return (
    <AnimatePresence>
      <div id="maps-selector-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          id="maps-selector-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
            <div className="flex gap-2.5 items-center">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Como deseja navegar?</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selecione o seu app favorito</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Target Card info */}
            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl text-left">
              <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Destino Selecionado</span>
              <h4 className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">{title}</h4>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed break-words font-medium">
                {isQueryUrl ? title : (query || title)}
              </p>
              {hasCoords && (
                <div className="flex items-center gap-1 mt-1.5 text-[9px] text-slate-400 font-mono">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>{latitude?.toFixed(5)}, {longitude?.toFixed(5)} (Coordenadas Reais)</span>
                </div>
              )}
            </div>

            {isShortMapsUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left text-amber-900 space-y-1">
                <p className="text-[11px] font-bold flex items-start gap-1">
                  <span>⚠️</span>
                  <span>Aviso: Link Curto do Google Maps</span>
                </p>
                <p className="text-[10px] leading-relaxed text-amber-800 font-medium">
                  Este link utiliza o encurtador antigo (<code>maps.app.goo.gl</code>) desativado pelo Google, o que causa o erro "Link não suportado" em celulares.
                </p>
                <p className="text-[10px] leading-relaxed font-bold text-amber-950">
                  Para abrir com sucesso, toque no botão <b>Google Maps</b> abaixo (que usa busca segura por texto) ou em <b>Copiar Endereço</b>.
                </p>
              </div>
            )}

            {/* Copy Actions Section */}
            <div className="space-y-1.5">
              <button
                onClick={() => handleCopy(searchText, "address")}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-all cursor-pointer border ${
                  copied === "address" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                    : "bg-indigo-600 border-indigo-650 hover:bg-indigo-700 text-white shadow-xs"
                }`}
              >
                {copied === "address" ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Endereço Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Endereço (Texto Puro)
                  </>
                )}
              </button>

              {isQueryUrl && (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={absoluteQuery}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl font-bold text-[10px] flex justify-center items-center gap-1.5 transition-all cursor-pointer border bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir Link Direto
                  </a>
                  <button
                    onClick={() => handleCopy(absoluteQuery, "link")}
                    className={`py-2.5 px-3 rounded-xl font-bold text-[10px] flex justify-center items-center gap-1.5 transition-all cursor-pointer border ${
                      copied === "link" 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-slate-100 border-slate-200 hover:bg-slate-150 text-slate-600"
                    }`}
                  >
                    {copied === "link" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Link
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Options List */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider text-left block">
                Abrir diretamente nos Aplicativos:
              </span>

              {/* Google Maps & Apple Maps side-by-side */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center group transition-all"
                >
                  <GoogleMapsSvg />
                  <span className="text-[10px] font-bold text-slate-700">Google Maps</span>
                  <span className="text-[8px] text-indigo-600 font-extrabold uppercase">
                    {isShortMapsUrl ? "Busca Segura" : "Web / App"}
                  </span>
                </a>

                {/* Apple Maps Link */}
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center justify-center text-center group transition-all"
                >
                  <AppleMapsSvg />
                  <span className="text-[10px] font-bold text-slate-700">Apple Maps</span>
                  <span className="text-[8px] text-slate-400">Exclusivo iOS</span>
                </a>
              </div>

              {/* Waze Link */}
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between px-4 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <WazeSvg />
                  <span className="text-[11px] font-bold text-slate-700">Navegar com Waze</span>
                </div>
                <Navigation className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-650 transition-colors" />
              </a>
            </div>

            {/* Direct Deep link scheme trigger (for immediate native launch) */}
            <div className="border-t border-slate-100 pt-3 flex flex-col items-center">
              <span className="text-[10px] font-extrabold text-indigo-650 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                Dica de Celular / Iframe
              </span>
              <p className="text-[10px] text-slate-400 text-center mt-1 leading-relaxed px-1">
                Caso sua conexão Sandbox bloqueie os links, toque em <strong>Copiar Endereço</strong> acima e cole no seu aplicativo preferido (ou Uber / Grab / Taxi).
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

