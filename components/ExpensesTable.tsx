
import React, { useState } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../constants';

interface ExpensesTableProps {
  expenses: Expense[];
  onAddExpense: (e: Omit<Expense, 'id'>) => void;
  onEditExpense: (e: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({ expenses, onAddExpense, onEditExpense, onDeleteExpense }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [value, setValue] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Expense | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !value || !description) return;
    onAddExpense({ date, description, category, value: +value });
    setDescription('');
    setValue('');
  };

  const inputClass = "w-full md:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1 ml-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Despesas</h2>
          <p className="text-sm text-slate-600">Custos operacionais</p>
        </div>
        
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:flex md:flex-wrap gap-3 items-end">
          <div className="w-full md:w-auto">
            <label className={labelClass}>Data</label>
            <input 
              type="date" 
              required 
              value={date} 
              onChange={(e)=>setDate(e.target.value)} 
              className={inputClass}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className={labelClass}>Categoria</label>
            <select 
              value={category} 
              onChange={(e)=>setCategory(e.target.value)} 
              className={inputClass}
            >
              {EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-full md:w-auto">
            <label className={labelClass}>Descrição</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: Táxi" 
              value={description} 
              onChange={(e)=>setDescription(e.target.value)} 
              className={`${inputClass} md:w-48`}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className={labelClass}>Valor</label>
            <div className="relative">
              <input 
                type="number" 
                min="0" 
                required 
                placeholder="Val" 
                value={value} 
                onChange={(e)=>setValue(e.target.value)} 
                className={`${inputClass} md:w-32 pl-9`}
              />
              <span className="absolute left-3 top-2 text-slate-500 font-bold text-xs">MZN</span>
            </div>
          </div>
          <button type="submit" className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 text-sm font-bold shadow-sm h-[38px] transition-colors">
            <Plus size={18} />
            <span className="md:hidden">Adicionar</span>
            <span className="hidden md:inline">Add</span>
          </button>
        </form>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-red-50 text-red-950 font-bold border-b border-red-100">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">Sem despesas.</td></tr>
            ) : (
              [...expenses].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((e) => {
                const isEd = editingId === e.id;
                return (
                  <tr key={e.id} className={isEd?'bg-yellow-50':'hover:bg-slate-50'}>
                    {isEd ? (
                      <>
                        <td className="px-6 py-3"><input type="date" value={editForm?.date || ''} onChange={(ev)=>setEditForm(p=>p?{...p,date:ev.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full focus:ring-2 focus:ring-yellow-400 outline-none"/></td>
                        <td className="px-6 py-3"><select value={editForm?.category || ''} onChange={(ev)=>setEditForm(p=>p?{...p,category:ev.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full focus:ring-2 focus:ring-yellow-400 outline-none">{EXPENSE_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></td>
                        <td className="px-6 py-3"><input type="text" value={editForm?.description || ''} onChange={(ev)=>setEditForm(p=>p?{...p,description:ev.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full focus:ring-2 focus:ring-yellow-400 outline-none"/></td>
                        <td className="px-6 py-3"><input type="number" value={editForm?.value || 0} onChange={(ev)=>setEditForm(p=>p?{...p,value:+ev.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-24 focus:ring-2 focus:ring-yellow-400 outline-none"/></td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={()=>{if(editForm){onEditExpense(editForm);setEditingId(null)}}} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={18}/></button>
                            <button onClick={()=>{setEditingId(null);setEditForm(null)}} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><X size={18}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3 text-slate-900 font-medium">{e.date.split('-').reverse().join('/')}</td>
                        <td className="px-6 py-3"><span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-700 border border-slate-200">{e.category}</span></td>
                        <td className="px-6 py-3 text-slate-700 font-medium">{e.description}</td>
                        <td className="px-6 py-3 font-bold text-red-700">- {e.value.toLocaleString()} MZN</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={()=>{setEditingId(e.id);setEditForm({...e})}} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors"><Pencil size={16}/></button>
                            <button onClick={()=>onDeleteExpense(e.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
