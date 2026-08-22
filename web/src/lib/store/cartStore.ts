import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Modifier, useMenuStore } from './menuStore';

export interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  basePrice: number;
  quantity: number;
  modifiers: Modifier[];
  notes: string;
  totalPrice: number;
}

interface CartStore {
  cart: CartItem[];
  orderType: "here" | "to_go";
  customerInfo: string;
  setOrderType: (type: "here" | "to_go") => void;
  setCustomerInfo: (info: string) => void;
  addToCart: (item: CartItem) => void;
  updateCartItemQuantity: (cartId: string, delta: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  setCart: (cart: CartItem[]) => void;
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: [],
      orderType: "here",
      customerInfo: "",
      setOrderType: (type) => set((state) => {
        if (state.orderType === type) return { orderType: type, customerInfo: "" };
        const menuStore = useMenuStore.getState();
        const newCart = state.cart.map(item => {
          const product = menuStore.products.find(p => p.id === item.productId);
          if (!product) return item;
          const needsPackaging = (product.categoryId === 'c2' || product.categoryId === 'c4' || product.categoryId === 'c8' || product.categoryId === 'c7' || product.categoryId === 'c6' || product.categoryId === 'c13' || (product.categoryId === 'c1' && product.name.toLowerCase().includes('combo')));
          if (!needsPackaging) return item;

          let newModifiers = [...item.modifiers];
          if (type === "to_go") {
            if (!newModifiers.some(m => m.name === "Empaque desechable")) {
              newModifiers.push({ id: "pkg", name: "Empaque desechable", price: 500, type: "packaging" });
            }
          } else {
            newModifiers = newModifiers.filter(m => m.name !== "Empaque desechable");
          }

          const modifiersPrice = newModifiers.reduce((sum, m) => sum + m.price, 0);
          return {
            ...item,
            modifiers: newModifiers,
            totalPrice: (item.basePrice + modifiersPrice) * item.quantity
          };
        });

        return { orderType: type, customerInfo: "", cart: newCart };
      }),
      setCustomerInfo: (info) => set({ customerInfo: info }),
      addToCart: (item) => set((state) => {
        const menuStore = useMenuStore.getState();
        const product = menuStore.products.find(p => p.id === item.productId);
        let finalItem = { ...item };
        
        if (product && state.orderType === "to_go") {
          const needsPackaging = (product.categoryId === 'c2' || product.categoryId === 'c4' || product.categoryId === 'c8' || product.categoryId === 'c7' || product.categoryId === 'c6' || product.categoryId === 'c13' || (product.categoryId === 'c1' && product.name.toLowerCase().includes('combo')));
          if (needsPackaging && !finalItem.modifiers.some(m => m.name === "Empaque desechable")) {
            finalItem.modifiers = [...finalItem.modifiers, { id: "pkg", name: "Empaque desechable", price: 500, type: "packaging" }];
            const modifiersPrice = finalItem.modifiers.reduce((sum, m) => sum + m.price, 0);
            finalItem.totalPrice = (finalItem.basePrice + modifiersPrice) * finalItem.quantity;
          }
        }
        return { cart: [...state.cart, finalItem] };
      }),
      updateCartItemQuantity: (cartId, delta) => set((state) => {
        const updated = state.cart.map(item => {
          if (item.cartId !== cartId) return item;
          const newQty = Math.max(1, item.quantity + delta);
          const modifiersPrice = item.modifiers.reduce((sum, m) => sum + m.price, 0);
          return {
            ...item,
            quantity: newQty,
            totalPrice: (item.basePrice + modifiersPrice) * newQty,
          };
        });
        return { cart: updated };
      }),
      removeFromCart: (cartId) => set((state) => ({ cart: state.cart.filter(i => i.cartId !== cartId) })),
      clearCart: () => set({ cart: [], activeOrderId: null, customerInfo: "" }),
      setCart: (cart) => set({ cart }),
      activeOrderId: null,
      setActiveOrderId: (id) => set({ activeOrderId: id })
    }),
    {
      name: 'pos-cart-storage',
    }
  )
);
