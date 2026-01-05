
import React, { useState } from 'react';
import { MonthlyCommission, Month, Operator } from '../types';
import { MONTHS, OPERATORS } from '../constants';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (c: Omit<MonthlyCommission, 'id'>) => void;
  onEditCommission: (c: MonthlyCommission) => void;
  onDeleteCommission: (id: string) => void;
}

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onEditCommission, onDeleteCommission }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(Month.Jan);
  const [operator, setOperator] = useState(Operator.MPesa);
  const [value, setValue] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyCommission | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    onAddCommission({ year, month, operator, commissionValue: +value });
    setValue('');
  };

  const inputClass = "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1 ml-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Comissões Mensais</h2>
          <p className="text-sm text-slate-500">Gestão por operadora</p>
        </div>
        
        <form onSubmit={handleAdd} className="grid grid-cols-2 md:flex md:flex-wrap gap-3 items-end">
          <div className="md:w-auto">
            <label className={labelClass}>Ano</label>
            <input 
              type="number" 
              value={year} 
              onChange={(e)=>setYear(+e.target.value)} 
              className={`${inputClass} md:w-24`}
            />
          </div>
          <div className="md:w-auto">
            <label className={labelClass}>Mês</label>
            <select 
              value={month} 
              onChange={(e)=>setMonth(e.target.value as Month)} 
              className={`${inputClass} md:w-32`}
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 md:w-auto">
            <label className={labelClass}>Operadora</label>
            <select 
              value={operator} 
              onChange={(e)=>setOperator(e.target.value as Operator)} 
              className={`${inputClass} md:w-40`}
            >
              {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 md:w-auto">
            <label className={labelClass}>Valor (MZN)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={value} 
              onChange={(e)=>setValue(e.target.value)} 
              className={`${inputClass} md:w-32 font-bold`}
            />
          </div>
          <button type="submit" className="col-span-2 md:col-span-1 w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-bold shadow-sm h-[38px] transition-colors">
            <Plus size={18} />
            <span className="md:hidden">Adicionar</span>
            <span className="hidden md:inline">Add</span>
          </button>
        </form>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="px-6 py-3">Período</th>
              <th className="px-6 py-3">Operadora</th>
              <th className="px-6 py-3">Valor</th>
              <th className="px-6 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commissions.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Nenhuma comissão registrada.</td></tr>
            ) : (
              [...commissions].sort((a,b) => (b.year-a.year) || 0).map((c) => {
                const isEd = editingId === c.id;
                return (
                  <tr key={c.id} className={isEd?'bg-yellow-50':'hover:bg-slate-50'}>
                    {isEd ? (
                      <>
                        <td className="px-6 py-3 flex gap-2">
                          <select value={editForm?.month || Month.Jan} onChange={(e)=>setEditForm(p=>p?{...p,month:e.target.value as Month}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 text-sm focus:ring-2 focus:ring-yellow-400 outline-none">{MONTHS.map(m=><option key={m} value={m}>{m}</option>)}</select>
                          <input type="number" value={editForm?.year || 0} onChange={(e)=>setEditForm(p=>p?{...p,year:+e.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-20 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"/>
                        </td>
                        <td className="px-6 py-3">
                          <select value={editForm?.operator || Operator.MPesa} onChange={(e)=>setEditForm(p=>p?{...p,operator:e.target.value as Operator}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full text-sm focus:ring-2 focus:ring-yellow-400 outline-none">{OPERATORS.map(op=><option key={op} value={op}>{op}</option>)}</select>
                        </td>
                        <td className="px-6 py-3">
                          <input type="number" value={editForm?.commissionValue || 0} onChange={(e)=>setEditForm(p=>p?{...p,commissionValue:+e.target.value}:null)} className="px-2 py-1 bg-white border border-slate-300 rounded text-slate-900 w-full text-sm font-bold focus:ring-2 focus:ring-yellow-400 outline-none"/>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={()=>{if(editForm){onEditCommission(editForm);setEditingId(null)}}} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check size={18}/></button>
                            <button onClick={()=>{setEditingId(null);setEditForm(null)}} className="p-1 text-slate-500 hover:bg-slate-100 rounded"><X size={18}/></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-3"><span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-bold uppercase border border-slate-200">{c.month} {c.year}</span></td>
                        <td className="px-6 py-3"><span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${c.operator===Operator.MPesa?'bg-red-50 text-red-700 border-red-100':'bg-amber-50 text-amber-700 border-amber-100'}`}>{c.operator}</span></td>
                        <td className="px-6 py-3 font-bold text-slate-800">{c.commissionValue.toLocaleString()} MZN</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={()=>{setEditingId(c.id);setEditForm({...c})}} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded transition-colors"><Pencil size={16}/></button>
                            <button onClick={()=>onDeleteCommission(c.id)} className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"><Trash2 size={16}/></button>
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
