"use client";

import { useState } from "react";
import { Calculator, LogOut, Save, Plus, Trash2, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBusinessStore, TableConfig } from "@/lib/store/businessStore";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { useAuditStore } from "@/lib/store/auditStore";
import AuthGuard from "@/components/AuthGuard";

export default function Settings() {
  const router = useRouter();
  const { businessName, subtitle, taxRate, receiptFooter, tables, updateConfig, addTable, removeTable, updateTable } = useBusinessStore();
  const { currentEmployee, logout } = useEmployeeStore();
  const { log: auditLog } = useAuditStore();
  
  // Local state for the config form
  const [formName, setFormName] = useState(businessName);
  const [formSubtitle, setFormSubtitle] = useState(subtitle);
  const [formTaxRate, setFormTaxRate] = useState(taxRate.toString());
  const [formFooter, setFormFooter] = useState(receiptFooter);
  
  // Local state for tables
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("4");

  const handleSaveConfig = () => {
    updateConfig({
      businessName: formName,
      subtitle: formSubtitle,
      taxRate: parseFloat(formTaxRate) || 0,
      receiptFooter: formFooter,
    });
    
    toast.success("Configuración guardada", { description: "Los cambios se aplicarán en todo el sistema." });
    if (currentEmployee) {
      auditLog('config_changed', currentEmployee.id, currentEmployee.name, `Actualizó configuración del negocio`);
    }
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;
    
    addTable({
      name: newTableName,
      capacity: parseInt(newTableCapacity) || 4,
      active: true,
    });
    
    setNewTableName("");
    toast.success("Mesa agregada", { description: newTableName });
  };

  const handleDeleteTable = (id: string, name: string) => {
    if (confirm(`¿Eliminar la mesa "${name}"?`)) {
      removeTable(id);
      toast.error("Mesa eliminada");
    }
  };

  const handleToggleTable = (id: string, active: boolean) => {
    updateTable(id, { active: !active });
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <AuthGuard allowedRoles={['admin']} redirectTo="/admin/login">
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 relative z-10 overflow-y-auto custom-scrollbar">
      
      {/* Header NavBar */}
      <div className="flex justify-between items-center mb-8 max-w-7xl mx-auto bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50 shadow-lg">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400"><Calculator size={24} /></div>
             <div>
                <h1 className="text-2xl font-bold text-white leading-tight">Admin Central</h1>
                <p className="text-xs text-slate-400">Panel de Control</p>
             </div>
          </div>
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
             <button className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium" onClick={()=>router.push('/admin/dashboard')}>Dashboard Financiero</button>
             <button className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium" onClick={()=>router.push('/admin/products')}>Gestión de Menú</button>
             <button className="px-5 py-2.5 rounded-lg bg-slate-700 text-white font-medium shadow transition-all" onClick={()=>router.push('/admin/settings')}>Configuración</button>
          </div>
        </div>
        
        <div className="flex gap-4">          
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* BUSINESS INFO */}
        <div className="glass-panel p-8 rounded-3xl h-fit border border-slate-700/50 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700/50">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Store size={24} /></div>
            <div>
              <h2 className="text-xl font-bold text-white">Información del Negocio</h2>
              <p className="text-sm text-slate-400">Datos mostrados en el sistema y recibos</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre Comercial</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej. Mom's Pizza"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subtítulo / Lema</label>
              <input
                type="text"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej. Restaurante & Pizzería"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Porcentaje de Impuesto / Impoconsumo (%)</label>
              <input
                type="number"
                step="0.1"
                value={formTaxRate}
                onChange={(e) => setFormTaxRate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="Ej. 8"
              />
              <p className="text-xs text-slate-500 mt-1">Este valor se desglosará en el recibo impreso. Usa 0 si no aplicas impuestos.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mensaje al pie del recibo</label>
              <textarea
                value={formFooter}
                onChange={(e) => setFormFooter(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                placeholder="¡Gracias por visitarnos!"
              />
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-4 flex justify-center gap-2"
            >
              <Save size={20} />
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* TABLES MANAGEMENT */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col h-full max-h-[800px]">
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-700/50 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Mesas y Barras</h2>
              <p className="text-sm text-slate-400">Zonas de consumo para los clientes</p>
            </div>
            <span className="bg-slate-800 text-slate-300 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-700">
              Total: {tables.length}
            </span>
          </div>

          <form onSubmit={handleAddTable} className="flex gap-3 mb-6 shrink-0">
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Nombre de mesa (ej. Mesa 5)"
              required
            />
            <button
              type="submit"
              disabled={!newTableName.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center shrink-0"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="overflow-y-auto custom-scrollbar flex-1 -mx-4 px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tables.map(table => (
                <div key={table.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  table.active ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/50 border-slate-800/50 opacity-60'
                }`}>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleToggleTable(table.id, table.active)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        table.active ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                      }`}
                    />
                    <div>
                      <p className={`font-bold ${table.active ? 'text-white' : 'text-slate-400'}`}>{table.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTable(table.id, table.name)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            {tables.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p className="mb-2">No hay mesas configuradas.</p>
                <p className="text-sm">Agrega tu primera mesa usando el formulario de arriba.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </AuthGuard>
  );
}
