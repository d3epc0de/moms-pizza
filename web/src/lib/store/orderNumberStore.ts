import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrderNumberStore {
  lastOrderNumber: number;
  lastResetDate: string; // YYYY-MM-DD
  getNextOrderNumber: () => number;
}

const getTodayStr = () => new Date().toISOString().split('T')[0];

export const useOrderNumberStore = create<OrderNumberStore>()(
  persist(
    (set, get) => ({
      lastOrderNumber: 0,
      lastResetDate: getTodayStr(),

      getNextOrderNumber: () => {
        const today = getTodayStr();
        const state = get();

        // Reset to 0 at the start of each day
        if (state.lastResetDate !== today) {
          set({ lastOrderNumber: 1, lastResetDate: today });
          return 1;
        }

        const next = state.lastOrderNumber + 1;
        set({ lastOrderNumber: next });
        return next;
      },
    }),
    {
      name: 'pos-order-numbers',
    }
  )
);
