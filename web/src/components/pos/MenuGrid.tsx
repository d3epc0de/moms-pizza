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

export default function MenuGrid({ onProductSelect, isMobile }: { onProductSelect: (p: Product) => void, isMobile?: boolean }) {
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

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2 h-full">
        {/* Categories - horizontal scroll with compact pills */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 px-1 snap-x">
          {categories.map(cat => {
            const Icon = IconMap[cat.iconName] || Utensils;
            const isActive = activeCategory === cat.id && !search;
            return (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
                className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-sm ${
                  isActive 
                    ? "bg-blue-500 text-white shadow-md" 
                    : "bg-slate-800/50 text-slate-400"
                }`}
              >
                <Icon size={16} />
                <span className="font-medium">{cat.name}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-9 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Products grid - 3 columns, compact cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-20">
          <div className="grid grid-cols-3 gap-2">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                <Utensils size={36} className="opacity-30 mb-3" />
                <p className="text-sm font-medium">{search ? 'Sin resultados' : 'Sin productos'}</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => onProductSelect(product)}
                  onDoubleClick={(e) => handleDoubleClick(product, e)}
                  className={`flex flex-col items-center text-center p-3 rounded-xl border ${product.borderColor} ${product.color} active:scale-95 transition-all select-none`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center mb-2 text-xl border border-white/5">
                    {product.emoji}
                  </div>
                  <h3 className="font-semibold text-xs mb-0.5 leading-tight">{product.name}</h3>
                  <p className="text-slate-300 font-medium text-xs">{formatPrice(product.price)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (unchanged)
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
