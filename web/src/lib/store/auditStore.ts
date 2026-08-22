import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'order_created'
  | 'order_cancelled'
  | 'order_delivered'
  | 'payment_received'
  | 'discount_applied'
  | 'price_changed'
  | 'product_created'
  | 'product_deleted'
  | 'product_toggled'
  | 'employee_created'
  | 'employee_deleted'
  | 'cashout_performed'
  | 'config_changed';

export interface AuditEntry {
  id: string;
  timestamp: number;
  action: AuditAction;
  employeeId: string;
  employeeName: string;
  details: string;
  metadata?: Record<string, unknown>;
}

interface AuditStore {
  entries: AuditEntry[];
  log: (action: AuditAction, employeeId: string, employeeName: string, details: string, metadata?: Record<string, unknown>) => void;
  getEntriesForDate: (date: Date) => AuditEntry[];
  getEntriesByAction: (action: AuditAction) => AuditEntry[];
  purgeOlderThan: (days: number) => void;
}

const MAX_ENTRIES = 5000; // Prevent localStorage from growing too large

export const useAuditStore = create<AuditStore>()(
  persist(
    (set, get) => ({
      entries: [],

      log: (action, employeeId, employeeName, details, metadata) => {
        const entry: AuditEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          action,
          employeeId,
          employeeName,
          details,
          metadata,
        };
        
        set((state) => {
          // Keep only the most recent entries to prevent localStorage bloat
          const updated = [entry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries: updated };
        });
      },

      getEntriesForDate: (date: Date) => {
        const dateStr = date.toDateString();
        return get().entries.filter(e => new Date(e.timestamp).toDateString() === dateStr);
      },

      getEntriesByAction: (action: AuditAction) => {
        return get().entries.filter(e => e.action === action);
      },

      purgeOlderThan: (days: number) => {
        const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
        set((state) => ({
          entries: state.entries.filter(e => e.timestamp >= cutoff)
        }));
      },
    }),
    {
      name: 'pos-audit-log',
    }
  )
);
