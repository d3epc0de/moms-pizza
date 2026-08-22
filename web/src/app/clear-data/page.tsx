"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearDataPage() {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    // Clear all Zustand persisted stores
    const storeKeys = [
      'pos-submitted-orders',
      'pos-finance-store',
      'pos-audit-store',
      'pos-active-orders',
      'pos-order-number',
      'pos-cart-store',
      'pos-employee-store',
      'pos-sync-store',
    ];
    
    storeKeys.forEach(key => localStorage.removeItem(key));
    setCleared(true);
  }, []);

  if (!cleared) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Limpiando datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-panel p-10 rounded-3xl text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Datos Limpiados</h1>
        <p className="text-slate-400 mb-6">Se eliminaron todos los datos de prueba (pedidos, gastos, cierres, auditoría). El menú de Mom&apos;s Pizza se mantendrá intacto.</p>
        <button
          onClick={() => { router.push('/'); router.refresh(); }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all"
        >
          Ir al Inicio
        </button>
      </div>
    </div>
  );
}
