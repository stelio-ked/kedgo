import React, { useState, useEffect } from "react";
import { auth, googleProvider, appleProvider } from "../utils/firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import {
  Lock,
  User,
  LogIn,
  UserPlus,
  Compass,
  Sparkles,
  AlertCircle,
  Mail,
  Key,
  ArrowLeft,
  RefreshCw,
  Inbox,
  CheckCircle2,
  Eye,
  EyeOff
} from "lucide-react";
import KedGoLogo from "./KedGoLogo";

interface LoginScreenProps {
  onLogin: (token: string, user: any) => void;
  onTravelerLogin: (email: string, linkedItineraries: any[], hasPassword?: boolean, isFirstAccess?: boolean) => void;
}

export default function LoginScreen({ onLogin, onTravelerLogin }: LoginScreenProps) {
  // Mode selection: "planner" | "traveler"
  const [accessMode, setAccessMode] = useState<"planner" | "traveler">("planner");

  // Organizer state (Standard credentials)
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  // Travelers tab state
  const [travelerEmail, setTravelerEmail] = useState("");

  // Google Sign-In / Password Setup states
  const [useGoogle, setUseGoogle] = useState(false);
  const [googleFlowMode, setGoogleFlowMode] = useState<"simulated" | "real">("simulated");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleIsRegister, setGoogleIsRegister] = useState(false);

  // Mailbox simulator state
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [selectedSimulatedEmail, setSelectedSimulatedEmail] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  // Secure Password Setup Mode (accessed via email link)
  const [setupPasswordMode, setSetupPasswordMode] = useState(false);
  const [setupToken, setSetupToken] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupName, setSetupName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  // General view states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch simulated emails for active input
  const fetchSimulatedEmails = async (targetEmail: string) => {
    if (!targetEmail || !targetEmail.includes("@")) return;
    try {
      const res = await fetch(`/api/dev/last-emails?email=${encodeURIComponent(targetEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setSimulatedEmails(data);
        if (Array.isArray(data) && data.length > 0) {
          setSelectedSimulatedEmail(data[data.length - 1]);
        }
      }
    } catch (err) {
      console.error("Error fetching simulated emails:", err);
    }
  };

  // Poll for simulated e-mails when Google login/signup or email registration is active
  useEffect(() => {
    let emailToPoll = useGoogle ? googleEmail : email;
    if (setupPasswordMode) {
      emailToPoll = setupEmail;
    }

    if (emailToPoll && emailToPoll.includes("@")) {
      fetchSimulatedEmails(emailToPoll);
      const interval = setInterval(() => {
        fetchSimulatedEmails(emailToPoll);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [useGoogle, googleEmail, email, setupPasswordMode, setupEmail]);

  // Intercepting / Setup link or Email Verification link from URL search query on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const token = params.get("token");
    if (action === "setup_password" && token) {
      handleActivateToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === "verify_email" && token) {
      handleVerifyEmailToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle redirect result for Mobile Safari/Chrome where popup is converted to redirect
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          setLoading(true);
          const fbUser = result.user;
          if (!fbUser.email) throw new Error("Sem e-mail do Firebase.");

          const res = await fetch("/api/auth/firebase-google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: fbUser.email,
              name: fbUser.displayName || fbUser.email.split("@")[0],
              firebaseUid: fbUser.uid
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Erro Google Server.");

          localStorage.setItem("auth_token", data.token);
          onLogin(data.token, data.user);
        }
      } catch (err: any) {
        console.error("Firebase Redirect Error:", err);
        setError(err.message || "Erro durante o login via redirecionamento Google.");
      } finally {
        setLoading(false);
      }
    };
    handleRedirect();
  }, [onLogin]);

  const handleVerifyEmailToken = async (tokenVal: string) => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenVal })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Token de confirmação inválido ou expirado.");
      }

      setSuccessMsg("Conta ativada com sucesso! Conectando ao sistema...");
      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOrganizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const storedRefCode = localStorage.getItem("kedgo_referral_code");
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? { email, name, password, referralCode: storedRefCode }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro de autenticação para Organizador");
      }

      if (isRegister && data.requiresVerification) {
        setSuccessMsg(data.message || "E-mail de confirmação enviado! Acesse sua caixa de entrada (ou caixa simulada abaixo) para ativar a conta.");
        setPassword("");
        fetchSimulatedEmails(email);
        return;
      }

      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      if (!fbUser.email) {
        throw new Error("Não foi possível obter o e-mail da conta Google através do Firebase.");
      }

      const storedRefCode = localStorage.getItem("kedgo_referral_code");
      const res = await fetch("/api/auth/firebase-google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split("@")[0],
          provider: "google",
          firebaseUid: fbUser.uid,
          referralCode: storedRefCode
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao autenticar a sessão do Google com o servidor.");
      }

      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("O login foi cancelado. A janela de autenticação foi fechada.");
      } else if (err.code === "auth/unauthorized-domain") {
        const domain = window.location.hostname;
        setError(`O domínio "${domain}" não está autorizado no Firebase. Para habilitar o login social, adicione "${domain}" em: Firebase Console > Authentication > Settings > Authorized domains.`);
      } else {
        setError(err.message || "Falha na autenticação via Firebase Google Auth.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseAppleLogin = async () => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const fbUser = result.user;
      if (!fbUser.email) {
        throw new Error("Não foi possível obter o e-mail da conta Apple através do Firebase.");
      }

      const res = await fetch("/api/auth/firebase-social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email.split("@")[0],
          provider: "apple",
          firebaseUid: fbUser.uid
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao autenticar a sessão da Apple com o servidor.");
      }

      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      console.error("Firebase Apple Auth Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("O login foi cancelado. A janela de autenticação da Apple foi fechada.");
      } else if (err.code === "auth/unauthorized-domain") {
        const domain = window.location.hostname;
        setError(`O domínio "${domain}" não está autorizado no Firebase. Para habilitar o login social, adicione "${domain}" em: Firebase Console > Authentication > Settings > Authorized domains.`);
      } else {
        setError(err.message || "Falha na autenticação via Apple.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.toLowerCase().endsWith("@gmail.com")) {
      setError("Por favor, digite uma conta de e-mail do Google (@gmail.com) válida.");
      return;
    }
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/gmail-google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        // If account isn't registered, offer to register with quick selection
        if (res.status === 404) {
          setError("Esta conta do Gmail não foi encontrada como organizador. Deseja criá-la? Clique em 'Criar Conta com Gmail' abaixo.");
          setGoogleIsRegister(true);
          return;
        }
        // Force immediate fetch of emails because the server just sent a simulated password setup token
        fetchSimulatedEmails(googleEmail);
        throw new Error(data.error || "Erro no login federado");
      }

      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
      fetchSimulatedEmails(googleEmail);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.toLowerCase().endsWith("@gmail.com")) {
      setError("Por favor, digite um e-mail do @gmail.com de sua posse.");
      return;
    }
    if (!googleName.trim()) {
      setError("Por favor, informe seu nome.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/gmail-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, name: googleName })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na solicitação de cadastro via Google");
      }

      setSuccessMsg("Link de ativação gerado! O link para criar sua senha de organizador de forma segura foi enviado para sua caixa postal simulada do Gmail do Google.");
      fetchSimulatedEmails(googleEmail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateToken = async (tokenVal: string) => {
    setError("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/gmail-verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenVal })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Token inválido");
      }

      setSetupToken(tokenVal);
      setSetupEmail(data.email);
      setSetupName(data.name);
      setSetupPasswordMode(true);
      setSelectedSimulatedEmail(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("As senhas informadas não coincidem. Certifique-se de preencher dados idênticos.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A senha escolhida precisa conter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/gmail-set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: setupToken, password: newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Tentativa de confirmação falhou.");
      }

      localStorage.setItem("auth_token", data.token);
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTraveler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelerEmail.trim()) {
      setError("Por favor, digite seu endereço de e-mail de viajante.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/traveler/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: travelerEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao consultar as viagens para este viajante.");
      }

      // Successfully authenticated traveler via linked email!
      onTravelerLogin(data.email, data.itineraries, data.hasPassword, data.isFirstAccess);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300">

        {/* Top Banner */}
        <div className="bg-[#1E3A5F] bg-gradient-to-br from-[#1E3A5F] to-[#162B48] p-8 text-center relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D95D39]/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />

          <div className="bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg mb-3 border border-white/20">
            <KedGoLogo size={48} showSlogan={false} />
          </div>

          <p className="text-amber-200 text-xs font-bold mt-1 tracking-wide max-w-xs">
            Seu Roteiro Personalizado Individual ou em Grupo, Sem Perrengue.
          </p>
        </div>

        {/* Access Role Switcher Tab Controls (Decoupled & untouchable for traveler rule) */}
        {!setupPasswordMode && (
          <div className="flex border-b border-slate-200 p-2 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setAccessMode("planner");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${accessMode === "planner"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <Lock className="w-4 h-4" />
              <span>Organizador</span>
            </button>
            <button
              type="button"
              id="traveler-linked-access-tab-btn"
              onClick={() => {
                setAccessMode("traveler");
                setError("");
                setSuccessMsg("");
              }}
              className={`flex-1 py-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${accessMode === "traveler"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <User className="w-4 h-4" />
              <span>Viajante Vinculado</span>
            </button>
          </div>
        )}

        {/* Render Form */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-bold border border-emerald-100 flex items-start gap-2.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* PASSWORD SETUP MODE STATE */}
          {setupPasswordMode ? (
            <form onSubmit={handleSavePassword} className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <span className="inline-flex p-3 bg-indigo-50 text-indigo-650 rounded-full mb-2">
                  <Key className="w-6 h-6 animate-pulse" />
                </span>
                <h3 className="text-base font-black text-slate-800">Crie Sua Senha de Acesso</h3>
                <p className="text-slate-500 text-xs font-medium">
                  Olá, <strong className="text-indigo-650">{setupName}</strong>. Defina uma senha forte de organizador para seu e-mail <span className="underline">{setupEmail}</span>.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Digite Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold text-slate-800"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirme Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold text-slate-800"
                    placeholder="Repita a senha longa"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar Senha e Entrar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSetupPasswordMode(false);
                  setSetupToken("");
                  setError("");
                  setSuccessMsg("");
                }}
                className="w-full text-slate-500 hover:text-slate-800 font-black text-xs py-2 text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para o início</span>
              </button>
            </form>
          ) : (
            <>
              {/* ORGANIZER ACCESS FLOW */}
              {accessMode === "planner" ? (
                <div className="space-y-4 animate-fadeIn">
                  {/* Social Auth Buttons */}
                  <div className="space-y-2.5">
                    {/* Continuar com Google */}
                    <button
                      type="button"
                      onClick={handleFirebaseGoogleLogin}
                      disabled={loading}
                      className="w-full cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continuar com Google</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">ou</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  {/* Standard Email / Password Form */}
                  <form onSubmit={handleSubmitOrganizer} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {isRegister ? "Cadastro por E-mail" : "Acesso por E-mail"}
                      </span>
                    </div>

                    {isRegister && (
                      <div className="space-y-1 animate-fadeIn">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold"
                            placeholder="Seu nome"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Endereço de E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold"
                          placeholder="organizador@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-indigo-400 hover:scale-[1.01]"
                    >
                      {loading ? "Processando..." : (isRegister ? <><UserPlus className="w-4.5 h-4.5" /> Cadastrar com E-mail</> : <><LogIn className="w-4.5 h-4.5" /> Entrar com E-mail</>)}
                    </button>

                    <p className="text-center text-xs text-slate-500 font-bold shrink-0 pt-1">
                      {isRegister ? "Já possui conta?" : "Não tem conta de organizador?"}{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(!isRegister);
                          setError("");
                          setSuccessMsg("");
                          setEmail("");
                          setName("");
                          setPassword("");
                        }}
                        className="text-indigo-600 font-black hover:underline cursor-pointer"
                      >
                        {isRegister ? "Fazer Login" : "Criar uma Conta"}
                      </button>
                    </p>
                  </form>
                </div>
              ) : (
                /* TRAVELER GUEST READONLY DECOUPLED FLOW (Untouched behavior) */
                <form onSubmit={handleSubmitTraveler} className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-[11px] font-semibold text-indigo-950 flex items-start gap-2.5 leading-relaxed font-sans">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                    <span>
                      <strong>Acesso para Viajantes:</strong> Você não precisa de uma senha! Basta usar o seu e-mail cadastrado pelo Organizador na lista de viajantes do grupo. Se o seu e-mail estiver vinculado a uma viagem, você terá acesso total à visualização do roteiro, hotel e planilha de despesas de modo prático!
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-widest">Seu E-mail Vinculado</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        id="traveler-guest-email-input"
                        value={travelerEmail}
                        onChange={e => setTravelerEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-xs font-semibold"
                        placeholder="seu.email@viajante.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    id="traveler-guest-submit-btn"
                    className="w-full cursor-pointer bg-gradient-to-r from-indigo-600 to-pink-600 hover:opacity-95 text-white font-black text-xs py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
                  >
                    {loading ? "Verificando..." : <><LogIn className="w-4.5 h-4.5" /> Entrar e Ver Minhas Viagens</>}
                  </button>

                  <div className="text-center text-[11px] text-slate-400 font-semibold p-2">
                    Dica: O planejador da sua viagem deve adicionar o seu e-mail na aba "Participantes" para liberar seu acesso.
                  </div>
                </form>
              )}
            </>
          )}

        </div>
      </div>

      {/* DETACHED SIMULATED GMAIL / SMTP MAILBOX FOR DEVELOPMENT & INTERACTIVE TESTING */}
      {simulatedEmails.length > 0 && (
        <div id="gmail-simulated-mailbox" className="max-w-md w-full mt-6 bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-2xl border border-slate-800 animate-slideUp">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Inbox className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-black tracking-tight text-white">Caixa de Entrada Simulada (Dev)</h4>
                <p className="text-[10px] text-slate-400 font-medium">{email || googleEmail || setupEmail || "Sandbox de E-mails"}</p>
              </div>
            </div>
            <button
              onClick={() => fetchSimulatedEmails(email || googleEmail || setupEmail)}
              className="p-2 hover:bg-slate-800 rounded-xl transition text-slate-400 hover:text-white cursor-pointer"
              title="Sincronizar caixa de entrada"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {simulatedEmails.length === 0 ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <Inbox className="w-8 h-8 mx-auto stroke-[1.2] opacity-55 animate-pulse" />
              <p className="text-xs font-bold leading-normal">Caixa de entrada vazia</p>
              <p className="text-[10px] max-w-xs mx-auto text-slate-400 leading-relaxed font-semibold">
                Caso tenha clicado em cadastrar, aguarde ou clique no botão de atualizar. Os e-mails são processados nos servidores locais da KEDGO.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block mb-1">Novas Mensagens ({simulatedEmails.length})</span>

              {simulatedEmails.map((mail) => (
                <div
                  key={mail.id}
                  className={`p-3.5 rounded-2xl text-left border transition-all ${selectedSimulatedEmail?.id === mail.id
                      ? "bg-slate-800/80 border-indigo-500"
                      : "bg-slate-800/60 hover:bg-slate-800 border-slate-800 cursor-pointer"
                    }`}
                  onClick={() => setSelectedSimulatedEmail(selectedSimulatedEmail?.id === mail.id ? null : mail)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded-md mb-1.5 inline-block uppercase">KEDGO E-mail</span>
                      <h5 className="text-xs font-black text-white">{mail.subject}</h5>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 font-semibold">De: seguranca@kedgo.com.br</p>
                    </div>
                    <span className="text-[9px] text-slate-500 font-bold">Agora mesmo</span>
                  </div>

                  {selectedSimulatedEmail?.id === mail.id && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-3.5 animate-fadeIn">
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-medium">
                        {mail.body}
                      </p>

                      {/* Fully interactive link block that executes authentication verification */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const tokenMatch = mail.link.match(/token=([^&]+)/);
                          if (tokenMatch && tokenMatch[1]) {
                            if (mail.link.includes("action=verify_email")) {
                              handleVerifyEmailToken(tokenMatch[1]);
                            } else {
                              handleActivateToken(tokenMatch[1]);
                            }
                          }
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-md select-none"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Confirmar E-mail / Ativar Conta</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
