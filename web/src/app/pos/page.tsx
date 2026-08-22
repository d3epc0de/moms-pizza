"use client";

import { useState } from "react";
import { User, ArrowLeft, Delete, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { toast } from "sonner";

export default function PosPinLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const { loginByPin } = useEmployeeStore();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        const employee = loginByPin(newPin);
        if (employee) {
          toast.success(`Bienvenido, ${employee.name}`, {
            description: `Rol: ${employee.role === 'mesero' ? 'Mesero' : employee.role === 'cajero' ? 'Cajero' : employee.role === 'admin' ? 'Administrador' : 'Cocina'}`
          });
          // Route based on role
          if (employee.role === 'cocina') {
            router.push('/kds');
          } else {
            router.push('/pos/dashboard');
          }
        } else {
          setError(true);
          toast.error("PIN incorrecto", {
            description: "No se encontró un empleado con ese PIN."
          });
        }
        setTimeout(() => setPin(""), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 transition-colors bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-700/50">
        <ArrowLeft size={20} />
        <span className="font-medium">Volver</span>
      </Link>

      <div className="glass-panel p-8 rounded-3xl w-full max-w-sm flex flex-col items-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner border transition-all duration-300 ${
          error 
            ? "bg-red-500/10 border-red-500/50" 
            : "bg-slate-800/80 border-slate-700"
        }`}>
          {error 
            ? <ShieldCheck size={36} className="text-red-400" />
            : <User size={36} className="text-blue-400" />
          }
        </div>
        <h1 className="text-2xl font-semibold mb-1 text-white">Terminal POS</h1>
        <p className="text-slate-400 text-sm mb-8 text-center">Ingresa tu PIN de 4 dígitos para acceder al turno</p>

        {/* PIN Indicators */}
        <div className="flex space-x-4 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                error 
                  ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]"
                  : i < pin.length 
                    ? "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" 
                    : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 active:scale-95 transition-all text-2xl font-medium text-white shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:scale-95 transition-all text-sm font-bold shadow-sm flex items-center justify-center tracking-wider"
          >
            CLR
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 active:scale-95 transition-all text-2xl font-medium text-white shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete size={24} className="text-slate-400" />
          </button>
        </div>

        <p className="text-slate-600 text-xs mt-6 text-center">
          Cada empleado tiene un PIN único asignado por el administrador
        </p>
      </div>
    </div>
  );
}
