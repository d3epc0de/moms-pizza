"use client";

import { useEffect, useState, useRef } from "react";
import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { padOrderNumber } from "@/lib/utils";
import { Pizza, BellRing, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { isMock } from "@/lib/supabase";
import { useBusinessStore } from "@/lib/store/businessStore";

export default function CustomerDisplay() {
  const router = useRouter();
  const { orders } = useSubmittedOrdersStore();
  const { businessName } = useBusinessStore();
  const [mounted, setMounted] = useState(false);
  const previousReadyCount = useRef(0);
  const [lastReadyOrder, setLastReadyOrder] = useState<number | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show all active orders (both local and to-go) that haven't been delivered
  const customerOrders = orders.filter(o => o.status !== 'delivered');
  
  const preparingOrders = customerOrders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const readyOrders = customerOrders.filter(o => o.status === 'ready');

  useEffect(() => {
    if (readyOrders.length > previousReadyCount.current) {
      // New order is ready! Play sound and show animation
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Play a nice "ding dong" sound
        const playTone = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
          
          gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
          
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };

        playTone(523.25, 0, 0.6); // C5
        playTone(440.00, 0.4, 0.8); // A4
        
      } catch (e) {
        console.log("Audio not supported");
      }

      // Find the newest ready order
      const newestReady = readyOrders[0]?.orderNumber;
      if (newestReady) {
        setLastReadyOrder(newestReady);
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 5000);
      }
    }
    previousReadyCount.current = readyOrders.length;
  }, [readyOrders]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-2xl shadow-lg shadow-orange-500/20">
            <Pizza size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">{businessName}</h1>
            <p className="text-orange-400 font-bold text-lg tracking-widest uppercase">Estado de su pedido</p>
          </div>
        </div>
        <button 
          onClick={() => router.push('/pos/dashboard')}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors border border-slate-700"
        >
          <LogOut size={24} />
          <span>Volver al POS</span>
        </button>
      </header>

      {/* Main Content: Two Columns */}
      <main className="flex-1 flex w-full relative z-10">
        
        {/* EN PREPARACIÓN COLUMN */}
        <div className="flex-1 border-r border-slate-800 flex flex-col bg-slate-950/50 relative">
          <div className="bg-slate-900/80 p-6 border-b border-slate-800 text-center sticky top-0 shadow-md">
            <h2 className="text-4xl font-black text-slate-300 tracking-tight uppercase">En Preparación</h2>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {preparingOrders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 font-medium text-2xl">
                  No hay pedidos en preparación
                </div>
              ) : (
                preparingOrders.map(order => (
                  <div key={order.id} className="bg-slate-900/60 border-2 border-slate-800 rounded-3xl p-6 flex items-center justify-center shadow-lg">
                    <span className="text-6xl font-black text-slate-300 tracking-tighter">
                      {padOrderNumber(order.orderNumber)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* LISTOS COLUMN */}
        <div className="flex-1 flex flex-col bg-emerald-950/20 relative">
          <div className="bg-emerald-900/40 p-6 border-b border-emerald-900/50 text-center sticky top-0 shadow-md flex items-center justify-center gap-4">
            <BellRing size={36} className="text-emerald-400" />
            <h2 className="text-4xl font-black text-emerald-400 tracking-tight uppercase">Listos para Entregar</h2>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {readyOrders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-emerald-900/50 font-medium text-2xl">
                  No hay pedidos listos
                </div>
              ) : (
                readyOrders.map(order => (
                  <div 
                    key={order.id} 
                    className={`bg-emerald-900/40 border-2 border-emerald-500/50 rounded-3xl p-6 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all ${
                      showAnimation && lastReadyOrder === order.orderNumber ? 'scale-110 shadow-[0_0_50px_rgba(16,185,129,0.4)] bg-emerald-800/60 ring-4 ring-emerald-400 animate-pulse z-50' : ''
                    }`}
                  >
                    <span className="text-7xl font-black text-emerald-400 tracking-tighter">
                      {padOrderNumber(order.orderNumber)}
                    </span>
                    {order.customerInfo && (
                      <span className="mt-2 text-xl font-bold text-emerald-200/80 truncate max-w-full px-2">
                        {order.customerInfo}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>

      {/* FULL SCREEN ANIMATION OVERLAY FOR NEW READY ORDER */}
      {showAnimation && lastReadyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-10 duration-500 delay-150">
            <h2 className="text-5xl font-black text-emerald-400 mb-8 uppercase tracking-widest">¡Pedido Listo!</h2>
            <div className="bg-emerald-500 text-white rounded-[4rem] px-20 py-16 shadow-[0_0_100px_rgba(16,185,129,0.5)] border-8 border-emerald-300 flex items-center justify-center">
              <span className="text-[12rem] font-black tracking-tighter leading-none">
                {padOrderNumber(lastReadyOrder)}
              </span>
            </div>
            <p className="mt-12 text-3xl font-bold text-emerald-200">Por favor, acérquese a reclamar su pedido</p>
          </div>
        </div>
      )}

    </div>
  );
}
