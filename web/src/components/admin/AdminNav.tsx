"use client";

import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, UtensilsCrossed, Settings, History, LogOut } from "lucide-react";
import { useEmployeeStore } from "@/lib/store/employeeStore";

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useEmployeeStore();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const navItems = [
    { name: "Resumen", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Menú", path: "/admin/products", icon: UtensilsCrossed },
    { name: "Historial", path: "/admin/history", icon: History },
    { name: "Ajustes", path: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar / Topbar equivalent nav (Hidden on Mobile) */}
      <div className="hidden md:flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700/50 shadow-inner">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </button>
          );
        })}
        
        <div className="w-px bg-slate-700/50 mx-1 my-1"></div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 text-red-400 hover:text-white hover:bg-red-500/20"
        >
          <LogOut size={18} />
          Salir
        </button>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center gap-1 p-2 min-w-[4.5rem] transition-colors ${
                  isActive ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-blue-500/10' : ''}`}>
                  <Icon size={22} className={isActive ? "fill-blue-500/20" : ""} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-1 p-2 min-w-[4.5rem] transition-colors text-red-500 hover:text-red-400"
          >
            <div className="p-1.5 rounded-full transition-all duration-300">
              <LogOut size={22} />
            </div>
            <span className="text-[10px] font-medium">Salir</span>
          </button>
        </div>
      </div>
    </>
  );
}
