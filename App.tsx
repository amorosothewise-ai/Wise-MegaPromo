
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  LayoutDashboard as DashIcon, 
  Wallet as WalletIcon, 
  TrendingUp as SalesIcon, 
  Receipt as ExpenseIcon, 
  PieChart as SummaryIcon, 
  Gem as GemIcon, 
  DollarSign as MoneyIcon, 
  Coins as ReinvestIcon, 
  Layers as PackIcon, 
  Download as ExportIcon, 
  Settings as SettingsIcon, 
  ChevronRight as RightIcon, 
  ChevronLeft as BackIcon,
  X as CloseIcon, 
  BarChart3,
  Sparkles,
  BrainCircuit,
  Loader2,
  Upload as ImportIcon,
  Database,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { StatsCard } from './components/StatsCard.tsx';
import { SalesTable } from './components/SalesTable.tsx';
import { CommissionsTable } from './components/CommissionsTable.tsx';
import { ExpensesTable } from './components/ExpensesTable.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmationModal } from './components/ConfirmationModal.tsx';
import { DiamondSale, MonthlyCommission, ViewMode, Language, AppSettings, Expense, Month, FilterMode, Operator } from './types.ts';
import { INITIAL_SALES, INITIAL_COMMISSIONS, INITIAL_EXPENSES, calculateReinvestment, MONTHS, formatMZN, escapeCSV, FACTORS, EXPENSE_CATEGORIES } from './constants.ts';
import { generateBusinessInsights } from './services/geminiService.ts';

const generateId = () => typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
const safeParse = <T,>(k: string, fb: T): T => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const safeStore = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error('Storage Error', e); } };

