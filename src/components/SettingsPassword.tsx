import React, { useState } from "react";
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function SettingsPassword({ email }: { email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/auth/change-my-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao alterar a senha");
      setSuccess("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <h4 className="text-xs font-black tracking-tight text-slate-800 mb-2.5 flex items-center gap-1.5">
        <Key className="w-3.5 h-3.5 text-slate-400" />
        Redefinir Senha
      </h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-1.5 text-rose-600 text-[10px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-1.5 text-emerald-600 text-[10px] font-bold">
            <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
        
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">Senha Atual (se aplicável)</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 pr-10"
            placeholder="••••••"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 pl-1">Nova Senha de Segurança</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={newPassword}
              required
              minLength={6}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 pr-10"
              placeholder="Min. 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-black shadow-xs disabled:opacity-50 hover:bg-slate-800 transition"
        >
          {loading ? "Processando..." : "Confirmar Nova Senha"}
        </button>
      </form>
    </div>
  );
}
