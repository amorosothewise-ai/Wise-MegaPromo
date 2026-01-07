
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, BrainCircuit, Gem, PieChart, Globe, Settings, Receipt, FileText, Target, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { StatsCard } from './components/StatsCard';
import { SalesTable } from './components/SalesTable';
import { CommissionsTable } from './components/CommissionsTable';
import { ExpensesTable } from './components/ExpensesTable';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DiamondSale, MonthlyCommission, ViewMode, Language, AppSettings, Expense } from './types';
import { INITIAL_SALES, INITIAL_COMMISSIONS, INITIAL_EXPENSES, calculateSaleMetrics, MONTHS, FACTORS, formatMZN, escapeCSV } from './constants';
import { generateBusinessInsights } from './services/geminiService';

const generateId = () => typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
const safeParse = <T,>(k: string, fb: T): T => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const safeStore = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error('Storage Error', e); } };

const T = {
  pt: { 
    dash: 'Painel Principal', sale: 'Vendas_Diamantes', comm: 'Comissões MZ', exp: 'Despesas', sum: 'Fechamento Mensal',
    net: 'Lucro de Vendas', tComm: 'Comissões Operadora', tExp: 'Despesas Totais', tEarn: 'Lucro Líquido Final',
    wel: 'Bem-vindo!', mEarn: 'Lucro do Mês', ai: 'Analista Inteligente', gen: 'Gerar Insights',
    confirmDelTitle: 'Confirmar Remoção', confirmDelMsg: 'Deseja realmente apagar este(s) registro(s) permanentemente?', delete: 'Eliminar',
    exportCsv: 'Backup CSV', set: 'Definições', accProfit: 'Lucro Acumulado', margin: 'Margem Líquida',
    aiError: 'Erro ao conectar com Analista.', clickToGen: 'Clique para analisar métricas reais.',
    perfChart: 'Evolução de Saldo (MZN)', distChart: 'Distribuição de Ganhos'
  },
  en: { 
    dash: 'Main Dashboard', sale: 'Diamond_Sales', comm: 'MZ Commissions', exp: 'Expenses', sum: 'Monthly Closing',
    net: 'Sales Profit', tComm: 'Operator Comm.', tExp: 'Total Expenses', tEarn: 'Net Final Profit',
    wel: 'Welcome!', mEarn: 'Monthly Profit', ai: 'AI Analyst', gen: 'Get Insights',
    confirmDelTitle: 'Confirm Delete', confirmDelMsg: 'Permanently remove these record(s)?', delete: 'Delete',
    exportCsv: 'Export CSV', set: 'Settings', accProfit: 'Accumulated Profit', margin: 'Net Margin',
    aiError: 'AI connection failed.', clickToGen: 'Click for data analysis.',
    perfChart: 'Balance Evolution (MZN)', distChart: 'Earnings Distribution'
  }
};