const T = {
  pt: { 
    dash: 'Gestão Inteligente', sale: 'Ativações', comm: 'Comissões MZ', exp: 'Custos Fixos', sum: 'Resumo de Caixa',
    net: 'Comissões', tDebt: 'Reinvestido', tExp: 'Despesas', tEarn: 'Lucro Real',
    tQty: 'Total Ativado', wel: 'Bem-vindo!',
    confirmDelTitle: 'Apagar Registro', confirmDelMsg: 'Deseja eliminar permanentemente este item?', delete: 'Sim, Eliminar',
    exportCsv: 'Exportar CSV', set: 'Configurações', accProfit: 'Lucro Consolidado',
    perfChart: 'Fluxo Mensal', distChart: 'Partilha Sócios',
    noData: 'Sem dados.', notify: 'Alertas', period: 'Filtrar por', monthly: 'Mês/Ano', range: 'Intervalo',
    aiTitle: 'Wise AI Insights', aiBtn: 'Analisar com IA', aiLoading: 'IA analisando...', aiEmpty: 'Clica no botão para obter uma análise detalhada.',
    dataMgmt: 'Gestão de Dados', backupFull: 'Exportar Backup Completo (JSON)', restoreFull: 'Restaurar Backup (JSON)',
    restoreWarn: 'Atenção: Restaurar dados irá apagar permanentemente todos os registros atuais da aplicação. Recomendamos exportar um backup antes. Deseja continuar?',
    exportAllCsv: 'Exportar Todo Histórico (CSV)'
  },
  en: { 
    dash: 'Smart Management', sale: 'Activations', comm: 'MZ Commissions', exp: 'Fixed Costs', sum: 'Cash Summary',
    net: 'Commissions', tDebt: 'Reinvested', tExp: 'Expenses', tEarn: 'Net Profit',
    tQty: 'Total Activated', wel: 'Welcome!',
    confirmDelTitle: 'Delete Record', confirmDelMsg: 'Permanently remove this item?', delete: 'Yes, Delete',
    exportCsv: 'Export CSV', set: 'Settings', accProfit: 'Consolidated Profit',
    perfChart: 'Monthly Flow', distChart: 'Profit Sharing',
    noData: 'No data.', notify: 'Alerts', period: 'Filter by', monthly: 'Month/Year', range: 'Range',
    aiTitle: 'Wise AI Insights', aiBtn: 'Analyze with AI', aiLoading: 'AI analyzing...', aiEmpty: 'Click the button to get a detailed analysis.',
    dataMgmt: 'Data Management', backupFull: 'Export Full Backup (JSON)', restoreFull: 'Restore Data (JSON)',
    restoreWarn: 'Warning: Restoring data will overwrite all current records. We recommend exporting a backup first. Do you want to proceed?',
    exportAllCsv: 'Export All History (CSV)'
  }
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultRepaymentRate: FACTORS.REINVESTMENT_FEE, 
  defaultSalePrice: 470, 
  defaultGrossCommission: 75,
  partnerAPercentage: 40,
  partnerBPercentage: 60,
  partnerAName: 'Sócio A',
  partnerBName: 'Sócio B',
  defaultQuantity: 50,
  defaultOperator: Operator.MPesa,
  defaultExpenseCategory: EXPENSE_CATEGORIES[0]
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [lang, setLang] = useState<Language>('pt');
  const [showSettings, setShowSettings] = useState(false);
  
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<Month>(MONTHS[new Date().getMonth()] as Month);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Melhora a inicialização para garantir que campos novos sejam mesclados com dados antigos
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = safeParse('diamond_settings', {});
    return { ...DEFAULT_SETTINGS, ...saved };
  });
  
  const [sales, setSales] = useState<DiamondSale[]>(() => safeParse('diamond_sales', INITIAL_SALES));
  const [commissions, setCommissions] = useState<MonthlyCommission[]>(() => safeParse('diamond_commissions', INITIAL_COMMISSIONS));
  const [expenses, setExpenses] = useState<Expense[]>(() => safeParse('diamond_expenses', INITIAL_EXPENSES));

  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, onConfirm: () => void, title: string, message: string, type: 'danger' | 'warning'}>({ 
    isOpen: false, 
    onConfirm: () => {},
    title: '',
    message: '',
    type: 'danger'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { safeStore('diamond_sales', sales); }, [sales]);
  useEffect(() => { safeStore('diamond_commissions', commissions); }, [commissions]);
  useEffect(() => { safeStore('diamond_expenses', expenses); }, [expenses]);
  useEffect(() => { safeStore('diamond_settings', settings); }, [settings]);

  const changeView = useCallback((newView: ViewMode) => {
    if (view === newView) return;
    if ('vibrate' in navigator) navigator.vibrate(12);
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const t = T[lang];

  const filteredData = useMemo(() => {
    if (filterMode === 'monthly') {
      const monthIdx = MONTHS.indexOf(selectedMonth);
      const monthStr = (monthIdx + 1).toString().padStart(2, '0');
      const periodKey = `${selectedYear}-${monthStr}`;
      return {
        sales: sales.filter(s => s.date.startsWith(periodKey)),
        commissions: commissions.filter(c => c.month === selectedMonth && c.year === selectedYear),
        expenses: expenses.filter(e => e.date.startsWith(periodKey))
      };
    } else {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      return {
        sales: sales.filter(s => { const d = new Date(s.date); return d >= start && d <= end; }),
        commissions: commissions.filter(c => {
          const midx = MONTHS.indexOf(c.month);
          const d = new Date(c.year, midx, 15);
          return d >= start && d <= end;
        }),
        expenses: expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; })
      };
    }
  }, [sales, commissions, expenses, filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const periodStats = useMemo(() => {
    const totalQty = filteredData.sales.reduce((sum, s) => sum + s.quantity, 0);
    const totalDebt = filteredData.sales.reduce((sum, s) => {
      const debt = calculateReinvestment(s.quantity, s.repaymentRate);
      return sum + debt;
    }, 0);
    const totalComm = filteredData.commissions.reduce((sum, c) => sum + c.commissionValue, 0);
    const totalExp = filteredData.expenses.reduce((sum, e) => sum + e.value, 0);
    const netProfit = totalComm - totalDebt - totalExp;
    return { totalQty, totalDebt, totalComm, totalExp, netProfit };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const map: Record<string, any> = {};
    sales.forEach(s => {
      const parts = s.date.split('-');
      const k = `${parts[0]}-${parts[1]}`;
      if (!map[k]) map[k] = { y: +parts[0], m: +parts[1]-1, credits: 0, debt: 0, debits: 0 };
      map[k].debt += calculateReinvestment(s.quantity, s.repaymentRate);
    });
    commissions.forEach(c => {
      const k = `${c.year}-${(MONTHS.indexOf(c.month)+1).toString().padStart(2,'0')}`;
      if (!map[k]) map[k] = { y: c.year, m: MONTHS.indexOf(c.month), credits: 0, debt: 0, debits: 0 };
      map[k].credits += c.commissionValue;
    });
    expenses.forEach(e => {
      const parts = e.date.split('-');
      const k = `${parts[0]}-${parts[1]}`;
      if (!map[k]) map[k] = { y: +parts[0], m: +parts[1]-1, credits: 0, debt: 0, debits: 0 };
      map[k].debits += e.value;
    });
    return Object.values(map)
      .map((r: any) => ({ ...r, bal: r.credits - r.debt - r.debits, name: MONTHS[r.m] }))
      .sort((a, b) => b.y - a.y || b.m - a.m);
  }, [sales, commissions, expenses]);

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    setInsights(null);
    if ('vibrate' in navigator) navigator.vibrate([15, 60, 15]);
    try {
      const res = await generateBusinessInsights({ sales, commissions, expenses, settings });
      setInsights(res);
    } catch (err) {
      setInsights("Erro ao gerar insights. Verifique a chave API.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleExportCSV = useCallback(() => {
    const headers = ['Tipo', 'ID Ref', 'Data/Periodo', 'Qtd (Unidades)', 'Valor (MT)'];
    const rows = [headers.join(',')];
    filteredData.sales.forEach(s => {
      const debt = calculateReinvestment(s.quantity, s.repaymentRate);
      rows.push(['Venda-Divida', s.id.slice(-6).toUpperCase(), s.date, s.quantity, escapeCSV(-debt)].join(','));
    });
    filteredData.commissions.forEach(c => rows.push(['Comissão', c.id.slice(-6).toUpperCase(), `${c.month} ${c.year}`, '-', escapeCSV(c.commissionValue)].join(',')));
    filteredData.expenses.forEach(e => rows.push(['Despesa', e.id.slice(-6).toUpperCase(), e.date, '-', escapeCSV(-e.value)].join(',')));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Wise_Relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredData]);

  const handleRestoreBackup = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.data) {
          setConfirmModal({
            isOpen: true,
            type: 'warning',
            title: "Restaurar Backup",
            message: t.restoreWarn,
            onConfirm: () => {
              setSales(json.data.sales || []);
              setCommissions(json.data.commissions || []);
              setExpenses(json.data.expenses || []);
              if (json.data.settings) setSettings(prev => ({ ...prev, ...json.data.settings }));
              alert("Dados restaurados com sucesso!");
              setShowSettings(false);
            }
          });
        }
      } catch (err) { alert("Erro ao ler o ficheiro."); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [t.restoreWarn]);

  const NavBtn = ({ v, ic: I, l, m = false }: { v: ViewMode, ic: any, l: string, m?: boolean }) => (
    <button 
      onClick={() => changeView(v)} 
      className={m 
        ? `flex flex-col items-center justify-center flex-1 py-4 transition-all active:scale-90 touch-manipulation h-full ${view === v ? 'text-red-600' : 'text-slate-400'}` 
        : `w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all touch-manipulation active:scale-95 ${view === v ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
      }
    >
      <I size={m ? 26 : 22} strokeWidth={2.5} />
      <span className={m ? "text-[8px] mt-1.5 uppercase font-black tracking-widest text-center" : "font-black text-[11px] uppercase tracking-widest"}>{l}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans overscroll-none selection:bg-red-100 antialiased">
      <input type="file" ref={fileInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings} 
        onSave={setSettings} 
        onFullBackup={() => { /* Implementado no modal */ }}
        onRestoreBackup={() => fileInputRef.current?.click()}
        onExportAllCSV={() => {}}
        t={t} 
      />
      
      <ConfirmationModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal(p => ({...p, isOpen: false}))} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message} 
        confirmText={t.delete} 
        type={confirmModal.type}
      />
      
      <aside className="hidden md:flex w-72 bg-slate-950 text-white flex-col h-screen sticky top-0 z-50 shadow-2xl shrink-0">
        <div className="p-8 flex items-center gap-4 border-b border-white/5">
          <div className="bg-red-600 p-2.5 rounded-2xl shadow-xl border border-red-500"><GemIcon size={28} className="text-white" /></div>
          <div><span className="text-xl font-black text-white tracking-tighter">WISE</span><span className="text-[10px] font-black text-red-500 uppercase block tracking-[0.2em] -mt-1">CONTROL</span></div>
        </div>
        <nav className="px-5 py-8 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
          <NavBtn v="dashboard" ic={DashIcon} l={t.dash} />
          <NavBtn v="sales" ic={SalesIcon} l={t.sale} />
          <NavBtn v="commissions" ic={WalletIcon} l={t.comm} />
          <NavBtn v="expenses" ic={ExpenseIcon} l={t.exp} />
          <NavBtn v="summary" ic={SummaryIcon} l={t.sum} />
        </nav>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-3xl border-t border-slate-200 z-[100] flex items-center justify-around h-20 pb-safe shadow-[0_-15px_40px_rgba(0,0,0,0.08)] px-2">
          <NavBtn v="dashboard" ic={DashIcon} l={t.dash} m />
          <NavBtn v="sales" ic={SalesIcon} l={t.sale} m />
          <NavBtn v="commissions" ic={WalletIcon} l={t.comm} m />
          <NavBtn v="expenses" ic={ExpenseIcon} l={t.exp} m />
          <NavBtn v="summary" ic={SummaryIcon} l={t.sum} m />
      </nav>

      <main className="flex-1 h-screen overflow-y-auto relative pb-28 md:pb-12 bg-slate-50 overflow-x-hidden transition-all duration-300">
        <header className="bg-white/95 backdrop-blur-3xl border-b border-slate-200 px-6 sm:px-10 py-5 flex flex-col gap-5 sticky top-0 z-40 shadow-sm">
           <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-4">
               {view !== 'dashboard' ? (
                 <button 
                  onClick={() => changeView('dashboard')}
                  className="md:hidden bg-slate-900 p-2.5 rounded-xl text-white shadow-lg active:scale-90 transition-all flex items-center justify-center"
                 >
                   <BackIcon size={18} strokeWidth={3}/>
                 </button>
               ) : (
                 <div className="md:hidden bg-red-600 p-2.5 rounded-xl text-white shadow-lg"><GemIcon size={18} strokeWidth={3}/></div>
               )}
               <h1 className="text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-slate-900 uppercase truncate max-w-[150px] sm:max-w-none">
                 {t[view as keyof typeof t] || t.dash}
               </h1>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={handleExportCSV} className="p-3 bg-slate-50 text-slate-900 rounded-xl border-2 border-slate-200 hover:bg-slate-100 transition-all active:scale-90 shadow-sm" title={t.exportCsv}><ExportIcon size={20} strokeWidth={2.5}/></button>
               <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-90 shadow-lg" title={t.set}><SettingsIcon size={20} strokeWidth={2.5}/></button>
             </div>
           </div>

           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
               <button onClick={() => setFilterMode('monthly')} className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${filterMode === 'monthly' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>{t.monthly}</button>
               <button onClick={() => setFilterMode('range')} className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${filterMode === 'range' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'}`}>{t.range}</button>
             </div>
             <div className="flex-1 flex items-center gap-3 px-3">
               {filterMode === 'monthly' ? (
                 <div className="flex items-center gap-3 w-full">
                   <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value as Month)} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-900 cursor-pointer h-10 flex-1">
                     {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                   <div className="w-px h-4 bg-slate-300"></div>
                   <select value={selectedYear} onChange={(e) => setSelectedYear(+e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-900 cursor-pointer h-10 flex-1">
                     {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                   </select>
                 </div>
               ) : (
                 <div className="flex-1 flex items-center gap-3 justify-between">
                   <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-900 h-10 w-full" />
                   <RightIcon size={12} className="text-slate-400 shrink-0" />
                   <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none text-slate-900 h-10 w-full" />
                 </div>
               )}
             </div>
           </div>
        </header>

        <div className="p-4 sm:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
          {view === 'dashboard' && (<>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatsCard title={t.tQty} value={periodStats.totalQty.toString()} icon={PackIcon} color="purple" />
                <StatsCard title={t.net} value={formatMZN(periodStats.totalComm)} icon={WalletIcon} color="blue" />
                <StatsCard title={t.tDebt} value={formatMZN(-periodStats.totalDebt)} icon={ReinvestIcon} color="orange" />
                <StatsCard title={t.tExp} value={formatMZN(-periodStats.totalExp)} icon={ExpenseIcon} color="red" />
                <StatsCard title={t.tEarn} value={formatMZN(periodStats.netProfit)} icon={MoneyIcon} color="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-2 bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><BarChart3 size={18} className="text-blue-600"/> {t.perfChart}</h3>
                  <div className="h-[250px] sm:h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[...chartData].reverse()}>
                        <defs><linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.2}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient></defs>
                        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} />
                        <YAxis stroke="#cbd5e1" fontSize={9} fontWeight="900" axisLine={false} tickLine={false} tickFormatter={(val) => `${Math.floor(val/1000)}k`} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: '900', fontSize: '11px' }} />
                        <Area type="monotone" dataKey="bal" stroke="#dc2626" strokeWidth={5} fill="url(#colorSaldo)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>
               <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3"><Users size={18} className="text-purple-600"/> {t.distChart}</h3>
                  <div className="h-[250px] sm:h-[350px] flex items-center justify-center">
                    {periodStats.netProfit > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie 
                            data={[
                              { name: settings.partnerAName || 'Sócio A', value: periodStats.netProfit * (settings.partnerAPercentage/100) }, 
                              { name: settings.partnerBName || 'Sócio B', value: periodStats.netProfit * (settings.partnerBPercentage/100) }
                            ]} 
                            cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={10} dataKey="value" stroke="none"
                          >
                            <Cell fill="#dc2626" />
                            <Cell fill="#1e3a8a" />
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', paddingTop: '20px' }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center opacity-30 py-10">
                        <ReinvestIcon size={48} strokeWidth={1.5} className="mx-auto mb-4 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sem dividendos</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="relative group bg-slate-950 p-6 sm:p-12 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] pointer-events-none group-hover:bg-red-600/20 transition-all duration-700"></div>
               <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  <div className="flex items-center gap-5">
                     <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <Sparkles size={28} className="text-red-500 animate-pulse" />
                     </div>
                     <div>
                        <h3 className="text-lg font-black text-white tracking-tight">{t.aiTitle}</h3>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">Gemini Pro AI Analysis</p>
                     </div>
                  </div>
                  <button onClick={handleGetInsights} disabled={loadingInsights} className="w-full md:w-auto px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50">
                    {loadingInsights ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                    {loadingInsights ? t.aiLoading : t.aiBtn}
                  </button>
               </div>
               <div className="relative mt-8 p-6 sm:p-8 bg-white/5 border border-white/5 rounded-3xl min-h-[80px]">
                  {loadingInsights ? (
                    <div className="flex flex-col items-center gap-3 text-white/40 py-8">
                       <Loader2 size={32} className="animate-spin text-red-500" />
                       <p className="text-[9px] font-black uppercase tracking-widest">{t.aiLoading}</p>
                    </div>
                  ) : insights ? (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
                       <p className="text-white/80 text-sm leading-relaxed font-medium">{insights}</p>
                    </div>
                  ) : (
                    <div className="text-center py-4"><p className="text-white/20 text-[9px] font-black uppercase tracking-widest">{t.aiEmpty}</p></div>
                  )}
               </div>
            </div>
          </>)}

          {view === 'summary' && (<div className="space-y-6">
              <div className="md:hidden space-y-6">
                {chartData.map(r => (
                  <div 
                    key={`${r.y}-${r.m}`} 
                    className="bg-white rounded-[2rem] p-7 border-2 border-slate-200 shadow-sm space-y-6 will-change-transform transform-gpu"
                    style={{ contain: 'content' }}
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <span className="font-black text-xs uppercase text-slate-900">{r.name} / {r.y}</span>
                      <span className={`font-black text-base ${r.bal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatMZN(r.bal)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                          <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">{settings.partnerAName || 'Sócio A'}</p>
                          <p className="font-black text-red-700 text-sm">{r.bal > 0 ? formatMZN(r.bal * (settings.partnerAPercentage / 100)) : formatMZN(0)}</p>
                       </div>
                       <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                          <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">{settings.partnerBName || 'Sócio B'}</p>
                          <p className="font-black text-blue-700 text-sm">{r.bal > 0 ? formatMZN(r.bal * (settings.partnerBPercentage / 100)) : formatMZN(0)}</p>
                       </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">
                       <span>Comissão: {formatMZN(r.credits)}</span>
                       <span>Despesas: {formatMZN(r.debt + r.debits)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto custom-scrollbar min-h-[400px]">
                <table className="w-full text-[10px] text-left min-w-[1000px]">
                  <thead className="bg-slate-950 text-white font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-10 py-6">Mês Referência</th>
                      <th className="px-6 py-6 text-right">Comissões (+)</th>
                      <th className="px-6 py-6 text-right">Reinvestimento (-)</th>
                      <th className="px-6 py-6 text-right">Despesas (-)</th>
                      <th className="px-8 py-6 text-right bg-slate-900 border-x border-white/10">LUCRO LÍQUIDO</th>
                      <th className="px-8 py-6 text-right text-red-400">{settings.partnerAName || 'Sócio A'} ({settings.partnerAPercentage}%)</th>
                      <th className="px-8 py-6 text-right text-blue-400">{settings.partnerBName || 'Sócio B'} ({settings.partnerBPercentage}%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {chartData.map(r => (
                      <tr key={`${r.y}-${r.m}`} className="hover:bg-slate-50/80 transition-all">
                        <td className="px-10 py-6 font-black uppercase text-slate-900 text-xs">{r.name} / {r.y}</td>
                        <td className="px-6 py-6 text-right text-emerald-700 font-bold">{r.credits > 0 ? formatMZN(r.credits) : '-'}</td>
                        <td className="px-6 py-6 text-right text-orange-600 font-bold">{r.debt > 0 ? formatMZN(-r.debt) : '-'}</td>
                        <td className="px-6 py-6 text-right text-red-600 font-bold">{r.debits > 0 ? formatMZN(-r.debits) : '-'}</td>
                        <td className={`px-8 py-6 text-right font-black bg-slate-100/50 border-x border-slate-200 text-sm ${r.bal >= 0 ? 'text-slate-950' : 'text-red-700'}`}>{formatMZN(r.bal)}</td>
                        <td className="px-8 py-6 text-right font-black text-red-700 bg-red-50/20">{r.bal > 0 ? formatMZN(r.bal * (settings.partnerAPercentage / 100)) : formatMZN(0)}</td>
                        <td className="px-8 py-6 text-right font-black text-blue-700 bg-blue-50/20">{r.bal > 0 ? formatMZN(r.bal * (settings.partnerBPercentage / 100)) : formatMZN(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>)}

          {view === 'sales' && (<SalesTable sales={filteredData.sales} onAddSale={s => setSales(p => [{...s, id: generateId()}, ...p])} onEditSale={s => setSales(p => p.map(x => x.id === s.id ? s : x))} onDeleteSale={id => setConfirmModal({ isOpen: true, type: 'danger', title: t.confirmDelTitle, message: t.confirmDelMsg, onConfirm: () => setSales(p => p.filter(x => x.id !== id))})} settings={settings} />)}
          {view === 'commissions' && (<CommissionsTable commissions={filteredData.commissions} onAddCommission={c => setCommissions(p => [{...c, id: generateId()}, ...p])} onEditCommission={c => setCommissions(p => p.map(x => x.id === c.id ? c : x))} onDeleteCommission={id => setConfirmModal({ isOpen: true, type: 'danger', title: t.confirmDelTitle, message: t.confirmDelMsg, onConfirm: () => setCommissions(p => p.filter(x => x.id !== id))})} settings={settings} />)}
          {view === 'expenses' && (<ExpensesTable expenses={filteredData.expenses} onAddExpense={e => setExpenses(p => [{...e, id: generateId()}, ...p])} onEditExpense={e => setExpenses(p => p.map(x => x.id === e.id ? e : x))} onDeleteExpense={id => setConfirmModal({ isOpen: true, type: 'danger', title: t.confirmDelTitle, message: t.confirmDelMsg, onConfirm: () => setExpenses(p => p.filter(x => x.id !== id))})} settings={settings} />)}
        </div>
      </main>
    </div>
  );
};

export default App;
