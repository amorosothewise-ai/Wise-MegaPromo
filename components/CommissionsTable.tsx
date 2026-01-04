import React, { useState } from 'react';
import { MonthlyCommission, Month, Operator } from '../types';
import { MONTHS, OPERATORS } from '../constants';
import { Plus, Trash2 } from 'lucide-react';

interface CommissionsTableProps {
  commissions: MonthlyCommission[];
  onAddCommission: (comm: Omit<MonthlyCommission, 'id'>) => void;
  onDeleteCommission: (id: string) => void;
}

export const CommissionsTable: React.FC<CommissionsTableProps> = ({ commissions, onAddCommission, onDeleteCommission }) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<Month>(Month.Jan);
  const [operator, setOperator] = useState<Operator>(Operator.MPesa);
  const [value, setValue] = useState('');

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
                    className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
                <select 
                    value={month} 
                    onChange={(e) => setMonth(e.target.value as Month)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Operadora</label>
                <select 
                    value={operator} 
                    onChange={(e) => setOperator(e.target.value as Operator)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
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
                    className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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
                [...commissions].sort((a, b) => (b.year - a.year) || 0).map((comm) => (
                    <tr key={comm.id} className="hover:bg-slate-50/50 transition-colors">
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
                        <button 
                        onClick={() => onDeleteCommission(comm.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        >
                        <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};