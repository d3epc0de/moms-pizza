"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { useOrderNumberStore } from "@/lib/store/orderNumberStore";
import { CreditCard, Banknote, Smartphone, Landmark, ArrowLeft, Percent, X } from "lucide-react";
import { isMock } from "@/lib/supabase";
import { toast } from "sonner";
import { useSyncStore } from "@/lib/store/syncStore";
import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { useActiveOrdersStore } from "@/lib/store/activeOrdersStore";
import { formatPrice } from "@/lib/utils";
import { printCustomerReceipt, printKitchenTicket } from "@/lib/printUtils";

type PaymentMethod = 'cash' | 'card' | 'nequi' | 'transfer';
type CheckoutStep = 'method' | 'cash_input' | 'discount';

const PAYMENT_METHODS: { id: PaymentMethod; name: string; icon: any; color: string }[] = [
  { id: 'cash', name: 'Efectivo', icon: Banknote, color: 'emerald' },
  { id: 'nequi', name: 'Nequi', icon: Smartphone, color: 'purple' },
];

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { cart, orderType, customerInfo, clearCart, activeOrderId, setActiveOrderId } = useCartStore();
  const { enqueueJob } = useSyncStore();
  const { orders: submittedOrders, addOrder: addSubmittedOrder, updateOrder: updateSubmittedOrder } = useSubmittedOrdersStore();
  const { removeOrder: removeActiveOrder } = useActiveOrdersStore();
  const { currentEmployee } = useEmployeeStore();
  const { getNextOrderNumber } = useOrderNumberStore();

  const existingOrder = activeOrderId ? submittedOrders.find(o => o.id === activeOrderId) : null;
  const previouslyPaid = existingOrder?.paidAmount || 0;
  const previousDiscount = existingOrder?.discount || 0;

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [step, setStep] = useState<CheckoutStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amountReceived, setAmountReceived] = useState("");

  const total = Math.max(0, subtotal - previousDiscount - discount - previouslyPaid);
  const changeAmount = selectedMethod === 'cash' ? Math.max(0, (parseFloat(amountReceived) || 0) - total) : 0;
  const canCompleteCash = selectedMethod === 'cash' && (parseFloat(amountReceived) || 0) >= total;

  const waiterName = currentEmployee?.name || "Sin asignar";
  const waiterId = currentEmployee?.id || "";

  const handleSelectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === 'cash') {
      setStep('cash_input');
    } else {
      completePayment(method);
    }
  };

  const completePayment = (method: PaymentMethod) => {
    const receivedAmount = method === 'cash' ? parseFloat(amountReceived) || total : total;
    const change = method === 'cash' ? Math.max(0, receivedAmount - total) : 0;
    const finalOrderNumber = existingOrder?.orderNumber || getNextOrderNumber();

    if (activeOrderId) {
      removeActiveOrder(activeOrderId);
      updateSubmittedOrder(activeOrderId, {
        items: cart,
        totalAmount: subtotal,
        paymentStatus: 'paid',
        paymentMethod: method,
        amountReceived: receivedAmount,
        changeGiven: change,
        discount: previousDiscount + discount,
        discountReason: discountReason || existingOrder?.discountReason,
        paidAmount: previouslyPaid + total,
      });
      setActiveOrderId(null);
    } else {
      addSubmittedOrder({
        id: crypto.randomUUID(),
        orderNumber: finalOrderNumber,
        serviceType: orderType,
        customerInfo,
        items: cart,
        totalAmount: subtotal,
        paymentStatus: 'paid',
        paymentMethod: method,
        amountReceived: receivedAmount,
        changeGiven: change,
        discount: discount > 0 ? discount : undefined,
        discountReason: discountReason || undefined,
        paidAmount: total,
        status: 'pending',
        createdAt: Date.now(),
        waiterName,
        waiterId,
      });

      // Since this is a direct checkout (bypassed "A Cocina"), we must print the kitchen ticket too
      printKitchenTicket({
        orderNumber: finalOrderNumber,
        customerInfo,
        serviceType: orderType,
        waiterName,
        date: Date.now(),
        items: cart,
      });
    }

    printCustomerReceipt({
      orderNumber: finalOrderNumber,
      customerInfo,
      serviceType: orderType,
      waiterName,
      date: Date.now(),
      items: cart,
      totalAmount: subtotal - (previousDiscount + discount),
      amountReceived: receivedAmount,
      changeGiven: change,
      paymentMethod: method,
      discount: previousDiscount + discount > 0 ? previousDiscount + discount : undefined,
    });

    const methodName = PAYMENT_METHODS.find(m => m.id === method)?.name || method;
    
    toast.success(`Pago registrado con ${methodName}`, {
      description: change > 0 
        ? `Cambio: ${formatPrice(change)}`
        : discount > 0 
          ? `Descuento aplicado: ${formatPrice(discount)}`
          : `Total: ${formatPrice(total)}`
    });

    clearCart();
    onClose();
  };

  // Quick cash buttons
  const quickCashAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 20000) * 20000,
    Math.ceil(total / 50000) * 50000,
    100000,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-600/50 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white mb-1">
            Cobrar — {orderType === "here" ? customerInfo : "A Domicilio"}
          </h2>
          {orderType === "to_go" && customerInfo && (
            <p className="text-blue-400 font-medium">{customerInfo}</p>
          )}
        </div>

        {/* Total Display */}
        <div className="bg-slate-800/60 rounded-2xl p-5 mb-6 text-center border border-slate-700/50">
          {discount > 0 && (
            <div className="flex justify-between text-sm text-slate-400 mb-2">
              <span>Subtotal</span>
              <span className="line-through">{formatPrice(subtotal)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-400 mb-2">
              <span>Descuento ({discountReason || 'Manual'})</span>
              <span>-{formatPrice(discount)}</span>
            </div>
          )}
          {previouslyPaid > 0 && (
            <div className="flex justify-between text-sm text-blue-400 mb-2">
              <span>Abonado previamente</span>
              <span>-{formatPrice(previouslyPaid)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-700">
            <span className="text-lg text-slate-300 font-medium">Total a pagar</span>
            <span className="text-emerald-400 font-black text-3xl">{formatPrice(total)}</span>
          </div>
        </div>

        {/* Discount toggle */}
        {step === 'method' && discount === 0 && (
          <button 
            onClick={() => setStep('discount')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium w-full justify-center"
          >
            <Percent size={14} />
            Aplicar descuento
          </button>
        )}

        {/* Step: Discount Input */}
        {step === 'discount' && (
          <div className="space-y-4 mb-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Monto descuento</label>
                <input
                  type="number"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.min(subtotal, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="5000"
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-1">Razón</label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cortesía, promo..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDiscount(0); setDiscountReason(""); setStep('method'); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-medium transition-all">
                Cancelar
              </button>
              <button onClick={() => setStep('method')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold transition-all">
                Aplicar
              </button>
            </div>
          </div>
        )}

        {/* Step: Payment Method Selection */}
        {step === 'method' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {PAYMENT_METHODS.map(pm => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  onClick={() => handleSelectMethod(pm.id)}
                  className={`bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-white font-semibold py-5 rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2 shadow-md`}
                >
                  <Icon size={28} className={`text-${pm.color}-400`} />
                  <span className="text-sm">{pm.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step: Cash Input */}
        {step === 'cash_input' && (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Monto recibido en efectivo</label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-4 text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                placeholder={total.toString()}
                autoFocus
              />
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-2 gap-2">
              {quickCashAmounts.map(amount => (
                <button
                  key={amount}
                  onClick={() => setAmountReceived(amount.toString())}
                  className={`py-3 rounded-xl font-bold text-sm transition-all ${
                    amountReceived === amount.toString()
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {formatPrice(amount)}
                </button>
              ))}
            </div>

            {/* Change Display */}
            {parseFloat(amountReceived) > 0 && (
              <div className={`p-4 rounded-xl text-center font-bold text-xl ${
                canCompleteCash 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {canCompleteCash 
                  ? `Cambio: ${formatPrice(changeAmount)}`
                  : `Faltan: ${formatPrice(total - (parseFloat(amountReceived) || 0))}`
                }
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setStep('method'); setSelectedMethod(null); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={18} /> Atrás
              </button>
              <button 
                onClick={() => completePayment('cash')}
                disabled={!canCompleteCash}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white font-medium transition-colors p-3 w-full rounded-xl hover:bg-slate-800/50"
        >
          Volver a la orden
        </button>
      </div>
    </div>
  );
}
