import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ExpenseCategory = 'materia_prima' | 'servicios' | 'nomina' | 'transporte' | 'otros';
export type PaymentMethod = 'cash' | 'nequi' | 'bank';

export interface Expense {
  id: string;
  date: number; // timestamp
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  employeeId: string;
  employeeName: string;
}

export interface DailyClosure {
  id: string;
  date: number; // timestamp
  totalSales: number; // Total Ingresos
  cashSales: number; // Ingresos en Efectivo
  nequiSales: number; // Ingresos Nequi
  totalExpenses: number; // Total Gastos
  cashExpenses: number; // Gastos en Efectivo
  expectedCash: number; // (cashSales - cashExpenses)
  declaredCash: number; // Efectivo declarado por el cajero
  difference: number; // declaredCash - expectedCash
  notes: string;
  closedBy: string; // employeeName
}

interface FinanceStore {
  expenses: Expense[];
  closures: DailyClosure[];
  addExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  removeExpense: (id: string) => void;
  addClosure: (closure: Omit<DailyClosure, 'id' | 'date'>) => void;
  removeClosure: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      expenses: [],
      closures: [],

      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, {
          ...expense,
          id: "exp_" + crypto.randomUUID().substring(0, 8),
          date: Date.now()
        }]
      })),

      removeExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(e => e.id !== id)
      })),

      addClosure: (closure) => set((state) => ({
        closures: [...state.closures, {
          ...closure,
          id: "cls_" + crypto.randomUUID().substring(0, 8),
          date: Date.now()
        }]
      })),

      removeClosure: (id) => set((state) => ({
        closures: state.closures.filter(c => c.id !== id)
      }))
    }),
    {
      name: 'pos-finance-store',
    }
  )
);
