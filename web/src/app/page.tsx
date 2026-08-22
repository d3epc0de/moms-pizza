"use client";

import Link from 'next/link';
import { LayoutDashboard, MonitorSmartphone, ChefHat, MonitorPlay, LogOut } from 'lucide-react';
import { useBusinessStore } from '@/lib/store/businessStore';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { businessName } = useBusinessStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth-login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative z-10">
      <div className="glass-panel p-10 rounded-3xl text-center max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          {businessName} POS
        </h1>
        <p className="text-slate-400 mb-10">Selecciona el módulo para acceder al sistema</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/pos" className="group">
            <div className="h-48 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <MonitorSmartphone size={48} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-semibold mb-2 text-white">Terminal POS</h2>
              <p className="text-sm text-slate-400">Toma de comandas</p>
            </div>
          </Link>

          <Link href="/kds" className="group">
            <div className="h-48 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-orange-500/50 hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <ChefHat size={48} className="text-orange-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-semibold mb-2 text-white">Cocina (KDS)</h2>
              <p className="text-sm text-slate-400">Pantalla de producción</p>
            </div>
          </Link>

          <Link href="/admin/login" className="group">
            <div className="h-48 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-teal-500/50 hover:bg-slate-800 transition-all flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <LayoutDashboard size={48} className="text-teal-400 mb-4 group-hover:scale-110 transition-transform" />
              <h2 className="text-xl font-semibold mb-2 text-white">Administración</h2>
              <p className="text-sm text-slate-400">Reportes y menú</p>
            </div>
          </Link>
        </div>

        <div className="flex justify-center mt-8 pt-8 border-t border-slate-700/50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-6 py-3 rounded-xl transition-all font-medium active:scale-95 shadow-lg shadow-red-500/5"
          >
            <LogOut size={20} />
            Cerrar Sesión del Negocio
          </button>
        </div>
      </div>
    </main>
  );
}
