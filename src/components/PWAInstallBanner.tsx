import React, { useState, useEffect } from "react";
import { X, Compass, Share, PlusSquare, Smartphone, CheckCircle2 } from "lucide-react";

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if app is already running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (navigator as any).standalone === true;

    if (isStandalone) {
      return; // Do not show banner if already running as standalone app
    }

    // 2. Check if user dismissed banner recently
    const dismissed = localStorage.getItem("kktur_pwa_banner_dismissed");
    if (dismissed === "true") {
      return;
    }

    // 3. Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(iosDevice);

    // 4. Capture native beforeinstallprompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 5. If mobile device, show banner (works for iOS and Android)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth <= 768;
    if (isMobile) {
      setShowBanner(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("kktur_pwa_banner_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native Android / Chrome PWA install dialog
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Show iOS step-by-step installation instructions
      setShowIosModal(true);
    } else {
      // Fallback: Show instructions or trigger install
      alert("Para instalar: abra o menu do navegador e selecione 'Adicionar à tela de início' ou 'Instalar aplicativo'.");
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* TOP SMART APP INSTALL BANNER (Matches screenshot design) */}
      <div className="bg-white border-b border-slate-200 px-3 py-2.5 shadow-sm sticky top-0 z-50 animate-fadeIn">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
          {/* Left: Dismiss Button + App Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              aria-label="Fechar aviso de aplicativo"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* App Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Compass className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Middle: Callout Text */}
          <div className="grow min-w-0 pr-1">
            <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug line-clamp-2">
              Obtenha a melhor experiência baixando nosso aplicativo para mobile!
            </p>
          </div>

          {/* Right: Install Pill Button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2 rounded-full transition shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Instalar</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS INSTALL INSTRUCTIONS MODAL (Safari) */}
      {showIosModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl animate-slideUp border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Instalar no iPhone</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              Siga os 2 passos rápidos no Safari para adicionar o <strong>KedGo!</strong> à sua tela de início:
            </p>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Toque no ícone de <strong className="text-indigo-650">Compartilhar</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-indigo-600" /> na barra inferior do navegador.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                <p className="text-xs font-bold text-slate-800 leading-snug">
                  Role o menu e selecione <strong className="text-indigo-650">Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-indigo-600" />.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosModal(false);
                handleDismiss();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Entendi!</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
