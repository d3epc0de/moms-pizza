"use client";

import { useState } from "react";
import { 
  Calculator, LogOut, Plus, Edit2, Trash2, Search, X, CheckCircle2, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMenuStore, Product, Category, Modifier } from "@/lib/store/menuStore";
import { useEmployeeStore, Employee } from "@/lib/store/employeeStore";
import { useAuditStore } from "@/lib/store/auditStore";
import AuthGuard from "@/components/AuthGuard";
import { formatPrice } from "@/lib/utils";

type ActiveTab = 'products' | 'employees' | 'modifiers';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  mesero: 'Mesero',
  cocina: 'Cocina',
};

export default function ProductManagement() {
  const router = useRouter();
  const { categories, products, modifiers, addProduct, updateProduct, deleteProduct, toggleProductActive, addModifier, deleteModifier } = useMenuStore();
  const { employees, addEmployee, updateEmployee, deleteEmployee, logout, currentEmployee } = useEmployeeStore();
  const { log: auditLog } = useAuditStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  
  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("c1");
  const [formPrice, setFormPrice] = useState("");
  const [formEmoji, setFormEmoji] = useState("🆕");

  // Employee Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState("");
  const [empPin, setEmpPin] = useState("");
  const [empRole, setEmpRole] = useState<Employee['role']>("mesero");

  // Modifier Modal State
  const [isModModalOpen, setIsModModalOpen] = useState(false);
  const [modName, setModName] = useState("");
  const [modPrice, setModPrice] = useState("");
  const [modType, setModType] = useState<'addition' | 'modifier' | 'flavor' | 'malteada_flavor' | 'hit_flavor' | 'pizza_flavor'>('addition');

  const getCategoryName = (catId: string) => categories.find((c: Category) => c.id === catId)?.name || "Sin Categoría";

  // Product handlers
  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormName(product.name);
      setFormCategory(product.categoryId);
      setFormPrice(product.price.toString());
      setFormEmoji(product.emoji || "🆕");
    } else {
      setEditingProduct(null);
      setFormName("");
      setFormCategory("c1");
      setFormPrice("");
      setFormEmoji("🆕");
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formName || !formPrice) return;
    
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formName,
        categoryId: formCategory,
        price: parseInt(formPrice),
        emoji: formEmoji || "🆕"
      });
      toast.success("Producto actualizado", { description: formName + " se actualizó correctamente." });
      if (currentEmployee) auditLog('price_changed', currentEmployee.id, currentEmployee.name, `Producto actualizado: ${formName}`);
    } else {
      const categoryProducts = products.filter(p => p.categoryId === formCategory);
      const color = categoryProducts.length > 0 ? categoryProducts[0].color : "bg-slate-500/20";
      const borderColor = categoryProducts.length > 0 ? categoryProducts[0].borderColor : "border-slate-500/30";

      addProduct({
        categoryId: formCategory,
        name: formName,
        price: parseInt(formPrice),
        active: true,
        emoji: formEmoji || "🆕",
        color,
        borderColor
      });
      toast.success("Producto creado", { description: formName + " fue añadido al menú." });
      if (currentEmployee) auditLog('product_created', currentEmployee.id, currentEmployee.name, `Nuevo producto: ${formName} — ${formatPrice(parseInt(formPrice))}`);
    }
    
    setIsModalOpen(false);
  };

  const toggleActive = (id: string) => {
    toggleProductActive(id);
    const p = products.find(prod => prod.id === id);
    if(p) {
      toast.info(p.active ? "Producto Desactivado" : "Producto Activado", { description: p.name });
      if (currentEmployee) auditLog('product_toggled', currentEmployee.id, currentEmployee.name, `${p.name}: ${p.active ? 'desactivado' : 'activado'}`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) {
      const p = products.find(prod => prod.id === id);
      deleteProduct(id);
      toast.error("Producto eliminado");
      if (currentEmployee && p) auditLog('product_deleted', currentEmployee.id, currentEmployee.name, `Producto eliminado: ${p.name}`);
    }
  };

  // Employee handlers
  const handleOpenEmpModal = (emp: Employee | null = null) => {
    if (emp) {
      setEditingEmployee(emp);
      setEmpName(emp.name);
      setEmpPin(emp.pin);
      setEmpRole(emp.role);
    } else {
      setEditingEmployee(null);
      setEmpName("");
      setEmpPin("");
      setEmpRole("mesero");
    }
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = () => {
    if (!empName || !empPin || empPin.length !== 4) {
      toast.error("Error", { description: "Nombre y PIN de 4 dígitos son requeridos." });
      return;
    }

    // Check PIN uniqueness
    const pinExists = employees.some(e => e.pin === empPin && e.id !== editingEmployee?.id);
    if (pinExists) {
      toast.error("PIN duplicado", { description: "Otro empleado ya tiene este PIN. Usa uno diferente." });
      return;
    }

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, { name: empName, pin: empPin, role: empRole });
      toast.success("Empleado actualizado", { description: empName });
      if (currentEmployee) auditLog('config_changed', currentEmployee.id, currentEmployee.name, `Empleado actualizado: ${empName}`);
    } else {
      addEmployee({ name: empName, pin: empPin, role: empRole, active: true });
      toast.success("Empleado creado", { description: `${empName} — PIN: ${empPin}` });
      if (currentEmployee) auditLog('employee_created', currentEmployee.id, currentEmployee.name, `Nuevo empleado: ${empName} (${ROLE_LABELS[empRole]})`);
    }
    setIsEmpModalOpen(false);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm("¿Eliminar este empleado?")) {
      const emp = employees.find(e => e.id === id);
      deleteEmployee(id);
      toast.error("Empleado eliminado");
      if (currentEmployee && emp) auditLog('employee_deleted', currentEmployee.id, currentEmployee.name, `Empleado eliminado: ${emp.name}`);
    }
  };

  // Modifier handlers
  const handleSaveModifier = () => {
    if (!modName.trim()) {
      toast.error("Error", { description: "El nombre del modificador es requerido." });
      return;
    }
    addModifier({ name: modName, price: parseInt(modPrice) || 0, type: modType });
    toast.success("Modificador creado", { description: modName });
    setIsModModalOpen(false);
    setModName("");
    setModPrice("");
    setModType('addition');
  };

  const handleDeleteModifier = (id: string) => {
    if (confirm("¿Eliminar este modificador?")) {
      deleteModifier(id);
      toast.error("Modificador eliminado");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    getCategoryName(p.categoryId).toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/admin/login">
    <div className="min-h-screen bg-slate-900 text-slate-200 p-3 md:p-6 relative z-10 overflow-y-auto custom-scrollbar">
      
      {/* Header NavBar */}
      <div className="flex flex-col gap-3 mb-6 md:mb-8 max-w-7xl mx-auto bg-slate-800/50 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-700/50 shadow-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3">
             <div className="bg-emerald-500/20 p-2 md:p-3 rounded-xl text-emerald-400"><Calculator size={20} /></div>
             <div>
                <h1 className="text-lg md:text-2xl font-bold text-white leading-tight">Admin Central</h1>
                <p className="text-xs text-slate-400">Panel de Control</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 md:px-5 py-2 md:py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-sm"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
           <button className="flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm" onClick={()=>router.push('/admin/dashboard')}>Dashboard</button>
           <button className="flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-lg bg-slate-700 text-white font-medium shadow transition-all text-sm" onClick={()=>router.push('/admin/products')}>Menú</button>
           <button className="flex-shrink-0 px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium text-sm" onClick={()=>router.push('/admin/settings')}>Configuración</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Sub-tabs: Products vs Employees */}
        <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto custom-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-shrink-0 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Productos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-shrink-0 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm md:text-base ${activeTab === 'employees' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <Users size={16} /> Empleados ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('modifiers')}
            className={`flex-shrink-0 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base ${activeTab === 'modifiers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Modificadores ({modifiers.length})
          </button>
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o categoría..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <button 
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95 text-sm md:text-base flex-shrink-0"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Agregar</span> Producto
              </button>
            </div>

            <div className="space-y-8">
              {categories.filter(c => filteredProducts.some(p => p.categoryId === c.id)).map(category => (
                <div key={category.id} className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                  <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">{category.name}</h3>
                    <span className="bg-slate-900 text-slate-400 font-bold px-3 py-1 rounded-lg text-sm border border-slate-700/50">
                      {filteredProducts.filter(p => p.categoryId === category.id).length} productos
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/40 border-b border-slate-700/50">
                        <th className="py-3 px-6 text-slate-400 font-medium text-sm">Nombre del Producto</th>
                        <th className="py-3 px-6 text-slate-400 font-medium text-sm text-right">Precio COP</th>
                        <th className="py-3 px-6 text-slate-400 font-medium text-sm text-center">Estado</th>
                        <th className="py-3 px-6 text-slate-400 font-medium text-sm text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.filter(p => p.categoryId === category.id).map(p => (
                        <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-6 font-semibold text-white">{p.emoji} {p.name}</td>
                          <td className="py-4 px-6 text-right font-bold text-emerald-400">{formatPrice(p.price)}</td>
                          <td className="py-4 px-6 text-center">
                            <button 
                              onClick={() => toggleActive(p.id)}
                              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                p.active 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                              }`}
                            >
                              {p.active ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleOpenModal(p)}
                                className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(p.id)}
                                className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="glass-panel rounded-3xl p-12 text-center text-slate-500 font-medium border border-slate-700/50">
                  No se encontraron productos con esos criterios de búsqueda.
                </div>
              )}
            </div>
          </>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === 'employees' && (
          <>
            <div className="flex justify-end mb-6">
              <button 
                onClick={() => handleOpenEmpModal()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus size={20} />
                Agregar Empleado
              </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700">
                    <th className="py-4 px-6 text-slate-400 font-medium">Nombre</th>
                    <th className="py-4 px-6 text-slate-400 font-medium">PIN</th>
                    <th className="py-4 px-6 text-slate-400 font-medium">Rol</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-center">Estado</th>
                    <th className="py-4 px-6 text-slate-400 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-white">{emp.name}</td>
                      <td className="py-4 px-6 font-mono text-lg text-blue-400 tracking-widest">{emp.pin}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                          emp.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                          emp.role === 'cocina' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          emp.role === 'cajero' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {ROLE_LABELS[emp.role] || emp.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                          emp.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}>
                          {emp.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEmpModal(emp)}
                            className="p-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id)}
                            className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                        No se encontraron empleados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* MODIFIERS TAB */}
        {activeTab === 'modifiers' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-400">Administra los adicionales, modificaciones y sabores de bebidas disponibles para los productos.</p>
              <button 
                onClick={() => setIsModModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus size={20} />
                Agregar Modificador
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Adicionales (con precio) */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Adicionales (con precio)</h3>
                  <p className="text-sm text-slate-400">Se suman al precio del producto</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'addition').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <div>
                        <span className="font-semibold text-white">{mod.name}</span>
                        <span className="ml-3 text-emerald-400 font-bold">+{formatPrice(mod.price)}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'addition').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">No hay adicionales configurados</div>
                  )}
                </div>
              </div>

              {/* Modificaciones (sin precio) */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Modificaciones (sin costo)</h3>
                  <p className="text-sm text-slate-400">Instrucciones especiales sin costo extra</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'modifier').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-white">{mod.name}</span>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'modifier').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">No hay modificaciones configuradas</div>
                  )}
                </div>
              </div>

              {/* Sabores de Jugos */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Sabores de Jugos</h3>
                  <p className="text-sm text-slate-400">Sabores disponibles para bebidas</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'flavor').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-white">{mod.name}</span>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'flavor').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">No hay sabores configurados</div>
                  )}
                </div>
              </div>

              {/* Sabores de Malteadas */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Sabores de Malteadas</h3>
                  <p className="text-sm text-slate-400">Sabores disponibles para malteadas</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'malteada_flavor').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-white">{mod.name}</span>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'malteada_flavor').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">No hay sabores configurados</div>
                  )}
                </div>
              </div>

              {/* Sabores de Hit */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Sabores de Jugos Hit</h3>
                  <p className="text-sm text-slate-400">Sabores disponibles para Hit</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'hit_flavor').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-white">{mod.name}</span>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'hit_flavor').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500">No hay sabores configurados</div>
                  )}
                </div>
              </div>

              {/* Sabores de Pizzas */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
                <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white">Sabores de Pizzas</h3>
                  <p className="text-sm text-slate-400">Opciones disponibles para pizzas mixtas</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {modifiers.filter(m => m.type === 'pizza_flavor').map(mod => (
                    <div key={mod.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors">
                      <span className="font-semibold text-white">{mod.name}</span>
                      <button 
                        onClick={() => handleDeleteModifier(mod.id)}
                        className="p-2 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg transition-colors shadow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {modifiers.filter(m => m.type === 'pizza_flavor').length === 0 && (
                    <div className="px-6 py-8 text-center text-slate-500 col-span-full">No hay sabores configurados</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* PRODUCT CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-600/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Producto</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Ej. Hamburguesa Doble"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Icono (Emoji)</label>
                <input
                  type="text"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="🆕"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Precio de Venta (COP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold">$</div>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-8 pr-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="15000"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!formName || !formPrice}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEE CRUD MODAL */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-600/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h2>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre completo</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">PIN de acceso (4 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={empPin}
                  onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-2xl tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(ROLE_LABELS) as [Employee['role'], string][]).map(([role, label]) => (
                    <button
                      key={role}
                      onClick={() => setEmpRole(role)}
                      className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                        empRole === role
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveEmployee}
                disabled={!empName || empPin.length !== 4}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {editingEmployee ? 'Guardar Cambios' : 'Crear Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFIER CRUD MODAL */}
      {isModModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-600/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">Nuevo Modificador</h2>
              <button onClick={() => setIsModModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tipo</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={() => setModType('addition')}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'addition' ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Adicional
                  </button>
                  <button
                    onClick={() => { setModType('modifier'); setModPrice("0"); }}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'modifier' ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Modificación
                  </button>
                  <button
                    onClick={() => { setModType('flavor'); setModPrice("0"); }}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'flavor' ? 'bg-orange-600 text-white border-orange-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Sabor Natural
                  </button>
                  <button
                    onClick={() => { setModType('malteada_flavor'); setModPrice("0"); }}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'malteada_flavor' ? 'bg-purple-600 text-white border-purple-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Sabor Malteada
                  </button>
                  <button
                    onClick={() => { setModType('hit_flavor'); setModPrice("0"); }}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'hit_flavor' ? 'bg-rose-600 text-white border-rose-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Sabor Hit
                  </button>
                  <button
                    onClick={() => { setModType('pizza_flavor'); setModPrice("0"); }}
                    className={`py-3 rounded-xl font-medium text-sm transition-all border ${
                      modType === 'pizza_flavor' ? 'bg-red-600 text-white border-red-500 shadow-lg' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Sabor Pizza
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre</label>
                <input
                  type="text"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder={modType === 'addition' ? "Ej. Papas a la francesa" : (modType === 'flavor' || modType === 'malteada_flavor' || modType === 'hit_flavor' || modType === 'pizza_flavor') ? "Ej. Hawaiana" : "Ej. Sin cebolla"}
                  autoFocus
                />
              </div>

              {modType === 'addition' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Precio (COP)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold">$</div>
                    <input
                      type="number"
                      value={modPrice}
                      onChange={(e) => setModPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 pl-8 pr-4 text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="5000"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveModifier}
                disabled={!modName.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4 flex justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Crear Modificador
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}
