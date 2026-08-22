"use client";

import { useState } from "react";
import { useMenuStore, Product } from "@/lib/store/menuStore";
import { useCartStore } from "@/lib/store/cartStore";
import { toast } from "sonner";
import { Utensils, Sandwich, Beef, Drumstick, Pizza, Coffee, IceCream, Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const IconMap: Record<string, any> = {
  Utensils, Sandwich, Beef, Drumstick, Pizza, Coffee, IceCream
};

export default function MenuGrid({ onProductSelect }: { onProductSelect: (p: Product) => void }) {
  const { categories, products } = useMenuStore();
  const { addToCart } = useCartStore();
  const [activeCategory, setActiveCategory] = useState("c1");
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => {
    if (!p.active) return false;
    if (search.trim()) {
      return p.name.toLowerCase().includes(search.toLowerCase());
    }
    return p.categoryId === activeCategory;
  });

  const handleDoubleClick = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      cartId: Math.random().toString(36).substring(7),
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity: 1,
      modifiers: [],
      notes: "",
      totalPrice: product.price
    });
    toast.success("Agregado al carrito", { description: `1x ${product.name}` });
  };

  return (
    <div className="w-[65%] flex flex-col gap-4">
      {/* Categories and Search */}
      <div className="glass-panel p-4 rounded-3xl flex flex-col gap-4">
        
        <div className="flex gap-4 overflow-x-auto custom-scrollbar whitespace-nowrap snap-x">
          {categories.map(cat => {
            const Icon = IconMap[cat.iconName] || Utensils;
            const isActive = activeCategory === cat.id && !search;
            const productCount = products.filter(p => p.categoryId === cat.id && p.active).length;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                className={`snap-start flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl transition-all ${
                  isActive 
                    ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                    : "bg-slate-800/50 hover:bg-slate-700 text-slate-300"
                }`}
              >
                <Icon size={24} />
                <span className="font-medium text-lg">{cat.name}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-blue-400/30' : 'bg-slate-700/50'}`}>
                  {productCount}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos rápidamente..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-10 py-3 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="glass-panel p-6 rounded-3xl flex-1 overflow-y-auto custom-scrollbar grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-500">
            <Utensils size={48} className="opacity-30 mb-4" />
            <p className="text-lg font-medium">{search ? 'No se encontraron resultados' : 'No hay productos activos en esta categoría'}</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => onProductSelect(product)}
              onDoubleClick={(e) => handleDoubleClick(product, e)}
              className={`flex flex-col items-center text-center p-6 rounded-2xl border ${product.borderColor} ${product.color} hover:brightness-125 transition-all active:scale-95 shadow-sm group select-none`}
              title="Doble clic para agregar rápido sin modificadores"
            >
              <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mb-4 text-3xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                {product.emoji}
              </div>
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-slate-300 font-medium">{formatPrice(product.price)}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
