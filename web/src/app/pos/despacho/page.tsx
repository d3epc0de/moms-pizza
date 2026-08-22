"use client";

import { useEffect, useState, useRef } from "react";
import { useSubmittedOrdersStore, SubmittedOrder } from "@/lib/store/submittedOrdersStore";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useActiveOrdersStore } from "@/lib/store/activeOrdersStore";
import { formatPrice, formatElapsedTime, calculateProgressPercent, padOrderNumber } from "@/lib/utils";

const MAX_TIME_MS = 30 * 60 * 1000; // 30 min

export default function DespachoPage() {
  const { orders: allOrders, updateOrderStatus, removeOrder } = useSubmittedOrdersStore();
  const { removeOrder: removeActiveOrder } = useActiveOrdersStore();
  const [now, setNow] = useState(Date.now());
  const previousOrderCount = useRef(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter: only show non-delivered orders
  const displayOrders = allOrders.filter(o => o.status !== 'delivered');

  // Sound alert for new orders
  useEffect(() => {
    if (displayOrders.length > previousOrderCount.current && soundEnabled) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        osc.type = 'sine';
        gain.gain.value = 0.25;
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 400);
      } catch (e) {
        console.log('Audio not available');
      }
    }
    previousOrderCount.current = displayOrders.length;
  }, [displayOrders.length, soundEnabled]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="p-6 border-b border-slate-800 bg-[#1E293B] shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <Link href="/pos/dashboard" className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 p-3 rounded-xl transition-all mr-2">
            <ArrowLeft size={24} />
          </Link>
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <span className="text-3xl text-blue-400">🕒</span>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Panel de Despacho</h1>
            <p className="text-blue-400 font-bold mt-1 tracking-wide uppercase text-xs">Pedidos Solicitados — En Tiempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-3 rounded-xl transition-colors ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <div className="bg-slate-900/50 border border-slate-700 px-4 py-2 rounded-xl">
            <span className="text-slate-400 font-medium mr-2">Pedidos Activos:</span>
            <span className="text-2xl font-black text-white">{displayOrders.length}</span>
          </div>
        </div>
      </header>

      {/* Grid de Pedidos */}
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {displayOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <span className="text-6xl mb-4 opacity-50">✅</span>
            <p className="text-3xl font-medium tracking-tight">Cero pedidos en espera. ¡Excelente!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max">
            {displayOrders.map((order) => {
              
              const elapsed = Math.max(0, now - order.createdAt);
              const isOvertime = elapsed > MAX_TIME_MS;
              const progress = calculateProgressPercent(elapsed, MAX_TIME_MS);
              const isPendingPayment = order.paymentStatus === 'pending_payment';
              const isReady = order.status === 'ready';
              
              // Styles by state
              let stateColor = 'yellow';
              let borderColor = 'border-yellow-500/50';
              let badgeText = 'PREPARANDO';
              let badgeBg = 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30';
              let actionText = 'Marcar como Listo';
              let actionClass = 'border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white';

              if (isReady) {
                stateColor = 'green';
                borderColor = 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]';
                badgeText = 'LISTO PARA DESPACHO';
                badgeBg = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                actionText = 'Marcar como Despachado';
                actionClass = 'bg-emerald-500 text-white font-bold hover:bg-emerald-400 shadow-lg hover:-translate-y-0.5';
              } else if (isPendingPayment && order.status !== 'pending') {
                stateColor = 'orange';
                borderColor = 'border-orange-500/50';
                badgeText = 'EN ESPERA DE PAGO';
                badgeBg = 'bg-orange-500/20 text-orange-500 border border-orange-500/30';
              }

              if (isReady && isPendingPayment) {
                actionText = 'Despachar (Sin Pagar)';
                actionClass = 'border border-orange-500/50 text-orange-400 hover:bg-orange-500/20';
              }

              if (isOvertime && !isReady) {
                borderColor = 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]';
              }

              return (
                <div key={order.id} className={`bg-[#1E293B] rounded-3xl border-2 ${borderColor} p-6 flex flex-col transition-all hover:scale-[1.01]`}>
                  
                  {/* Top: Order number + Timer */}
                  <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                    <div className="flex flex-col">
                      <span className="text-4xl font-black text-white tracking-tighter leading-none">
                        #{padOrderNumber(order.orderNumber)}
                      </span>
                      <span className="text-white text-base font-bold tracking-tight leading-tight mt-2">
                        {order.serviceType === 'to_go' ? 'A Domicilio' : 'Local'} • {order.customerInfo}
                      </span>
                      <span className="text-slate-500 text-xs mt-1">{order.waiterName}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-3xl font-black font-mono tracking-tighter ${
                        isOvertime ? 'text-red-500' : stateColor === 'yellow' ? 'text-yellow-500' : stateColor === 'green' ? 'text-emerald-500' : 'text-orange-500'
                      }`}>
                        {formatElapsedTime(elapsed)}
                      </span>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${
                            isOvertime ? 'bg-red-500' : isReady ? 'bg-emerald-500' : stateColor === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                          }`} 
                          style={{ width: isReady ? '100%' : `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="py-5 space-y-3 flex-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex gap-3 text-slate-200 text-base font-medium">
                          <span className="text-slate-500 font-bold">{item.quantity}x</span>
                          <span className="leading-snug">{item.name}</span>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="ml-8 flex flex-wrap gap-1">
                            {item.modifiers.map((mod: any, mIdx: number) => (
                              <span key={mIdx} className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                + {typeof mod === 'string' ? mod : mod.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <span className="ml-8 text-xs text-amber-400 italic">📝 {item.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Bottom: Actions */}
                  <div className="flex flex-col gap-4 mt-auto border-t border-slate-700/50 pt-4">
                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1.5 text-xs font-black tracking-widest rounded-lg ${badgeBg}`}>
                        {badgeText}
                      </span>
                      {order.discount && order.discount > 0 && (
                        <span className="text-xs text-emerald-400 font-medium">Desc: {formatPrice(order.discount)}</span>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!isReady) {
                          updateOrderStatus(order.id, 'ready');
                        } else {
                          removeOrder(order.id);
                          removeActiveOrder(order.id);
                        }
                      }}
                      className={`w-full py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${actionClass}`}
                    >
                      {actionText}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
