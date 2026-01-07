
import React, { useState, useMemo } from 'react';
import { MonthlyCommission, Month, Operator } from '../types';
import { MONTHS, OPERATORS, formatMZN } from '../constants';
import { Trash2, Pencil, Check, X, Wallet, Search, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (c: Omit<MonthlyCommission, 'id'>) => void;
  onEditCommission: (c: MonthlyCommission) => void;
  onDeleteCommission: (id: string) => void;
  onDeleteMultipleCommissions?: (ids: string[]) => void;
  tSearch?: string;
}

const ITEMS_PER_PAGE = 15;
type SortKey = 'period' | 'operator' | 'value';
type SortOrder = 'asc' | 'desc' | null;

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onEditCommission, onDeleteCommission, onDeleteMultipleCommissions, tSearch = "Pesquisar..." }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(MONTHS[currentMonthIdx] as Month);
  const [operator, setOperator] = useState(Operator.MPesa);
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyCommission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'period', order: 'desc' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (year > currentYear) {
      setError({ field: 'year', message: "Anos futuros não são permitidos." });
      return;
    }
    if (year === currentYear && MONTHS.indexOf(month) > currentMonthIdx) {
      setError({ field: 'month', message: "Não é possível registrar para meses futuros." });
      return;
    }
    if (!value || Number(value) <= 0) {
      setError({ field: 'value', message: "Informe um valor positivo." });
      return;
    }
    
    onAddCommission({ year, month, operator, commissionValue: +value });
    setValue('');
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const toggleSort = (key: SortKey) => {
    let order: SortOrder = 'desc';
    if (sortConfig.key === key) {
      if (sortConfig.order === 'desc') order = 'asc';
      else if (sortConfig.order === 'asc') order = null;
    }
    setSortConfig({ key, order });
  };

  const filteredAndSortedComms = useMemo(() => {
    const l = searchTerm.toLowerCase();
    let result = commissions.filter(c => 
      c.month.toLowerCase().includes(l) || c.operator.toLowerCase().includes(l) || c.year.toString().includes(l)
    );

    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'period') {
          valA = a.year * 100 + MONTHS.indexOf(a.month);
          valB = b.year * 100 + MONTHS.indexOf(b.month);
        } else if (sortConfig.key === 'operator') {
          valA = a.operator; valB = b.operator;
        } else if (sortConfig.key === 'value') {
          valA = a.commissionValue; valB = b.commissionValue;
        }
        
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      result.sort((a, b) => (b.year - a.year) || (MONTHS.indexOf(b.month) - MONTHS.indexOf(a.month)));
    }

    return result;
  }, [commissions, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedComms.length / ITEMS_PER_PAGE);
  const paginatedComms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedComms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedComms, currentPage]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if ('vibrate' in navigator) navigator.vibrate(5);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedComms.length && paginatedComms.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedComms.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (onDeleteMultipleCommissions && selectedIds.size > 0) {
      onDeleteMultipleCommissions(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-red-100 focus:border-red-600 outline-none transition-all placeholder:text-slate-500 shadow-sm min-h-[48px]";

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideInRow {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-row { animation: slideInRow 0.3s ease-out forwards; }
      `}</style>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-6 uppercase tracking-widest text-sm">
            <div className="bg-red-50 p-2 rounded-lg border-2 border-red-100 shadow-sm"><Wallet className="text-red-600" size={24} /></div>
            Comissões de Operadoras
          </h2>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 text-xs font-black rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertCircle size={20}/>
              {error.message}
            </div>
          )}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Ano</label>
              <input type="number" max={currentYear} value={year} onChange={(e)=>setYear(+e.target.value)} className={`${inputClass} ${error?.field === 'year' ? 'border-red-500' : ''}`} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Mês</label>
              <select value={month} onChange={(e)=>setMonth(e.target.value as Month)} className={`${inputClass} ${error?.field === 'month' ? 'border-red-500' : ''}`}>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Operadora</label>
              <select value={operator} onChange={(e)=>setOperator(e.target.value as Operator)} className={inputClass}>
                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Valor Bruto (MT)</label>
              <input type="number" step="0.01" value={value} onChange={(e)=>setValue(e.target.value)} className={`${inputClass} ${error?.field === 'value' ? 'border-red-500' : ''}`} placeholder="0,00" />
            </div>
            <button type="submit" className="w-full h-[52px] bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-200 border border-red-700">
              Registrar
            </button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-100 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" placeholder={tSearch} value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none shadow-sm focus:ring-4 focus:ring-red-100 min-h-[44px]" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {selectedIds.size > 0 && (
              <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black border border-red-200 animate-in zoom-in duration-200 hover:bg-red-200 active:scale-95 transition-all min-h-[44px]">
                <Trash2 size={16} /> Excluir ({selectedIds.size})
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{currentPage} / {Math.max(1, totalPages)}</span>
              <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-30 active:scale-90 transition-all shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white text-slate-700 disabled:opacity-30 active:scale-90 transition-all shadow-sm min-w-[44px] min-h-[44px] flex items-center justify-center"><ChevronRight size={18}/></button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar touch-pan-x">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10">
                  <button onClick={toggleSelectAll} className="p-2 text-slate-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                    {selectedIds.size === paginatedComms.length && paginatedComms.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}
                  </button>
                </th>
                <th className="px-4 py-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('period')}>
                  <div className="flex items-center gap-2">
                    Período Fiscal
                    {sortConfig.key === 'period' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('operator')}>
                  <div className="flex items-center gap-2">
                    Operadora
                    {sortConfig.key === 'operator' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5 cursor-pointer hover:bg-slate-100 transition-colors group" onClick={() => toggleSort('value')}>
                  <div className="flex items-center gap-2">
                    Valor Recebido
                    {sortConfig.key === 'value' ? (sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-red-600" /> : <ChevronDown size={14} className="text-red-600" />) : <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedComms.map((c, index) => {
                const isEd = editingId === c.id;
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr key={c.id} className={`${isEd?'bg-amber-50':isSelected?'bg-red-50/40':'hover:bg-slate-50'} transition-colors group animate-row`} style={{ animationDelay: `${index * 30}ms` }}>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(c.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
                        {isSelected ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}
                      </button>
                    </td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4 flex gap-2">
                           <select value={editForm?.month} onChange={(e)=>setEditForm(p=>p?{...p,month:e.target.value as Month}:null)} className="px-2 py-2 border-2 border-amber-300 rounded-lg text-xs font-black text-slate-900 bg-white min-h-[44px]">{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select>
                           <input type="number" max={currentYear} value={editForm?.year} onChange={(e)=>setEditForm(p=>p?{...p,year:+e.target.value}:null)} className="px-2 py-2 border-2 border-amber-300 rounded-lg w-24 text-xs font-black text-slate-900 bg-white min-h-[44px]"/>
                        </td>
                        <td className="px-8 py-4">
                           <select value={editForm?.operator} onChange={(e)=>setEditForm(p=>p?{...p,operator:e.target.value as Operator}:null)} className="px-2 py-2 border-2 border-amber-300 rounded-lg text-xs font-black text-slate-900 bg-white min-h-[44px]">{OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}</select>
                        </td>
                        <td className="px-8 py-4">
                           <input type="number" step="0.01" value={editForm?.commissionValue} onChange={(e)=>setEditForm(p=>p?{...p,commissionValue:+e.target.value}:null)} className="px-2 py-2 border-2 border-amber-300 rounded-lg w-36 font-black text-slate-900 bg-white min-h-[44px]"/>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={()=>{
                              if(editForm!.year > currentYear || (editForm!.year === currentYear && MONTHS.indexOf(editForm!.month) > currentMonthIdx)) {
                                setError({ message: "Meses futuros não permitidos." }); return;
                              }
                              onEditCommission(editForm!); setEditingId(null);
                            }} className="p-3 bg-emerald-600 text-white rounded-xl active:scale-90 shadow-md border border-emerald-700 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"><Check size={20}/></button>
                            <button onClick={()=>{setEditingId(null);setEditForm(null)}} className="p-3 bg-slate-200 text-slate-800 rounded-xl active:scale-90 shadow-md border border-slate-300 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"><X size={20}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-700 uppercase text-xs">{c.month} {c.year}</td>
                        <td className="px-8 py-5">
                          <span className={`px-5 py-2 rounded-2xl font-black text-[10px] uppercase border-2 shadow-sm ${c.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>
                            {c.operator}
                          </span>
                        </td>
                        <td className="px-8 py-5 font-black text-slate-900 text-base">{formatMZN(c.commissionValue)}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-3 transition-all">
                            <button onClick={()=>{setEditingId(c.id); setEditForm({...c})}} className="text-blue-700 p-3 bg-white border-2 border-blue-100 hover:bg-blue-50 rounded-xl active:scale-90 shadow-sm transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"><Pencil size={20}/></button>
                            <button onClick={()=>onDeleteCommission(c.id)} className="text-red-700 p-3 bg-white border-2 border-red-100 hover:bg-red-50 rounded-xl active:scale-90 shadow-sm transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={20}/></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
