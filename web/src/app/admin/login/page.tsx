"use client";

import { useState } from "react";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { toast } from "sonner";

export default function AdminLogin() {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();
  const { loginByPin } = useEmployeeStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const employee = loginByPin(pin);
    if (employee && employee.role === 'admin') {
      toast.success(`Bienvenido, ${employee.name}`, {
        description: "Accediendo al panel de administración..."
      });
      router.push('/admin/dashboard');
    } else if (employee) {
      setErrorMsg("Tu rol no tiene permisos de administrador. Contacta al gerente.");
      toast.error("Acceso denegado", {
        description: `El rol "${employee.role}" no tiene acceso al panel admin.`
      });
    } else {
      setErrorMsg("PIN incorrecto. Verifica e intenta nuevamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="glass-panel p-8 rounded-3xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-white">Dashboard Admin</h1>
        <p className="text-slate-400 text-sm mb-8">Ingresa el PIN de administrador para acceder</p>

        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in fade-in zoom-in-95">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">PIN de Administrador</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErrorMsg(""); }}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-4 pl-10 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-2xl tracking-[0.5em] text-center font-mono"
                placeholder="••••"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">El PIN del administrador es de 4 dígitos</p>
          </div>

          <button
            type="submit"
            disabled={pin.length !== 4}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-white font-medium py-3 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-teal-500/25"
          >
            <span>Ingresar al Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </form>
        
        <button 
          onClick={() => router.push('/')}
          className="mt-6 text-sm text-slate-400 hover:text-white transition-colors flex w-full justify-center"
        >
          Volver a la selección de módulo
        </button>
      </div>
    </div>
  );
}
