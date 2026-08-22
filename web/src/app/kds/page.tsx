"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, ChefHat, CheckCircle2, Flame, Volume2, VolumeX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { useSubmittedOrdersStore, SubmittedOrder } from "@/lib/store/submittedOrdersStore";
import { useBusinessStore } from "@/lib/store/businessStore";
import { formatPrice, formatElapsedTime, calculateProgressPercent, padOrderNumber } from "@/lib/utils";

const MAX_TIME_MS = 45 * 60 * 1000; // 45 minutes

export default function KitchenDisplaySystem() {
  const router = useRouter();
  const { currentEmployee, logout } = useEmployeeStore();
  const { orders: allOrders, updateOrderStatus } = useSubmittedOrdersStore();
  const { businessName } = useBusinessStore();
  const [now, setNow] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderCount = useRef(0);

  // Filter to show only active kitchen orders (not delivered)
  const orders = allOrders.filter(o => o.status !== 'delivered' && o.status !== 'ready');

  // Clock + timer
  useEffect(() => {
    const timer = setInterval(() => {
      const date = new Date();
      setCurrentTime(date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sound alert for new orders
  useEffect(() => {
    if (orders.length > previousOrderCount.current && soundEnabled) {
      try {
        // Use Web Audio API for a simple beep (no external file needed)
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => { oscillator.stop(); ctx.close(); }, 300);
        // Second beep
        setTimeout(() => {
          const ctx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx2.destination);
          osc2.frequency.value = 1100;
          osc2.type = 'sine';
          gain2.gain.value = 0.3;
          osc2.start();
          setTimeout(() => { osc2.stop(); ctx2.close(); }, 300);
        }, 350);
      } catch (e) {
        console.log('Audio not available:', e);
      }
    }
    previousOrderCount.current = orders.length;
  }, [orders.length, soundEnabled]);

  const changeOrderStatus = (orderId: string, newStatus: SubmittedOrder['status']) => {
    updateOrderStatus(orderId, newStatus);
  };

  // Sort: pending first, then by creation time (oldest first)
  const sortedOrders = [...orders].sort((a, b) => {
    const statusOrder = { pending: 0, preparing: 1, ready: 2, delivered: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return a.createdAt - b.createdAt;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 relative z-10 flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Kitchen Display System</h1>
            <p className="text-orange-400 font-medium">{businessName} — Línea de Producción</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="bg-slate-900/80 border border-slate-700 px-5 py-2 rounded-xl flex items-center gap-3">
            <span className="text-slate-400 text-sm font-medium">En cola:</span>
            <span className="text-3xl font-black text-white">{orders.length}</span>
          </div>
          <div className="bg-slate-900 border border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-inner">
            <Clock size={24} className="text-blue-400" />
            <span className="text-2xl font-bold text-white font-mono">{currentTime}</span>
          </div>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          <button 
            onClick={() => {
              if (currentEmployee && currentEmployee.role !== 'cocina') {
                router.push('/pos/dashboard');
              } else {
                logout();
                router.push('/');
              }
            }}
            className="text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-xl bg-slate-900 border border-slate-700"
            title={currentEmployee && currentEmployee.role !== 'cocina' ? "Volver al POS" : "Salir KDS"}
          >
            {currentEmployee && currentEmployee.role !== 'cocina' ? 'Volver al POS' : 'Salir KDS'}
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto custom-scrollbar content-start">
        {sortedOrders.length === 0 ? (
          <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <CheckCircle2 size={64} className="text-emerald-500/50" />
            <p className="text-2xl font-medium">No hay órdenes pendientes. ¡Buen trabajo!</p>
          </div>
        ) : (
          sortedOrders.map((order) => {
            const elapsed = Math.max(0, now - order.createdAt);
            const isOvertime = elapsed > MAX_TIME_MS;
            const progress = calculateProgressPercent(elapsed, MAX_TIME_MS);
            const isPreparing = order.status === 'preparing' || order.status === 'pending';

            // Urgency colors
            let headerColor = "bg-slate-800";
            let borderColor = "border-slate-700";
            const minutes = Math.floor(elapsed / 60000);
            
            if (isOvertime) {
              headerColor = "bg-red-600/90";
              borderColor = "border-red-500";
            } else if (minutes >= 30) {
              headerColor = "bg-orange-500/90";
              borderColor = "border-orange-500";
            } else if (isPreparing) {
              headerColor = "bg-blue-600/90";
              borderColor = "border-blue-500";
            }

            return (
              <div key={order.id} className={`flex flex-col rounded-3xl border-2 ${borderColor} overflow-hidden shadow-xl bg-slate-900 transition-all ${isOvertime ? 'animate-pulse' : ''}`}>
                
                {/* Card Header */}
                <div className={`${headerColor} p-5 flex flex-col text-white`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-md ${order.serviceType === 'to_go' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}`}>
                      {order.serviceType === 'to_go' ? 'DOMICILIO' : 'CONSUMO LOCAL'}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-2xl font-bold font-mono bg-slate-900/40 px-2 py-0.5 rounded-lg ${isOvertime ? 'text-red-300' : ''}`}>
                        {formatElapsedTime(elapsed)}
                      </span>
                      <span className="text-xs uppercase font-bold tracking-wider opacity-90 mt-1">
                        {isPreparing ? 'En Preparación' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-5xl font-black tracking-tighter">#{padOrderNumber(order.orderNumber)}</span>
                      <p className="text-lg opacity-90 mt-1 font-medium">{order.customerInfo}</p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 rounded-full ${isOvertime ? 'bg-red-400' : isPreparing ? 'bg-blue-300' : 'bg-white/50'}`} 
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 p-5 overflow-y-auto bg-slate-900 space-y-4">
                  {order.items.map((item, idx) => {
                    const isCompleted = (order.completedItemIndexes || []).includes(idx);
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={() => useSubmittedOrdersStore.getState().toggleItemCompletion(order.id, idx)}
                        className={`border-b border-slate-800 pb-3 last:border-0 last:pb-0 cursor-pointer transition-all hover:bg-slate-800/50 p-2 rounded-xl -mx-2 ${isCompleted ? 'opacity-40 grayscale' : ''}`}
                      >
                        <div className="flex gap-3 items-start">
                          <span className="text-xl font-bold text-orange-400">{item.quantity}</span>
                          <span className={`text-xl font-bold text-slate-200 leading-tight ${isCompleted ? 'line-through' : ''}`}>
                            {item.name}
                          </span>
                        </div>
                        
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="ml-7 mt-2 space-y-1">
                            {item.modifiers.map((mod: any, midx: number) => (
                              <p key={midx} className={`text-lg font-semibold flex items-center gap-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-red-400'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full block ${isCompleted ? 'bg-slate-500' : 'bg-red-400'}`}></span>
                                {typeof mod === 'string' ? mod : mod.name}
                              </p>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className={`ml-7 mt-2 text-base font-semibold italic ${isCompleted ? 'text-slate-500 line-through' : 'text-amber-400'}`}>
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="p-4 bg-slate-950 border-t border-slate-800">
                  <button 
                    onClick={() => changeOrderStatus(order.id, 'ready')}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-colors active:scale-95"
                  >
                    <CheckCircle2 size={24} /> Marcar como Lista
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
