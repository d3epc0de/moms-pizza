"use client";

import { useState } from "react";
import { X, CheckCircle2, Plus, Minus, MessageSquare } from "lucide-react";
import { useMenuStore, Product, Modifier } from "@/lib/store/menuStore";
import { useCartStore } from "@/lib/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function ModifierModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { modifiers, categories } = useMenuStore();
  const { addToCart } = useCartStore();
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Juice specific state
  const isJugoNatural = product.name.toLowerCase().includes('jugo');
  const isHit = product.name.toLowerCase().includes('hit');
  const isJugo = isJugoNatural || isHit;
  
  const naturalFlavors = Array.from(new Set(modifiers.filter(m => m.type === 'flavor').map(m => m.name)));
  const hitFlavors = Array.from(new Set(modifiers.filter(m => m.type === 'hit_flavor').map(m => m.name)));
  const activeJuiceFlavors = isHit ? hitFlavors : naturalFlavors;
  
  const [jugoFlavor, setJugoFlavor] = useState(activeJuiceFlavors.length > 0 ? activeJuiceFlavors[0] : "Mango");
  const [jugoBase, setJugoBase] = useState(product.name.toLowerCase().includes('leche') ? "Leche" : "Agua");

  // Malteada & Helado & Pizza Mixta specific state
  const isMalteada = product.name.toLowerCase().includes('malteada');
  const isHelado = product.name.toLowerCase().includes('helado') || product.name.toLowerCase().includes('revolc');
  const isIceCreamOrMilkshake = isMalteada || isHelado;
  
  const category = categories.find(c => c.id === product.categoryId);
  const isBebidaCategory = category?.name.toLowerCase().includes('bebida') || false;
  const isPizzaCategory = category?.name.toLowerCase().includes('pizza') || false;
  const isPizzaMixta = isPizzaCategory && product.name.toLowerCase().includes('mixta');

  const isMultiFlavor = product.name.toLowerCase().includes('copa') || product.name.toLowerCase().includes('revolc') || isPizzaMixta;
  const maxFlavors = isPizzaMixta ? 2 : (isMultiFlavor ? 3 : 1);
  
  const malteadaFlavors = Array.from(new Set(modifiers.filter(m => m.type === 'malteada_flavor').map(m => m.name)));
  const pizzaFlavors = Array.from(new Set(modifiers.filter(m => m.type === 'pizza_flavor').map(m => m.name)));
  
  const selectableFlavors = isPizzaMixta ? pizzaFlavors : malteadaFlavors;
  
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(
    isPizzaMixta ? [] : (malteadaFlavors.length > 0 ? [malteadaFlavors[0]] : [])
  );

  const toggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      if (selectedFlavors.length === 1 && !isMultiFlavor) return;
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      if (selectedFlavors.length < maxFlavors) {
        setSelectedFlavors([...selectedFlavors, flavor]);
      } else if (maxFlavors === 1) {
        setSelectedFlavors([flavor]);
      } else {
        toast.error(`Máximo ${maxFlavors} sabores`, { description: `Solo puedes seleccionar hasta ${maxFlavors} sabores para este producto.` });
      }
    }
  };

  const toggleModifier = (mod: Modifier) => {
    if (selectedModifiers.find(m => m.id === mod.id)) {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== mod.id));
    } else {
      setSelectedModifiers([...selectedModifiers, mod]);
    }
  };

  let customBasePrice = product.price;
  if (isJugoNatural) {
    customBasePrice = jugoBase === "Leche" ? 7000 : 6000;
  }

  const modsPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0);
  const unitTotal = customBasePrice + modsPrice;
  const lineTotal = unitTotal * quantity;

  const confirmModifiersAndAdd = () => {
    let finalName = product.name;
    if (isJugoNatural) {
      finalName = `Jugo de ${jugoFlavor} (en ${jugoBase.toLowerCase()})`;
    } else if (isHit) {
      finalName = `${product.name} (${jugoFlavor})`;
    } else if (isMalteada) {
      finalName = `Malteada de ${selectedFlavors[0] || 'Sabor'}`;
    } else if (isHelado) {
      finalName = `${product.name} (Sabores: ${selectedFlavors.length > 0 ? selectedFlavors.join(', ') : 'Ninguno'})`;
    } else if (isPizzaMixta && selectedFlavors.length > 0) {
      finalName = `${product.name} (${selectedFlavors.join(' / ')})`;
    }

    addToCart({
      cartId: crypto.randomUUID(),
      productId: product.id,
      name: finalName,
      basePrice: customBasePrice,
      quantity,
      modifiers: selectedModifiers,
      notes: notes.trim(),
      totalPrice: lineTotal
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md md:p-4 animate-in fade-in duration-200">
      <div className="glass-panel p-6 md:p-8 rounded-t-[2rem] md:rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600/50 animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
              {product.emoji} {product.name}
            </h2>
            <p className="text-slate-400 font-medium">Personaliza la orden</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors shadow-inner text-slate-300">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quantity Selector */}
        <div className="flex items-center justify-between bg-slate-800/60 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <span className="text-slate-300 font-medium text-lg">Cantidad</span>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-11 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors active:scale-95"
            >
              <Minus size={20} strokeWidth={3} />
            </button>
            <span className="text-3xl font-black text-white w-10 text-center tabular-nums">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors active:scale-95"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Modifiers or Custom Juice Selection */}
        {isJugo ? (
          <div className="space-y-5 mb-6">
            <div>
              <h3 className="text-white font-semibold mb-3">Sabor de {isHit ? 'Hit' : 'Jugo'}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {activeJuiceFlavors.length === 0 ? (
                  <div className="col-span-full text-slate-400 text-sm italic">No hay sabores disponibles</div>
                ) : (
                  activeJuiceFlavors.map(flavor => (
                    <button
                      key={flavor}
                      onClick={() => setJugoFlavor(flavor)}
                      className={`py-3 px-2 rounded-xl font-medium text-sm transition-all border flex items-center justify-center gap-2 ${
                        jugoFlavor === flavor
                          ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {flavor}
                    </button>
                  ))
                )}
              </div>
            </div>
            {isJugoNatural && (
              <div>
                <span className="text-slate-300 font-medium mb-3 block">Base</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setJugoBase('Agua')}
                    className={`p-3 rounded-xl font-bold transition-all border ${
                      jugoBase === 'Agua' 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    En Agua ($6.000)
                  </button>
                  <button
                    onClick={() => setJugoBase('Leche')}
                    className={`p-3 rounded-xl font-bold transition-all border ${
                      jugoBase === 'Leche' 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    En Leche ($7.000)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (isIceCreamOrMilkshake || isPizzaMixta) ? (
          <div className="space-y-5 mb-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">
                  {isPizzaMixta ? 'Sabores de la Pizza (Mitades)' : `Sabor de ${isMalteada ? 'Malteada' : 'Helado'}`}
                </h3>
                {isMultiFlavor && (
                  <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
                    Máx {maxFlavors}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                {selectableFlavors.length === 0 ? (
                  <div className="col-span-full text-slate-400 text-sm italic">No hay sabores disponibles</div>
                ) : (
                  selectableFlavors.map(flavor => (
                    <button
                      key={flavor}
                      onClick={() => toggleFlavor(flavor)}
                      className={`py-2 px-2 rounded-xl font-medium text-sm transition-all border flex items-center justify-center gap-1.5 ${
                        selectedFlavors.includes(flavor)
                          ? 'bg-purple-500 text-white border-purple-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isMultiFlavor && selectedFlavors.includes(flavor) && <CheckCircle2 size={16} />}
                      {flavor}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : isBebidaCategory ? null : (
          <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 mb-4 custom-scrollbar">
            {modifiers.filter(m => m.type === 'addition' || m.type === 'modifier').map(mod => {
              const isSelected = selectedModifiers.some(m => m.id === mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleModifier(mod)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    isSelected 
                      ? "bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                      : "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500'}`}>
                      {isSelected && <CheckCircle2 size={16} strokeWidth={3} />}
                    </div>
                    <span className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-slate-300'}`}>{mod.name}</span>
                  </div>
                  {mod.price > 0 && (
                    <span className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                      +{formatPrice(mod.price)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Notes toggle */}
        <button 
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium"
        >
          <MessageSquare size={16} />
          {showNotes ? "Ocultar notas" : "Agregar nota especial"}
        </button>

        {showNotes && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Sin tomate, bien cocida, extra picante..."
            className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-4 placeholder:text-slate-500 text-sm"
            rows={2}
          />
        )}

        {/* Total + Confirm */}
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-slate-400 font-medium">Total de línea:</span>
          <span className="text-2xl font-black text-emerald-400">{formatPrice(lineTotal)}</span>
        </div>

        <button
          onClick={confirmModifiersAndAdd}
          className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/25 text-lg tracking-wide"
        >
          Agregar {quantity > 1 ? `${quantity} unidades` : ''} al Pedido
        </button>
      </div>
    </div>
  );
}
