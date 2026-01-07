
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
  tSearch?: string;
}

const ITEMS_PER_PAGE = 15;
type SortKey = 'date' | 'category' | 'value';
type SortOrder = 'asc' | 'desc' | null;

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense, onDeleteMultipleExpenses, tSearch = "Pesquisar..." }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(maxDate);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [value, setValue] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<{field?: string, message: string} | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ key: 'date', order: 'desc' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isFutureDate(date)) {
      setError({ message: "Data futura não permitida para despesas." });
      return;
    }
    if (!description.trim() || !value || Number(value) <= 0) {
      setError({ field: 'form', message: "Preencha todos os campos corretamente." });
      return;
    }
    onAddExpense({ date, description, category, value: +value });
    setDescription(''); setValue('');
    if ('vibrate' in navigator) navigator.vibrate(15);
  };

  const handleEditSave = () => {
    if (!editForm) return;
    setError(null);
    if (isFutureDate(editForm.date)) {
      setError({ message: "Data futura não permitida." });
      if ('vibrate' in navigator) navigator.vibrate([50, 50, 50]);
      return;
    }
    onEditExpense(editForm);
    setEditingId(null);
  };

  const filteredAndSortedExpenses = useMemo(() => {
    const l = searchTerm.toLowerCase();
    let result = expenses.filter(e => 
      e.description.toLowerCase().includes(l) || 
      e.category.toLowerCase().includes(l) || 
      e.date.includes(l) ||
      formatDateDisplay(e.date).includes(l) ||
      e.id.toLowerCase().includes(l)
    );
    if (sortConfig.order) {
      result.sort((a, b) => {
        let valA: any, valB: any;
        if (sortConfig.key === 'date') { valA = a.date; valB = b.date; }
        else if (sortConfig.key === 'category') { valA = a.category; valB = b.category; }
        else if (sortConfig.key === 'value') { valA = a.value; valB = b.value; }
        if (valA < valB) return sortConfig.order === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [expenses, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedExpenses, currentPage]);

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:border-red-600 outline-none transition-all shadow-sm min-h-[48px]";

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes slideInRow { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-row { animation: slideInRow 0.3s ease-out forwards; }
      `}</style>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <div className="bg-red-50 p-2 rounded-lg border border-red-100 shadow-sm"><Receipt className="text-red-600" size={18} /></div>
            Registro de Despesas
          </h2>
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 text-xs font-black rounded-2xl border border-red-200 animate-pulse">{error.message}</div>}
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Data</label><input type="date" required max={maxDate} value={date} onChange={(e)=>setDate(e.target.value)} className={inputClass} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Categoria</label><select value={category} onChange={(e)=>setCategory(e.target.value)} className={inputClass}>{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="lg:col-span-1 space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Descrição</label><input type="text" required value={description} onChange={(e)=>setDescription(e.target.value)} className={inputClass} placeholder="Ex: Internet" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Valor (MT)</label><input type="number" step="0.01" required value={value} onChange={(e)=>setValue(e.target.value)} className={inputClass} placeholder="0,00" /></div>
            <button type="submit" className="h-[52px] bg-red-600 text-white rounded-2xl font-black text-xs uppercase py-4 shadow-xl border border-red-700">Registrar</button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-sm"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Pesquisar descrição ou Ref..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-red-600 min-h-[48px]" /></div>
          <div className="flex items-center gap-3">
             <div className="flex gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700"><ChevronLeft size={18}/></button>
                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-lg bg-white disabled:opacity-30 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-700"><ChevronRight size={18}/></button>
             </div>
          </div>
        </div>

        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm min-w-[950px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10"><button onClick={()=>setSelectedIds(selectedIds.size === paginatedExpenses.length ? new Set() : new Set(paginatedExpenses.map(e=>e.id)))} className="min-h-[44px] min-w-[44px] flex items-center justify-center">{selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0 ? <CheckSquare size={20} className="text-red-600"/> : <Square size={20}/>}</button></th>
                <th className="px-4 py-5">Ref.</th>
                <th className="px-4 py-5">Data</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedExpenses.map((e, idx) => {
                const isEd = editingId === e.id;
                return (
                  <tr key={e.id} className={`${isEd?'bg-amber-50':'hover:bg-slate-50'} animate-row transition-colors`} style={{ animationDelay: `${idx * 30}ms` }}>
                    <td className="px-6 py-4"><button className="text-slate-400 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={()=> { const n = new Set(selectedIds); if(n.has(e.id)) n.delete(e.id); else n.add(e.id); setSelectedIds(n); }}>{selectedIds.has(e.id) ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}</button></td>
                    <td className="px-4 py-5 font-mono text-[10px] text-slate-400">#{e.id.slice(-4).toUpperCase()}</td>
                    {isEd ? (
                      <>
                        <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm(p=>p?{...p,date:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg font-bold min-h-[44px] bg-white outline-none"/></td>
                        <td className="px-8 py-4"><select value={editForm?.category} onChange={e=>setEditForm(p=>p?{...p,category:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none">{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                        <td className="px-8 py-4"><input type="text" value={editForm?.description} onChange={e=>setEditForm(p=>p?{...p,description:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none"/></td>
                        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.value} onChange={e=>setEditForm(p=>p?{...p,value:+e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg w-28 text-xs font-bold bg-white outline-none"/></td>
                        <td className="px-8 py-4 text-right flex justify-end gap-2"><button onClick={handleEditSave} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Check size={18}/></button><button onClick={()=>setEditingId(null)} className="p-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors"><X size={18}/></button></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-5 font-black text-slate-700">{formatDateDisplay(e.date)}</td>
                        <td className="px-8 py-5"><div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-700 border border-slate-200">{e.category}</div></td>
                        <td className="px-8 py-5 font-bold text-slate-800">{e.description}</td>
                        <td className="px-8 py-5 font-black text-red-700">{formatMZN(e.value)}</td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                           <button onClick={()=>{setEditingId(e.id); setEditForm({...e})}} className="p-2.5 bg-white border-2 border-blue-100 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors"><Pencil size={18}/></button>
                           <button onClick={()=>onDeleteExpense(e.id)} className="p-2.5 bg-white border-2 border-red-100 text-red-700 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={18}/></button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visualização Mobile (Cards) */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4 bg-slate-50">
          {paginatedExpenses.length > 0 ? paginatedExpenses.map((e, idx) => (
            <div key={e.id} className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4 animate-row" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref: #{e.id.slice(-4).toUpperCase()} | {formatDateDisplay(e.date)}</p>
                   <p className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{e.description}</p>
                   <p className="font-black text-red-700 text-base">{formatMZN(e.value)}</p>
                 </div>
                 <div className="bg-red-50 p-2.5 rounded-xl text-red-600"><Receipt size={20}/></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                 <button onClick={()=>{setEditingId(e.id); setEditForm({...e});}} className="flex-1 py-3.5 bg-white border-2 border-blue-100 text-blue-700 rounded-2xl font-black text-xs active:bg-blue-50 min-h-[48px] shadow-sm flex items-center justify-center gap-2"><Pencil size={16}/> Editar</button>
                 <button onClick={()=>onDeleteExpense(e.id)} className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-700 rounded-2xl font-black text-xs active:bg-red-50 min-h-[48px] shadow-sm flex items-center justify-center gap-2"><Trash2 size={16}/> Excluir</button>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center opacity-50"><SearchX size={48} className="mx-auto text-slate-300"/><p className="font-black uppercase tracking-widest text-[10px]">Sem despesas registradas</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
