"use client";

import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { formatPrice, padOrderNumber } from "@/lib/utils";
import { Receipt, CheckCircle2, Clock, Flame, PackageCheck, CreditCard, Plus, Utensils, Edit2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cartStore";
import { useActiveOrdersStore } from "@/lib/store/activeOrdersStore";
import { toast } from "sonner";

interface ActiveOrdersGridProps {
  onCheckout: (orderId: string) => void;
  onAddItems: () => void;
}

export default function ActiveOrdersGrid({ onCheckout, onAddItems }: ActiveOrdersGridProps) {
  const { orders, updateOrderStatus, updateOrder } = useSubmittedOrdersStore();
  const { setCart, setCustomerInfo, setOrderType, setActiveOrderId } = useCartStore();
  const { updateCustomerInfo } = useActiveOrdersStore();

  // Active orders: not delivered OR not paid
  const activeOrders = orders.filter(o => o.status !== 'delivered' || o.paymentStatus !== 'paid');

  // Sort: pending first, then preparing, then ready
  const sortedOrders = [...activeOrders].sort((a, b) => {
    const statusOrder = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return b.createdAt - a.createdAt; // newest first
  });

  const handleAddItems = (order: any) => {
    setCart(order.items);
    setOrderType(order.serviceType);
    setCustomerInfo(order.customerInfo);
    setActiveOrderId(order.id);
    toast.info("Retomando cuenta: " + order.customerInfo);
    onAddItems(); // switches back to menu view
  };

  const handleEditCustomerInfo = (order: any) => {
    const newName = window.prompt("Editar nombre del cliente o mesa:", order.customerInfo);
    if (newName && newName.trim() !== "" && newName.trim() !== order.customerInfo) {
      const trimmed = newName.trim();
      updateCustomerInfo(order.id, trimmed);
      updateOrder(order.id, { customerInfo: trimmed });
      toast.success("Nombre actualizado", { description: `Nuevo nombre: ${trimmed}` });
    }
  };

  const handleDeliver = (orderId: string, isPaid: boolean) => {
    if (!isPaid) {
      toast.error("Atención", { description: "No puedes entregar un pedido que no ha sido pagado." });
      return;
    }
    updateOrderStatus(orderId, 'delivered');
    toast.success("Pedido Entregado", { description: "La orden se marcó como entregada y cerrada." });
  };

  return (
    <div className="w-[65%] glass-panel rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Receipt className="text-orange-400" size={32} />
            Gestión de Órdenes
          </h2>
          <p className="text-slate-400 font-medium">Control unificado de cuentas abiertas y despachos</p>
        </div>
        <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 font-bold">
          {activeOrders.length} activas
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {sortedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <CheckCircle2 size={64} className="opacity-20 mb-4" />
            <p className="text-2xl font-bold">No hay órdenes activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {sortedOrders.map(order => {
              const isPaid = order.paymentStatus === 'paid';
              const isReady = order.status === 'ready';
              
              // Count completed items
              const completedCount = order.completedItemIndexes?.length || 0;
              const totalItems = order.items.length;
              const progress = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

              return (
                <div key={order.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden">
                  
                  {/* Status Bar Top */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-700">
                    <div 
                      className={`h-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : order.status === 'preparing' ? 'bg-blue-500' : 'bg-orange-500'}`}
                      style={{ width: `${Math.max(10, progress)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold bg-slate-900 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                          #{padOrderNumber(order.orderNumber)}
                        </span>
                        <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${order.serviceType === 'here' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {order.serviceType === 'here' ? 'Local' : 'Domicilio'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-white leading-tight">{order.customerInfo}</h3>
                        <button 
                          onClick={() => handleEditCustomerInfo(order)} 
                          className="text-slate-400 hover:text-white transition-colors bg-slate-800/80 p-1.5 rounded-lg border border-slate-700 hover:border-slate-500 shadow-sm"
                          title="Editar nombre"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-400">{formatPrice(order.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${
                      isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    }`}>
                      <CreditCard size={16} />
                      {isPaid ? 'PAGADO' : 'POR PAGAR'}
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${
                      isReady ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                      order.status === 'preparing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                      'bg-slate-700 text-slate-300 border-slate-600'
                    }`}>
                      {isReady ? <CheckCircle2 size={16} /> : order.status === 'preparing' ? <Flame size={16} /> : <Clock size={16} />}
                      {isReady ? 'LISTO EN COCINA' : order.status === 'preparing' ? 'PREPARANDO' : 'PENDIENTE COCINA'}
                    </div>
                  </div>

                  {/* Items Summary (Kitchen status) */}
                  <div className="bg-slate-900/50 rounded-xl p-3 max-h-32 overflow-y-auto custom-scrollbar">
                    {order.items.map((item, idx) => {
                      const isCompleted = (order.completedItemIndexes || []).includes(idx);
                      return (
                        <div key={idx} className={`flex justify-between items-center py-1 border-b border-slate-800 last:border-0 ${isCompleted ? 'opacity-50 grayscale' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-orange-400">{item.quantity}</span>
                            <span className={`text-sm font-medium ${isCompleted ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                              {item.name}
                            </span>
                          </div>
                          {isCompleted ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Utensils size={14} className="text-slate-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 mt-auto pt-2">
                    <button
                      onClick={() => handleAddItems(order)}
                      className="bg-slate-700/50 hover:bg-slate-600 border border-slate-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
                    >
                      <Plus size={18} /> Añadir
                    </button>
                    
                    {!isPaid ? (
                      <button
                        onClick={() => {
                          setCart(order.items);
                          setOrderType(order.serviceType);
                          setCustomerInfo(order.customerInfo);
                          setActiveOrderId(order.id);
                          onCheckout(order.id);
                        }}
                        className="col-span-2 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                      >
                        <CreditCard size={18} /> Cobrar Pedido
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeliver(order.id, isPaid)}
                        disabled={!isReady}
                        className={`col-span-2 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                          isReady 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-lg' 
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <PackageCheck size={18} /> 
                        {isReady ? 'Entregar Pedido' : 'Esperando Cocina'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