const COLORS = ['#dc2626', '#2563eb', '#7c3aed', '#059669', '#ea580c'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(() => (window.history.state?.view || 'dashboard'));
  const [lang, setLang] = useState<Language>('pt');
  const [showSettings, setShowSettings] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, onConfirm: () => void, title?: string, message?: string}>({ 
    isOpen: false, 
    onConfirm: () => {} 
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => safeParse('diamond_settings', { 
    defaultRepaymentRate: FACTORS.DEFAULT_DIVIDA_REPOR, 
    defaultSalePrice: FACTORS.VALOR_RECEBIDO, 
    defaultGrossCommission: FACTORS.COMISSAO_BRUTA,
    partnerAPercentage: 40,
    partnerBPercentage: 60
  }));
  
  const [sales, setSales] = useState<DiamondSale[]>(() => safeParse('diamond_sales', INITIAL_SALES));
  const [commissions, setCommissions] = useState<MonthlyCommission[]>(() => safeParse('diamond_commissions', INITIAL_COMMISSIONS));
  const [expenses, setExpenses] = useState<Expense[]>(() => safeParse('diamond_expenses', INITIAL_EXPENSES));
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGenInsight] = useState(false);

  useEffect(() => { safeStore('diamond_sales', sales); }, [sales]);
  useEffect(() => { safeStore('diamond_commissions', commissions); }, [commissions]);
  useEffect(() => { safeStore('diamond_expenses', expenses); }, [expenses]);
  useEffect(() => { safeStore('diamond_settings', settings); }, [settings]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const newView = e.state?.view || 'dashboard';
      setView(newView);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const changeView = useCallback((newView: ViewMode) => {
    if (view === newView) return;
    window.history.pushState({ view: newView }, '', '');
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if ('vibrate' in navigator) navigator.vibrate(5);
  }, [view]);

  const t = T[lang];

  const requestDelete = useCallback((onConfirm: () => void, count: number = 1) => {
    setDeleteModal({
      isOpen: true,
      onConfirm,
      title: t.confirmDelTitle,
      message: count > 1 ? `Deseja realmente apagar ${count} registros permanentemente?` : t.confirmDelMsg
    });
  }, [t]);

  const handleDeleteMultipleSales = useCallback((ids: string[]) => {
    requestDelete(() => {
      setSales(prev => prev.filter(s => !ids.includes(s.id)));
      if ('vibrate' in navigator) navigator.vibrate(20);
    }, ids.length);
  }, [requestDelete]);

  const handleDeleteMultipleCommissions = useCallback((ids: string[]) => {
    requestDelete(() => {
      setCommissions(prev => prev.filter(c => !ids.includes(c.id)));
      if ('vibrate' in navigator) navigator.vibrate(20);
    }, ids.length);
  }, [requestDelete]);

  const handleDeleteMultipleExpenses = useCallback((ids: string[]) => {
    requestDelete(() => {
      setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
      if ('vibrate' in navigator) navigator.vibrate(20);
    }, ids.length);
  }, [requestDelete]);

  const exportToCSV = () => {
    const headers = ['Tipo', 'Data/Periodo', 'Qtd/Desc', 'Op/Cat', 'Bruto', 'Lucro Bruto (Venda)', 'Despesa', 'Saldo'];
    const rows = [headers.join(',')];
    const calcParams = { salePrice: settings.defaultSalePrice, grossCommission: settings.defaultGrossCommission, repaymentRate: settings.defaultRepaymentRate };

    sales.forEach(s => {
      const m = calculateSaleMetrics(s, calcParams);
      rows.push(['Venda', s.date, s.quantity, 'Diamantes', escapeCSV(m.valorRecebido), escapeCSV(m.lucroLiquido), '0', escapeCSV(m.lucroLiquido)].join(','));
    });
    commissions.forEach(c => {
      rows.push(['Comissao', `${c.month} ${c.year}`, '-', escapeCSV(c.operator), escapeCSV(c.commissionValue), '0', '0', escapeCSV(c.commissionValue)].join(','));
    });
    expenses.forEach(e => {
      rows.push(['Despesa', e.date, escapeCSV(e.description), escapeCSV(e.category), '0', '0', escapeCSV(e.value), escapeCSV(-e.value)].join(','));
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `WiseControl_Backup_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const today = new Date();
  const currMonth = MONTHS[today.getMonth()];
  const currYear = today.getFullYear();
  const calcParams = { salePrice: settings.defaultSalePrice, grossCommission: settings.defaultGrossCommission, repaymentRate: settings.defaultRepaymentRate };

  const cmStats = useMemo(() => {
    const s = sales.filter(s => s.date.includes(`${currYear}-${(today.getMonth()+1).toString().padStart(2,'0')}`));
    const c = commissions.filter(c => c.month === currMonth && c.year === currYear);
    const e = expenses.filter(e => e.date.includes(`${currYear}-${(today.getMonth()+1).toString().padStart(2,'0')}`));
    
    const profitSales = s.reduce((a, x) => a + calculateSaleMetrics(x, calcParams).lucroLiquido, 0);
    const totalComm = c.reduce((a, x) => a + x.commissionValue, 0);
    const totalExp = e.reduce((a, x) => a + x.value, 0);
    
    return { profitSales, totalComm, totalExp, finalBalance: profitSales + totalComm - totalExp };
  }, [sales, commissions, expenses, settings, currMonth, currYear]);

  const reconData = useMemo(() => {
    const map: any = {};
    sales.forEach(s => {
      const parts = s.date.split('-');
      const k = `${parts[0]}-${parts[1]}`;
      if (!map[k]) map[k] = { y: +parts[0], m: +parts[1]-1, credits: 0, debits: 0, turnover: 0 };
      const m = calculateSaleMetrics(s, calcParams);
      map[k].credits += m.lucroLiquido;
      map[k].turnover += m.valorRecebido;
    });
    commissions.forEach(c => {
      const k = `${c.year}-${(MONTHS.indexOf(c.month)+1).toString().padStart(2,'0')}`;
      if (!map[k]) map[k] = { y: c.year, m: MONTHS.indexOf(c.month), credits: 0, debits: 0, turnover: 0 };
      map[k].credits += c.commissionValue;
    });
    expenses.forEach(e => {
      const parts = e.date.split('-');
      const k = `${parts[0]}-${parts[1]}`;
      if (!map[k]) map[k] = { y: +parts[0], m: +parts[1]-1, credits: 0, debits: 0, turnover: 0 };
      map[k].debits += e.value;
    });

    return Object.values(map)
      .map((r: any) => {
        const bal = r.credits - r.debits;
        return { 
          ...r, 
          bal, 
          name: MONTHS[r.m],
          margin: r.turnover > 0 ? (bal / r.turnover) * 100 : 0,
          sA: bal * (settings.partnerAPercentage/100),
          sB: bal * (settings.partnerBPercentage/100)
        };
      })
      .sort((a, b) => b.y - a.y || b.m - a.m);
  }, [sales, commissions, expenses, settings, calcParams]);

  const chartData = useMemo(() => [...reconData].reverse().map(r => ({
    name: r.name,
    saldo: r.bal,
    receita: r.credits,
    despesa: r.debits
  })), [reconData]);

  const pieData = [
    { name: 'Sócio A', value: cmStats.finalBalance > 0 ? cmStats.finalBalance * (settings.partnerAPercentage/100) : 0 },
    { name: 'Sócio B', value: cmStats.finalBalance > 0 ? cmStats.finalBalance * (settings.partnerBPercentage/100) : 0 }
  ];

  const accTotals = useMemo(() => reconData.reduce((a, c) => ({
    bal: a.bal + c.bal,
    exp: a.exp + c.debits,
    cred: a.cred + c.credits
  }), { bal: 0, exp: 0, cred: 0 }), [reconData]);

  const NavBtn = ({ v, ic: I, l, m = false }: { v: ViewMode, ic: any, l: string, m?: boolean }) => (
    <button onClick={() => changeView(v)} className={m 
        ? `flex flex-col items-center flex-1 py-3 transition-all active:scale-95 ${view === v ? 'text-red-600 bg-red-50 font-black' : 'text-slate-500 font-bold'}` 
        : `w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${view === v ? 'bg-red-600 text-white shadow-xl shadow-red-200 border border-red-500' : 'text-blue-100 hover:bg-white/10'}`
      }>
      <I size={m ? 24 : 20} className={view === v && !m ? 'text-white' : ''} />
      <span className={m ? "text-[10px] mt-1 uppercase tracking-tighter" : "font-bold"}>{l}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overscroll-none touch-pan-y selection:bg-red-200">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={setSettings} t={t} />
      <ConfirmationModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal(p => ({...p, isOpen: false}))} 
        onConfirm={deleteModal.onConfirm} 
        title={deleteModal.title || t.confirmDelTitle} 
        message={deleteModal.message || t.confirmDelMsg} 
        confirmText={t.delete} 
        cancelText="Cancelar" 
      />
      
      <aside className="hidden md:flex w-72 bg-blue-950 text-blue-100 flex-col h-screen sticky top-0 border-r-2 border-blue-900 shadow-2xl z-50">
        <div className="p-8 flex items-center gap-3 border-b border-white/5">
          <div className="bg-red-600 p-2.5 rounded-2xl shadow-xl shadow-red-900/40 border border-red-500"><Gem size={26} className="text-white" /></div>
          <div><span className="text-xl font-black text-white">WISE</span><span className="text-xs font-black text-red-500 uppercase block tracking-[0.2em]">Control</span></div>
        </div>
        <nav className="px-5 py-10 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          <NavBtn v="dashboard" ic={LayoutDashboard} l={t.dash} />
          <NavBtn v="sales" ic={TrendingUp} l={t.sale} />
          <NavBtn v="commissions" ic={Wallet} l={t.comm} />
          <NavBtn v="expenses" ic={Receipt} l={t.exp} />
          <NavBtn v="summary" ic={PieChart} l={t.sum} />
          <div className="pt-10 px-2 space-y-4 border-t border-white/5 mt-5">
            <button onClick={exportToCSV} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"><FileText size={18}/>{t.exportCsv}</button>
            <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"><Settings size={18}/>{t.set}</button>
          </div>
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 z-50 flex items-center justify-around py-3 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          <NavBtn v="dashboard" ic={LayoutDashboard} l={t.dash} m />
          <NavBtn v="sales" ic={TrendingUp} l={t.sale} m />
          <NavBtn v="expenses" ic={Receipt} l={t.exp} m />
          <NavBtn v="summary" ic={PieChart} l={t.sum} m />
      </nav>

      <main className="flex-1 overflow-y-auto h-screen relative pb-32 md:pb-10">
        <header className="bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 px-6 sm:px-10 py-5 flex justify-between items-center sticky top-0 z-40 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="md:hidden bg-red-600 p-1.5 rounded-lg text-white shadow-md shadow-red-200"><Gem size={18} /></div>
             <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">{t[view as keyof typeof t] || t.dash}</h1>
           </div>
           <button onClick={() => setLang(l => l === 'pt' ? 'en' : 'pt')} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 rounded-full text-xs font-black text-slate-800 uppercase transition-all flex items-center gap-2 shadow-sm"><Globe size={16}/>{lang}</button>
        </header>

        <div className="p-4 sm:p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
          {view === 'dashboard' && (<>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <StatsCard title={t.net} value={formatMZN(cmStats.profitSales)} icon={TrendingUp} color="green" />
                <StatsCard title={t.tComm} value={formatMZN(cmStats.totalComm)} icon={Wallet} color="blue" />
                <StatsCard title={t.tExp} value={formatMZN(-cmStats.totalExp)} icon={Receipt} color="red" />
                <StatsCard title={t.tEarn} value={formatMZN(cmStats.finalBalance)} icon={DollarSign} color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2"><BarChart3 size={18} className="text-blue-600"/> {t.perfChart}</h3>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(val) => `MT ${val/1000}k`} />
                        <Tooltip contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '15px' }} />
                        <Area type="monotone" dataKey="saldo" stroke="#dc2626" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-200">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2"><PieChart size={18} className="text-purple-600"/> {t.distChart}</h3>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" animationDuration={1000}>
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="white" />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-2 border-slate-800 ring-4 ring-slate-900/5">
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4"><BrainCircuit size={30} className="text-blue-400"/> <span className="font-black text-sm uppercase tracking-[0.3em] text-blue-100">{t.ai} Analysis Intelligence</span></div>
                  <div className="bg-white/10 rounded-[2rem] p-8 text-base leading-relaxed border border-white/20 font-bold text-slate-100 shadow-inner backdrop-blur-sm">
                    {isGeneratingInsight ? <div className="flex items-center gap-4 animate-pulse"><div className="w-2 h-2 bg-blue-400 rounded-full"></div>Analisando métricas e gerando previsões financeiras...</div> : insight || t.clickToGen}
                  </div>
                  <button onClick={async () => { setIsGenInsight(true); const res = await generateBusinessInsights({ sales, commissions, expenses, settings }); setInsight(res); setIsGenInsight(false); }} disabled={isGeneratingInsight} className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-2xl transition-all active:scale-95 disabled:opacity-50 border-b-4 border-blue-800">
                    {t.gen}
                  </button>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] scale-150"><BrainCircuit size={280}/></div>
            </div>
          </>)}

          {view === 'summary' && (<>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <StatsCard title={t.accProfit} value={formatMZN(accTotals.bal)} icon={Target} color="purple" />
                <StatsCard title={t.tExp + " Total"} value={formatMZN(-accTotals.exp)} icon={Receipt} color="red" />
                <StatsCard title={t.margin + " Média"} value={`${((accTotals.bal / Math.max(1, accTotals.cred)) * 100).toFixed(1)}%`} icon={TrendingUp} color="green" />
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-xl border-2 border-slate-200 overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[1100px]">
                    <thead className="bg-slate-100 text-slate-800 font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-200">
                      <tr>
                        <th className="px-10 py-6 border-r border-slate-200">Período Fiscal</th>
                        <th className="px-10 py-6 text-right">Créditos Realizados (+)</th>
                        <th className="px-10 py-6 text-right">Débitos Operacionais (-)</th>
                        <th className="px-10 py-6 text-right border-x-2 border-slate-200 bg-slate-50">SALDO LÍQUIDO FINAL</th>
                        <th className="px-10 py-6 text-right text-blue-800 bg-blue-100/50 border-r border-slate-200">Sócio A ({settings.partnerAPercentage}%)</th>
                        <th className="px-10 py-6 text-right text-purple-800 bg-purple-100/50">Sócio B ({settings.partnerBPercentage}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100 bg-white">
                      {reconData.map(r => (
                        <tr key={`${r.y}-${r.m}`} className="hover:bg-slate-50/100 transition-colors">
                          <td className="px-10 py-6 font-black text-slate-900 border-r border-slate-100 uppercase text-[11px] tracking-wider">{r.name} {r.y}</td>
                          <td className="px-10 py-6 text-right text-emerald-700 font-black text-sm">+{formatMZN(r.credits)}</td>
                          <td className="px-10 py-6 text-right text-red-700 font-black text-sm">-{formatMZN(r.debits)}</td>
                          <td className="px-10 py-6 text-right font-black border-x-2 border-slate-200 bg-slate-50/50 text-slate-900 text-base">
                            <div className="flex items-center justify-end gap-3">
                              {r.bal > 0 ? <ArrowUpRight size={18} className="text-emerald-600" /> : <ArrowDownRight size={18} className="text-red-600" />}
                              {formatMZN(r.bal)}
                            </div>
                          </td>
                          <td className="px-10 py-6 text-right bg-blue-50/40 text-blue-900 font-black text-base border-r border-slate-100">{formatMZN(r.sA)}</td>
                          <td className="px-10 py-6 text-right bg-purple-50/40 text-purple-900 font-black text-base">{formatMZN(r.sB)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
          </>)}

          {view === 'sales' && (
            <SalesTable 
              sales={sales} 
              onAddSale={s => setSales(p => [{...s, id: generateId()}, ...p])} 
              onEditSale={s => setSales(p => p.map(x => x.id === s.id ? s : x))} 
              onDeleteSale={id => requestDelete(() => setSales(p => p.filter(x => x.id !== id)))} 
              onDeleteMultipleSales={handleDeleteMultipleSales}
              settings={settings} 
            />
          )}
          {view === 'commissions' && (
            <CommissionsTable 
              commissions={commissions} 
              onAddCommission={c => setCommissions(p => [{...c, id: generateId()}, ...p])} 
              onEditCommission={c => setCommissions(p => p.map(x => x.id === c.id ? c : x))} 
              onDeleteCommission={id => requestDelete(() => setCommissions(p => p.filter(x => x.id !== id)))} 
              onDeleteMultipleCommissions={handleDeleteMultipleCommissions}
            />
          )}
          {view === 'expenses' && (
            <ExpensesTable 
              expenses={expenses} 
              onAddExpense={e => setExpenses(p => [{...e, id: generateId()}, ...p])} 
              onEditExpense={e => setExpenses(p => p.map(x => x.id === e.id ? e : x))} 
              onDeleteExpense={id => requestDelete(() => setExpenses(p => p.filter(x => x.id !== id)))} 
              onDeleteMultipleExpenses={handleDeleteMultipleExpenses}
            />
          )}
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .pb-safe { padding-bottom: max(1.5rem, env(safe-area-inset-bottom)); }
        * { -webkit-tap-highlight-color: transparent; outline: none !important; }
        html, body { overscroll-behavior-y: contain; }
      `}</style>
    </div>
  );
};

export default App;
