
import React, { useState, useMemo } from 'react';
import { MonthlyCommission, Month, Operator } from '../types';
import { MONTHS, OPERATORS, formatMZN, isFuturePeriod } from '../constants';
import { Trash2, Pencil, Check, X, Wallet, Search, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, SearchX } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (c: Omit<MonthlyCommission, 'id'>) => void;
  onEditCommission: (c: MonthlyCommission) => void;
  onDeleteCommission: (id: string) => void;
  onDeleteMultipleCommissions?: (ids: string[]) => void;
}

const ITEMS_PER_PAGE = 10;
type SortKey = 'period' | 'operator' | 'value';
type SortOrder = 'asc' | 'desc' | null;

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onEditCommission, onDeleteCommission, onDeleteMultipleCommissions }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(MONTHS[currentMonthIdx] as Month);
  const [operator, setOperator] = useState(Operator.MPesa);
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyCommission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState<Operator | 'all'>('all');
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'period', order: 'desc' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFuturePeriod(month, year)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    if (!value || Number(value) <= 0) {
      setError({ field: 'value', message: "Valor inválido." });
      return;
    }
    onAddCommission({ year, month, operator, commissionValue: +value });
    setValue('');
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    if (isFuturePeriod(editForm.month, editForm.year)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    onEditCommission(editForm);
    setEditingId(null);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedComms = useMemo(() => {
    const l = searchTerm.toLowerCase().trim();
    let result = commissions.filter(c => {
      const matchText = (
        c.month.toLowerCase().includes(l) || 
        c.operator.toLowerCase().includes(l) || 
        c.year.toString().includes(l) || 
        c.id.toLowerCase().includes(l)
      );
      const matchOperator = operatorFilter === 'all' || c.operator === operatorFilter;
      return matchText && matchOperator;
    });

    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'period') { valA = a.year * 100 + MONTHS.indexOf(a.month); valB = b.year * 100 + MONTHS.indexOf(b.month); }
        else if (sortConfig.key === 'operator') { valA = a.operator; valB = b.operator; }
        else if (sortConfig.key === 'value') { valA = a.commissionValue; valB = b.commissionValue; }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [commissions, searchTerm, operatorFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedComms.length / ITEMS_PER_PAGE);
  const paginatedComms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedComms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedComms, currentPage]);

  const toggleSelect = (id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(5);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const inputClass = "w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm min-h-[50px] touch-manipulation";

  return (
    <div className="space-y-6">
      <style>{`
        .scroll-item { will-change: transform, opacity; transform: translateZ(0); }
      `}</style>
      <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b-2 border-slate-100 bg-slate-50/30">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="bg-red-600 p-2 rounded-xl text-white shadow-lg"><Wallet size={18} /></div>
            Relatório de Comissões
          </h2>
          {error && <div className="mb-6 p-4 bg-red-100 text-red-700 text-xs font-black rounded-xl border border-red-200 animate-pulse">{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Ano</label><input type="number" max={currentYear} value={year} onChange={(e)=>setYear(+e.target.value)} className={inputClass} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Mês</label><select value={month} onChange={(e)=>setMonth(e.target.value as Month)} className={inputClass}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Operadora</label><select value={operator} onChange={(e)=>setOperator(e.target.value as Operator)} className={inputClass}>{OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Valor Final</label><input type="number" step="0.01" value={value} onChange={(e)=>setValue(e.target.value)} className={inputClass} placeholder="0,00 MT" /></div>
            <button type="submit" className="w-full bg-red-600 text-white rounded-2xl font-black text-xs uppercase py-5 shadow-xl border-b-4 border-red-800 active:scale-95 transition-all min-h-[56px] touch-manipulation">Salvar Ganhos</button>
          </form>
        </div>

        <div className="px-6 py-6 border-b-2 border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Filtrar lançamentos..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-red-600 shadow-sm min-h-[50px]" />
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-200 w-full sm:w-auto">
               {(['all', ...OPERATORS] as const).map(op => (
                 <button 
                  key={op} 
                  onClick={() => {setOperatorFilter(op); setCurrentPage(1);}}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex-1 sm:flex-none touch-manipulation min-h-[40px] ${operatorFilter === op ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500'}`}
                 >
                   {op === 'all' ? 'Tudo' : op}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto justify-between">
             {selectedIds.size > 0 && <button onClick={()=>{onDeleteMultipleCommissions?.(Array.from(selectedIds)); setSelectedIds(new Set());}} className="bg-red-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black active:scale-90 transition-all shadow-xl min-h-[48px] touch-manipulation">ELIMINAR ({selectedIds.size})</button>}
             <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:bg-slate-50 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"><ChevronLeft size={20}/></button>
                <span className="text-[10px] font-black text-slate-400 uppercase w-10 text-center">{currentPage}/{Math.max(1, totalPages)}</span>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-3 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 active:bg-slate-50 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"><ChevronRight size={20}/></button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[900px]">
            <thead className="bg-slate-100 text-slate-900 font-black uppercase tracking-widest text-[9px] border-b-2 border-slate-200">
              <tr>
                <th className="px-8 py-6 w-10"><button onClick={()=>setSelectedIds(selectedIds.size === paginatedComms.length ? new Set() : new Set(paginatedComms.map(c=>c.id)))} className="min-h-[44px] min-w-[44px] flex items-center justify-center">{selectedIds.size === paginatedComms.length && paginatedComms.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></th>
                <th className="px-4 py-6">Ref.</th>
                <th className="px-4 py-6 cursor-pointer" onClick={()=>handleSort('period')}>Período <ArrowUpDown size={14} className="inline ml-1 transition-colors text-slate-300"/></th>
                <th className="px-8 py-6 cursor-pointer" onClick={()=>handleSort('operator')}>Operadora <ArrowUpDown size={14} className="inline ml-1 transition-colors text-slate-300"/></th>
                <th className="px-8 py-6 cursor-pointer" onClick={()=>handleSort('value')}>Comissão <ArrowUpDown size={14} className="inline ml-1 transition-colors text-slate-300"/></th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100">
              {paginatedComms.map((c) => {
                const isEd = editingId === c.id;
                const isSelected = selectedIds.has(c.id);
                return (
                  <tr key={c.id} className={`${isEd?'bg-amber-50':isSelected?'bg-red-50/30':'hover:bg-slate-50/50'} transition-all group scroll-item`}>
                    <td className="px-8 py-5"><button onClick={()=>toggleSelect(c.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-300 group-hover:text-slate-400 transition-all">{isSelected ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></td>
                    <td className="px-4 py-5 font-mono text-[10px] text-slate-400 font-black uppercase">#{c.id.slice(-6)}</td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4 flex gap-2"><select value={editForm?.month} onChange={e=>setEditForm(p=>p?{...p,month:e.target.value as Month}:null)} className="p-3 border-2 border-amber-300 rounded-xl text-[10px] font-black">{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select><input type="number" max={currentYear} value={editForm?.year} onChange={e=>setEditForm(p=>p?{...p,year:+e.target.value}:null)} className="p-3 border-2 border-amber-300 rounded-xl w-24 text-[10px] font-black"/></td>
                        <td className="px-8 py-4"><select value={editForm?.operator} onChange={e=>setEditForm(p=>p?{...p,operator:e.target.value as Operator}:null)} className="p-3 border-2 border-amber-300 rounded-xl text-[10px] font-black uppercase">{OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}</select></td>
                        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.commissionValue} onChange={e=>setEditForm(p=>p?{...p,commissionValue:+e.target.value}:null)} className="p-3 border-2 border-amber-300 rounded-xl w-32 text-[10px] font-black"/></td>
                        <td className="px-8 py-4 text-right flex justify-end gap-3"><button onClick={handleEditSave} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg border-b-4 border-blue-800 transition-all min-h-[44px] min-w-[44px]"><Check size={18}/></button><button onClick={()=>setEditingId(null)} className="p-3 bg-slate-400 text-white rounded-xl shadow-lg border-b-4 border-slate-600 transition-all min-h-[44px] min-w-[44px]"><X size={18}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-900 uppercase text-xs tracking-tighter">{c.month} / {c.year}</td>
                        <td className="px-8 py-5"><span className={`px-5 py-2 rounded-2xl font-black text-[9px] uppercase border-2 shadow-sm ${c.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>{c.operator}</span></td>
                        <td className="px-8 py-5 font-black text-slate-900 text-base tracking-tighter">{formatMZN(c.commissionValue)}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={()=>{setEditingId(c.id); setEditForm({...c});}} className="p-3 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"><Pencil size={18}/></button>
                          <button onClick={()=>onDeleteCommission(c.id)} className="p-3 bg-white border-2 border-red-600 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={18}/></button>
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
