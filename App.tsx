
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LayoutDashboard, Wallet, TrendingUp, DollarSign, BrainCircuit, BarChart3, Gem, Calendar, ArrowUpRight, ArrowDownRight, Minus, ClipboardCheck, Users, PieChart, Globe, Download, Upload, Trash2, Settings, Filter, Receipt, Menu, Save, FolderOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend } from 'recharts';
import { StatsCard } from './components/StatsCard';
import { SalesTable } from './components/SalesTable';
import { CommissionsTable } from './components/CommissionsTable';
import { ExpensesTable } from './components/ExpensesTable';
import { SettingsModal } from './components/SettingsModal';
import { AppState, DiamondSale, MonthlyCommission, ViewMode, Language, AppSettings, Expense } from './types';
import { INITIAL_SALES, INITIAL_COMMISSIONS, INITIAL_EXPENSES, calculateSaleMetrics, MONTHS, FACTORS } from './constants';
import { generateBusinessInsights } from './services/geminiService';

const generateId = () => typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);
const safeParse = <T,>(k: string, fb: T): T => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : fb; } catch { return fb; } };
const safeStore = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error('Storage Error', e); } };

// Helper to parse "YYYY-MM-DD" securely without timezone shifts
const getYearMonth = (dateStr: string) => {
  const [y, m] = dateStr.split('-').map(Number);
  return { year: y, monthIndex: m - 1 };
};

const T = {
  pt: { 
    dash: 'Dashboard', sale: 'Vendas', comm: 'Comissões', exp: 'Despesas', sum: 'Resumo', wel: 'Bem-vindo', net: 'Lucro Líquido (Vendas)', tComm: 'Total Comissões', tExp: 'Total Despesas', tEarn: 'Lucro Real Final', mEarn: 'Lucro Real (Mês)', trend: 'vs mês ant.', monthClose: 'Fechamento Mensal', bal: 'Saldo Final', p40: 'Sócio 40%', p60: 'Sócio 60%', compA: 'Comparativo Anual', compM: 'Comparativo Mensal', ai: 'Analista AI', gen: 'Gerar Relatório', proc: 'Processando...', noData: 'Sem dados.', curr: 'Mês Atual', hist: 'Histórico', expJ: 'Exportar JSON', impJ: 'Importar JSON', del: 'Confirmar exclusão?', set: 'Configurações', loc: 'Backup Local', save: 'Salvar', load: 'Baixar',
    clickToGen: 'Clique para gerar insights', period: 'Período', partnerSplit: 'Divisão de Sócios', settingsTitle: 'Configurações', defaultRateLabel: 'Taxa Padrão', defaultRateDesc: 'Valor usado para calcular dívida padrão', cancel: 'Cancelar', syncOk: 'Sincronização concluída!', impErr: 'Erro ao importar arquivo.'
  },
  en: { 
    dash: 'Dashboard', sale: 'Sales', comm: 'Commissions', exp: 'Expenses', sum: 'Summary', wel: 'Welcome', net: 'Net Profit', tComm: 'Total Comm', tExp: 'Total Exp', tEarn: 'Real Profit', mEarn: 'Real Profit (Mo)', trend: 'vs prev.', monthClose: 'Monthly Close', bal: 'Balance', p40: 'Partner 40%', p60: 'Partner 60%', compA: 'Annual Comp', compM: 'Monthly Comp', ai: 'AI Analyst', gen: 'Gen Report', proc: 'Processing...', noData: 'No Data.', curr: 'Current Month', hist: 'History', expJ: 'Export JSON', impJ: 'Import JSON', del: 'Delete?', set: 'Settings', loc: 'Local Backup', save: 'Save', load: 'Load',
    clickToGen: 'Click to generate insights', period: 'Period', partnerSplit: 'Partner Split', settingsTitle: 'Settings', defaultRateLabel: 'Default Rate', defaultRateDesc: 'Value used for default debt calculation', cancel: 'Cancel', syncOk: 'Sync successful!', impErr: 'Error importing file.'
  }
};

