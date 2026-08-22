"use client";

import { useState } from "react";
import { Calculator, LogOut, Search, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import AuthGuard from "@/components/AuthGuard";
import AdminNav from "@/components/admin/AdminNav";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HistoryPage() {
  const router = useRouter();
  const { orders } = useSubmittedOrdersStore();
  const { currentEmployee, logout } = useEmployeeStore();
  
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toString().includes(search) ||
    o.customerInfo.toLowerCase().includes(search.toLowerCase()) ||
    o.waiterName.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.createdAt - a.createdAt);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ready': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'preparing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'delivered': return 'Entregado';
      case 'ready': return 'Listo';
      case 'preparing': return 'Preparando';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/admin/login">
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-24 md:pb-6 relative z-10 overflow-y-auto custom-scrollbar">
      
      {/* Header NavBar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
               <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                 <Calculator size={22} />
               </div>
               <div>
                  <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">Admin Central</h1>
                  <p className="text-xs text-slate-400 font-medium">{currentEmployee?.name || 'Panel de Control'}</p>
               </div>
            </div>
            
            <AdminNav />
            
            <div className="flex gap-2 items-center">
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Historial Completo de Pedidos</h2>
              <p className="text-slate-400">Revisa el detalle de todas las órdenes procesadas por el sistema.</p>
            </div>
            
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar (orden, cliente, mesero)"
                className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Clock size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No se encontraron órdenes</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                  <div 
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
                  >
                    <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
                      <div className="w-16 text-left md:text-center shrink-0">
                        <span className="text-sm text-slate-400 block mb-1">Orden</span>
                        <span className="text-xl font-black text-white">#{order.orderNumber.toString().padStart(3, '0')}</span>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-bold text-white text-base md:text-lg">{order.customerInfo}</p>
                        <p className="text-xs sm:text-sm text-slate-400">{format(new Date(order.createdAt), "dd MMM yyyy - hh:mm a", { locale: es })}</p>
                      </div>
                      
                      <div className="md:hidden">
                        {expandedOrder === order.id ? <ChevronUp size={24} className="text-slate-500" /> : <ChevronDown size={24} className="text-slate-500" />}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 md:gap-8 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-slate-700/50 md:border-0">
                      <div className="text-left md:text-right w-1/2 md:w-auto">
                        <span className="text-xs sm:text-sm text-slate-400 block mb-1">Mesero</span>
                        <span className="font-medium text-slate-200">{order.waiterName}</span>
                      </div>
                      
                      <div className="text-left md:text-right w-1/2 md:w-auto">
                        <span className="text-xs sm:text-sm text-slate-400 block mb-1">Total</span>
                        <span className="font-bold text-white text-lg">{formatPrice(order.totalAmount)}</span>
                      </div>

                      <div className="w-full md:w-32 flex justify-start md:justify-end mt-2 md:mt-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="hidden md:block text-slate-500 shrink-0">
                        {expandedOrder === order.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedOrder === order.id && (
                    <div className="p-4 sm:p-6 bg-slate-900/50 border-t border-slate-700/50 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div>
                          <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Productos</h4>
                          <ul className="space-y-3">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between text-sm">
                                <div>
                                  <span className="text-white font-medium">{item.quantity}x {item.name}</span>
                                  {item.modifiers && item.modifiers.length > 0 && (
                                    <div className="ml-5 mt-1 space-y-1">
                                      {item.modifiers.map((mod, mIdx) => (
                                        <div key={mIdx} className="text-slate-400 text-xs flex gap-2">
                                          <span>• {mod.name}</span>
                                          {mod.price > 0 && <span className="text-emerald-400">+{formatPrice(mod.price)}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && <p className="ml-5 mt-1 text-orange-400 text-xs">Nota: {item.notes}</p>}
                                </div>
                                <span className="text-slate-300 font-medium">{formatPrice(item.totalPrice)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Resumen de Pago</h4>
                          <div className="space-y-3 bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-300">Método de pago:</span>
                              <span className="text-white font-medium capitalize">{order.paymentMethod || 'No registrado'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-300">Estado de pago:</span>
                              <span className={order.paymentStatus === 'paid' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                {order.paymentStatus === 'paid' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-300">Tiempo de completado:</span>
                              <span className="text-white font-medium">
                                {order.completedAt 
                                  ? `${Math.round((order.completedAt - order.createdAt) / 60000)} min`
                                  : 'N/A'
                                }
                              </span>
                            </div>
                            <hr className="border-slate-700" />
                            <div className="flex justify-between">
                              <span className="text-slate-300 font-bold">Total Cobrado:</span>
                              <span className="text-white font-black text-lg">{formatPrice(order.totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
