import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './cartStore';

export interface ActiveOrder {
  id: string;
  orderNumber: number;
  serviceType: 'here' | 'to_go';
  customerInfo: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: number;
  waiterName: string;
  waiterId: string;
}

interface ActiveOrdersStore {
  orders: ActiveOrder[];
  addOrder: (order: ActiveOrder) => void;
  removeOrder: (id: string) => void;
  updateOrderItems: (id: string, newItems: CartItem[], newTotal: number) => void;
  updateCustomerInfo: (id: string, info: string) => void;
}

export const useActiveOrdersStore = create<ActiveOrdersStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      removeOrder: (id) => set((state) => ({ orders: state.orders.filter(o => o.id !== id) })),
      updateOrderItems: (id, newItems, newTotal) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, items: newItems, totalAmount: newTotal } : o)
      })),
      updateCustomerInfo: (id, info) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, customerInfo: info } : o)
      }))
    }),
    {
      name: 'pos-active-orders-storage',
    }
  )
);
