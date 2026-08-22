import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmployeeRole = 'cajero' | 'mesero' | 'cocina' | 'admin';

export interface Employee {
  id: string;
  name: string;
  pin: string; // 4-digit PIN
  role: EmployeeRole;
  active: boolean;
}

interface EmployeeStore {
  employees: Employee[];
  currentEmployee: Employee | null;
  loginByPin: (pin: string) => Employee | null;
  logout: () => void;
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp_001', name: 'Administrador', pin: '0000', role: 'admin', active: true },
  { id: 'emp_002', name: 'Cajero 1', pin: '1111', role: 'cajero', active: true },
  { id: 'emp_003', name: 'Mesero 1', pin: '1234', role: 'mesero', active: true },
  { id: 'emp_004', name: 'Mesero 2', pin: '5678', role: 'mesero', active: true },
  { id: 'emp_005', name: 'Cocina 1', pin: '9999', role: 'cocina', active: true },
];

export const useEmployeeStore = create<EmployeeStore>()(
  persist(
    (set, get) => ({
      employees: DEFAULT_EMPLOYEES,
      currentEmployee: null,

      loginByPin: (pin: string) => {
        const employee = get().employees.find(e => e.pin === pin && e.active);
        if (employee) {
          set({ currentEmployee: employee });
          return employee;
        }
        return null;
      },

      logout: () => {
        set({ currentEmployee: null });
      },

      addEmployee: (employee) => set((state) => ({
        employees: [...state.employees, {
          ...employee,
          id: 'emp_' + crypto.randomUUID().substring(0, 6),
        }]
      })),

      updateEmployee: (id, updates) => set((state) => ({
        employees: state.employees.map(e => e.id === id ? { ...e, ...updates } : e)
      })),

      deleteEmployee: (id) => set((state) => ({
        employees: state.employees.filter(e => e.id !== id)
      })),
    }),
    {
      name: 'pos-employees',
    }
  )
);
