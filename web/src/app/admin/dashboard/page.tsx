"use client";

import { useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  DollarSign, CreditCard, Banknote, Landmark, Printer, Smartphone,
  Calculator, CheckCircle2, X, LogOut, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSubmittedOrdersStore } from "@/lib/store/submittedOrdersStore";
import { useEmployeeStore } from "@/lib/store/employeeStore";
import { useMenuStore } from "@/lib/store/menuStore";
import { useAuditStore } from "@/lib/store/auditStore";
import { useFinanceStore, ExpenseCategory, PaymentMethod } from "@/lib/store/financeStore";
import AuthGuard from "@/components/AuthGuard";
import { formatPrice, formatTime } from "@/lib/utils";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

export default function AdminDashboard() {
  const router = useRouter();
  const { orders } = useSubmittedOrdersStore();
  const { employees, currentEmployee, logout } = useEmployeeStore();
  const { categories } = useMenuStore();
  const { log: auditLog } = useAuditStore();
  const [cashoutModalOpen, setCashoutModalOpen] = useState(false);
  const [declaredCash, setDeclaredCash] = useState<string>("");
  const [cashoutResult, setCashoutResult] = useState<{diff: number, message: string} | null>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'closures'>('overview');
  const { expenses, closures, addExpense, addClosure } = useFinanceStore();

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Filter orders by date range and PAID status
  const filteredOrders = useMemo(() => {
    let start = new Date();
    let end = new Date();
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (dateFilter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (dateFilter === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (dateFilter === 'month') {
      start.setDate(start.getDate() - 30);
    } else if (dateFilter === 'custom') {
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
    }

    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end && o.paymentStatus === 'paid';
    });
  }, [orders, dateFilter, customStartDate, customEndDate]);

  // Filter expenses by the same date range
  const filteredExpenses = useMemo(() => {
    let start = new Date();
    let end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (dateFilter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (dateFilter === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (dateFilter === 'month') {
      start.setDate(start.getDate() - 30);
    } else if (dateFilter === 'custom') {
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
    }

    return expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, dateFilter, customStartDate, customEndDate]);

  // Daily summary from real data (Orders + Expenses)
  const dailySummary = useMemo(() => {
    const summary = { 
      total: 0, cash: 0, card: 0, nequi: 0, transfer: 0, orderCount: 0, discounts: 0,
      expensesTotal: 0, expensesCash: 0, expensesNequi: 0, netProfit: 0 
    };
    filteredOrders.forEach(o => {
      summary.total += o.totalAmount;
      summary.orderCount++;
      if (o.discount) summary.discounts += o.discount;
      switch (o.paymentMethod) {
        case 'cash': summary.cash += o.totalAmount; break;
        case 'card': summary.card += o.totalAmount; break;
        case 'nequi': summary.nequi += o.totalAmount; break;
        case 'transfer': summary.transfer += o.totalAmount; break;
      }
    });

    filteredExpenses.forEach(e => {
      summary.expensesTotal += e.amount;
      if (e.paymentMethod === 'cash') summary.expensesCash += e.amount;
      if (e.paymentMethod === 'nequi') summary.expensesNequi += e.amount;
    });

    summary.netProfit = summary.total - summary.expensesTotal;

    return summary;
  }, [filteredOrders, filteredExpenses]);

  const averageTicket = useMemo(() => {
    return dailySummary.orderCount > 0 ? dailySummary.total / dailySummary.orderCount : 0;
  }, [dailySummary]);

  // Top products from real data
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; sales: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!productMap[item.productId]) {
          productMap[item.productId] = { name: item.name, sales: 0, revenue: 0 };
        }
        productMap[item.productId].sales += item.quantity;
        productMap[item.productId].revenue += item.totalPrice;
      });
    });
    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredOrders]);

  // Category sales from real data
  const categorySales = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        // Find category from the productId prefix
        const catName = categories.find(c => {
          const menuStore = useMenuStore.getState();
          return menuStore.products.some(p => p.id === item.productId && p.categoryId === c.id);
        })?.name || 'Otros';
        catMap[catName] = (catMap[catName] || 0) + item.totalPrice;
      });
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredOrders, categories]);

  // Sales by waiter
  const salesByWaiter = useMemo(() => {
    const waiterMap: Record<string, { name: string; total: number; orders: number }> = {};
    filteredOrders.forEach(o => {
      if (!waiterMap[o.waiterId]) {
        waiterMap[o.waiterId] = { name: o.waiterName, total: 0, orders: 0 };
      }
      waiterMap[o.waiterId].total += o.totalAmount;
      waiterMap[o.waiterId].orders++;
    });
    return Object.values(waiterMap).sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  // Sales by hour
  const salesByHour = useMemo(() => {
    const hourMap: Record<string, number> = {};
    filteredOrders.forEach(o => {
      const date = new Date(o.createdAt);
      const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
      hourMap[hour] = (hourMap[hour] || 0) + o.totalAmount;
    });
    
    return Object.entries(hourMap)
      .map(([time, value]) => ({ time, value }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredOrders]);

  // Recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return filteredOrders.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  }, [filteredOrders]);

  const expectedCash = dailySummary.cash - dailySummary.expensesCash;

  const handleCashoutCalculation = () => {
    const declared = parseFloat(declaredCash) || 0;
    const diff = declared - expectedCash;
    
    let message = "Cuadre exacto. ✅";
    if (diff > 0) message = "Sobrante de caja.";
    if (diff < 0) message = "Descuadre (Faltante).";

    setCashoutResult({ diff, message });
  };

  const confirmCashout = () => {
    if (currentEmployee && cashoutResult) {
      auditLog('cashout_performed', currentEmployee.id, currentEmployee.name, 
        `Cierre de caja: Esperado=${formatPrice(expectedCash)}, Declarado=${formatPrice(parseFloat(declaredCash) || 0)}, Diferencia=${formatPrice(cashoutResult.diff)}`,
        { expectedCash, declaredCash: parseFloat(declaredCash) || 0, diff: cashoutResult.diff }
      );

      addClosure({
        totalSales: dailySummary.total,
        cashSales: dailySummary.cash,
        nequiSales: dailySummary.nequi,
        totalExpenses: dailySummary.expensesTotal,
        cashExpenses: dailySummary.expensesCash,
        expectedCash: expectedCash,
        declaredCash: parseFloat(declaredCash) || 0,
        difference: cashoutResult.diff,
        notes: cashoutResult.message,
        closedBy: currentEmployee.name
      });
      
      toast.success("Cierre de caja completado y guardado");
    }
    setCashoutModalOpen(false);
    setCashoutResult(null);
    setDeclaredCash("");
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
                <p className="text-xs text-slate-400">{currentEmployee?.name || 'Panel de Control'}</p>
             </div>
          </div>
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-700/50">
             <button className="px-5 py-2.5 rounded-lg bg-slate-700 text-white font-medium shadow transition-all" onClick={()=>router.push('/admin/dashboard')}>Dashboard Financiero</button>
             <button className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium" onClick={()=>router.push('/admin/products')}>Gestión de Menú</button>
             <button className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium" onClick={()=>router.push('/admin/settings')}>Configuración</button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={() => setCashoutModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Banknote size={20} />
            Cierre de Caja
          </button>
          
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Resumen Analítico
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Gestión de Gastos
          </button>
          <button
            onClick={() => setActiveTab('closures')}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'closures' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            Historial de Cierres
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {activeTab === 'overview' && (
          <>
            {/* Date Filter Controls */}
            <div className="glass-panel p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-lg">
          <div className="flex gap-2">
            {[
              { id: 'today', label: 'Hoy' },
              { id: 'yesterday', label: 'Ayer' },
              { id: 'week', label: 'Últimos 7 días' },
              { id: 'month', label: 'Últimos 30 días' },
              { id: 'custom', label: 'Personalizado' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setDateFilter(filter.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  dateFilter === filter.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500">hasta</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group col-span-2 border border-blue-500/20 hover:border-blue-400/40 transition-colors shadow-lg shadow-blue-900/20">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20 text-blue-400 rounded-xl shadow-inner"><DollarSign size={24} /></div>
              <div>
                <h3 className="text-slate-300 font-medium leading-tight">Total Ventas</h3>
                <p className="text-xs text-blue-400 font-bold">{dailySummary.orderCount} órdenes</p>
              </div>
            </div>
            <p className="text-3xl font-black text-white relative z-10 tracking-tight">{formatPrice(dailySummary.total)}</p>
            <div className="mt-2 text-sm text-slate-400 relative z-10">Ticket Promedio: <span className="font-bold text-slate-200">{formatPrice(averageTicket)}</span></div>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group lg:col-span-2 border border-emerald-500/20 hover:border-emerald-400/40 transition-colors shadow-lg shadow-emerald-900/20">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-inner"><Banknote size={24} /></div>
              <h3 className="text-slate-300 font-medium">Efectivo</h3>
            </div>
            <p className="text-3xl font-black text-white relative z-10 tracking-tight">{formatPrice(dailySummary.cash)}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group lg:col-span-2 border border-purple-500/20 hover:border-purple-400/40 transition-colors shadow-lg shadow-purple-900/20">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/20 text-purple-400 rounded-xl shadow-inner"><Smartphone size={24} /></div>
              <h3 className="text-slate-300 font-medium">Nequi/Daviplata</h3>
            </div>
            <p className="text-3xl font-black text-white relative z-10 tracking-tight">{formatPrice(dailySummary.nequi)}</p>
          </div>

          {/* New Financial Summary Cards */}
          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group bg-red-900/10 border-red-500/30 hover:border-red-400/50 transition-colors shadow-lg shadow-red-900/20 col-span-1 md:col-span-3">
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-400/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/20 text-red-400 rounded-xl shadow-inner"><Banknote size={24} /></div>
              <h3 className="text-slate-300 font-medium">Gastos Totales</h3>
            </div>
            <p className="text-3xl font-black text-red-400 relative z-10 tracking-tight">{formatPrice(dailySummary.expensesTotal)}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group bg-emerald-900/10 border-emerald-500/30 hover:border-emerald-400/50 transition-colors shadow-lg shadow-emerald-900/20 col-span-1 md:col-span-3">
            <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-all duration-500"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 text-emerald-400 rounded-xl shadow-inner"><Calculator size={24} /></div>
              <h3 className="text-slate-300 font-medium">Utilidad Neta <span className="text-sm font-normal text-slate-400 opacity-80">(Ingresos - Gastos)</span></h3>
            </div>
            <p className="text-3xl font-black text-emerald-400 relative z-10 tracking-tight">{formatPrice(dailySummary.netProfit)}</p>
          </div>

          {/* Sales by Hour Chart */}
          <div className="glass-panel p-6 rounded-3xl lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-6">Ventas por Hora</h3>
            <div className="h-72">
              {salesByHour.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <p>Sin datos para este período</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesByHour} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.4} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${value/1000}k`} 
                      dx={-10}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: '#334155', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      formatter={(value: any) => formatPrice(Number(value) || 0)}
                    />
                    <Bar dataKey="value" fill="url(#colorSales)" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Waiter stats + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">Top 5 Platos del Día</h3>
            <div className="h-72">
              {topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <p>Sin datos de ventas aún</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorPlates" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} opacity={0.4} />
                    <XAxis type="number" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={150} stroke="#cbd5e1" tickLine={false} axisLine={false} tick={{ fill: '#f8fafc', fontSize: 13 }} />
                    <RechartsTooltip 
                      cursor={{ fill: '#334155', opacity: 0.2 }}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                      itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="sales" fill="url(#colorPlates)" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6">Ingresos por Categoría</h3>
            <div className="h-72 flex flex-col">
              {categorySales.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <p>Sin datos de ventas aún</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorySales}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={6}
                          dataKey="value"
                          stroke="rgba(15, 23, 42, 0.8)"
                          strokeWidth={3}
                        >
                          {categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: any) => formatPrice(Number(value) || 0)}
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                    {categorySales.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                        <span className="text-slate-300 truncate font-medium" title={entry.name}>{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sales by waiter */}
          <div className="glass-panel p-6 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Users size={20} className="text-blue-400" /> Ventas por Mesero
            </h3>
            <div className="space-y-4">
              {salesByWaiter.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  <p>Sin datos de ventas aún</p>
                </div>
              ) : (
                salesByWaiter.map((w, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-black text-slate-600">#{i + 1}</span>
                      <div>
                        <p className="font-bold text-white">{w.name}</p>
                        <p className="text-xs text-slate-400">{w.orders} órdenes</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-emerald-400">{formatPrice(w.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="glass-panel p-6 rounded-3xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Historial de Transacciones</h3>
            <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Mostrando las últimas 10 del período ({dailySummary.orderCount} total)
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="py-4 px-4 font-medium"># Orden</th>
                  <th className="py-4 px-4 font-medium">Cliente</th>
                  <th className="py-4 px-4 font-medium">Fecha y Hora</th>
                  <th className="py-4 px-4 font-medium">Mesero</th>
                  <th className="py-4 px-4 font-medium">Método</th>
                  <th className="py-4 px-4 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No hay transacciones registradas en este período.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((tx) => {
                    const methodColors: Record<string, string> = {
                      cash: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      card: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                      nequi: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                      transfer: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    };
                    const methodNames: Record<string, string> = {
                      cash: 'Efectivo', card: 'Tarjeta', nequi: 'Nequi', transfer: 'Transferencia'
                    };
                    return (
                      <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 font-bold text-white">#{tx.orderNumber?.toString().padStart(3, '0')}</td>
                        <td className="py-4 px-4 text-slate-300">{tx.customerInfo}</td>
                        <td className="py-4 px-4 text-slate-300">
                          {format(new Date(tx.createdAt), "dd MMM yy, hh:mm a", { locale: es })}
                        </td>
                        <td className="py-4 px-4 text-slate-300">{tx.waiterName}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${methodColors[tx.paymentMethod || 'cash']}`}>
                            {methodNames[tx.paymentMethod || 'cash']}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-white">{formatPrice(tx.totalAmount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Registrar Nuevo Gasto</h3>
              <form 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                  const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value);
                  const category = (form.elements.namedItem('category') as HTMLSelectElement).value as ExpenseCategory;
                  const method = (form.elements.namedItem('method') as HTMLSelectElement).value as PaymentMethod;
                  
                  if (!desc || !amount || !currentEmployee) return;
                  
                  addExpense({
                    description: desc,
                    amount,
                    category,
                    paymentMethod: method,
                    employeeId: currentEmployee.id,
                    employeeName: currentEmployee.name
                  });
                  toast.success("Gasto registrado");
                  form.reset();
                }}
              >
                <div className="lg:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Descripción</label>
                  <input name="desc" type="text" required placeholder="Ej. Compra de queso..." className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoría</label>
                  <select name="category" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                    <option value="materia_prima">Materia Prima</option>
                    <option value="nomina">Pago a Empleados</option>
                    <option value="servicios">Servicios</option>
                    <option value="transporte">Transporte</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Monto (COP)</label>
                  <input name="amount" type="number" required min="1" placeholder="Ej. 50000" className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Método de Pago</label>
                  <select name="method" required className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                    <option value="cash">Efectivo (Caja)</option>
                    <option value="nequi">Nequi</option>
                  </select>
                </div>
                <div className="lg:col-span-5 flex justify-end">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95">Guardar Gasto</button>
                </div>
              </form>
            </div>

            <div className="glass-panel p-6 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Historial de Gastos ({filteredExpenses.length})</h3>
              <div className="overflow-x-auto custom-scrollbar pb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400">
                      <th className="py-4 px-4 font-medium">Fecha</th>
                      <th className="py-4 px-4 font-medium">Descripción</th>
                      <th className="py-4 px-4 font-medium">Categoría</th>
                      <th className="py-4 px-4 font-medium">Método</th>
                      <th className="py-4 px-4 font-medium">Registrado por</th>
                      <th className="py-4 px-4 font-medium text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">No hay gastos registrados en este período.</td></tr>
                    ) : (
                      filteredExpenses.sort((a,b)=>b.date - a.date).map((exp) => (
                        <tr key={exp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 px-4 text-slate-300">{format(new Date(exp.date), "dd MMM yy, hh:mm a", { locale: es })}</td>
                          <td className="py-4 px-4 font-medium text-white">{exp.description}</td>
                          <td className="py-4 px-4 text-slate-400 capitalize">{exp.category.replace('_', ' ')}</td>
                          <td className="py-4 px-4"><span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs border border-slate-700">{exp.paymentMethod}</span></td>
                          <td className="py-4 px-4 text-slate-400">{exp.employeeName}</td>
                          <td className="py-4 px-4 text-right font-bold text-red-400">- {formatPrice(exp.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CLOSURES TAB */}
        {activeTab === 'closures' && (
          <div className="glass-panel p-6 rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Historial de Cierres de Caja</h3>
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-sm">
                    <th className="py-4 px-4 font-medium">Fecha</th>
                    <th className="py-4 px-4 font-medium text-right">Ventas</th>
                    <th className="py-4 px-4 font-medium text-right">Gastos</th>
                    <th className="py-4 px-4 font-medium text-right">Efectivo Sistema</th>
                    <th className="py-4 px-4 font-medium text-right">Efectivo Declarado</th>
                    <th className="py-4 px-4 font-medium text-right">Descuadre</th>
                    <th className="py-4 px-4 font-medium">Cajero</th>
                  </tr>
                </thead>
                <tbody>
                  {closures.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-500">No hay cierres registrados.</td></tr>
                  ) : (
                    closures.sort((a,b)=>b.date - a.date).map((cls) => (
                      <tr key={cls.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-4 text-white font-medium">{format(new Date(cls.date), "dd MMM yy, hh:mm a", { locale: es })}</td>
                        <td className="py-4 px-4 text-right text-emerald-400">{formatPrice(cls.totalSales)}</td>
                        <td className="py-4 px-4 text-right text-red-400">- {formatPrice(cls.totalExpenses)}</td>
                        <td className="py-4 px-4 text-right text-slate-300">{formatPrice(cls.expectedCash)}</td>
                        <td className="py-4 px-4 text-right text-white font-bold">{formatPrice(cls.declaredCash)}</td>
                        <td className="py-4 px-4 text-right">
                          <span className={`px-3 py-1 rounded-lg font-bold text-xs ${cls.difference === 0 ? 'bg-emerald-500/20 text-emerald-400' : cls.difference > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                            {cls.difference === 0 ? 'Cuadre Perfecto' : formatPrice(cls.difference)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-sm">{cls.closedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* CASHOUT MODAL */}
      {cashoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-slate-600/50 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calculator size={24} className="text-emerald-400" />
                  Arqueo de Caja (Cierre Z)
                </h2>
                <p className="text-slate-400">Verifica el efectivo físico vs sistema</p>
              </div>
              <button onClick={() => {setCashoutModalOpen(false); setCashoutResult(null); setDeclaredCash("")}} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Ventas cobradas en Efectivo:</span>
                <span className="text-emerald-400 font-medium">{formatPrice(dailySummary.cash)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                <span className="text-slate-400">Gastos pagados en Efectivo:</span>
                <span className="text-red-400 font-medium">- {formatPrice(dailySummary.expensesCash)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-300 font-bold">Efectivo Esperado en Caja:</span>
                <span className="text-xl font-bold text-white">{formatPrice(expectedCash)}</span>
              </div>
            </div>

            {!cashoutResult ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Efectivo Físico Contado ($)</label>
                  <input
                    type="number"
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. 450000"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleCashoutCalculation}
                  disabled={!declaredCash}
                  className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4"
                >
                  Calcular Diferencia
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${
                  cashoutResult.diff === 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : cashoutResult.diff > 0 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  {cashoutResult.diff === 0 ? <CheckCircle2 size={32} className="mb-2" /> : <Calculator size={32} className="mb-2" />}
                  <p className="font-semibold text-lg">{cashoutResult.message}</p>
                  {cashoutResult.diff !== 0 && (
                    <p className="text-2xl font-bold mt-1">
                      {cashoutResult.diff > 0 ? '+' : ''}{formatPrice(cashoutResult.diff)}
                    </p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCashoutResult(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all"
                  >
                    Recalcular
                  </button>
                  <button
                    onClick={confirmCashout}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                  >
                    Confirmar Cierre
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    </AuthGuard>
  );
}
