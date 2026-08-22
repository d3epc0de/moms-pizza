"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { useOrderNumberStore } from "@/lib/store/orderNumberStore";
import { User, LogOut, Utensils, X, Send, CreditCard, Store, Bike, Receipt, ClipboardList, Plus, Minus, WifiOff, Wifi, MessageSquare, ChefHat, LayoutGrid } from "lucide-react";
import { isMock } from "@/lib/supabase";
import { toast } from "sonner";
import { useSyncStore } from "@/lib/store/syncStore";
import { useActiveOrdersStore } from "@/lib/store/activeOrdersStore";
import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { useBusinessStore } from "@/lib/store/businessStore";
import { useAuditStore } from "@/lib/store/auditStore";
import { printKitchenTicket } from "@/lib/printUtils";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CartPanel({ 
  onCheckout, 
  viewMode, 
  onToggleView 
}: { 
  onCheckout: () => void, 
  viewMode?: 'menu' | 'orders',
  onToggleView?: (mode: 'menu' | 'orders') => void
}) {
  const { cart, orderType, customerInfo, setOrderType, setCustomerInfo, removeFromCart, updateCartItemQuantity, clearCart, setCart, activeOrderId, setActiveOrderId } = useCartStore();
  const { processQueue } = useSyncStore();
  const { orders, addOrder, updateOrderItems } = useActiveOrdersStore();
  const { orders: submittedOrders, addOrder: addSubmittedOrder, updateOrder: updateSubmittedOrder } = useSubmittedOrdersStore();
  const { currentEmployee } = useEmployeeStore();
  const { getNextOrderNumber } = useOrderNumberStore();
  const { logout } = useEmployeeStore();
  const { getActiveTables } = useBusinessStore();
  const { log: auditLog } = useAuditStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const waiterName = currentEmployee?.name || "Sin asignar";
  const waiterId = currentEmployee?.id || "";

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);
    const handleOnline = () => { setIsOnline(true); processQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  const sendToKitchen = async () => {
    if (cart.length === 0) return;
    if (!customerInfo.trim()) {
      toast.error("Información requerida", {
        description: orderType === "here" ? "Selecciona una mesa o barra." : "Ingresa la información del cliente."
      });
      return;
    }

    if (activeOrderId) {
      const existingOrder = submittedOrders.find(o => o.id === activeOrderId);
      const previouslyPaid = existingOrder?.paidAmount || 0;
      const previousDiscount = existingOrder?.discount || 0;
      const isFullyPaid = (previouslyPaid + previousDiscount) >= total;

      // Updating existing order
      updateOrderItems(activeOrderId, cart, total);
      updateSubmittedOrder(activeOrderId, { 
        items: cart, 
        totalAmount: total,
        status: 'pending', // Reset status so kitchen sees the updates
        paymentStatus: isFullyPaid ? 'paid' : 'pending_payment'
      });
      clearCart();
      toast.success("Comanda actualizada", {
        description: `Nuevos ítems añadidos a ${customerInfo}`
      });

      printKitchenTicket({
        orderNumber: existingOrder?.orderNumber || "ACTUALIZACIÓN",
        customerInfo,
        serviceType: orderType,
        waiterName,
        date: Date.now(),
        items: cart, // Only printing the new/updated items
      });
      return;
    }

    if (orderType === "here" && orders.some(o => o.customerInfo === customerInfo)) {
      toast.error("Mesa Ocupada", { description: "Esta mesa ya tiene una cuenta abierta. Añade los ítems desde 'Cuentas Abiertas'." });
      return;
    }

    const newId = crypto.randomUUID();
    const orderNumber = getNextOrderNumber();

    addOrder({
      id: newId,
      orderNumber,
      serviceType: orderType,
      customerInfo,
      items: cart,
      totalAmount: total,
      createdAt: Date.now(),
      waiterName,
      waiterId,
    });
    
    addSubmittedOrder({
      id: newId,
      orderNumber,
      serviceType: orderType,
      customerInfo,
      items: cart,
      totalAmount: total,
      paymentStatus: 'pending_payment',
      status: 'pending',
      createdAt: Date.now(),
      waiterName,
      waiterId,
    });

    clearCart();
    toast.success(`Comanda #${orderNumber.toString().padStart(3, '0')} enviada a cocina`, {
      description: `${customerInfo} • ${waiterName}`
    });
    if (currentEmployee) auditLog('order_created', currentEmployee.id, currentEmployee.name, `Comanda #${orderNumber.toString().padStart(3, '0')} — ${customerInfo} — ${formatPrice(total)}`);

    printKitchenTicket({
      orderNumber,
      customerInfo,
      serviceType: orderType,
      waiterName,
      date: Date.now(),
      items: cart,
    });
  };

  const handleLogout = () => {
    clearCart();
    logout();
    router.push('/');
  };

  return (
    <div className="w-[35%] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-slate-600/30 relative">
      
      {/* Connectivity banner */}
      {mounted && !isOnline && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 text-red-400 text-sm font-medium">
          <WifiOff size={16} />
          <span>Sin conexión — las comandas se guardarán localmente</span>
        </div>
      )}

      <div className="bg-slate-800/80 p-5 flex flex-col gap-4 border-b border-slate-700/50">
        <div className="flex justify-between items-center gap-2">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-700/50 shrink-0">
            <button 
              onClick={() => setOrderType("here")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium transition-all text-sm ${orderType === "here" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              title="Consumir Aquí"
            >
              <Store size={16} /> Local
            </button>
            <button 
              onClick={() => setOrderType("to_go")}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 font-medium transition-all text-sm ${orderType === "to_go" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              title="A Domicilio"
            >
              <Bike size={16} /> Domicilio
            </button>
          </div>
          
          <div className="flex gap-1.5 items-center justify-end flex-wrap">
            <Link 
              href="/kds"
              className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 p-2 rounded-xl transition-colors shadow-inner flex items-center justify-center"
              title="Pantalla de Cocina (KDS)"
            >
              <ChefHat size={18} />
            </Link>
            <button 
              onClick={() => onToggleView && onToggleView(viewMode === 'menu' ? 'orders' : 'menu')}
              className={`${viewMode === 'orders' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20'} p-2 rounded-xl transition-colors shadow-inner flex items-center justify-center relative`}
              title={viewMode === 'orders' ? "Volver al Menú" : "Gestión de Órdenes"}
            >
              {viewMode === 'orders' ? <LayoutGrid size={18} /> : <Receipt size={18} />}
              {orders.length > 0 && viewMode !== 'orders' && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
            <div className="bg-slate-700/50 p-2 rounded-xl shadow-inner flex items-center gap-1.5 cursor-default" title={waiterName}>
              <User size={18} className="text-blue-400" />
              <span className="text-xs text-slate-300 font-medium max-w-[50px] truncate">{currentEmployee?.name?.split(' ')[0]}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-xl transition-colors shadow-inner flex items-center justify-center"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {orderType === "here" ? (
          <div className="grid grid-cols-4 gap-2">
            {getActiveTables().map(mesa => {
              const isOccupied = orders.some(o => o.customerInfo === mesa.name);
              const isCurrentOrderTable = activeOrderId === orders.find(o => o.customerInfo === mesa.name)?.id;
              
              return (
                <button
                  key={mesa.id}
                  disabled={isOccupied && !isCurrentOrderTable}
                  onClick={() => setCustomerInfo(mesa.name)}
                  className={`py-2 flex flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold transition-all ${
                    customerInfo === mesa.name 
                      ? "bg-blue-500 text-white shadow-md shadow-blue-500/20 border border-blue-500" 
                      : (isOccupied && !isCurrentOrderTable)
                        ? "bg-red-500/10 border border-red-500/30 text-red-400 opacity-50 cursor-not-allowed"
                        : "bg-slate-900 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  }`}
                >
                  <span>{mesa.name}</span>
                  {(isOccupied && !isCurrentOrderTable) && <span className="text-[10px] uppercase font-black tracking-widest text-red-500">Ocupada</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div>
            <input 
              type="text" 
              value={customerInfo}
              onChange={(e) => setCustomerInfo(e.target.value)}
              placeholder="Nombre del cliente / Dirección / WhatsApp..."
              className="w-full bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-lg placeholder:text-slate-500"
            />
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center shadow-inner">
              <Utensils size={32} className="opacity-50" />
            </div>
            <p className="font-medium">La comanda está vacía</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item.cartId} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 relative group transition-all hover:bg-slate-800/60">
              <div className="flex justify-between items-start mb-1">
                <div className="flex gap-3 items-center">
                  {/* Inline quantity controls */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateCartItemQuantity(item.cartId, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-90"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className="font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md min-w-[28px] text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartItemQuantity(item.cartId, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors active:scale-90"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                  <span className="font-semibold text-white">{item.name}</span>
                </div>
                <span className="font-medium text-slate-200">{formatPrice(item.totalPrice)}</span>
              </div>
              
              {/* Modifiers List */}
              {item.modifiers.length > 0 && (
                <div className="ml-[88px] mt-2 space-y-1">
                  {item.modifiers.map((mod, i) => (
                    <div key={i} className="flex justify-between text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-500 inline-block"></span>
                          {mod.name}
                      </span>
                      {mod.price > 0 && <span>+{formatPrice(mod.price)}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="ml-[88px] mt-2 flex items-center gap-1.5 text-sm text-amber-400/80">
                  <MessageSquare size={12} />
                  <span className="italic">{item.notes}</span>
                </div>
              )}

              {/* Delete button */}
              <button 
                onClick={() => removeFromCart(item.cartId)}
                className="absolute -right-2 -top-2 bg-red-500/90 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-500 hover:scale-110"
              >
                <X size={14} strokeWidth={3} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Totals & Actions */}
      <div className="bg-slate-800/80 p-6 border-t border-slate-700/50 space-y-6 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex justify-between items-center text-xl font-bold text-white pt-3 border-t border-slate-700/50">
            <span>Total a Pagar</span>
            <span className="text-emerald-400 text-2xl">{formatPrice(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={sendToKitchen}
            disabled={cart.length === 0}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <Send size={22} className={activeOrderId ? "text-orange-400" : "text-blue-400"} />
            <span>{activeOrderId ? "Actualizar Cuenta" : "A Cocina (Pendiente)"}</span>
          </button>
          
          <button 
            onClick={() => {
              if (!customerInfo.trim()) {
                toast.error("Información requerida", {
                  description: orderType === "here" ? "Selecciona una mesa o barra." : "Ingresa la información del cliente."
                });
                return;
              }
              if (orderType === "here" && !activeOrderId && orders.some(o => o.customerInfo === customerInfo)) {
                toast.error("Mesa Ocupada", { description: "Esta mesa ya tiene una cuenta abierta. Añade los ítems desde 'Cuentas Abiertas'." });
                return;
              }
              onCheckout();
            }}
            disabled={cart.length === 0}
            className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <CreditCard size={22} />
            <span className="text-center leading-tight">Cobrar y Enviar<br/>(Pagado)</span>
          </button>
        </div>
      </div>

    </div>
  );
}
