
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Trash2, Pencil, Check, X, Receipt, Search, Tag, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, SearchX } from 'lucide-react';
import { EXPENSE_CATEGORIES, formatMZN, isFutureDate, formatDateDisplay } from '../constants';

interface ExpensesTableProps {
  expenses: Expense[];
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteMultipleExpenses?: (ids: string[]) => void;
}

const ITEMS_PER_PAGE = 15;
type SortKey = 'date' | 'category' | 'value' | 'description';
type SortOrder = 'asc' | 'desc' | null;

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense, onDeleteMultipleExpenses }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(maxDate);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'date', order: 'desc' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFutureDate(date)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    if (!description.trim() || !value || Number(value) <= 0) {
      setError({ field: 'form', message: "Preencha todos os campos." });
      return;
    }
    onAddExpense({ date, description, category, value: +value });
    setDescription(''); setValue('');
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    if (isFutureDate(editForm.date)) {
      setError({ message: "Data futura não permitida." });
      return;
    }
    onEditExpense(editForm);
    setEditingId(null);
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredAndSortedExpenses = useMemo(() => {
    const l = searchTerm.toLowerCase().trim();
    let result = expenses.filter(e => {
      const matchText = (
        e.description.toLowerCase().includes(l) || 
        e.category.toLowerCase().includes(l) || 
        e.date.includes(l) ||
        formatDateDisplay(e.date).includes(l) ||
        e.id.toLowerCase().includes(l)
      );
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchText && matchCategory;
    });

    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'date') { valA = a.date; valB = b.date; }
        else if (sortConfig.key === 'category') { valA = a.category; valB = b.category; }
        else if (sortConfig.key === 'value') { valA = a.value; valB = b.value; }
        else if (sortConfig.key === 'description') { valA = a.description; valB = b.description; }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [expenses, searchTerm, categoryFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedExpenses, currentPage]);

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm min-h-[52px] touch-manipulation";

  return (
    <div className="space-y-6">
      <style>{`
        .scroll-item { will-change: transform, opacity; transform: translateZ(0); }
      `}</style>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-lg"><Receipt size={20} /></div>
            Registro de Custos Fixos
          </h2>
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-black rounded-2xl border border-red-200 animate-pulse">{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Data</label><input type="date" required max={maxDate} value={date} onChange={(e)=>setDate(e.target.value)} className={inputClass} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Categoria</label><select value={category} onChange={(e)=>setCategory(e.target.value)} className={inputClass}>{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="lg:col-span-1 space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Descrição</label><input type="text" required value={description} onChange={(e)=>setDescription(e.target.value)} className={inputClass} placeholder="Ex: Internet" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Valor (MT)</label><input type="number" step="0.01" required value={value} onChange={(e)=>setValue(e.target.value)} className={inputClass} placeholder="0,00" /></div>
            <button type="submit" className="h-[52px] bg-red-600 text-white rounded-2xl font-black text-xs uppercase py-4 shadow-xl border-b-4 border-red-800 active:scale-95 transition-all touch-manipulation">Registrar</button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-2xl">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-red-600 min-h-[48px]" />
            </div>
            <select value={categoryFilter} onChange={e => {setCategoryFilter(e.target.value); setCurrentPage(1);}} className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 focus:border-red-600 outline-none min-h-[48px] w-full sm:w-auto touch-manipulation">
              <option value="all">Todas</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-between">
             {selectedIds.size > 0 && <button onClick={()=>{onDeleteMultipleExpenses?.(Array.from(selectedIds)); setSelectedIds(new Set());}} className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black active:scale-90 transition-all shadow-xl min-h-[44px] touch-manipulation">Excluir ({selectedIds.size})</button>}
             <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-700 active:bg-slate-50 touch-manipulation"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-700 active:bg-slate-50 touch-manipulation"><ChevronRight size={18}/></button>
             </div>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[950px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10"><button onClick={()=>setSelectedIds(selectedIds.size === paginatedExpenses.length ? new Set() : new Set(paginatedExpenses.map(e=>e.id)))} className="min-h-[44px] min-w-[44px] flex items-center justify-center">{selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></th>
                <th className="px-4 py-5">Ref.</th>
                <th className="px-4 py-5 cursor-pointer" onClick={()=>handleSort('date')}>Data <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedExpenses.map((e) => {
                const isEd = editingId === e.id;
                const isSelected = selectedIds.has(e.id);
                return (
                  <tr key={e.id} className={`${isEd?'bg-amber-50':isSelected?'bg-red-50/20':'hover:bg-slate-50'} transition-colors group scroll-item`}>
                    <td className="px-6 py-4"><button className="text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center transition-all" onClick={()=> { const n = new Set(selectedIds); if(n.has(e.id)) n.delete(e.id); else n.add(e.id); setSelectedIds(n); }}>{isSelected ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}</button></td>
                    <td className="px-4 py-5 font-mono text-[10px] text-slate-400">#{e.id.slice(-4).toUpperCase()}</td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg font-bold min-h-[44px] bg-white outline-none"/></td>
                        <td className="px-8 py-4"><select value={editForm?.category} onChange={e=>setEditForm(p=>p?{...p,category:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none">{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                        <td className="px-8 py-4"><input type="text" value={editForm?.description} onChange={e=>setEditForm(p=>p?{...p,description:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none"/></td>
                        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.value} onChange={e=>setEditForm(p=>p?{...p,value:+e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg w-28 text-xs font-bold bg-white outline-none"/></td>
                        <td className="px-8 py-4 text-right flex justify-end gap-2"><button onClick={handleEditSave} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"><Check size={18}/></button><button onClick={()=>setEditingId(null)} className="p-3 bg-slate-200 rounded-xl hover:bg-slate-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><X size={18}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-700">{formatDateDisplay(e.date)}</td>
                        <td className="px-8 py-5"><div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-700 border border-slate-200">{e.category}</div></td>
                        <td className="px-8 py-5 font-bold text-slate-800">{e.description}</td>
                        <td className="px-8 py-5 font-black text-red-700">{formatMZN(e.value)}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={()=>{setEditingId(e.id); setEditForm({...e})}} className="p-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"><Pencil size={18}/></button>
                           <button onClick={()=>onDeleteExpense(e.id)} className="p-2.5 bg-white border-2 border-red-600 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm min-h-[44px] min-w-[44px] flex items-center justify-center"><Trash2 size={18}/></button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden grid grid-cols-1 gap-6 p-6 bg-slate-50 overscroll-contain">
          {paginatedExpenses.length > 0 ? paginatedExpenses.map((e, idx) => (
            <div key={e.id} className="bg-white rounded-[2.5rem] p-8 border-2 border-slate-200 shadow-sm space-y-6 scroll-item animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex justify-between items-start">
                 <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDateDisplay(e.date)}</p>
                   <p className="font-black text-slate-900 text-lg leading-tight truncate max-w-[200px]">{e.description}</p>
                   <p className="font-black text-red-700 text-xl tracking-tighter">{formatMZN(e.value)}</p>
                 </div>
                 <div className="bg-red-50 p-3 rounded-2xl text-red-600 border border-red-100"><Receipt size={24}/></div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                 <button onClick={()=>{setEditingId(e.id); setEditForm({...e});}} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-xs uppercase active:bg-blue-50 min-h-[52px] shadow-sm flex items-center justify-center gap-2 touch-manipulation"><Pencil size={18}/> Editar</button>
                 <button onClick={()=>onDeleteExpense(e.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase active:bg-red-700 min-h-[52px] shadow-xl border-b-4 border-red-800 flex items-center justify-center gap-2 touch-manipulation"><Trash2 size={18}/> Excluir</button>
              </div>
            </div>
          )) : (
            <div className="py-24 text-center opacity-50"><SearchX size={56} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-[10px] mt-4">Sem custos registrados</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
