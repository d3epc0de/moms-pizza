import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './cartStore';
import { supabase, isMock } from '../supabase';
import { toast } from 'sonner';

export interface SubmittedOrder {
  id: string;
  orderNumber: number;
  serviceType: 'here' | 'to_go';
  customerInfo: string;
  items: CartItem[];
  totalAmount: number;
  paymentStatus: 'paid' | 'pending_payment';
  paymentMethod?: 'cash' | 'card' | 'nequi' | 'transfer';
  amountReceived?: number;
  changeGiven?: number;
  discount?: number;
  discountReason?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  createdAt: number;
  completedAt?: number;
  waiterName: string;
  waiterId: string;
  completedItemIndexes?: number[];
  paidAmount?: number;
}

interface SubmittedOrdersStore {
  orders: SubmittedOrder[];
  addOrder: (order: SubmittedOrder) => void;
  updateOrderStatus: (id: string, status: SubmittedOrder['status']) => void;
  updateOrder: (id: string, updates: Partial<SubmittedOrder>) => void;
  removeOrder: (id: string) => void;
  syncFromRealtime: (order: SubmittedOrder) => void;
  getOrdersForToday: () => SubmittedOrder[];
  getOrdersForDateRange: (startDate: Date, endDate: Date) => SubmittedOrder[];
  toggleItemCompletion: (orderId: string, itemIndex: number) => void;
  purgeOldOrders: (daysToKeep?: number) => void;
}

const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isWithinDateRange = (timestamp: number, startDate: Date, endDate: Date): boolean => {
  const date = new Date(timestamp);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
};

// Helper for safe Supabase operations with error logging
const safeSupabaseOp = async (operation: () => PromiseLike<{ error: any }> | any, context: string) => {
  try {
    const { error } = await operation();
    if (error) {
      console.error(`[Supabase Error in ${context}]:`, error);
      toast.error(`Error de sincronización (${context})`);
    }
    return !error;
  } catch (err) {
    console.error(`[Unexpected Exception in ${context}]:`, err);
    return false;
  }
};

export const useSubmittedOrdersStore = create<SubmittedOrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));
        
        // Sync to Supabase with proper error handling
        if (!isMock) {
          safeSupabaseOp(
            () => supabase.from('pedidos').insert({
              id: order.id,
              order_number: order.orderNumber,
              service_type: order.serviceType,
              payment_status: order.paymentStatus,
              status: order.status,
              customer_info: order.customerInfo,
              total_amount: order.totalAmount,
              waiter_name: order.waiterName,
              waiter_id: order.waiterId,
            }),
            `addOrder #${order.orderNumber}`
          ).then(() => {
            const detalles = order.items.map(item => ({
              pedido_id: order.id,
              producto_id: item.productId,
              name: item.name,
              quantity: item.quantity,
              unit_price: item.basePrice,
              modifiers: item.modifiers,
              notes: item.notes || ''
            }));
            safeSupabaseOp(
              () => supabase.from('detalles_pedido').insert(detalles),
              `addOrderDetails #${order.orderNumber}`
            );
          });
        }
      },

      updateOrderStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id !== id) return o;
            return {
              ...o,
              status,
              completedAt: status === 'delivered' ? Date.now() : o.completedAt,
            };
          })
        }));
        if (!isMock) {
          safeSupabaseOp(
            () => supabase.from('pedidos').update({ 
              status, 
              completed_at: status === 'delivered' ? new Date().toISOString() : undefined 
            }).eq('id', id),
            `updateOrderStatus ${id} -> ${status}`
          );
        }
      },

      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map(o => o.id === id ? { ...o, ...updates } : o)
        }));
        if (!isMock) {
          const payload: Record<string, unknown> = {};
          if (updates.status !== undefined) payload.status = updates.status;
          if (updates.paymentStatus !== undefined) payload.payment_status = updates.paymentStatus;
          if (updates.totalAmount !== undefined) payload.total_amount = updates.totalAmount;
          if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
          if (updates.amountReceived !== undefined) payload.amount_received = updates.amountReceived;
          if (updates.changeGiven !== undefined) payload.change_given = updates.changeGiven;
          if (updates.discount !== undefined) payload.discount = updates.discount;
          if (updates.discountReason !== undefined) payload.discount_reason = updates.discountReason;
          if (updates.customerInfo !== undefined) payload.customer_info = updates.customerInfo;
          if (Object.keys(payload).length > 0) {
            safeSupabaseOp(
              () => supabase.from('pedidos').update(payload).eq('id', id),
              `updateOrder ${id}`
            );
          }
        }
      },

      removeOrder: (id) => {
        set((state) => ({
          orders: state.orders.map(o =>
            o.id === id ? { ...o, status: 'delivered' as const, completedAt: Date.now() } : o
          )
        }));
        if (!isMock) {
          safeSupabaseOp(
            () => supabase.from('pedidos').update({ status: 'delivered', completed_at: new Date().toISOString() }).eq('id', id),
            `removeOrder (deliver) ${id}`
          );
        }
      },

      syncFromRealtime: (order) => set((state) => {
        const exists = state.orders.some(o => o.id === order.id);
        if (exists) return state;
        return { orders: [order, ...state.orders] };
      }),

      getOrdersForToday: () => {
        return get().orders.filter(o => isToday(o.createdAt));
      },

      getOrdersForDateRange: (startDate: Date, endDate: Date) => {
        return get().orders.filter(o => isWithinDateRange(o.createdAt, startDate, endDate));
      },

      toggleItemCompletion: (orderId, itemIndex) => set((state) => {
        return {
          orders: state.orders.map(o => {
            if (o.id !== orderId) return o;
            const current = o.completedItemIndexes || [];
            const isCompleted = current.includes(itemIndex);
            const next = isCompleted 
              ? current.filter(i => i !== itemIndex)
              : [...current, itemIndex];
            return { ...o, completedItemIndexes: next };
          })
        };
      }),

      purgeOldOrders: (daysToKeep = 30) => {
        const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
        set((state) => ({
          orders: state.orders.filter(o => o.createdAt >= cutoff)
        }));
      },
    }),
    {
      name: 'pos-submitted-orders',
      onRehydrateStorage: () => {
        // Auto-purge orders older than 30 days on app load
        return (state, error) => {
          if (state && !error) {
            state.purgeOldOrders(30);
          }
        };
      },
    }
  )
);
