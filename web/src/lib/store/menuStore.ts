import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Category {
  id: string;
  name: string;
  iconName: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  borderColor: string;
  active: boolean;
}

export interface Modifier {
  id: string;
  name: string;
  price: number;
  type: string;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: "c9", name: "Pizzas Personales", iconName: "Pizza" },
  { id: "c10", name: "Pizzas Medianas", iconName: "Pizza" },
  { id: "c11", name: "Pizzas Grandes", iconName: "Pizza" },
  { id: "c1", name: "Hamburguesas", iconName: "Utensils" },
  { id: "c2", name: "Salchipapas", iconName: "Utensils" },
  { id: "c3", name: "Sandwich", iconName: "Sandwich" },
  { id: "c4", name: "Picadas", iconName: "Beef" },
  { id: "c5", name: "Lasaña y Perro", iconName: "Utensils" },
  { id: "c6", name: "Alitas y Pollo", iconName: "Drumstick" },
  { id: "c7", name: "Carne de Cerdo", iconName: "Beef" },
  { id: "c8", name: "Canasta Patacón", iconName: "Utensils" },
  { id: "c12", name: "Bebidas", iconName: "Coffee" },
  { id: "c13", name: "Helados", iconName: "IceCream" },
];

const INITIAL_PRODUCTS: Product[] = [
  // 1. HAMBURGUESAS
  { id: "h1", categoryId: "c1", name: "Sencilla", price: 12000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "h2", categoryId: "c1", name: "Pollo sencilla", price: 14000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "h3", categoryId: "c1", name: "Mom's sencilla", price: 14000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "h4", categoryId: "c1", name: "Combo", price: 15000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "h5", categoryId: "c1", name: "Mom's combo", price: 18000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "h6", categoryId: "c1", name: "Pollo combo", price: 18000, emoji: "🍔", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },

  // 2. SALCHIPAPAS
  { id: "s1", categoryId: "c2", name: "Sencilla", price: 8000, emoji: "🍟", color: "bg-yellow-500/20", borderColor: "border-yellow-500/30", active: true },
  { id: "s2", categoryId: "c2", name: "Doble", price: 12000, emoji: "🍟", color: "bg-yellow-500/20", borderColor: "border-yellow-500/30", active: true },
  { id: "s3", categoryId: "c2", name: "Ranchera", price: 16000, emoji: "🍟", color: "bg-yellow-500/20", borderColor: "border-yellow-500/30", active: true },
  { id: "s4", categoryId: "c2", name: "Especial", price: 20000, emoji: "🍟", color: "bg-yellow-500/20", borderColor: "border-yellow-500/30", active: true },
  { id: "s5", categoryId: "c2", name: "Mixta", price: 22000, emoji: "🍟", color: "bg-yellow-500/20", borderColor: "border-yellow-500/30", active: true },

  // 3. SANDWICH
  { id: "sa1", categoryId: "c3", name: "Jamon y queso", price: 10000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },
  { id: "sa2", categoryId: "c3", name: "Hawaiano", price: 11000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },
  { id: "sa3", categoryId: "c3", name: "De pollo", price: 13000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },
  { id: "sa4", categoryId: "c3", name: "Pollo/champiñon", price: 15000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },
  { id: "sa5", categoryId: "c3", name: "Cubano", price: 15000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },
  { id: "sa6", categoryId: "c3", name: "Pollo apanado", price: 16000, emoji: "🥪", color: "bg-amber-500/20", borderColor: "border-amber-500/30", active: true },

  // 4. PICADAS
  { id: "pi1", categoryId: "c4", name: "Mazorcada", price: 22000, emoji: "🥩", color: "bg-red-500/20", borderColor: "border-red-500/30", active: true },
  { id: "pi2", categoryId: "c4", name: "Personal", price: 25000, emoji: "🥩", color: "bg-red-500/20", borderColor: "border-red-500/30", active: true },
  { id: "pi3", categoryId: "c4", name: "Boyacense", price: 35000, emoji: "🥩", color: "bg-red-500/20", borderColor: "border-red-500/30", active: true },

  // 5. LASAÑA Y COMIDAS RÁPIDAS
  { id: "l1", categoryId: "c5", name: "Lasaña", price: 15000, emoji: "🍝", color: "bg-orange-600/20", borderColor: "border-orange-600/30", active: true },
  { id: "l2", categoryId: "c5", name: "Hot dog", price: 10000, emoji: "🌭", color: "bg-orange-600/20", borderColor: "border-orange-600/30", active: true },

  // 6. ALITAS Y POLLO
  { id: "a1", categoryId: "c6", name: "Alitas BBQ", price: 16000, emoji: "🍗", color: "bg-amber-600/20", borderColor: "border-amber-600/30", active: true },
  { id: "a2", categoryId: "c6", name: "Alitas apanadas", price: 18000, emoji: "🍗", color: "bg-amber-600/20", borderColor: "border-amber-600/30", active: true },
  { id: "a3", categoryId: "c6", name: "Crispetas pollo", price: 16000, emoji: "🍗", color: "bg-amber-600/20", borderColor: "border-amber-600/30", active: true },
  { id: "a4", categoryId: "c6", name: "Pollo agridulce", price: 17000, emoji: "🍗", color: "bg-amber-600/20", borderColor: "border-amber-600/30", active: true },
  { id: "a5", categoryId: "c6", name: "Chuleta pollo", price: 18000, emoji: "🍗", color: "bg-amber-600/20", borderColor: "border-amber-600/30", active: true },

  // 7. CARNE DE CERDO
  { id: "ce1", categoryId: "c7", name: "A la plancha", price: 20000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },
  { id: "ce2", categoryId: "c7", name: "Chuleta de cerdo", price: 20000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },
  { id: "ce3", categoryId: "c7", name: "Costillas BBQ", price: 18000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },
  { id: "ce4", categoryId: "c7", name: "Cerdo agridulce", price: 17000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },
  { id: "ce5", categoryId: "c7", name: "Costilla ahumada", price: 18000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },
  { id: "ce6", categoryId: "c7", name: "Panceta", price: 20000, emoji: "🥓", color: "bg-red-600/20", borderColor: "border-red-600/30", active: true },

  // 8. CANASTA DE PATACON
  { id: "pa1", categoryId: "c8", name: "Con pollo", price: 13000, emoji: "🌮", color: "bg-yellow-600/20", borderColor: "border-yellow-600/30", active: true },
  { id: "pa2", categoryId: "c8", name: "Con res", price: 14000, emoji: "🌮", color: "bg-yellow-600/20", borderColor: "border-yellow-600/30", active: true },
  { id: "pa3", categoryId: "c8", name: "Con panceta", price: 16000, emoji: "🌮", color: "bg-yellow-600/20", borderColor: "border-yellow-600/30", active: true },
  { id: "pa4", categoryId: "c8", name: "Con todo", price: 18000, emoji: "🌮", color: "bg-yellow-600/20", borderColor: "border-yellow-600/30", active: true },

  // 9. PIZZAS PERSONALES
  { id: "pz1_p", categoryId: "c9", name: "Hawaiana", price: 14000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz2_p", categoryId: "c9", name: "Napolitana", price: 14000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz3_p", categoryId: "c9", name: "Chorizo vela", price: 15000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz4_p", categoryId: "c9", name: "Salami", price: 15000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz5_p", categoryId: "c9", name: "Peperoni", price: 15000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz6_p", categoryId: "c9", name: "Pollo/maicitos", price: 16000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz7_p", categoryId: "c9", name: "Pollo/champiñon", price: 16000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz8_p", categoryId: "c9", name: "Carne", price: 17000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz9_p", categoryId: "c9", name: "Mixta", price: 17000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz10_p", categoryId: "c9", name: "Pollo/cham/mai", price: 17000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },

  // 10. PIZZAS MEDIANAS
  { id: "pz1_m", categoryId: "c10", name: "Hawaiana", price: 30000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz2_m", categoryId: "c10", name: "Napolitana", price: 30000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz3_m", categoryId: "c10", name: "Chorizo vela", price: 32000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz4_m", categoryId: "c10", name: "Salami", price: 32000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz5_m", categoryId: "c10", name: "Peperoni", price: 32000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz6_m", categoryId: "c10", name: "Pollo/maicitos", price: 33000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz7_m", categoryId: "c10", name: "Pollo/champiñon", price: 34000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz8_m", categoryId: "c10", name: "Carne", price: 36000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz9_m", categoryId: "c10", name: "Mixta", price: 36000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz10_m", categoryId: "c10", name: "Pollo/cham/mai", price: 36000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },

  // 11. PIZZAS GRANDES
  { id: "pz1_g", categoryId: "c11", name: "Hawaiana", price: 40000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz2_g", categoryId: "c11", name: "Napolitana", price: 40000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz3_g", categoryId: "c11", name: "Chorizo vela", price: 42000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz4_g", categoryId: "c11", name: "Salami", price: 42000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz5_g", categoryId: "c11", name: "Peperoni", price: 42000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz6_g", categoryId: "c11", name: "Pollo/maicitos", price: 43000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz7_g", categoryId: "c11", name: "Pollo/champiñon", price: 43000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz8_g", categoryId: "c11", name: "Carne", price: 46000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz9_g", categoryId: "c11", name: "Mixta", price: 46000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },
  { id: "pz10_g", categoryId: "c11", name: "Pollo/cham/mai", price: 46000, emoji: "🍕", color: "bg-orange-500/20", borderColor: "border-orange-500/30", active: true },

  // 12. BEBIDAS
  { id: "b1", categoryId: "c12", name: "Jugos en agua", price: 6000, emoji: "🧃", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b2", categoryId: "c12", name: "Jugos en leche", price: 7000, emoji: "🥛", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b3", categoryId: "c12", name: "Milo frio", price: 7000, emoji: "🧋", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b4", categoryId: "c12", name: "Limonada", price: 5000, emoji: "🍋", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b5", categoryId: "c12", name: "Avena cubana (P)", price: 6000, emoji: "🥛", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b6", categoryId: "c12", name: "Avena cubana (G)", price: 9000, emoji: "🥛", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b7", categoryId: "c12", name: "Malteada", price: 10000, emoji: "🥤", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b8", categoryId: "c12", name: "Michelada budweiser", price: 5000, emoji: "🍺", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },
  { id: "b9", categoryId: "c12", name: "Michelada poker", price: 6000, emoji: "🍺", color: "bg-blue-500/20", borderColor: "border-blue-500/30", active: true },

  // 13. HELADOS
  { id: "he1", categoryId: "c13", name: "Cono de helado", price: 4000, emoji: "🍦", color: "bg-pink-500/20", borderColor: "border-pink-500/30", active: true },
  { id: "he2", categoryId: "c13", name: "Copa de helado", price: 8000, emoji: "🍨", color: "bg-pink-500/20", borderColor: "border-pink-500/30", active: true },
  { id: "he3", categoryId: "c13", name: "Brownie con helado", price: 8000, emoji: "🥧", color: "bg-pink-500/20", borderColor: "border-pink-500/30", active: true },
  { id: "he4", categoryId: "c13", name: "Revolcon", price: 10000, emoji: "🍨", color: "bg-pink-500/20", borderColor: "border-pink-500/30", active: true },
];

const INITIAL_MODIFIERS: Modifier[] = [
  { id: "ad1", name: "Papas a la francesa", price: 5000, type: "addition" },
  { id: "ad2", name: "Queso", price: 4000, type: "addition" },
  { id: "ad3", name: "Champiñon", price: 4000, type: "addition" },
  { id: "ad4", name: "Pollo", price: 4000, type: "addition" },
  { id: "ad5", name: "Maicitos", price: 4000, type: "addition" },
  { id: "m1", name: "Sin Cebolla", price: 0, type: "modifier" },
  { id: "m2", name: "Sin Salsas", price: 0, type: "modifier" },
  { id: "f1", name: "Mango", price: 0, type: "flavor" },
  { id: "f2", name: "Mora", price: 0, type: "flavor" },
  { id: "f3", name: "Fresa", price: 0, type: "flavor" },
  { id: "f4", name: "Guanabana", price: 0, type: "flavor" },
  { id: "mf1", name: "Chocolate", price: 0, type: "malteada_flavor" },
  { id: "mf2", name: "Vainilla", price: 0, type: "malteada_flavor" },
  { id: "mf3", name: "Fresa", price: 0, type: "malteada_flavor" },
  { id: "mf4", name: "Oreo", price: 0, type: "malteada_flavor" },
  { id: "hf1", name: "Mora", price: 0, type: "hit_flavor" },
  { id: "hf2", name: "Mango", price: 0, type: "hit_flavor" },
  { id: "hf3", name: "Lulo", price: 0, type: "hit_flavor" },
  { id: "hf4", name: "Tropical", price: 0, type: "hit_flavor" },
  { id: "pf1", name: "Hawaiana", price: 0, type: "pizza_flavor" },
  { id: "pf2", name: "Napolitana", price: 0, type: "pizza_flavor" },
  { id: "pf3", name: "Salami", price: 0, type: "pizza_flavor" },
  { id: "pf4", name: "Peperoni", price: 0, type: "pizza_flavor" },
  { id: "pf5", name: "Pollo/Champiñon", price: 0, type: "pizza_flavor" },
  { id: "pf6", name: "Carne", price: 0, type: "pizza_flavor" },
  { id: "pf7", name: "Pollo/Maicitos", price: 0, type: "pizza_flavor" },
];

interface MenuStore {
  categories: Category[];
  products: Product[];
  modifiers: Modifier[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductActive: (id: string) => void;
  addModifier: (modifier: Omit<Modifier, 'id'>) => void;
  deleteModifier: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  setCategories: (categories: Category[]) => void;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set) => ({
      categories: INITIAL_CATEGORIES,
      products: INITIAL_PRODUCTS,
      modifiers: INITIAL_MODIFIERS,
      
      addProduct: (product) => set((state) => ({
        products: [...state.products, { ...product, id: "p_" + crypto.randomUUID().substring(0, 6) }]
      })),

      updateProduct: (id, updatedFields) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...updatedFields } : p)
      })),

      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),

      toggleProductActive: (id) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, active: !p.active } : p)
      })),

      addModifier: (modifier) => set((state) => ({
        modifiers: [...state.modifiers, { ...modifier, id: "mod_" + crypto.randomUUID().substring(0, 6) }]
      })),

      deleteModifier: (id) => set((state) => ({
        modifiers: state.modifiers.filter(m => m.id !== id)
      })),

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: "c_" + crypto.randomUUID().substring(0, 6) }]
      })),

      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      setCategories: (categories) => set({ categories }),
    }),
    {
      name: 'pos-menu-store',
    }
  )
);
