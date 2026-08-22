"use client";

import { useState, useEffect } from "react";
import MenuGrid from "@/components/pos/MenuGrid";
import CartPanel from "@/components/pos/CartPanel";
import ModifierModal from "@/components/pos/ModifierModal";
import CheckoutModal from "@/components/pos/CheckoutModal";
import ActiveOrdersGrid from "@/components/pos/ActiveOrdersGrid";
import AuthGuard from "@/components/AuthGuard";
import { Product, useMenuStore } from "@/lib/store/menuStore";
import { useCartStore } from "@/lib/store/cartStore";
import { ShoppingCart } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export type ViewMode = 'menu' | 'orders';

export default function PosDashboard() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const { categories, updateCategory, products, updateProduct, modifiers, addModifier, deleteModifier, setCategories } = useMenuStore();
  const cart = useCartStore(s => s.cart);
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Migration for category renaming and fixing product colors
  useEffect(() => {
    // 1. Rename category
    const oldCat = categories.find(c => c.name === "Lasaña y Rápidas");
    if (oldCat) {
      updateCategory(oldCat.id, { name: "Lasaña y Perro" });
    }

    // 2. Fix product colors for products with default or missing colors
    const categoryColors: Record<string, { bg: string, border: string }> = {
      "Lasaña y Perro": { bg: "bg-red-500/20", border: "border-red-500/30" },
      "Alitas y Pollo": { bg: "bg-amber-500/20", border: "border-amber-500/30" },
      "Carne de Cerdo": { bg: "bg-rose-500/20", border: "border-rose-500/30" },
      "Canasta Patacón": { bg: "bg-lime-500/20", border: "border-lime-500/30" },
      "Bebidas": { bg: "bg-cyan-500/20", border: "border-cyan-500/30" },
      "Helados": { bg: "bg-fuchsia-500/20", border: "border-fuchsia-500/30" },
    };

    products.forEach(prod => {
      const cat = categories.find(c => c.id === prod.categoryId);
      
      if (cat && categoryColors[cat.name]) {
        const targetColor = categoryColors[cat.name].bg;
        const targetBorder = categoryColors[cat.name].border;
        if (prod.color !== targetColor || prod.borderColor !== targetBorder) {
          updateProduct(prod.id, { color: targetColor, borderColor: targetBorder });
        }
      } 
      else if (!prod.color || prod.color === 'bg-slate-500/20' || prod.color === 'bg-slate-800' || prod.color === 'bg-slate-900') {
        const validPeer = products.find(p => p.categoryId === prod.categoryId && p.color && p.color !== 'bg-slate-500/20' && p.color !== 'bg-slate-800' && p.color !== 'bg-slate-900');
        if (validPeer) {
          updateProduct(prod.id, { color: validPeer.color, borderColor: validPeer.borderColor });
        }
      }
    });

    // 3. Add default pizza flavors if none exist
    const currentPizzaFlavors = modifiers.filter(m => m.type === 'pizza_flavor');
    if (currentPizzaFlavors.length === 0) {
      const defaultPizzaFlavors = [
        "Hawaiana", "Napolitana", "Chorizo vela", "Salami", "Peperoni", 
        "Pollo/maicitos", "Pollo/champiñon", "Carne", "Pollo/cham/mai"
      ];
      defaultPizzaFlavors.forEach(flavor => {
        addModifier({ name: flavor, price: 0, type: 'pizza_flavor' });
      });
    }

    // 4. Deduplicate pizza flavors (fixes the React StrictMode double-mount issue)
    const uniqueNames = new Set<string>();
    const toDelete: string[] = [];
    modifiers.filter(m => m.type === 'pizza_flavor').forEach(m => {
      if (uniqueNames.has(m.name)) {
        toDelete.push(m.id);
      } else {
        uniqueNames.add(m.name);
      }
    });
    
    if (toDelete.length > 0) {
      toDelete.forEach(id => deleteModifier(id));
    }

    // 5. Reorder categories so Pizzas are first
    if (categories.length > 0) {
      const firstCat = categories[0];
      const hasPizzaFirst = firstCat.name.toLowerCase().includes('pizza');
      const hasAnyPizza = categories.some(c => c.name.toLowerCase().includes('pizza'));
      
      if (!hasPizzaFirst && hasAnyPizza) {
        const pizzas = categories.filter(c => c.name.toLowerCase().includes('pizza'));
        const others = categories.filter(c => !c.name.toLowerCase().includes('pizza'));
        setCategories([...pizzas, ...others]);
      }
    }
  }, [categories, updateCategory, products, updateProduct, modifiers, addModifier, deleteModifier, setCategories]);

  return (
    <AuthGuard allowedRoles={['cajero', 'mesero', 'admin']}>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen overflow-hidden p-4 gap-4 relative z-10 text-slate-200">
        {viewMode === 'menu' ? (
          <MenuGrid onProductSelect={setSelectedProduct} />
        ) : (
          <ActiveOrdersGrid 
            onCheckout={() => setCheckoutModalOpen(true)} 
            onAddItems={() => setViewMode('menu')} 
          />
        )}
        <CartPanel 
          onCheckout={() => setCheckoutModalOpen(true)} 
          viewMode={viewMode}
          onToggleView={(mode) => setViewMode(mode)}
        />
      </div>

      {/* Mobile Layout */}
      <div className="flex md:hidden flex-col h-screen overflow-hidden relative z-10 text-slate-200">
        <div className="flex-1 overflow-hidden p-2 pb-0">
          {mobileCartOpen ? (
            <div className="h-full flex flex-col">
              <CartPanel 
                onCheckout={() => setCheckoutModalOpen(true)} 
                viewMode={viewMode}
                onToggleView={(mode) => setViewMode(mode)}
                isMobile={true}
                onMobileClose={() => setMobileCartOpen(false)}
              />
            </div>
          ) : viewMode === 'menu' ? (
            <MenuGrid onProductSelect={setSelectedProduct} isMobile={true} />
          ) : (
            <ActiveOrdersGrid 
              onCheckout={() => setCheckoutModalOpen(true)} 
              onAddItems={() => setViewMode('menu')} 
            />
          )}
        </div>

        {/* Floating Cart Button */}
        {!mobileCartOpen && (
          <button
            onClick={() => setMobileCartOpen(true)}
            className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-2xl shadow-2xl shadow-blue-500/30 flex items-center gap-3 active:scale-95 transition-all border border-blue-400/30"
          >
            <ShoppingCart size={22} />
            {cart.length > 0 ? (
              <>
                <span className="font-bold text-sm">{formatPrice(total)}</span>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </>
            ) : (
              <span className="font-medium text-sm">Comanda</span>
            )}
          </button>
        )}
      </div>

      {/* MODAL: Modifiers */}
      {selectedProduct && (
        <ModifierModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* MODAL: Checkout */}
      {checkoutModalOpen && (
        <CheckoutModal 
          onClose={() => setCheckoutModalOpen(false)} 
        />
      )}
    </AuthGuard>
  );
}
