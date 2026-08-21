import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  QrCode, 
  Check, 
  Copy, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Gift,
  HelpCircle,
  Tag,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KedGoLogo from "./KedGoLogo";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planType: 'pass' | 'pro_lifetime') => void;
  initialPlan?: 'pass' | 'pro_lifetime';
  itineraryTitle?: string;
  token?: string | null;
  activeItineraryId?: number | string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan = 'pro_lifetime',
  itineraryTitle = 'Minha Viagem',
  token,
  activeItineraryId,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'pass' | 'pro_lifetime'>(initialPlan);
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [validatedSourceName, setValidatedSourceName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);

  // Server-side verification function for discount/referral code
  const validateAndApplyCode = async (codeToValidate: string, isSilent = false) => {
    const clean = codeToValidate.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setIsDiscountApplied(false);
      if (!isSilent) setCouponError("Insira um código válido com pelo menos 3 caracteres.");
      return false;
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    try {
      const res = await fetch(`/api/referral/validate/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data && data.valid) {
        setDiscountCode(clean);
        setIsDiscountApplied(true);
        setValidatedSourceName(data.referrerName || clean);
        setCouponError("");
        try {
          localStorage.setItem("kedgo_referral_code", clean);
        } catch {}
        return true;
      } else {
        setIsDiscountApplied(false);
        setValidatedSourceName("");
        setCouponError("Código promocional ou de indicação inválido ou não encontrado.");
        try {
          localStorage.removeItem("kedgo_referral_code");
        } catch {}
        return false;
      }
    } catch {
      setIsDiscountApplied(false);
      setCouponError("Falha na validação com o servidor. Tente novamente.");
      return false;
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Auto-sync plan and auto-validate referral / promotional code (e.g. KED1, KED10)
  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setSelectedPlan(initialPlan);
      }
      setCouponError("");

      // Check stored referral code or query param (?ref=..., ?cupom=..., ?promo=...)
      let detectedCode = "";
      try {
        const urlParams = new URLSearchParams(window.location.search);
        detectedCode = urlParams.get("ref") || urlParams.get("refCode") || urlParams.get("cupom") || urlParams.get("coupon") || urlParams.get("promo") || "";
        if (!detectedCode) {
          const pathParts = window.location.pathname.split("/");
          if (pathParts.length >= 3 && pathParts[1].toLowerCase() === "ref") {
            detectedCode = pathParts[2];
          }
        }
        if (!detectedCode) {
          detectedCode = localStorage.getItem("kedgo_referral_code") || "";
        }
      } catch {
        // Ignore URL parsing errors
      }

      const cleanCode = (detectedCode || "").trim().toUpperCase();
      if (cleanCode && cleanCode.length >= 3) {
        setDiscountCode(cleanCode);
        validateAndApplyCode(cleanCode, true);
      } else {
        setIsDiscountApplied(false);
        setDiscountCode("");
      }
    }
  }, [isOpen, initialPlan]);

  if (!isOpen) return null;

  const basePrice = selectedPlan === 'pass' ? 29.90 : 149.90;
  const discountAmount = isDiscountApplied ? 10.00 : 0.00;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;
    await validateAndApplyCode(discountCode, false);
  };

  const handleRemoveDiscount = () => {
    setIsDiscountApplied(false);
    setDiscountCode('');
    setCouponError('');
    setValidatedSourceName('');
    try {
      localStorage.removeItem("kedgo_referral_code");
    } catch {}
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers,
        body: JSON.stringify({
          plan: selectedPlan,
          itineraryId: activeItineraryId,
          isDiscountApplied,
          discountCode: discountCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erro ao gerar ambiente de pagamento.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao conectar com a Stripe.");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans"
        >
          {/* Top Bar */}
          <div className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between">
            <KedGoLogo size={32} showSlogan={false} inverse={true} className="text-white" />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {paymentComplete ? (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Pagamento Confirmado!</h3>
              <p className="text-xs font-semibold text-slate-600">
                Seu acesso foi liberado! Aproveite todos os recursos do KedGo! sem limites.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

              {/* Select Plan Switcher */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-2 tracking-wider">
                  Escolha a Licença
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pass')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedPlan === 'pass'
                        ? "border-[#D95D39] bg-orange-50/40 ring-2 ring-[#D95D39]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-slate-900">🎫 Passe KedGo!</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">Para esta viagem</div>
                    <div className="text-sm font-black text-[#D95D39] mt-2 flex items-baseline gap-1">
                      {isDiscountApplied ? (
                        <>
                          <span className="text-[11px] font-semibold line-through text-slate-400">R$ 29,90</span>
                          <span>R$ 19,90</span>
                        </>
                      ) : (
                        <span>R$ 29,90</span>
                      )}
                      <span className="text-[10px] font-normal text-slate-400">/ viagem</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pro_lifetime')}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                      selectedPlan === 'pro_lifetime'
                        ? "border-[#1E3A5F] bg-indigo-50/40 ring-2 ring-[#1E3A5F]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
                      Vitalício
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">👑 KedGo! Pro</div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Viagens ilimitadas</div>
                    <div className="text-sm font-black text-[#1E3A5F] mt-2 flex items-baseline gap-1">
                      {isDiscountApplied ? (
                        <>
                          <span className="text-[11px] font-semibold line-through text-slate-400">R$ 149,90</span>
                          <span>R$ 139,90</span>
                        </>
                      ) : (
                        <span>R$ 149,90</span>
                      )}
                      <span className="text-[10px] font-normal text-slate-400">único</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Discount Code Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <form onSubmit={handleApplyDiscount} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Cupom promocional (ex: KED10)"
                      value={discountCode}
                      onChange={(e) => {
                        setDiscountCode(e.target.value.toUpperCase());
                        if (couponError) setCouponError('');
                      }}
                      disabled={isDiscountApplied || isValidatingCoupon}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden uppercase tracking-wider disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                  {isDiscountApplied ? (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Remover
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={discountCode.trim().length < 3 || isValidatingCoupon}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {isValidatingCoupon ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Validando...</span>
                        </>
                      ) : (
                        <span>Aplicar</span>
                      )}
                    </button>
                  )}
                </form>

                {isDiscountApplied && (
                  <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      Desconto de R$ 10,00 aplicado com sucesso ({discountCode}
                      {validatedSourceName && validatedSourceName !== discountCode ? ` - ${validatedSourceName}` : ""})!
                    </span>
                  </p>
                )}

                {couponError && !isDiscountApplied && (
                  <p className="text-[11px] font-bold text-rose-600 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Payment Info & Methods Supported */}
              <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-2">
                  <span className="text-slate-600">Total a pagar:</span>
                  <div className="flex items-baseline gap-1.5">
                    {isDiscountApplied && (
                      <span className="text-xs font-bold line-through text-slate-400">
                        R$ {basePrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-lg font-black text-[#1E3A5F]">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Formas de pagamento aceitas:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Pix
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Cartão
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  🔒 Você será redirecionado para a página oficial de pagamento criptografado da <strong>Stripe</strong> para concluir com segurança.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                  {errorMessage}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#D95D39] hover:bg-[#C86446] text-white font-extrabold text-sm rounded-2xl transition cursor-pointer shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <span>Conectando à Stripe...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Pagar R$ {finalPrice.toFixed(2)} na Stripe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <Lock className="w-3 h-3" /> Processado com segurança via Stripe Checkout (SSL 256-bit)
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;

