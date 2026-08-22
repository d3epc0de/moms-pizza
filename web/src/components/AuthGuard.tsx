"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useEmployeeStore, EmployeeRole } from "@/lib/store/employeeStore";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: EmployeeRole[];
  redirectTo?: string;
}

/**
 * AuthGuard protects routes by verifying that:
 * 1. There is a logged-in employee (currentEmployee !== null)
 * 2. The employee's role is in the allowedRoles list (if specified)
 * 
 * If the check fails, it redirects to the specified route (default: /pos for PIN login)
 */
export default function AuthGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/pos" 
}: AuthGuardProps) {
  const { currentEmployee } = useEmployeeStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentEmployee) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(currentEmployee.role)) {
      router.replace(redirectTo);
      return;
    }
  }, [currentEmployee, allowedRoles, redirectTo, router]);

  // Don't render children until auth check passes
  if (!currentEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(currentEmployee.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="glass-panel p-8 rounded-3xl text-center max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-slate-400 mb-6">Tu rol no tiene permisos para acceder a esta sección.</p>
          <button 
            onClick={() => router.replace(redirectTo)}
            className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-3 rounded-xl transition-all"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
