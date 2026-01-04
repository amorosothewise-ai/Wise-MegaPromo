import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, BrainCircuit, BarChart3, Gem, Calendar, ArrowUpRight, ArrowDownRight, Minus, ClipboardCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Components
import { StatsCard } from './components/StatsCard';
import { SalesTable } from './components/SalesTable';
import { CommissionsTable } from './components/CommissionsTable';

// Logic
import { AppState, DiamondSale, MonthlyCommission, ViewMode } from './types';
import { INITIAL_SALES, INITIAL_COMMISSIONS, calculateSaleMetrics, MONTHS, FACTORS } from './constants';
import { generateBusinessInsights } from './services/geminiService';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  
  // Initialize state with lazy initializer to read from localStorage first
  const [sales, setSales] = useState<DiamondSale[]>(() => {
    const saved = localStorage.getItem('diamond_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [commissions, setCommissions] = useState<MonthlyCommission[]>(() => {
    const saved = localStorage.getItem('diamond_commissions');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Migration: Add year if missing (for legacy data)
            return parsed.map((c: any) => ({
                ...c,
                year: c.year || new Date().getFullYear()
            }));
        } catch (e) {
            console.error("Failed to parse commissions", e);
            return INITIAL_COMMISSIONS;
        }
    }
    return INITIAL_COMMISSIONS;
  });
  
  // Insight State
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('diamond_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('diamond_commissions', JSON.stringify(commissions));
  }, [commissions]);

  // Computed Metrics
  const totalSalesNetProfit = sales.reduce((acc, sale) => acc + calculateSaleMetrics(sale).lucroLiquido, 0);
  const totalCommissions = commissions.reduce((acc, comm) => acc + comm.commissionValue, 0);
  const totalRevenue = totalSalesNetProfit + totalCommissions;
  const totalQty = sales.reduce((acc, sale) => acc + sale.quantity, 0);

  // Sorting Helper: Sort sales by date (descending)
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Volume & Comparison Analysis Logic ---
  
  // 1. Annual Volume & Growth
  const annualVolumeMap = sales.reduce((acc, sale) => {
    const year = new Date(sale.date).getFullYear();
    acc[year] = (acc[year] || 0) + sale.quantity;
    return acc;
  }, {} as Record<number, number>);

  // Sort Descending (2025, 2024...)
  const annualVolumeData = Object.entries(annualVolumeMap)
    .map(([year, qty]) => ({ year: Number(year), qty }))
    .sort((a, b) => b.year - a.year);

  // Add Growth Comparison (Year over Year)
  const annualComparison = annualVolumeData.map((item, index, arr) => {
      const prevYearItem = arr[index + 1]; // Because it's sorted DESC, the next item is previous year
      let growth = 0;
      let hasPrev = false;
      
      if (prevYearItem && prevYearItem.qty > 0) {
          growth = ((item.qty - prevYearItem.qty) / prevYearItem.qty) * 100;
          hasPrev = true;
      }
      return { ...item, growth, hasPrev };
  });

  // 2. Monthly Volume & Growth (Current Year)
  const currentYear = new Date().getFullYear();
  const monthlyVolumeData = MONTHS.map((monthName, index) => {
      const totalQtyInMonth = sales
        .filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === currentYear && d.getMonth() === index;
        })
        .reduce((sum, s) => sum + s.quantity, 0);
      
      return { name: monthName, qty: totalQtyInMonth };
  });

  // Add Monthly Comparison (Month over Month)
  const monthlyComparison = monthlyVolumeData.map((item, index, arr) => {
      const prevMonthItem = arr[index - 1];
      let growth = 0;
      let hasPrev = false;

      // Only calculate growth if previous month exists and we have data
      if (prevMonthItem && index > 0) {
          if (prevMonthItem.qty > 0) {
            growth = ((item.qty - prevMonthItem.qty) / prevMonthItem.qty) * 100;
            hasPrev = true;
          } else if (item.qty > 0) {
             // If prev was 0 and now we have sales, it's 100% "new" growth effectively
             growth = 100; 
             hasPrev = true;
          }
      }
      return { ...item, growth, hasPrev };
  });

  // --- RECONCILIATION LOGIC (New Feature) ---
  // Calculates: Commission Received - (Quantity Sold * 30)
  const reconciliationData = (() => {
      const data: Record<string, { year: number, monthIndex: number, monthName: string, totalQty: number, totalDebt: number, totalCommission: number }> = {};

      // 1. Process Sales for Debt Calculation
      sales.forEach(sale => {
          const d = new Date(sale.date);
          const year = d.getFullYear();
          const monthIndex = d.getMonth();
          const key = `${year}-${monthIndex}`;

          if (!data[key]) {
              data[key] = { year, monthIndex, monthName: MONTHS[monthIndex], totalQty: 0, totalDebt: 0, totalCommission: 0 };
          }
          data[key].totalQty += sale.quantity;
          data[key].totalDebt += sale.quantity * FACTORS.DIVIDA_REPOR; // 30 * Qty
      });

      // 2. Process Commissions
      commissions.forEach(comm => {
          const monthIndex = MONTHS.indexOf(comm.month);
          if (monthIndex === -1) return;
          const key = `${comm.year}-${monthIndex}`;

          if (!data[key]) {
             data[key] = { year: comm.year, monthIndex, monthName: MONTHS[monthIndex], totalQty: 0, totalDebt: 0, totalCommission: 0 };
          }
          data[key].totalCommission += comm.commissionValue;
      });

      // 3. Convert to Array and Sort Descending
      return Object.values(data)
        .map(item => ({
            ...item,
            finalBalance: item.totalCommission - item.totalDebt
        }))
        .sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.monthIndex - a.monthIndex;
        });
  })();


  const handleAddSale = (newSale: Omit<DiamondSale, 'id'>) => {
    setSales(prev => [...prev, { ...newSale, id: generateId() }]);
  };

  const handleDeleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  };

  const handleAddCommission = (newComm: Omit<MonthlyCommission, 'id'>) => {
    setCommissions(prev => [...prev, { ...newComm, id: generateId() }]);
  };

  const handleDeleteCommission = (id: string) => {
    setCommissions(prev => prev.filter(c => c.id !== id));
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    const result = await generateBusinessInsights({ sales, commissions });
    setInsight(result);
    setIsGeneratingInsight(false);
  };

  // Prepare Chart Data (Aggregate by Date & Sort Ascending for Chart)
  const chartData = sales.reduce((acc: any[], sale) => {
    const existing = acc.find(item => item.date === sale.date);
    const metrics = calculateSaleMetrics(sale);
    if (existing) {
      existing.profit += metrics.lucroLiquido;
    } else {
      acc.push({ date: sale.date, profit: metrics.lucroLiquido });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Helper component for Growth Badge
  const GrowthBadge = ({ value, hasPrev }: { value: number, hasPrev: boolean }) => {
      if (!hasPrev) return <span className="text-slate-400 text-xs">-</span>;
      if (value === 0) return <span className="text-slate-400 text-xs flex items-center gap-1"><Minus size={12}/> 0%</span>;
      
      const isPositive = value > 0;
      return (
          <span className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(value).toFixed(1)}%
          </span>
      );
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-blue-900 text-blue-100 flex-shrink-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-red-600 p-2 rounded-lg shadow-lg shadow-red-900/50">
             <Gem size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Wise <span className="text-red-400">MegaPromo</span></span>
        </div>

        <nav className="px-4 py-6 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'hover:bg-blue-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setView('sales')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'sales' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'hover:bg-blue-800 hover:text-white'}`}
          >
            <TrendingUp size={20} />
            <span className="font-medium">Vendas Diamantes</span>
          </button>

          <button 
            onClick={() => setView('commissions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'commissions' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'hover:bg-blue-800 hover:text-white'}`}
          >
            <Wallet size={20} />
            <span className="font-medium">Comissões Mensais</span>
          </button>
        </nav>

        <div className="mt-auto p-6 border-t border-blue-800">
           <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700">
              <h4 className="text-xs font-semibold text-blue-300 uppercase mb-2">Total Net Profit</h4>
              <p className="text-2xl font-bold text-white">{totalSalesNetProfit.toLocaleString()} MZN</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
           <h1 className="text-xl font-semibold text-slate-800 capitalize">{view === 'dashboard' ? 'Overview' : view.replace('-', ' ')}</h1>
           <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden sm:inline">Welcome back, Admin</span>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold border border-red-200">
                W
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* View: Dashboard */}
          {view === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard 
                  title="Lucro Líquido (Vendas)" 
                  value={`${totalSalesNetProfit.toLocaleString()} MZN`} 
                  icon={TrendingUp} 
                  color="green" 
                />
                <StatsCard 
                  title="Total Comissões" 
                  value={`${totalCommissions.toLocaleString()} MZN`} 
                  icon={Wallet} 
                  color="blue" 
                />
                <StatsCard 
                  title="Total Earnings" 
                  value={`${totalRevenue.toLocaleString()} MZN`} 
                  icon={DollarSign} 
                  color="red" 
                  trend="+12% vs last month"
                />
                <StatsCard 
                  title="Total Diamonds Sold" 
                  value={totalQty.toString()} 
                  icon={Gem} 
                  color="orange" 
                />
              </div>

              {/* RECONCILIATION TABLE (New Feature) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex items-center justify-between">
                       <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                           <ClipboardCheck size={20} className="text-emerald-600"/>
                           Fechamento Mensal (Reconciliação)
                       </h3>
                       <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-medium">Comissão - Dívida (30*N)</span>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                           <thead className="bg-slate-50 text-slate-500 font-medium">
                               <tr>
                                   <th className="px-6 py-3">Período</th>
                                   <th className="px-6 py-3 text-right">Qtd Vendida</th>
                                   <th className="px-6 py-3 text-right">Dívida Repor <span className="text-xs font-normal">({FACTORS.DIVIDA_REPOR}*N)</span></th>
                                   <th className="px-6 py-3 text-right">Comissões Recebidas</th>
                                   <th className="px-6 py-3 text-right">Saldo Final</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {reconciliationData.length > 0 ? (
                                   reconciliationData.map((row) => (
                                       <tr key={`${row.year}-${row.monthIndex}`} className="hover:bg-slate-50/50">
                                           <td className="px-6 py-3 font-medium text-slate-700">
                                               {row.monthName} {row.year}
                                           </td>
                                           <td className="px-6 py-3 text-right text-slate-600">{row.totalQty}</td>
                                           <td className="px-6 py-3 text-right text-red-500 font-medium">
                                               - {row.totalDebt.toLocaleString()} MZN
                                           </td>
                                           <td className="px-6 py-3 text-right text-blue-600 font-medium">
                                               + {row.totalCommission.toLocaleString()} MZN
                                           </td>
                                           <td className="px-6 py-3 text-right">
                                               <span className={`px-3 py-1 rounded-full font-bold text-xs ${row.finalBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                   {row.finalBalance.toLocaleString()} MZN
                                               </span>
                                           </td>
                                       </tr>
                                   ))
                               ) : (
                                   <tr>
                                       <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                           Sem dados suficientes para reconciliação.
                                       </td>
                                   </tr>
                               )}
                           </tbody>
                       </table>
                   </div>
              </div>


              {/* COMPARISON SECTION */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Annual Comparison */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                      <div className="p-5 border-b border-slate-100 bg-blue-50/50">
                          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                              <Calendar size={18} className="text-blue-600"/>
                              Comparativo Anual
                          </h3>
                      </div>
                      <div className="overflow-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Ano</th>
                                    <th className="px-6 py-3 text-right">Qtd</th>
                                    <th className="px-6 py-3 text-right">Vs Ano Ant.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {annualComparison.length > 0 ? (
                                    annualComparison.map((item) => (
                                        <tr key={item.year} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-medium text-slate-700">{item.year}</td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-800">{item.qty}</td>
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end">
                                                    <GrowthBadge value={item.growth} hasPrev={item.hasPrev} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">Sem dados.</td></tr>
                                )}
                            </tbody>
                        </table>
                      </div>
                  </div>

                  {/* Monthly Comparison (Chart + Detailed Table) */}
                  <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                       <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800">Comparativo Mensal ({currentYear})</h3>
                                <p className="text-sm text-slate-500">Evolução de vendas mês a mês</p>
                            </div>
                            <Gem size={20} className="text-blue-200" />
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           {/* Chart */}
                           <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyComparison}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#64748b', fontSize: 10}} 
                                            interval={0}
                                        />
                                        <Tooltip 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Bar dataKey="qty" radius={[4, 4, 0, 0]} barSize={24}>
                                            {monthlyComparison.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.qty > 0 ? '#1e40af' : '#e2e8f0'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                           </div>

                           {/* Detailed MoM Table */}
                           <div className="overflow-y-auto max-h-64 border border-slate-100 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2">Mês</th>
                                            <th className="px-4 py-2 text-right">Qtd</th>
                                            <th className="px-4 py-2 text-right">Vs Mês Ant.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {monthlyComparison.map((item) => (
                                            <tr key={item.name} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 text-slate-600 text-xs font-medium uppercase">{item.name}</td>
                                                <td className="px-4 py-2 text-right font-bold text-slate-800">{item.qty}</td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="flex justify-end">
                                                        <GrowthBadge value={item.growth} hasPrev={item.hasPrev} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           </div>
                       </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Tendência de Lucro</h3>
                        <p className="text-sm text-slate-500">Lucro Líquido diário (Vendas Diamantes)</p>
                    </div>
                    <BarChart3 className="text-slate-300" />
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12}} 
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="profit" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Insights Section */}
                <div className="bg-gradient-to-br from-blue-800 to-red-700 rounded-xl p-6 text-white flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <BrainCircuit size={20} className="text-white" />
                        </div>
                        <h3 className="font-semibold text-lg">AI Smart Analyst</h3>
                    </div>

                    <div className="flex-1 bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm text-sm leading-relaxed border border-white/10 min-h-[160px]">
                        {isGeneratingInsight ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-white animate-pulse">
                                <BrainCircuit className="animate-spin" />
                                <span>Analyzing financial data...</span>
                            </div>
                        ) : insight ? (
                            <p>{insight}</p>
                        ) : (
                            <p className="text-blue-100 text-center mt-10">Click below to generate a professional analysis of your sales performance.</p>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateInsight}
                        disabled={isGeneratingInsight}
                        className="w-full py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors shadow-lg z-10 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isGeneratingInsight ? 'Processing...' : 'Generate Report'}
                    </button>
                </div>
              </div>
              
              {/* Recent Tables (Preview) - Uses Sorted Data */}
              <div className="grid grid-cols-1 gap-8">
                  <SalesTable sales={sortedSales.slice(0, 5)} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} />
              </div>
            </>
          )}

          {/* View: Sales - Uses Sorted Data */}
          {view === 'sales' && (
             <SalesTable sales={sortedSales} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} />
          )}

          {/* View: Commissions */}
          {view === 'commissions' && (
             <CommissionsTable commissions={commissions} onAddCommission={handleAddCommission} onDeleteCommission={handleDeleteCommission} />
          )}
          
        </div>
      </main>
    </div>
  );
};

export default App;