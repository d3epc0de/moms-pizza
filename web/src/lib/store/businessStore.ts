import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TableConfig {
  id: string;
  name: string;
  capacity: number;
  active: boolean;
}

export interface BusinessConfig {
  businessName: string;
  subtitle: string;
  address: string;
  phone: string;
  taxId: string; // NIT
  currency: string;
  taxRate: number; // Porcentaje (ej: 8 para 8%)
  taxLabel: string; // "Impoconsumo", "IVA", etc.
  showTaxOnScreen: boolean;
  tables: TableConfig[];
  receiptFooter: string;
  themeColor: string;
}

interface BusinessStore extends BusinessConfig {
  updateConfig: (updates: Partial<BusinessConfig>) => void;
  addTable: (table: Omit<TableConfig, 'id'>) => void;
  removeTable: (id: string) => void;
  updateTable: (id: string, updates: Partial<TableConfig>) => void;
  getActiveTables: () => TableConfig[];
}

const DEFAULT_CONFIG: BusinessConfig = {
  businessName: "Mom's Pizza",
  subtitle: "Restaurante & Pizzería",
  address: "",
  phone: "",
  taxId: "",
  currency: "COP",
  taxRate: 8, // Impoconsumo en Colombia para restaurantes
  taxLabel: "Impoconsumo",
  showTaxOnScreen: false, // Mom's Pizza trabaja precios con impuesto incluido
  tables: [
    { id: "t_barra1", name: "Barra 1", capacity: 2, active: true },
    { id: "t_barra2", name: "Barra 2", capacity: 2, active: true },
    { id: "t_barra3", name: "Barra 3", capacity: 2, active: true },
    { id: "t_mesa1", name: "Mesa 1", capacity: 4, active: true },
    { id: "t_mesa2", name: "Mesa 2", capacity: 4, active: true },
    { id: "t_mesa3", name: "Mesa 3", capacity: 4, active: true },
    { id: "t_mesa4", name: "Mesa 4", capacity: 4, active: true },
  ],
  receiptFooter: "¡Gracias por visitarnos! — Mom's Pizza",
  themeColor: "#3b82f6",
};

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_CONFIG,

      updateConfig: (updates) => set((state) => ({ ...state, ...updates })),

      addTable: (table) => set((state) => ({
        tables: [...state.tables, { ...table, id: "t_" + crypto.randomUUID().substring(0, 6) }]
      })),

      removeTable: (id) => set((state) => ({
        tables: state.tables.filter(t => t.id !== id)
      })),

      updateTable: (id, updates) => set((state) => ({
        tables: state.tables.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      getActiveTables: () => {
        return get().tables.filter(t => t.active);
      },
    }),
    {
      name: 'pos-business-config',
    }
  )
);
