import React, { useState } from 'react';
import { MonthlyCommission, Month, Operator } from '../types';
import { MONTHS, OPERATORS } from '../constants';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (comm: Omit<MonthlyCommission, 'id'>) => void;
  onEditCommission: (comm: MonthlyCommission) => void;
  onDeleteCommission: (id: string) => void;
}

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onEditCommission, onDeleteCommission }) => {
  // Add Form State
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<Month>(Month.Jan);
  const [operator, setOperator] = useState<Operator>(Operator.MPesa);
  const [value, setValue] = useState('');

  // Edit Row State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MonthlyCommission | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    onAddCommission({
      year,
      month,
      operator,
      commissionValue: Number(value),
    });
    setValue('');
  };

  const handleEditClick = (comm: MonthlyCommission) => {
    setEditingId(comm.id);
    setEditForm({ ...comm });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editForm) {
      onEditCommission(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Comissões Mensais</h2>
          <p className="text-sm text-slate-500">Gestão de comissões por ano e operadora</p>
        </div>

        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 items-end">
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ano</label>
                <input
                    type="number"
                    min="2000"
                    max="2100"
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-slate-800"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
                <select 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value as Month)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-slate-800"
                >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Operadora</label>
                <select 
                    value={operator} 
                    onChange={(e) => setOperator(e.target.value as Operator)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-slate-800"
                >
                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor</label>
                <input
                    type="number"
                    min="0"
                    required
                    placeholder="Amount"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-800 bg-white"
                />
            </div>
            <button 
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-red-200"
            >
                <Plus size={16} /> Add
            </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-blue-50 text-blue-900 font-semibold border-b border-blue-100">
            <tr>
              <th className="px-6 py-3">Período</th>
              <th className="px-6 py-3">Operadora</th>
              <th className="px-6 py-3">Valor Comissão</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commissions.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No commissions recorded.
                    </td>
                </tr>
            ) : (
                // Sort by year then month (simple sort)
                [...commissions].sort((a, b) => (b.year - a.year) || 0).map((comm) => {
                    const isEditing = editingId === comm.id;
                    
                    return (
                        <tr key={comm.id} className={`transition-colors ${isEditing ? 'bg-yellow-50/50' : 'hover:bg-slate-50/50'}`}>
                        {isEditing ? (
                            // EDIT MODE
                            <>
                                <td className="px-6 py-3">
                                    <div className="flex gap-2 items-center">
                                        <select 
                                            value={editForm?.month} 
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, month: e.target.value as Month} : null)}
                                            className="px-2 py-1 border border-slate-300 rounded text-sm w-20 text-slate-800 bg-white"
                                        >
                                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <input
                                            type="number"
                                            value={editForm?.year}
                                            onChange={(e) => setEditForm(prev => prev ? {...prev, year: Number(e.target.value)} : null)}
                                            className="px-2 py-1 border border-slate-300 rounded text-sm w-16 text-slate-800 bg-white"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <select 
                                        value={editForm?.operator} 
                                        onChange={(e) => setEditForm(prev => prev ? {...prev, operator: e.target.value as Operator} : null)}
                                        className="px-2 py-1 border border-slate-300 rounded text-sm w-full max-w-[140px] text-slate-800 bg-white"
                                    >
                                        {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                    </select>
                                </td>
                                <td className="px-6 py-3">
                                    <input
                                        type="number"
                                        value={editForm?.commissionValue}
                                        onChange={(e) => setEditForm(prev => prev ? {...prev, commissionValue: Number(e.target.value)} : null)}
                                        className="px-2 py-1 border border-slate-300 rounded text-sm w-full max-w-[120px] text-slate-800 bg-white"
                                    />
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={handleSaveEdit}
                                            className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200 transition-colors"
                                            title="Save"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button 
                                            onClick={handleCancelEdit}
                                            className="p-1 text-slate-500 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
                                            title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </>
                        ) : (
                            // DISPLAY MODE
                            <>
                                <td className="px-6 py-3">
                                    <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 text-xs font-medium uppercase tracking-wide">
                                        {comm.month} {comm.year}
                                    </span>
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${comm.operator === Operator.MPesa ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'}`}>
                                        {comm.operator}
                                    </span>
                                </td>
                                <td className="px-6 py-3 font-semibold text-slate-700">{comm.commissionValue.toLocaleString()} MZN</td>
                                <td className="px-6 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                        <button 
                                            onClick={() => handleEditClick(comm)}
                                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={() => onDeleteCommission(comm.id)}
                                            className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
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