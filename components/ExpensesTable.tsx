
import React, { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Expense, AppSettings } from '../types.ts';
import { Trash2, Pencil, Check, X, Receipt, Search, Tag, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Square, SearchX } from 'lucide-react';
import { EXPENSE_CATEGORIES, formatMZN, isFutureDate, formatDateDisplay } from '../constants.ts';

interface ExpensesTableProps {
  expenses: Expense[];
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onDeleteMultipleExpenses?: (ids: string[]) => void;
  settings: AppSettings;
}

const ITEMS_PER_PAGE = 15;
type SortKey = 'date' | 'category' | 'value' | 'description';
type SortOrder = 'asc' | 'desc' | null;

const ExpenseRow = memo(({ 
  expense, isEd, isSelected, editForm, setEditForm, onEditSave, onCancelEdit, onSelect, onEdit, onDelete 
}: { 
  expense: Expense, isEd: boolean, isSelected: boolean, editForm: any, setEditForm: any, 
  onEditSave: any, onCancelEdit: any, onSelect: any, onEdit: any, onDelete: any 
}) => {
  const maxDate = new Date().toISOString().split('T')[0];
  
  if (isEd) {
    return (
      <tr className="bg-amber-50">
        <td className="px-6 py-4"></td>
        <td className="px-4 py-5 font-mono text-[10px] text-slate-400">#{expense.id.slice(-4).toUpperCase()}</td>
        <td className="px-4 py-4"><input type="date" max={maxDate} value={editForm?.date} onChange={e=>setEditForm((p:any)=>p?{...p,date:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg font-bold min-h-[48px] bg-white outline-none transition-all"/></td>
        <td className="px-8 py-4"><select value={editForm?.category} onChange={e=>setEditForm((p:any)=>p?{...p,category:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none transition-all">{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
        <td className="px-8 py-4"><input type="text" value={editForm?.description} onChange={e=>setEditForm((p:any)=>p?{...p,description:e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg text-xs font-bold bg-white outline-none transition-all"/></td>
        <td className="px-8 py-4"><input type="number" step="0.01" value={editForm?.value} onChange={e=>setEditForm((p:any)=>p?{...p,value:+e.target.value}:null)} className="p-2 border-2 border-amber-300 rounded-lg w-28 text-xs font-bold bg-white outline-none transition-all"/></td>
        <td className="px-8 py-4 text-right flex justify-end gap-2"><button onClick={onEditSave} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><Check size={18}/></button><button onClick={onCancelEdit} className="p-3 bg-slate-200 rounded-xl active:scale-90 transition-transform"><X size={18}/></button></td>
      </tr>
    );
  }

  return (
    <tr className={`${isSelected?'bg-red-50/20':'hover:bg-slate-50'} transition-all group will-change-transform transform-gpu`}>
      <td className="px-6 py-4"><button className="text-slate-400 min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95 transition-transform" onClick={()=>onSelect(expense.id)}>{isSelected ? <CheckSquare size={18} className="text-red-600"/> : <Square size={18}/>}</button></td>
      <td className="px-4 py-5 font-mono text-[10px] text-slate-400">#{expense.id.slice(-4).toUpperCase()}</td>
      <td className="px-4 py-5 font-black text-slate-700">{formatDateDisplay(expense.date)}</td>
      <td className="px-8 py-5"><div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-700 border border-slate-200">{expense.category}</div></td>
      <td className="px-8 py-5 font-bold text-slate-800">{expense.description}</td>
      <td className="px-8 py-5 font-black text-red-700">{formatMZN(expense.value)}</td>
      <td className="px-8 py-5 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
         <button onClick={()=>onEdit(expense)} className="p-2.5 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl active:scale-90 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center transition-transform"><Pencil size={18}/></button>
         <button onClick={()=>onDelete(expense.id)} className="p-2.5 bg-white border-2 border-red-600 text-red-600 rounded-2xl active:scale-90 shadow-sm min-h-[48px] min-w-[48px] flex items-center justify-center transition-transform"><Trash2 size={18}/></button>
      </td>
    </tr>
  );
});

const MobileExpenseCard = memo(({ 
  expense, onEdit, onDelete 
}: { 
  expense: Expense, onEdit: any, onDelete: any 
}) => (
  <div 
    className="bg-white rounded-[2rem] p-8 border-2 border-slate-200 shadow-sm space-y-6 active:scale-[0.98] transition-all transform-gpu will-change-transform" 
    style={{ contain: 'content' }}
  >
    <div className="flex justify-between items-start">
       <div className="space-y-2">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDateDisplay(expense.date)}</p>
         <p className="font-black text-slate-900 text-lg leading-tight truncate max-w-[200px]">{expense.description}</p>
         <p className="font-black text-red-700 text-xl tracking-tighter">{formatMZN(expense.value)}</p>
       </div>
       <div className="bg-red-50 p-3 rounded-2xl text-red-600 border border-red-100"><Receipt size={24}/></div>
    </div>
    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
       <button onClick={()=>onEdit(expense)} className="flex-1 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-2xl font-black text-xs uppercase active:scale-95 shadow-sm flex items-center justify-center gap-2 min-h-[52px] transition-transform"><Pencil size={18}/> Editar</button>
       <button onClick={()=>onDelete(expense.id)} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase active:scale-95 shadow-xl border-b-4 border-red-800 flex items-center justify-center gap-2 min-h-[52px] transition-transform"><Trash2 size={18}/> Excluir</button>
    </div>
  </div>
));

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense, settings }) => {
  const maxDate = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(maxDate);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(settings.defaultExpenseCategory);
  const [value, setValue] = useState('');

  useEffect(() => {
    setCategory(settings.defaultExpenseCategory);
  }, [settings.defaultExpenseCategory]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const handleAdd = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !value || Number(value) <= 0) return;
    onAddExpense({ date, description, category, value: +value });
    setDescription(''); setValue('');
    if ('vibrate' in navigator) navigator.vibrate(12);
  }, [date, description, category, value, onAddExpense]);

  const handleEditSave = useCallback(() => {
    if (!editForm) return;
    onEditExpense(editForm);
    setEditingId(null);
  }, [editForm, onEditExpense]);

  const toggleSelect = useCallback((id: string) => {
    if ('vibrate' in navigator) navigator.vibrate(8);
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredExpenses = useMemo(() => {
    const l = searchTerm.toLowerCase().trim();
    return expenses.filter(e => e.description.toLowerCase().includes(l) || e.category.toLowerCase().includes(l) || e.date.includes(l));
  }, [expenses, searchTerm]);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredExpenses, currentPage]);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6" style={{ contain: 'content' }}>
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden transform-gpu">
        <div className="p-6 sm:p-10 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <div className="bg-red-600 p-2.5 rounded-xl text-white shadow-lg"><Receipt size={20} /></div> Registro de Custos Fixos
          </h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase ml-1">Data</label><input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl font-bold transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase ml-1">Categoria</label><select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl font-bold transition-all">{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
            <div className="lg:col-span-1 space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase ml-1">Descrição</label><input type="text" value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl font-bold transition-all" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-700 uppercase ml-1">Valor</label><input type="number" step="0.01" value={value} onChange={(e)=>setValue(e.target.value)} className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl font-bold transition-all" /></div>
            <button type="submit" className="h-[52px] bg-red-600 text-white rounded-2xl font-black text-xs uppercase py-4 shadow-xl border-b-4 border-red-800 active:scale-95 transition-all">Registrar</button>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-black outline-none transition-all" />
          </div>
          <div className="flex gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-90 transition-all shadow-sm"><ChevronLeft size={18}/></button>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="p-2 border-2 border-slate-200 rounded-xl bg-white disabled:opacity-30 min-w-[48px] min-h-[48px] flex items-center justify-center active:scale-90 transition-all shadow-sm"><ChevronRight size={18}/></button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto smooth-scroll-container min-h-[400px]">
          <table className="w-full text-left text-sm min-w-[950px]">
            <thead className="bg-slate-50 text-slate-700 font-black uppercase tracking-widest text-[10px] border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-5 w-10"></th>
                <th className="px-4 py-5">Ref.</th>
                <th className="px-4 py-5">Data</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Valor</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedExpenses.map((e) => (
                <ExpenseRow 
                  key={e.id} 
                  expense={e} 
                  isSelected={selectedIds.has(e.id)}
                  isEd={editingId === e.id}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEditSave={handleEditSave}
                  onCancelEdit={() => setEditingId(null)}
                  onSelect={toggleSelect}
                  onEdit={(exp)=>{setEditingId(exp.id); setEditForm({...exp})}}
                  onDelete={onDeleteExpense}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden grid grid-cols-1 gap-6 p-6 bg-slate-50/50 smooth-scroll-container min-h-[500px]">
          {paginatedExpenses.map((e) => (
            <MobileExpenseCard 
              key={e.id}
              expense={e}
              onEdit={(exp)=>{setEditingId(exp.id); setEditForm({...exp});}}
              onDelete={onDeleteExpense}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
