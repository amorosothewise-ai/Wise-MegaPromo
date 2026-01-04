import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, BrainCircuit, BarChart3, Gem, Calendar, ArrowUpRight, ArrowDownRight, Minus, ClipboardCheck, Users, PieChart, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Components
import { StatsCard } from './components/StatsCard';
import { SalesTable } from './components/SalesTable';
import { CommissionsTable } from './components/CommissionsTable';

// Logic
import { AppState, DiamondSale, MonthlyCommission, ViewMode, Language } from './types';
import { INITIAL_SALES, INITIAL_COMMISSIONS, calculateSaleMetrics, MONTHS, FACTORS } from './constants';
import { generateBusinessInsights } from './services/geminiService';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substr(2, 9);

// Translations
const TRANSLATIONS = {
  pt: {
    dashboard: 'Dashboard (Mês Atual)',
    sales: 'Vendas Diamantes',
    commissions: 'Comissões Mensais',
    summary: 'Total Geral',
    welcome: 'Bem-vindo',
    netProfit: 'Lucro Líquido (Vendas)',
    totalCommissions: 'Total Comissões',
    totalEarnings: 'Ganhos Totais',
    totalDiamonds: 'Diamantes Vendidos',
    trend: 'vs mês anterior',
    monthlyClosure: 'Fechamento Mensal & Divisão',
    balanceCalc: 'Saldo = Comissão - Dívida',
    partners: 'Sócios 40/60',
    period: 'Período',
    qty: 'Qtd',
    debt: 'Dívida',
    balance: 'Saldo Final',
    partner40: 'Sócio (40%)',
    partner60: 'Sócio (60%)',
    annualComp: 'Comparativo Anual',
    monthlyComp: 'Comparativo Mensal',
    profitTrend: 'Tendência de Lucro',
    aiAnalyst: 'Analista Inteligente AI',
    genReport: 'Gerar Relatório',
    processing: 'Processando...',
    clickToGen: 'Clique abaixo para gerar uma análise profissional.',
    noData: 'Sem dados suficientes.',
    currentMonth: 'Resumo do Mês Atual',
    allTime: 'Resumo Histórico Geral',
    salesTrend: 'Vendas Diárias (Mês Atual)'
  },
  en: {
    dashboard: 'Dashboard (Current Month)',
    sales: 'Diamond Sales',
    commissions: 'Monthly Commissions',
    summary: 'General Summary',
    welcome: 'Welcome back',
    netProfit: 'Net Profit (Sales)',
    totalCommissions: 'Total Commissions',
    totalEarnings: 'Total Earnings',
    totalDiamonds: 'Diamonds Sold',
    trend: 'vs last month',
    monthlyClosure: 'Monthly Closure & Split',
    balanceCalc: 'Balance = Commission - Debt',
    partners: 'Partners 40/60',
    period: 'Period',
    qty: 'Qty',
    debt: 'Debt',
    balance: 'Final Balance',
    partner40: 'Partner (40%)',
    partner60: 'Partner (60%)',
    annualComp: 'Annual Comparison',
    monthlyComp: 'Monthly Comparison',
    profitTrend: 'Profit Trend',
    aiAnalyst: 'AI Smart Analyst',
    genReport: 'Generate Report',
    processing: 'Processing...',
    clickToGen: 'Click below to generate a professional analysis.',
    noData: 'Not enough data.',
    currentMonth: 'Current Month Summary',
    allTime: 'Historical General Summary',
    salesTrend: 'Daily Sales (Current Month)'
  }
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [lang, setLang] = useState<Language>('pt');
  
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

  // Helper for text
  const t = TRANSLATIONS[lang];

  // --- Date Helpers ---
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const currentYear = today.getFullYear();
  const currentMonthName = MONTHS[currentMonthIndex];

  // --- Metrics Calculation ---

  // 1. Current Month Stats (For Dashboard)
  const currentMonthSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
  });

  const currentMonthCommissions = commissions.filter(c => 
    c.month === currentMonthName && c.year === currentYear
  );

  const cmSalesProfit = currentMonthSales.reduce((acc, sale) => acc + calculateSaleMetrics(sale).lucroLiquido, 0);
  const cmCommissionsVal = currentMonthCommissions.reduce((acc, c) => acc + c.commissionValue, 0);
  const cmTotalRevenue = cmSalesProfit + cmCommissionsVal;
  const cmQty = currentMonthSales.reduce((acc, sale) => acc + sale.quantity, 0);

  // 2. All Time Stats (For General Summary)
  const totalSalesNetProfit = sales.reduce((acc, sale) => acc + calculateSaleMetrics(sale).lucroLiquido, 0);
  const totalCommissions = commissions.reduce((acc, comm) => acc + comm.commissionValue, 0);
  const totalRevenue = totalSalesNetProfit + totalCommissions;
  const totalQty = sales.reduce((acc, sale) => acc + sale.quantity, 0);

  // Sorting Helper: Sort sales by date (descending)
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedSalesCurrentMonth = [...currentMonthSales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  // --- Volume & Comparison Analysis Logic (Global) ---
  
  // Annual Volume
  const annualVolumeMap = sales.reduce((acc, sale) => {
    const year = new Date(sale.date).getFullYear();
    acc[year] = (acc[year] || 0) + sale.quantity;
    return acc;
  }, {} as Record<number, number>);

  const annualVolumeData = Object.entries(annualVolumeMap)
    .map(([year, qty]) => ({ year: Number(year), qty }))
    .sort((a, b) => b.year - a.year);

  const annualComparison = annualVolumeData.map((item, index, arr) => {
      const prevYearItem = arr[index + 1];
      let growth = 0;
      let hasPrev = false;
      
      if (prevYearItem && prevYearItem.qty > 0) {
          growth = ((item.qty - prevYearItem.qty) / prevYearItem.qty) * 100;
          hasPrev = true;
      }
      return { ...item, growth, hasPrev };
  });

  // Monthly Volume (Current Year)
  const monthlyVolumeData = MONTHS.map((monthName, index) => {
      const totalQtyInMonth = sales
        .filter(s => {
            const d = new Date(s.date);
            return d.getFullYear() === currentYear && d.getMonth() === index;
        })
        .reduce((sum, s) => sum + s.quantity, 0);
      
      return { name: monthName, qty: totalQtyInMonth };
  });

  const monthlyComparison = monthlyVolumeData.map((item, index, arr) => {
      const prevMonthItem = arr[index - 1];
      let growth = 0;
      let hasPrev = false;
      if (prevMonthItem && index > 0) {
          if (prevMonthItem.qty > 0) {
            growth = ((item.qty - prevMonthItem.qty) / prevMonthItem.qty) * 100;
            hasPrev = true;
          } else if (item.qty > 0) {
             growth = 100; 
             hasPrev = true;
          }
      }
      return { ...item, growth, hasPrev };
  });

  // --- RECONCILIATION LOGIC ---
  const reconciliationData = (() => {
      const data: Record<string, { year: number, monthIndex: number, monthName: string, totalQty: number, totalDebt: number, totalCommission: number }> = {};

      sales.forEach(sale => {
          const d = new Date(sale.date);
          const year = d.getFullYear();
          const monthIndex = d.getMonth();
          const key = `${year}-${monthIndex}`;
          if (!data[key]) data[key] = { year, monthIndex, monthName: MONTHS[monthIndex], totalQty: 0, totalDebt: 0, totalCommission: 0 };
          data[key].totalQty += sale.quantity;
          data[key].totalDebt += sale.quantity * FACTORS.DIVIDA_REPOR; 
      });

      commissions.forEach(comm => {
          const monthIndex = MONTHS.indexOf(comm.month);
          if (monthIndex === -1) return;
          const key = `${comm.year}-${monthIndex}`;
          if (!data[key]) data[key] = { year: comm.year, monthIndex, monthName: MONTHS[monthIndex], totalQty: 0, totalDebt: 0, totalCommission: 0 };
          data[key].totalCommission += comm.commissionValue;
      });

      return Object.values(data)
        .map(item => {
            const finalBalance = item.totalCommission - item.totalDebt;
            return {
                ...item,
                finalBalance,
                share40: finalBalance * 0.40,
                share60: finalBalance * 0.60
            };
        })
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

  const handleEditCommission = (updatedComm: MonthlyCommission) => {
    setCommissions(prev => prev.map(c => c.id === updatedComm.id ? updatedComm : c));
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

  // Chart Data: Current Month Only for Dashboard
  const currentMonthChartData = currentMonthSales.reduce((acc: any[], sale) => {
    const existing = acc.find(item => item.date === sale.date);
    const metrics = calculateSaleMetrics(sale);
    if (existing) {
      existing.profit += metrics.lucroLiquido;
    } else {
      acc.push({ date: sale.date, profit: metrics.lucroLiquido });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Chart Data: All Time for Summary
  const allTimeChartData = sales.reduce((acc: any[], sale) => {
    const existing = acc.find(item => item.date === sale.date);
    const metrics = calculateSaleMetrics(sale);
    if (existing) {
      existing.profit += metrics.lucroLiquido;
    } else {
      acc.push({ date: sale.date, profit: metrics.lucroLiquido });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


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

  const navButtonClass = (isActive: boolean) => 
    `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'hover:bg-blue-800 hover:text-white'}`;

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
          <button onClick={() => setView('dashboard')} className={navButtonClass(view === 'dashboard')}>
            <LayoutDashboard size={20} />
            <span className="font-medium">{t.dashboard}</span>
          </button>
          
          <button onClick={() => setView('sales')} className={navButtonClass(view === 'sales')}>
            <TrendingUp size={20} />
            <span className="font-medium">{t.sales}</span>
          </button>

          <button onClick={() => setView('commissions')} className={navButtonClass(view === 'commissions')}>
            <Wallet size={20} />
            <span className="font-medium">{t.commissions}</span>
          </button>

          <button onClick={() => setView('summary')} className={navButtonClass(view === 'summary')}>
            <PieChart size={20} />
            <span className="font-medium">{t.summary}</span>
          </button>
        </nav>

        <div className="mt-auto p-6 border-t border-blue-800">
           <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700">
              <h4 className="text-xs font-semibold text-blue-300 uppercase mb-2">{t.totalEarnings}</h4>
              <p className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()} MZN</p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
           <h1 className="text-xl font-semibold text-slate-800 capitalize">
               {view === 'dashboard' ? t.dashboard : view === 'summary' ? t.summary : view === 'sales' ? t.sales : t.commissions}
           </h1>
           <div className="flex items-center gap-4">
               {/* Language Toggle */}
               <button 
                onClick={() => setLang(l => l === 'pt' ? 'en' : 'pt')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-medium text-slate-700"
               >
                   <Globe size={16} />
                   {lang === 'pt' ? 'PT' : 'EN'}
               </button>
               
              <span className="text-sm text-slate-500 hidden sm:inline">{t.welcome}, Admin</span>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold border border-red-200">
                W
              </div>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          
          {/* View: Dashboard (CURRENT MONTH ONLY) */}
          {view === 'dashboard' && (
            <>
              <div className="mb-2">
                 <h2 className="text-2xl font-bold text-slate-800">{currentMonthName} {currentYear}</h2>
                 <p className="text-slate-500">{t.currentMonth}</p>
              </div>

              {/* Current Month Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title={t.netProfit} value={`${cmSalesProfit.toLocaleString()} MZN`} icon={TrendingUp} color="green" />
                <StatsCard title={t.totalCommissions} value={`${cmCommissionsVal.toLocaleString()} MZN`} icon={Wallet} color="blue" />
                <StatsCard title={t.totalEarnings} value={`${cmTotalRevenue.toLocaleString()} MZN`} icon={DollarSign} color="red" />
                <StatsCard title={t.totalDiamonds} value={cmQty.toString()} icon={Gem} color="orange" />
              </div>

              {/* Current Month Chart & Insight */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{t.salesTrend}</h3>
                    </div>
                    <BarChart3 className="text-slate-300" />
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={currentMonthChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `${value / 1000}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="profit" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-800 to-red-700 rounded-xl p-6 text-white flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex items-center gap-3 mb-4 z-10">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><BrainCircuit size={20} className="text-white" /></div>
                        <h3 className="font-semibold text-lg">{t.aiAnalyst}</h3>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg p-4 mb-4 backdrop-blur-sm text-sm leading-relaxed border border-white/10 min-h-[160px]">
                        {isGeneratingInsight ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-white animate-pulse">
                                <BrainCircuit className="animate-spin" />
                                <span>{t.processing}</span>
                            </div>
                        ) : insight ? (<p>{insight}</p>) : (<p className="text-blue-100 text-center mt-10">{t.clickToGen}</p>)}
                    </div>
                    <button onClick={handleGenerateInsight} disabled={isGeneratingInsight} className="w-full py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors shadow-lg z-10 disabled:opacity-70 disabled:cursor-not-allowed">
                        {isGeneratingInsight ? t.processing : t.genReport}
                    </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                  <SalesTable sales={sortedSalesCurrentMonth.slice(0, 5)} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} />
              </div>
            </>
          )}

          {/* View: General Summary (TOTALS + HISTORY) */}
          {view === 'summary' && (
              <>
                <div className="mb-2">
                   <h2 className="text-2xl font-bold text-slate-800">{t.allTime}</h2>
                </div>

                {/* All Time Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title={`TOTAL ${t.netProfit}`} value={`${totalSalesNetProfit.toLocaleString()} MZN`} icon={TrendingUp} color="green" />
                    <StatsCard title={`TOTAL ${t.totalCommissions}`} value={`${totalCommissions.toLocaleString()} MZN`} icon={Wallet} color="blue" />
                    <StatsCard title={`TOTAL ${t.totalEarnings}`} value={`${totalRevenue.toLocaleString()} MZN`} icon={DollarSign} color="red" />
                    <StatsCard title={`TOTAL ${t.totalDiamonds}`} value={totalQty.toString()} icon={Gem} color="orange" />
                </div>

                {/* RECONCILIATION TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h3 className="font-semibold text-emerald-900 flex items-center gap-2">
                            <ClipboardCheck size={20} className="text-emerald-600"/>
                            {t.monthlyClosure}
                        </h3>
                        <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-medium">{t.balanceCalc}</span>
                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full font-medium flex items-center gap-1"><Users size={12}/> {t.partners}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-3">{t.period}</th>
                                    <th className="px-6 py-3 text-right">{t.qty}</th>
                                    <th className="px-6 py-3 text-right">{t.debt} <span className="text-xs">({FACTORS.DIVIDA_REPOR})</span></th>
                                    <th className="px-6 py-3 text-right">{t.commissions}</th>
                                    <th className="px-6 py-3 text-right border-r border-slate-200">{t.balance}</th>
                                    <th className="px-6 py-3 text-right text-purple-700 bg-purple-50/50">{t.partner40}</th>
                                    <th className="px-6 py-3 text-right text-purple-700 bg-purple-50/50">{t.partner60}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reconciliationData.length > 0 ? (
                                    reconciliationData.map((row) => (
                                        <tr key={`${row.year}-${row.monthIndex}`} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-3 font-medium text-slate-700">{row.monthName} {row.year}</td>
                                            <td className="px-6 py-3 text-right text-slate-600">{row.totalQty}</td>
                                            <td className="px-6 py-3 text-right text-red-500">- {row.totalDebt.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right text-blue-600">+ {row.totalCommission.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right border-r border-slate-200">
                                                <span className={`font-bold ${row.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.finalBalance.toLocaleString()} MZN</span>
                                            </td>
                                            <td className="px-6 py-3 text-right bg-purple-50/20 font-medium text-slate-600">{row.share40.toLocaleString(undefined, { maximumFractionDigits: 2 })} MZN</td>
                                            <td className="px-6 py-3 text-right bg-purple-50/20 font-medium text-slate-600">{row.share60.toLocaleString(undefined, { maximumFractionDigits: 2 })} MZN</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">{t.noData}</td></tr>
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
                                {t.annualComp}
                            </h3>
                        </div>
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">{t.period} (Year)</th>
                                        <th className="px-6 py-3 text-right">{t.qty}</th>
                                        <th className="px-6 py-3 text-right">Vs Year Ant.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {annualComparison.length > 0 ? (
                                        annualComparison.map((item) => (
                                            <tr key={item.year} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-3 font-medium text-slate-700">{item.year}</td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-800">{item.qty}</td>
                                                <td className="px-6 py-3 text-right"><div className="flex justify-end"><GrowthBadge value={item.growth} hasPrev={item.hasPrev} /></div></td>
                                            </tr>
                                        ))
                                    ) : (<tr><td colSpan={3} className="px-6 py-8 text-center text-slate-400">{t.noData}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Monthly Comparison */}
                    <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">{t.monthlyComp} ({currentYear})</h3>
                                    <p className="text-sm text-slate-500">Evolution month by month</p>
                                </div>
                                <Gem size={20} className="text-blue-200" />
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyComparison}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={0} />
                                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="qty" radius={[4, 4, 0, 0]} barSize={24}>
                                                {monthlyComparison.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.qty > 0 ? '#1e40af' : '#e2e8f0'} />))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                            </div>
                            <div className="overflow-y-auto max-h-64 border border-slate-100 rounded-lg">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2">{t.period}</th>
                                                <th className="px-4 py-2 text-right">{t.qty}</th>
                                                <th className="px-4 py-2 text-right">Vs Prev.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {monthlyComparison.map((item) => (
                                                <tr key={item.name} className="hover:bg-slate-50">
                                                    <td className="px-4 py-2 text-slate-600 text-xs font-medium uppercase">{item.name}</td>
                                                    <td className="px-4 py-2 text-right font-bold text-slate-800">{item.qty}</td>
                                                    <td className="px-4 py-2 text-right"><div className="flex justify-end"><GrowthBadge value={item.growth} hasPrev={item.hasPrev} /></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                            </div>
                        </div>
                    </div>
                </div>
              </>
          )}

          {/* View: Sales */}
          {view === 'sales' && (
             <SalesTable sales={sortedSales} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} />
          )}

          {/* View: Commissions */}
          {view === 'commissions' && (
             <CommissionsTable 
                commissions={commissions} 
                onAddCommission={handleAddCommission} 
                onEditCommission={handleEditCommission}
                onDeleteCommission={handleDeleteCommission} 
             />
          )}
          
        </div>
      </main>
    </div>
  );
};

export default App;