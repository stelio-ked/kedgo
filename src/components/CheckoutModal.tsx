import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  QrCode, 
  Check, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Crown,
  Ticket,
  AlertCircle,
  Loader2,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import KedGoLogo from "./KedGoLogo";
import { PlanType, FoundersStatus } from "../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (planType: PlanType) => void;
  initialPlan?: PlanType;
  itineraryTitle?: string;
  token?: string | null;
  activeItineraryId?: number | string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPlan = 'annual',
  itineraryTitle = 'Minha Viagem',
  token,
  activeItineraryId,
}) => {
  // Available plans: 'pass' | 'annual' | 'founders_lifetime'
  const [selectedPlan, setSelectedPlan] = useState<'pass' | 'annual' | 'founders_lifetime'>(
    initialPlan === 'pass' ? 'pass' : initialPlan === 'founders_lifetime' ? 'founders_lifetime' : 'annual'
  );
  const [discountCode, setDiscountCode] = useState('');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);
  const [isCouponKed10, setIsCouponKed10] = useState(false);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [validatedSourceName, setValidatedSourceName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  
  // Real-time Founders Pass stock status
  const [foundersStatus, setFoundersStatus] = useState<FoundersStatus>({
    totalLimit: 200,
    soldUnits: 38,
    remainingUnits: 162,
    isAvailable: true,
  });

  // Fetch real-time Founders Pass availability
  useEffect(() => {
    if (isOpen) {
      fetch("/api/stripe/founders-status")
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.remainingUnits === 'number') {
            setFoundersStatus(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Server-side verification function for discount/referral code
  const validateAndApplyCode = async (codeToValidate: string, isSilent = false) => {
    const clean = codeToValidate.trim().toUpperCase();
    if (!clean || clean.length < 3) {
      setIsDiscountApplied(false);
      setIsCouponKed10(false);
      if (!isSilent) setCouponError("Insira um código válido com pelo menos 3 caracteres.");
      return false;
    }

    setIsValidatingCoupon(true);
    setCouponError("");

    if (clean === "KED10") {
      setDiscountCode("KED10");
      setIsDiscountApplied(true);
      setIsCouponKed10(true);
      setValidatedSourceName("Cupom Oficial @KedPeloMundo (10% OFF)");
      setCouponError("");
      setIsValidatingCoupon(false);
      try {
        localStorage.setItem("kedgo_referral_code", "KED10");
      } catch {}
      return true;
    }

    try {
      const res = await fetch(`/api/referral/validate/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data && data.valid) {
        setDiscountCode(clean);
        setIsDiscountApplied(true);
        setIsCouponKed10(false);
        setValidatedSourceName(data.referrerName || clean);
        setCouponError("");
        try {
          localStorage.setItem("kedgo_referral_code", clean);
        } catch {}
        return true;
      } else {
        setIsDiscountApplied(false);
        setIsCouponKed10(false);
        setValidatedSourceName("");
        setCouponError("Código promocional ou de indicação inválido.");
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

  // Auto-sync plan and auto-validate referral / promotional code
  useEffect(() => {
    if (isOpen) {
      if (initialPlan === 'pass' || initialPlan === 'annual' || initialPlan === 'founders_lifetime') {
        setSelectedPlan(initialPlan);
      } else {
        setSelectedPlan('annual');
      }
      setCouponError("");

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
      } catch {}

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

  // Pricing calculations
  const getBasePrice = (plan: 'pass' | 'annual' | 'founders_lifetime') => {
    switch (plan) {
      case 'pass': return 29.90;
      case 'annual': return 79.90;
      case 'founders_lifetime': return 149.90;
    }
  };

  const basePrice = getBasePrice(selectedPlan);
  
  // Calculate discount: KED10 = 10%, Referral = R$ 10,00
  let discountAmount = 0;
  if (isDiscountApplied) {
    if (isCouponKed10) {
      discountAmount = Number((basePrice * 0.10).toFixed(2));
    } else {
      discountAmount = 10.00;
    }
  }

  const finalPrice = Math.max(10.00, Number((basePrice - discountAmount).toFixed(2)));

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim()) return;
    await validateAndApplyCode(discountCode, false);
  };

  const handleRemoveDiscount = () => {
    setIsDiscountApplied(false);
    setIsCouponKed10(false);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans max-h-[92vh] flex flex-col"
        >
          {/* Top Header Bar */}
          <div className="bg-[#1E3A5F] text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <KedGoLogo size={32} showSlogan={false} inverse={true} className="text-white" />
              <div>
                <h2 className="text-sm font-black tracking-wide">Planos & Acesso KedGo!</h2>
                <p className="text-[11px] text-slate-300 font-medium">Escolha a melhor modalidade para sua viagem</p>
              </div>
            </div>
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
                Seu plano foi ativado com sucesso! Aproveite todos os recursos do KedGo!.
              </p>
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">

              {/* 3-Tier Plan Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    Selecione seu Plano
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">Sem fidelidade ou taxas ocultas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option 1: Passe Por Viagem */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('pass')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'pass'
                        ? "border-[#D95D39] bg-orange-50/50 ring-2 ring-[#D95D39]/30 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <Ticket className="w-4 h-4 text-[#D95D39]" />
                        <span>Passe Viagem</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-1 leading-snug">
                        Para 1 viagem específica (+30 dias)
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-sm font-black text-[#D95D39] flex items-baseline gap-1">
                        {isDiscountApplied ? (
                          <>
                            <span className="text-[11px] font-semibold line-through text-slate-400">R$ 29,90</span>
                            <span>R$ {(29.90 - (isCouponKed10 ? 2.99 : 10.00)).toFixed(2)}</span>
                          </>
                        ) : (
                          <span>R$ 29,90</span>
                        )}
                        <span className="text-[10px] font-normal text-slate-400">/ evento</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">✓ Todos recursos liberados</div>
                    </div>
                  </button>

                  {/* Option 2: KedGo Pro Anual (Featured / Best Value) */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('annual')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'annual'
                        ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/30 shadow-md"
                        : "border-emerald-200 hover:border-emerald-300 bg-emerald-50/20"
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-amber-300 text-amber-300" /> Mais Popular
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>KedGo Pro Anual</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 mt-1 leading-snug">
                        Viagens & OCR Ilimitados (1 ano)
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald-100">
                      <div className="text-sm font-black text-emerald-700 flex items-baseline gap-1">
                        {isDiscountApplied ? (
                          <>
                            <span className="text-[11px] font-semibold line-through text-slate-400">R$ 79,90</span>
                            <span>R$ {(79.90 - (isCouponKed10 ? 7.99 : 10.00)).toFixed(2)}</span>
                          </>
                        ) : (
                          <span>R$ 79,90</span>
                        )}
                        <span className="text-[10px] font-normal text-slate-500">/ ano</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold mt-1">
                        Apenas R$ 6,65/mês
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Founders Pass (Scarcity 200 units) */}
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('founders_lifetime')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                      selectedPlan === 'founders_lifetime'
                        ? "border-[#1E3A5F] bg-indigo-50/50 ring-2 ring-[#1E3A5F]/30 shadow-md"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-[#1E3A5F] text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-300 fill-amber-300" /> Fundadores
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                        <span>Founders Pass</span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 mt-1 leading-snug">
                        Acesso Vitalício sem renovação
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-sm font-black text-[#1E3A5F] flex items-baseline gap-1">
                        {isDiscountApplied ? (
                          <>
                            <span className="text-[11px] font-semibold line-through text-slate-400">R$ 149,90</span>
                            <span>R$ {(149.90 - (isCouponKed10 ? 14.99 : 10.00)).toFixed(2)}</span>
                          </>
                        ) : (
                          <span>R$ 149,90</span>
                        )}
                        <span className="text-[10px] font-normal text-slate-400">único</span>
                      </div>
                      <div className="text-[10px] font-bold text-amber-700 mt-1">
                        Restam {foundersStatus.remainingUnits} de {foundersStatus.totalLimit} vagas
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Scarcity Progress Bar if Founders selected */}
              {selectedPlan === 'founders_lifetime' && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      Lote de Fundadores @KedPeloMundo
                    </span>
                    <span className="text-amber-800">
                      {foundersStatus.soldUnits} / {foundersStatus.totalLimit} adquiridos ({foundersStatus.percentageClaimed || 19}%)
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-[#D95D39] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(5, (foundersStatus.soldUnits / foundersStatus.totalLimit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-800 font-medium mt-1.5">
                    ⚡ Após o preenchimento das 200 vagas, o acesso vitalício será permanentemente encerrado.
                  </p>
                </div>
              )}

              {/* Feature Comparison Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
                <div className="text-xs font-black text-slate-700 mb-2">Incluso neste plano:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Roteiros Inteligentes gerados por IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Scanner OCR de Comandas & Recibos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cofre Criptografado & Modo Offline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Divisão de Gastos & Chat de Grupo</span>
                  </div>
                </div>
              </div>

              {/* Coupon / Discount Code Box */}
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
                      Desconto de R$ {discountAmount.toFixed(2)} aplicado com sucesso ({discountCode}
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

              {/* Payment Summary */}
              <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/15 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 pb-2">
                  <span className="text-slate-600">Total a pagar:</span>
                  <div className="flex items-baseline gap-1.5">
                    {isDiscountApplied && (
                      <span className="text-xs font-bold line-through text-slate-400">
                        R$ {basePrice.toFixed(2)}
                      </span>
                    )}
                    <span className="text-xl font-black text-[#1E3A5F]">R$ {finalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Formas de pagamento aceitas:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> Pix
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-md flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Cartão de Crédito
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

              {/* Confirm / Pay Button */}
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
                    <span>Concluir Pagamento de R$ {finalPrice.toFixed(2)} na Stripe</span>
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
