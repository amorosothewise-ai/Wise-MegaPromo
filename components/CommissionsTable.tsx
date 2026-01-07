
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
    if (isFuturePeriod(month, year)) {
      setError({ message: "Impossível registrar comissão de período futuro." });
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

  const handleEditSave = () => {
    if (!editForm) return;
    setError(null);
    if (isFuturePeriod(editForm.month, editForm.year)) {
      setError({ message: "Data futura não permitida para comissão." });
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
      return;
    }
    onEditCommission(editForm);
    setEditingId(null);
  };

  const filteredAndSortedComms = useMemo(() => {
    const l = searchTerm.toLowerCase();
    let result = commissions.filter(c => 
      c.month.toLowerCase().includes(l) || c.operator.toLowerCase().includes(l) || c.year.toString().includes(l) || c.id.toLowerCase().includes(l)
    );

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
  }, [commissions, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedComms.length / ITEMS_PER_PAGE);
  const paginatedComms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedComms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedComms, currentPage]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm min-h-[48px]";

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideInRow { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-row { animation: slideInRow 0.3s ease-out forwards; }
      `}</style>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <div className="bg-red-50 p-2 rounded-lg border border-red-100 shadow-sm"><Wallet className="text-red-600" size={18} /></div>
            Registro de Comissões
          </h2>
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-black rounded-2xl flex items-center gap-3 animate-pulse border border-red-200"><AlertCircle size={20}/>{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Ano</label><input type="number" max={currentYear} value={year} onChange={(e)=>setYear(+e.target.value)} className={inputClass} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Mês</label><select value={month} onChange={(e)=>setMonth(e.target.value as Month)} className={inputClass}>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Operadora</label><select value={operator} onChange={(e)=>setOperator(e.target.value as Operator)} className={inputClass}>{OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}</select></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Valor (MT)</label><input type="number" step="0.01" value={value} onChange={(e)=>setValue(e.target.value)} className={inputClass} placeholder="0,00" /></div>
            <button type="submit" className="w-full bg-red-600 text-white rounded-2xl font-black text-xs uppercase py-4 shadow-xl border border-red-700 min-h-[50px]">Registrar</button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Pesquisar período ou Ref..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none shadow-sm focus:border-red-600 min-h-[48px]" />
          </div>
          <div className="flex items-center gap-3">
             {selectedIds.size > 0 && <button onClick={()=>{onDeleteMultipleCommissions?.(Array.from(selectedIds)); setSelectedIds(new Set());}} className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-xs font-black border border-red-200 min-h-[44px]">Excluir ({selectedIds.size})</button>}
             <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700"><ChevronRight size={18}/></button>
             </div>
          </div>
        </div>

        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[850px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10"><button onClick={()=>setSelectedIds(selectedIds.size === paginatedComms.length ? new Set() : new Set(paginatedComms.map(c=>c.id)))} className="min-h-[44px] min-w-[44px] flex items-center justify-center">{selectedIds.size === paginatedComms.length && paginatedComms.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></th>
                <th className="px-4 py-5">Ref.</th>
                <th className="px-4 py-5 cursor-pointer hover:bg-slate-100" onClick={()=>setSortConfig({key:'period', order: sortConfig.order==='asc'?'desc':'asc'})}>Período <ArrowUpDown size={10} className="inline ml-1"/></th>
                <th className="px-8 py-5">Operadora</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedComms.map((c, idx) => {
                const isEd = editingId === c.id;
                return (
                  <tr key={c.id} className={`${isEd?'bg-amber-50':'hover:bg-slate-50'} transition-colors animate-row`} style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-6 py-4"><button onClick={()=>toggleSelect(c.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400">{selectedIds.has(c.id) ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}</button></td>
                    <td className="px-4 py-5 font-mono text-[10px] text-slate-400">#{c.id.slice(-4).toUpperCase()}</td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4 flex gap-1"><select value={editForm?.month} onChange={e=>setEditForm(p=>p?{...p,month:e.target.value as Month}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold">{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select><input type="number" max={currentYear} value={editForm?.year} onChange={e=>setEditForm(p=>p?{...p,year:+e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg w-20 text-xs font-bold"/></td>
                        <td className="px-8 py-4"><select value={editForm?.operator} onChange={e=>setEditForm(p=>p?{...p,operator:e.target.value as Operator}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold">{OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}</select></td>
                        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.commissionValue} onChange={e=>setEditForm(p=>p?{...p,commissionValue:+e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg w-28 text-xs font-bold"/></td>
                        <td className="px-8 py-4 text-right flex justify-end gap-2"><button onClick={handleEditSave} className="p-2 bg-emerald-600 text-white rounded-lg"><Check size={18}/></button><button onClick={()=>setEditingId(null)} className="p-2 bg-slate-200 rounded-lg"><X size={18}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-700 uppercase text-xs">{c.month} {c.year}</td>
                        <td className="px-8 py-5"><span className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase border-2 shadow-sm ${c.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>{c.operator}</span></td>
                        <td className="px-8 py-5 font-black text-slate-900">{formatMZN(c.commissionValue)}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button onClick={()=>{setEditingId(c.id); setEditForm({...c});}} className="p-2.5 bg-white border-2 border-blue-100 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"><Pencil size={18}/></button>
                          <button onClick={()=>onDeleteCommission(c.id)} className="p-2.5 bg-white border-2 border-red-100 text-red-700 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visualização Mobile (Cards) - Paridade com Desktop */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-slate-50">
          {paginatedComms.length > 0 ? paginatedComms.map((c, idx) => (
            <div key={c.id} className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4 animate-row" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref: #{c.id.slice(-4).toUpperCase()} | {c.month} {c.year}</p>
                   <p className="font-black text-slate-900 text-lg">{formatMZN(c.commissionValue)}</p>
                 </div>
                 <span className={`px-4 py-1.5 rounded-xl font-black text-[9px] uppercase border-2 shadow-sm ${c.operator===Operator.MPesa?'bg-red-600 text-white border-red-700':'bg-amber-600 text-white border-amber-700'}`}>{c.operator}</span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <button onClick={()=>{setEditingId(c.id); setEditForm({...c});}} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-blue-100 text-blue-700 rounded-2xl font-black text-xs active:bg-blue-50 min-h-[48px] shadow-sm"><Pencil size={16}/> Editar</button>
                 <button onClick={()=>onDeleteCommission(c.id)} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-red-100 text-red-700 rounded-2xl font-black text-xs active:bg-red-50 min-h-[48px] shadow-sm"><Trash2 size={16}/> Excluir</button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center space-y-4 opacity-50"><SearchX size={48} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-[10px]">Sem comissões registradas</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