// Components extracted to prevent re-renders
interface NavBtnProps {
  v: ViewMode;
  ic: any;
  l: string;
  m?: boolean;
  current: ViewMode;
  setView: (v: ViewMode) => void;
}

const NavBtn: React.FC<NavBtnProps> = ({ v, ic: I, l, m = false, current, setView }) => (
  <button 
    onClick={() => setView(v)} 
    className={m 
      ? `flex flex-col items-center p-2 rounded-xl ${current === v ? 'text-red-600 bg-red-50' : 'text-slate-400'}` 
      : `w-full flex items-center gap-3 px-4 py-3 rounded-lg ${current === v ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-blue-800 hover:text-white'}`
    }
  >
    {m ? (
      <>
        <I size={20} />
        <span className="text-[10px] mt-1">{l}</span>
      </>
    ) : (
      <>
        <I size={20} />
        <span className="font-medium">{l}</span>
      </>
    )}
  </button>
);

const Growth = ({ v, p }: { v: number, p: boolean }) => {
  if (!p) return <span className="text-slate-400 text-xs">-</span>;
  
  return (
    <span className={`text-xs font-bold flex gap-1 ${v > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {v > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(v).toFixed(1)}%
    </span>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [lang, setLang] = useState<Language>('pt');
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => safeParse('diamond_settings', { 
    defaultRepaymentRate: FACTORS.DEFAULT_DIVIDA_REPOR, 
    defaultSalePrice: FACTORS.VALOR_RECEBIDO, 
    defaultGrossCommission: FACTORS.COMISSAO_BRUTA 
  }));
  
  const [sales, setSales] = useState<DiamondSale[]>(() => safeParse('diamond_sales', INITIAL_SALES));
  const [commissions, setCommissions] = useState<MonthlyCommission[]>(() => { 
    const s = safeParse<any[]>('diamond_commissions', INITIAL_COMMISSIONS); 
    return s.map((c: any) => ({...c, year: c.year || new Date().getFullYear()})); 
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => safeParse('diamond_expenses', INITIAL_EXPENSES));
  
  const [insight, setInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGenInsight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  useEffect(() => { safeStore('diamond_sales', sales); }, [sales]);
  useEffect(() => { safeStore('diamond_commissions', commissions); }, [commissions]);
  useEffect(() => { safeStore('diamond_expenses', expenses); }, [expenses]);
  useEffect(() => { safeStore('diamond_settings', settings); }, [settings]);

  const t = T[lang];
  const today = new Date();
  const currMIdx = today.getMonth();
  const currY = today.getFullYear();
  const currMName = MONTHS[currMIdx];

  const cmSales = useMemo(() => sales.filter(s => { 
    const { year, monthIndex } = getYearMonth(s.date);
    return monthIndex === currMIdx && year === currY; 
  }), [sales, currMIdx, currY]);

  const cmStats = useMemo(() => ({
    profit: cmSales.reduce((a, s) => a + calculateSaleMetrics(s).lucroLiquido, 0),
    comm: commissions.filter(c => c.month === currMName && c.year === currY).reduce((a, c) => a + c.commissionValue, 0),
    exp: expenses.filter(e => { 
      const { year, monthIndex } = getYearMonth(e.date);
      return monthIndex === currMIdx && year === currY; 
    }).reduce((a, e) => a + e.value, 0)
  }), [cmSales, commissions, expenses, currMName, currY, currMIdx]);

  const cmTotal = (cmStats.profit + cmStats.comm) - cmStats.exp;

  const allStats = useMemo(() => ({
    profit: sales.reduce((a, s) => a + calculateSaleMetrics(s).lucroLiquido, 0),
    comm: commissions.reduce((a, c) => a + c.commissionValue, 0),
    exp: expenses.reduce((a, e) => a + e.value, 0)
  }), [sales, commissions, expenses]);

  const allTotal = (allStats.profit + allStats.comm) - allStats.exp;

  const volMetrics = useMemo(() => {
    const yMap: Record<number, number> = {}; 
    const mMap: Record<number, number> = {};

    sales.forEach(s => { 
      const { year, monthIndex } = getYearMonth(s.date);
      yMap[year] = (yMap[year] || 0) + s.quantity; 
      if (year === currY) {
        mMap[monthIndex] = (mMap[monthIndex] || 0) + s.quantity;
      }
    });
    
    const yData = Object.entries(yMap).map(([y, q]: any) => ({ year: +y, qty: q })).sort((a: any, b: any) => b.year - a.year);
    const mData = MONTHS.map((m, i) => ({ 
      name: m, 
      qty: mMap[i] || 0
    }));
    
    const calcG = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;
    
    return { 
        yComp: yData.map((d, i, arr) => ({ ...d, growth: arr[i+1] ? calcG(d.qty, arr[i+1].qty) : 0, hasPrev: !!arr[i+1] })),
        mComp: mData.map((d, i, arr) => ({ ...d, growth: i > 0 ? calcG(d.qty, arr[i-1].qty) : (d.qty > 0 ? 100 : 0), hasPrev: i > 0 }))
    };
  }, [sales, currY]);

  const reconData = useMemo(() => {
      const d: any = {};
      
      sales.forEach(s => { 
        const { year, monthIndex } = getYearMonth(s.date);
        const k = `${year}-${monthIndex}`; 
        if (!d[k]) d[k] = { y: year, m: monthIndex, sales: 0, debt: 0, comm: 0, exp: 0 }; 
        const m = calculateSaleMetrics(s); 
        d[k].sales += m.lucroLiquido; 
      });
      
      commissions.forEach(c => { 
        const mI = MONTHS.indexOf(c.month);
        const k = `${c.year}-${mI}`; 
        if (!d[k]) d[k] = { y: c.year, m: mI, sales: 0, debt: 0, comm: 0, exp: 0 }; 
        d[k].comm += c.commissionValue; 
      });
      
      expenses.forEach(e => { 
        const { year, monthIndex } = getYearMonth(e.date);
        const k = `${year}-${monthIndex}`; 
        if (!d[k]) d[k] = { y: year, m: monthIndex, sales: 0, debt: 0, comm: 0, exp: 0 }; 
        d[k].exp += e.value; 
      });
      
      return Object.values(d)
        .map((r: any) => { 
          const bal = (r.sales + r.comm) - r.exp; 
          return { ...r, bal, s40: bal * 0.4, s60: bal * 0.6, name: MONTHS[r.m] }; 
        })
        .sort((a: any, b: any) => (b.y - a.y) || (b.m - a.m))
        .filter((r: any) => (filterYear === 'all' || r.y == +filterYear) && (filterMonth === 'all' || r.m == +filterMonth));
  }, [sales, commissions, expenses, filterYear, filterMonth]);

  const cmChart = useMemo(() => 
    cmSales.reduce((a: any[], s) => { 
      const ex = a.find(i => i.date === s.date); 
      const p = calculateSaleMetrics(s).lucroLiquido; 
      ex ? ex.profit += p : a.push({ date: s.date, profit: p }); 
      return a; 
    }, [])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
  [cmSales]);

  const pieData = useMemo(() => [
    { name: t.p40, value: reconData.reduce((a, r) => a + r.s40, 0), color: '#9333ea' }, 
    { name: t.p60, value: reconData.reduce((a, r) => a + r.s60, 0), color: '#3b82f6' }
  ], [reconData, t]);

  const availYears = useMemo(() => 
    Array.from(new Set([...sales.map(s => getYearMonth(s.date).year), ...commissions.map(c => c.year)]))
    .sort((a, b) => b - a), 
  [sales, commissions]);

  // Pre-calculate sorted sales at top level to avoid using hooks in render
  const sortedSales = useMemo(() => [...sales].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales]);

  const fileImp = (e: any) => { 
    const f = e.target.files?.[0]; 
    if (!f) return; 
    const r = new FileReader(); 
    r.onload = (ev) => { 
      try { 
        const d = JSON.parse(ev.target?.result as string); 
        setSales(d.sales || sales); 
        setCommissions(d.commissions || commissions); 
        setExpenses(d.expenses || expenses); 
        setSettings(d.settings || settings); 
        alert(t.syncOk); 
      } catch { 
        alert(t.impErr);
      }
    }; 
    r.readAsText(f); 
    e.target.value = ''; 
  };

  const fileExp = () => { 
      const url = URL.createObjectURL(new Blob([JSON.stringify({ sales, commissions, expenses, settings })], { type: "application/json" })); 
      const a = document.createElement("a"); 
      a.href = url; 
      a.download = `backup_${new Date().toISOString().split('T')[0]}.json`; 
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a); 
      setTimeout(() => URL.revokeObjectURL(url), 2000); 
  };

  const genInsight = async () => { 
    setIsGenInsight(true); 
    try { 
      setInsight(await generateBusinessInsights({ sales, commissions, expenses, settings })); 
    } catch { 
      setInsight("Error generating insight."); 
    } finally { 
      setIsGenInsight(false); 
    } 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSave={setSettings} t={t} />
      <input type="file" ref={fileInputRef} onChange={fileImp} accept=".json" className="hidden" />

      <aside className="hidden md:flex w-64 bg-blue-900 text-blue-100 flex-shrink-0 flex-col h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="bg-red-600 p-2 rounded-lg"><Gem size={24} /></div>
          <span className="text-xl font-bold">Wise <span className="text-red-400">MegaPromo</span></span>
        </div>
        
        <nav className="px-4 py-6 space-y-2 flex-1 overflow-y-auto">
          <NavBtn v="dashboard" ic={LayoutDashboard} l={t.dash} current={view} setView={setView} />
          <NavBtn v="sales" ic={TrendingUp} l={t.sale} current={view} setView={setView} />
          <NavBtn v="commissions" ic={Wallet} l={t.comm} current={view} setView={setView} />
          <NavBtn v="expenses" ic={Receipt} l={t.exp} current={view} setView={setView} />
          <NavBtn v="summary" ic={PieChart} l={t.sum} current={view} setView={setView} />
          
          <div className="pt-8 px-3 space-y-2">
            <p className="text-[10px] uppercase text-blue-400 font-bold mt-4 pl-1 flex items-center gap-1"><FolderOpen size={10} /> {t.loc}</p>
            <button onClick={fileExp} className="w-full flex gap-3 px-4 py-2 hover:bg-blue-800 rounded-lg text-sm text-blue-200">
              <Save size={18}/>{t.expJ}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex gap-3 px-4 py-2 hover:bg-blue-800 rounded-lg text-sm text-blue-200">
              <Upload size={18}/>{t.impJ}
            </button>
            <button onClick={() => setShowSettings(true)} className="w-full flex gap-3 px-4 py-2 mt-4 hover:bg-blue-800 rounded-lg text-sm text-blue-200">
              <Settings size={18}/>{t.set}
            </button>
          </div>
        </nav>
        
        <div className="p-6 border-t border-blue-800 bg-blue-900 z-10">
          <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700">
            <h4 className="text-xs font-semibold text-blue-300 uppercase mb-2">{view === 'dashboard' ? t.mEarn : t.tEarn}</h4>
            <p className="text-2xl font-bold text-white">{(view === 'dashboard' ? cmTotal : allTotal).toLocaleString()} MZN</p>
          </div>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex justify-around p-2 pb-safe shadow">
          <NavBtn v="dashboard" ic={LayoutDashboard} l={t.dash} m current={view} setView={setView} />
          <NavBtn v="sales" ic={TrendingUp} l={t.sale} m current={view} setView={setView} />
          <NavBtn v="expenses" ic={Receipt} l={t.exp} m current={view} setView={setView} />
          <NavBtn v="summary" ic={PieChart} l={t.sum} m current={view} setView={setView} />
      </nav>

      <main className="flex-1 overflow-y-auto h-screen pb-24 md:pb-0">
        <header className="bg-white border-b px-4 py-4 flex justify-between sticky top-0 z-20 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="md:hidden bg-red-600 p-1.5 rounded-lg"><Gem size={18} className="text-white"/></div>
             <h1 className="text-lg font-semibold capitalize">{t[view as keyof typeof t] || t.dash}</h1>
           </div>
           
           <div className="flex items-center gap-3">
               <button onClick={() => setLang(l => l === 'pt' ? 'en' : 'pt')} className="flex gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold">
                 <Globe size={14}/>{lang.toUpperCase()}
               </button>
               <div className="hidden md:flex h-8 w-8 bg-red-100 rounded-full items-center justify-center font-bold text-red-600 border border-red-200">W</div>
               <button className="md:hidden p-2 bg-slate-50 rounded-full" onClick={() => setShowSettings(true)}>
                 <Settings size={20}/>
               </button>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
          {view === 'dashboard' && (<>
            <div className="mb-2">
              <h2 className="text-2xl font-bold">{currMName} {currY}</h2>
              <p className="text-sm text-slate-500">{t.curr}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title={t.net} value={`${cmStats.profit.toLocaleString()} MZN`} icon={TrendingUp} color="green" />
                <StatsCard title={t.tComm} value={`${cmStats.comm.toLocaleString()} MZN`} icon={Wallet} color="blue" />
                <StatsCard title={t.tExp} value={`-${cmStats.exp.toLocaleString()} MZN`} icon={Receipt} color="red" />
                <StatsCard title={t.tEarn} value={`${cmTotal.toLocaleString()} MZN`} icon={DollarSign} color="orange" />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border">
                  <h3 className="font-bold mb-4">{t.sale}</h3>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cmChart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                        <XAxis dataKey="date" tickFormatter={v => v.split('-')[2]} axisLine={false} tickLine={false}/>
                        <YAxis axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`}/>
                        <Tooltip/>
                        <Bar dataKey="profit" fill="#dc2626" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-800 to-red-700 rounded-xl p-6 text-white relative overflow-hidden flex flex-col">
                    <div className="flex gap-2 mb-4 z-10"><BrainCircuit size={20}/><h3 className="font-bold">{t.ai}</h3></div>
                    <div className="flex-1 bg-white/10 rounded p-4 mb-4 text-sm min-h-[120px]">
                      {isGeneratingInsight ? t.proc : insight || t.clickToGen}
                    </div>
                    <button onClick={genInsight} disabled={isGeneratingInsight} className="w-full py-2 bg-white text-red-600 font-bold rounded shadow z-10">
                      {t.gen}
                    </button>
                </div>
            </div>
          </>)}

          {view === 'summary' && (<>
            <div className="md:hidden space-y-3 mb-4">
                <h2 className="font-bold">{t.loc}</h2>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={fileExp} className="p-2 bg-white border rounded text-xs font-bold">{t.expJ}</button>
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white border rounded text-xs font-bold">{t.impJ}</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title={`TOTAL ${t.net}`} value={`${allStats.profit.toLocaleString()} MZN`} icon={TrendingUp} color="green" />
                <StatsCard title={`TOTAL ${t.tComm}`} value={`${allStats.comm.toLocaleString()} MZN`} icon={Wallet} color="blue" />
                <StatsCard title={`TOTAL ${t.tExp}`} value={`-${allStats.exp.toLocaleString()} MZN`} icon={Receipt} color="red" />
                <StatsCard title={`TOTAL ${t.tEarn}`} value={`${allTotal.toLocaleString()} MZN`} icon={DollarSign} color="orange" />
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b bg-emerald-50 flex flex-col gap-2">
                      <h3 className="font-bold text-emerald-900 flex gap-2"><ClipboardCheck size={20}/>{t.monthClose}</h3>
                      <div className="flex gap-2">
                        <select className="bg-white border p-1 rounded text-xs" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
                          <option value="all">All Y</option>{availYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select className="bg-white border p-1 rounded text-xs" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                          <option value="all">All M</option>{MONTHS.map((m,i) => <option key={m} value={i}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">{t.period}</th>
                            <th className="p-3 text-right">Vendas</th>
                            <th className="p-3 text-right">Comiss</th>
                            <th className="p-3 text-right">Desp</th>
                            <th className="p-3 text-right border-r">{t.bal}</th>
                            <th className="p-3 text-right bg-purple-100">{t.p40}</th>
                            <th className="p-3 text-right bg-blue-100">{t.p60}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reconData.map(r => (
                            <tr key={`${r.y}-${r.m}`} className="hover:bg-slate-50">
                              <td className="p-3 font-medium">{r.name} {r.y}</td>
                              <td className="p-3 text-right text-green-600">+{r.sales.toLocaleString()}</td>
                              <td className="p-3 text-right text-blue-600">+{r.comm.toLocaleString()}</td>
                              <td className="p-3 text-right text-red-500">-{r.exp.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold border-r">{r.bal.toLocaleString()}</td>
                              <td className="p-3 text-right bg-purple-50 text-slate-600">{r.s40.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                              <td className="p-3 text-right bg-blue-50 text-slate-600">{r.s60.toLocaleString(undefined,{maximumFractionDigits:2})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
                     <h3 className="font-bold text-slate-800 mb-2 flex gap-2"><Users size={20}/>{t.partnerSplit}</h3>
                     <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                         <RePieChart>
                           <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                             {pieData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                           </Pie>
                           <Tooltip/>
                           <Legend/>
                         </RePieChart>
                       </ResponsiveContainer>
                     </div>
                </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-blue-50"><h3 className="font-bold flex gap-2"><Calendar size={18}/>{t.compA}</h3></div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Year</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Vs Prev</th>
                          </tr>
                        </thead>
                        <tbody>
                          {volMetrics.yComp.map(i => (
                            <tr key={i.year}>
                              <td className="p-3">{i.year}</td>
                              <td className="p-3 text-right font-bold">{i.qty}</td>
                              <td className="p-3 text-right flex justify-end"><Growth v={i.growth} p={i.hasPrev}/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                </div>
                
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-4">
                    <div className="flex justify-between mb-4"><h3 className="font-bold">{t.compM} ({currY})</h3><Gem size={20} className="text-blue-200"/></div>
                    <div className="grid lg:grid-cols-2 gap-4">
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={volMetrics.mComp}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} fontSize={10}/>
                            <Tooltip/>
                            <Bar dataKey="qty" radius={[4,4,0,0]}>
                              {volMetrics.mComp.map((e,i) => <Cell key={i} fill={e.qty > 0 ? '#1e40af' : '#e2e8f0'}/>)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-auto max-h-60 border rounded">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 sticky top-0 text-slate-800 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2">Mo</th>
                              <th className="p-2 text-right">Qty</th>
                              <th className="p-2 text-right">Vs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {volMetrics.mComp.map(i => (
                              <tr key={i.name}>
                                <td className="p-2 text-xs uppercase">{i.name}</td>
                                <td className="p-2 text-right font-bold">{i.qty}</td>
                                <td className="p-2 text-right flex justify-end"><Growth v={i.growth} p={i.hasPrev}/></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </div>
            </div>
          </>)}

          {view === 'sales' && (
            <SalesTable 
              sales={sortedSales}
              onAddSale={s => setSales(p => [...p, {...s, id: generateId()}])} 
              onEditSale={s => setSales(p => p.map(x => x.id === s.id ? s : x))} 
              onDeleteSale={id => confirm(t.del) && setSales(p => p.filter(x => x.id !== id))} 
              settings={settings} 
            />
          )}
          
          {view === 'commissions' && (
            <CommissionsTable 
              commissions={commissions} 
              onAddCommission={c => setCommissions(p => [...p, {...c, id: generateId()}])} 
              onEditCommission={c => setCommissions(p => p.map(x => x.id === c.id ? c : x))} 
              onDeleteCommission={id => confirm(t.del) && setCommissions(p => p.filter(x => x.id !== id))} 
            />
          )}
          
          {view === 'expenses' && (
            <ExpensesTable 
              expenses={expenses} 
              onAddExpense={e => setExpenses(p => [...p, {...e, id: generateId()}])} 
              onEditExpense={e => setExpenses(p => p.map(x => x.id === e.id ? e : x))} 
              onDeleteExpense={id => confirm(t.del) && setExpenses(p => p.filter(x => x.id !== id))} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
